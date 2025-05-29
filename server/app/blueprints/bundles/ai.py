import os
from dotenv import load_dotenv
from openai import AzureOpenAI
import json
import re
import uuid


def ai_call(
    product_to_clear: str = None,
    target_profit_margin_input: str = "Default (35%)",
    duration_input: str = "Estimate based on seasonality and stock",
    objective_input: str = "Increase average basket value by a target % (e.g., 10%)",
    bundle_type_input: str = "All",
    bundle_size_input: str = "Default (2–5 products)",
    bundle_cust_segment: str = None
):
    """
    Calls Azure AI to create bundles

    Args:
        product_to_clear (str, optional): Specific product to clear. Defaults to None.
        target_profit_margin_input (str, optional): Target profit margin. Defaults to "Default (35%)".
        duration_input (str, optional): Duration of Bundle. Defaults to "Estimate based on seasonality and stock".
        objective_input (str, optional): Bundle objective. Defaults to "Increase average basket value by a target % (e.g., 10%)".
        bundle_type_input (str, optional): Type of bundle. Defaults to "All".
        bundle_size_input (str, optional): Size of bundle. Defaults to "Default (2–5 products)".
    """
    load_dotenv()

    bundle_type_for_prompt = bundle_type_input
    bundle_size_for_prompt = bundle_size_input
    profit_margin_for_prompt = target_profit_margin_input
    duration_for_prompt = duration_input
    objectives_for_prompt = objective_input
    customer_segmentation_for_prompt = bundle_cust_segment

    if product_to_clear:
        if (
            "Inventory Goal" in objective_input
            or "clear specified product(s)" in objective_input.lower()
            or objective_input == "Max Cart"
        ):
            objectives_for_prompt = f"Inventory Goal: Clear {product_to_clear} from stock."
        elif objective_input:
            objectives_for_prompt += (
                f". Additionally, prioritize clearing {product_to_clear} from stock."
            )
        else:
            objectives_for_prompt = f"Inventory Goal: Clear {product_to_clear} from stock."

    print(f"Bundle Type: {bundle_type_for_prompt}")
    print(f"Objectives: {objectives_for_prompt}")
    print(f"Bundle Size: {bundle_size_for_prompt}")
    print(f"Target Profit Margin: {profit_margin_for_prompt}")
    print(f"Duration: {duration_for_prompt}")

    prompt = f"""
    You are a **senior retail AI expert**. Your job is to generate product bundles that maximize revenue, optimize stock, and achieve business goals for a retail company.  
**Your suggestions must use actual data from the provided dataset:** use each item's unit cost and price to calculate real bundle prices and profit margins. Do not assume the margin is always 35%—it must be computed per bundle, based on the included products and their prices.

---

### USER INPUT

- **Bundle Type**: {bundle_type_for_prompt}
- **Objectives**: {objectives_for_prompt}
- **Bundle Size**: {bundle_size_for_prompt or "Default (2–5 products)"}
- **Target Profit Margin**: {profit_margin_for_prompt or "Default (35%)"}
- **Duration (if given)**: {duration_for_prompt or "Estimate based on seasonality and stock"}
- **Customer segmentation (if given)**: {customer_segmentation_for_prompt}

---

### PROFIT MARGIN RULES

> - **If the user has specified a target profit margin, always respect the user's input as the maximum. Calculate bundle prices to match or approach this margin, but do not exceed it.**  
> - **If the objective is “Max Cart” and the user has not explicitly set a margin, recommend a margin in the range 30–34% for optimal results, but always prioritize the user’s explicit request if given.**
> - **Margins for different bundles MUST NOT all be the same. Each bundle must have a distinct estimated margin (unless absolutely impossible with the data provided).**
> - **Margins should cover a realistic range:**  
>   - For example, if the target margin is 25%, you might use margins such as 24%, 22%, 18%, 15%, etc. (as feasible per product costs)—**do not cluster all bundles at 15% or any other single value**.
> - **Distribute margin values evenly or realistically between just below the target and the lowest feasible value for each bundle, given item costs.**
> - **Never repeat the same margin in multiple bundles unless you cannot produce a valid bundle with another value.**
> - **If the user wants a specific margin, always go with the user's intention, and if not possible for some bundles, go as close as possible just below the target.**

---

### PRICING & MARGIN CORRELATION (Very Important!)

> - **The only variable that changes to achieve a lower profit margin is the price—unit costs remain fixed.**
> - **Profit margin and price are 100% correlated:**
>   - Example: If an item’s original price is €100 and the original profit margin is 35%, the unit cost is €65 (since €100 - €65 = €35, which is 35% margin).
>   - If a bundle requires a lower margin (e.g., 25%), the new price is calculated by keeping the unit cost fixed and reducing only the margin:  
>      - New Price = Unit Cost / (1 - Desired Margin Percentage)  
>      - For 25% margin: New Price = €65 / (1 - 0.25) = €86.67 (rounded as needed)
>   - **The margin profit reduction comes ONLY from price reduction. Never change costs.**
> - **For bundles with multiple items:**  
>   - Apply the same margin logic to each item in the bundle (cost stays fixed, margin/price change is proportional).
>   - **The bundle’s final profit margin is the average of all included items’ margins** (unless you have a specific per-bundle margin, then use that average).
>   - Always show both the bundle price and the computed average profit margin.

---

### CUSTOMER SEGMENTATION RULES

> - If a **customer segment** is provided, all bundle recommendations **must be tailored specifically to that segment**.
> - **Bundle products, names, pricing, and timing must reflect the behavior, preferences, and spending habits of the segment.** For example:
>   - Young adults (18–25): trend-driven items, bold styles, affordable pricing.
>   - Parents/families: practical combinations, multi-use items, strong value.
>   - Premium shoppers: luxury brands, curated aesthetics, higher price points.
> - **Never ignore segmentation**—even if it narrows product choices, bundles must make strategic sense for the defined audience.
> - If **no segment is specified**, assume a general consumer profile and design bundles for broad appeal.

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

### BUNDLE OUTPUT FORMAT

For each of up to **10 suggested bundles**, output the following (strictly use this format):

- **Bundle Name**: (creative and descriptive)
- **Products**:
- [Product Name] x[Qty]
- (repeat for all products in bundle)
- **Estimated Margin**: [X]%
- **Price**: €[Y]
- **Duration**: (e.g., "3 weeks", "1 month", "Until stock runs out", etc.)
- **Season**: (e.g., "Spring", "May–August", "Holiday", or leave blank if not relevant)
- **Rationale**: (Explain why these products are grouped, how this bundle meets the business goal, and clarify why margin and duration were chosen.)

> **Important Formatting Rules:**  
> - **Never repeat the same duration, season, or margin for all bundles. Always use different (but realistic) margins for each bundle, unless impossible.**
> - **Distribute margin values so that the list of bundles covers a variety of margin levels, not just the lowest.**
> - **Do not exceed the requested profit margin. If necessary, go as high as possible under the target.**
> - **Rationales must show clear, business-driven logic (not just repeat the type definition).**
> - **Never include extra commentary or template instructions in your answer.**
> - **Every bundle MUST contain ALL required fields and lines in the exact order shown above, with NO missing values.**
> - **Never return a truncated or incomplete bundle. If space is limited, return fewer bundles, but every bundle must be complete and correctly formatted.**
> - **Never cut off a bundle at the end or omit any field—EVER. If you cannot fit 10 bundles, return as many as fit in the output limit, but each one MUST be fully complete.**

---

### INSTRUCTIONS

- Suggest up to **10 feasible bundles**.
- Use only product data provided (e.g., unit prices, costs, categories, sales history).
- **Calculate each bundle's margin and price strictly using the price-profit margin correlation described above.**
- If no bundle type is specified, suggest the 10 highest-profit bundles you can find.
- **Vary margin, price, duration, and season across bundles; never use the same values in all outputs.**
- **Format output exactly as shown above.** Do **not** include any extra explanation or template text.

---

    """

    endpoint = os.environ.get("ENDPOINT")
    deployment = "makeathongpt41"  # Update if your deployment name is different!
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
    target_profit_margin_input: str = "Default (35%)",
    duration_input: str = "Estimate based on seasonality and stock",
    objective_input: str = "Increase average basket value by a target % (e.g., 10%)",
    bundle_type_input: str = "All",
    bundle_size_input: str = "Default (2–5 products)",
    bundle_cust_segment: str = None
):
    output = ai_call(
        product_to_clear=product_to_clear,
        target_profit_margin_input=target_profit_margin_input,
        duration_input=duration_input,
        objective_input=objective_input,
        bundle_type_input=bundle_type_input,
        bundle_size_input=bundle_size_input,
        bundle_cust_segment_input = bundle_cust_segment


    )
    bundle_json = ai_bundles_to_json(output)
    return bundle_json
