import os
from dotenv import load_dotenv
from openai import AzureOpenAI
import json
import re
import uuid

from .optimise_bundles import optimize_bundles

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def ai_call(
    product_to_clear: str = None,
    target_profit_margin_input: str = "Default (35%)",
    duration_input: str = "Estimate based on seasonality and stock",
    objective_input: str = "Increase average basket value by a target % (e.g., 10%)",
    bundle_type_input: str = "All",
    bundle_size_input: str = "Default (2–5 products)",
    top_n: int = 10,
    related_skus: list = None,
    excel_path: str = "product_bundle_suggestions.xlsx"
):
    """
    Calls Azure AI to refine and enrich already optimised bundles.

    (All args same as before; now, passes bundles to LLM for final enrichment.)
    """
    load_dotenv()
    # STEP 1: Run Python-side optimiser
    bundles_result = optimize_bundles(
        product_to_clear=product_to_clear,
        target_profit_margin_input=target_profit_margin_input,
        top_n=top_n,
        related_skus=related_skus,
        excel_path=excel_path
    )
    # Use the "best" bundle sheet (for example, Bundles_2 or whatever your logic prefers)
    # Here we just flatten and take the first 'top_n' bundles across sizes for demonstration.
    python_bundles = []
    for sheet, df in bundles_result['output'].items():
        for _, row in df.iterrows():
            python_bundles.append({
                "SKUs": str(row['SKUs']),
                "Products": [p.strip() for p in str(row['Products']).split(',')],
                "Count": int(row.get('Count', 1)),
                "Bundle Size": int(row.get('Bundle Size', 2)),
                "Original Total Price": float(row['Original Total Price']),
                "Suggested Bundle Price": float(row['Suggested Bundle Price'])
            })
            if len(python_bundles) >= top_n:
                break
        if len(python_bundles) >= top_n:
            break

    # STEP 2: Format bundles as markdown for prompt (tabular or bullet, for LLM context)
    bundles_md = "\n".join([
        f"- Products: {', '.join(b['Products'])} | Bundle Size: {b['Bundle Size']} | Original Price: €{b['Original Total Price']:.2f} | Suggested Bundle Price: €{b['Suggested Bundle Price']:.2f}"
        for b in python_bundles
    ])

    # STEP 3: Prompt for AI

    prompt = f"""
        You are a **senior retail AI expert**. Here are {len(python_bundles)} bundles that have already been optimised by a Python algorithm. Each bundle includes product names, price, and suggested discount for a profit margin specified by the user.

        Your job is to **transform and improve** these bundles by making small, realistic changes if needed (such as swapping in similar products or adjusting bundle composition for better fit with the user's business objective), and then:
        - Assign a creative bundle name,
        - Recommend an appropriate season and duration,
        - Calculate and show the estimated profit margin and final bundle price,
        - Write a clear rationale for each bundle, justifying your choice of products, season, duration, and pricing based on the business context.

        **You must respect the user's business constraints:**
        - **Bundle Type**: {bundle_type_input}
        - **Objectives**: {objective_input}
        - **Bundle Size**: {bundle_size_input}
        - **Target Profit Margin**: {target_profit_margin_input}
        - **Duration (if given)**: {duration_input}

        ---

        ### PRICING & MARGIN CORRELATION (Very Important!)

        > - **The only variable that changes to achieve a lower profit margin is the price—unit costs remain fixed.**
        > - **Profit margin and price are 100% correlated:**
        >   - Example: If an item's original price is €100 and the original profit margin is 35%, the unit cost is €65 (since €100 - €65 = €35, which is 35% margin).
        >   - If a bundle requires a lower margin (e.g., 25%), the new price is calculated by keeping the unit cost fixed and reducing only the margin:  
        >      - New Price = Unit Cost / (1 - Desired Margin Percentage)  
        >      - For 25% margin: New Price = €65 / (1 - 0.25) = €86.67 (rounded as needed)
        >   - **The margin profit reduction comes ONLY from price reduction. Never change costs.**
        > - **For bundles with multiple items:**  
        >   - Apply the same margin logic to each item in the bundle (cost stays fixed, margin/price change is proportional).
        >   - **The bundle's final profit margin is the average of all included items' margins** (unless you have a specific per-bundle margin, then use that average).
        >   - Always show both the bundle price and the computed average profit margin.

        ---

        ### BUNDLE TYPES & LOGIC

        #### COMPLEMENTARY
        Group products often used together or frequently bought as a set.  
        Example: T-shirt + Jeans + Hat = casual outfit  
        **Season:** March to September

        #### THEME
        Group by shared category, seasonal relevance, or color coordination.  
        Examples:  
        - "Summer Beach Kit": Swimsuit + Sunglasses + Flip Flops  
        - "Earth Tone Colors": Brown T-shirt + Beige Shorts  
        **Season:** May to September

        #### VOLUME
        Same product in multiple units, usually at discount (e.g., 1+1 free or 3-for-2).  
        Use for low sales, low per-unit margin, or to clear inventory.

        #### CROSS-SELL
        Pair a popular product with a high-margin, underperforming product.  
        Example: Popular Sneakers + Expensive Bag (low sales)

        #### LEFTOVER
        Group slow-moving or "leftover" products. The goal is inventory clearance; profit margin may be lower or even negative for these bundles.

        ---

        ### GOALS & OPTIMIZATION TARGETS

        Your bundles must meet **one or both** of these goals:
        - **Cart Uplift Goal:** Increase average basket value by a given %
        - **Inventory Goal:** Clear specified product(s) from stock

        #### Bundle Constraints
        - Respect requested margin (typically up to 35%). **Never propose a margin higher than the given target; if it's not feasible, maximize margin just below the target.**
        - Each bundle must include 2–5 items (default: 2, unless user specifies more).
        - Set **Bundle Price** using the actual (discounted or final) unit prices of included products, applying a realistic overall discount if necessary.
        - Set **Estimated Profit Margin** for the entire bundle, based on costs and price.
        - Recommend a **Duration** (e.g., "3 weeks", "2 months", "Until stock runs out")—this is the promotion's *length*, and should vary realistically between bundles based on the products, inventory, or customer need.
        - Set a **Season** (e.g., "Spring", "Summer", "Holiday", "May–August")—set only when *relevant* for the bundle; avoid using the same season for every bundle.
        - Make sure **Duration** and **Season** are not always the same and do not contradict each other. Not every bundle needs both a specific season and a set duration.

        ---

        **Here are the already-optimised bundles:**
        {bundles_md}
        ---

        **For each bundle, output exactly:**
        - **Bundle Name**: (creative and descriptive)
        - **Products**: (list, including quantities if >1)
        - **Estimated Margin**: [X]%
        - **Price**: €[Y]
        - **Duration**: (e.g., "3 weeks", "1 month", "Until stock runs out", etc.)
        - **Season**: (e.g., "Spring", "May–August", "Holiday", or leave blank if not relevant)
        - **Rationale**: (Explain why these products are grouped and how the bundle supports the user's business goal.)

        **Do not generate new bundles from scratch. Only use and improve the bundles above, making small changes if necessary.**
        **Never output extra commentary or missing fields.**
        """

# [Azure OpenAI API call as before]


    # --- Azure OpenAI API Call ---
    endpoint = os.environ.get("ENDPOINT")
    deployment = "gpt-4.1"
    search_endpoint = os.environ.get("SEARCH_ENDPOINT")
    search_index = os.environ.get("SEARCH_INDEX_NAME")
    search_key = os.environ.get("SEARCH_KEY")

    client = AzureOpenAI(
        api_key=os.environ.get("AZURE_KEY"),
        azure_endpoint=endpoint,
        api_version="2024-05-01-preview",
    )

    try:
        completion = client.chat.completions.create(
            model=deployment,
            messages=[{"role": "user", "content": prompt}],
            extra_body={
                "data_sources": [
                    {
                        "type": "azure_search",
                        "parameters": {
                            "endpoint": search_endpoint,
                            "index_name": search_index,
                            "authentication": {"type": "api_key", "key": search_key},
                        },
                    }
                ]
            },
            temperature=0.7,
            max_tokens=3000,
        )
        response_content = completion.choices[0].message.content

        print(response_content)
        print("-------------------------")
        return response_content
    except Exception as e:
        print(f"Error during API Azure call: {e}")
        return f"API Error: {e}"



def ai_bundles_to_json(ai_output):
    # Adjust the bundle block pattern for optional trailing spaces and allow for empty lines between bundles
    bundle_pattern = re.compile(
        r"- \*\*Bundle Name\*\*: (.*?)\s*\n- \*\*Products\*\*:\s*\n(.*?)(?=\n- \*\*Bundle Name\*\*:|\Z)",
        re.DOTALL,
    )
    # Allow for optional spaces before/after x in product line
    product_pattern = re.compile(r"- ([^\n]+?)\s*x\s*(\d+)")
    # Updated field patterns for possible extra spaces at the end of each line
    field_patterns = {
        "margin": re.compile(r"- \*\*Estimated Margin\*\*: ([\d.,]+)%\s*"),
        "price": re.compile(r"- \*\*Price\*\*: €([\d.,]+)\s*"),
        "duration": re.compile(r"- \*\*Duration\*\*: (.*?)\s*(?:\n|$)"),
        "season": re.compile(r"- \*\*Season\*\*: (.*?)\s*(?:\n|$)"),
        "rationale": re.compile(r"- \*\*Rationale\*\*: (.*?)(?:\s*\[doc\d+\])?(?:\n|$)"),
    }

    bundles = []
    for bundle_match in bundle_pattern.finditer(ai_output):
        name, bundle_block = bundle_match.groups()
        # Extract products
        products_block = bundle_block.split("- **Estimated Margin**:")[0]
        products = [
            {"item_name": m.group(1).strip(), "qty": int(m.group(2))}
            for m in product_pattern.finditer(products_block)
        ]
        # Extract other fields
        margin = field_patterns["margin"].search(bundle_block)
        price = field_patterns["price"].search(bundle_block)
        duration = field_patterns["duration"].search(bundle_block)
        season = field_patterns["season"].search(bundle_block)
        rationale = field_patterns["rationale"].search(bundle_block)
        bundles.append(
            {
                "bundle_id": f"bundle_{uuid.uuid4().hex[:8]}",
                "name": name.strip(),
                "items": products,
                "price": float(price.group(1).replace(",", ".")) if price else None,
                "profitMargin": f"{margin.group(1)}%" if margin else None,
                "duration": duration.group(1).strip() if duration else None,
                "season": season.group(1).strip() if season else None,
                "rationale": rationale.group(1).strip() if rationale else None,
            }
        )
    return {"bundles": bundles}


def get_results_from_ai(
    product_to_clear: str = None,
    target_profit_margin_input: str = "34",
    top_n: int = 20,
    related_skus: list = None,
    excel_path: str = "/app/excel/product_bundle_suggestions.xlsx"
) -> dict:
    output = ai_call(
        product_to_clear=product_to_clear,
        target_profit_margin_input=target_profit_margin_input,
        top_n=top_n,
        related_skus=related_skus,
        excel_path=excel_path
    )
    bundle_json = ai_bundles_to_json(output)
    return bundle_json
