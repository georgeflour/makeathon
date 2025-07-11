import pandas as pd
import os
import logging
import uuid

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# In Docker, the excel directory is mounted at excel
EXCEL_DIR = "excel"

logger.info(f"EXCEL_DIR: {EXCEL_DIR}")

def optimize_bundles(
    product_to_clear=None,
    target_profit_margin_input="34",
    top_n=20,
    related_skus=None,
    excel_path=os.path.join(EXCEL_DIR, "product_bundle_suggestions.xlsx"),
    alpha=0.3  # <-- weighting for frequency in score, adjust as needed
):
    """
    Returns filtered and optimized bundles as dictionaries (for API or other Python code).
    Now local search objective is a weighted combination of margin and bundle frequency.
    """
    logger.info(f"Starting optimize_bundles with parameters:")
    logger.info(f"product_to_clear: {product_to_clear}")
    logger.info(f"target_profit_margin_input: {target_profit_margin_input}")
    logger.info(f"top_n: {top_n}")
    logger.info(f"related_skus: {related_skus}")
    logger.info(f"excel_path: {excel_path}")
    
    try:
        # Clean up the margin input by removing '%' and any whitespace
        margin_str = str(target_profit_margin_input).replace('%', '').strip()
        logger.info(f"Cleaned margin string: {margin_str}")
        margin = int(margin_str)
        logger.info(f"Parsed margin: {margin}")
    except Exception as e:
        logger.error(f"Error parsing margin: {e}")
        raise

    try:
        logger.info(f"Attempting to read Excel file: {excel_path}")
        if not os.path.exists(excel_path):
            available_files = os.listdir(EXCEL_DIR)
            logger.error(f"Excel file not found. Available files in {EXCEL_DIR}: {available_files}")
            raise FileNotFoundError(f"Excel file not found at {excel_path}")
            
        bundle_sheets = pd.read_excel(excel_path, sheet_name=None)
        logger.info(f"Successfully read Excel file. Available sheets: {list(bundle_sheets.keys())}")
    except Exception as e:
        logger.error(f"Error reading Excel file: {e}")
        raise

    wanted_sheets = {k: v for k, v in bundle_sheets.items() if k.startswith('Bundles_')}
    logger.info(f"Filtered bundle sheets: {list(wanted_sheets.keys())}")

    output = {}
    local_search_output = {}

    def jaccard_similarity(set1, set2):
        intersection = len(set1 & set2)
        union = len(set1 | set2)
        return intersection / union if union > 0 else 0

    def find_nearest_bundles(
        bundles_df,
        product_to_clear=None,
        target_profit_margin_input=None,
        top_n=50,
        related_skus=None
    ):
        filtered = bundles_df.copy()
        margin_col = None
        if target_profit_margin_input is not None:
            margin_col_candidate = f'Suggested Price ({target_profit_margin_input}% off)'
            if margin_col_candidate in filtered.columns:
                margin_col = margin_col_candidate
        if margin_col is None:
            for col in filtered.columns:
                if col.startswith("Suggested Price"):
                    margin_col = col
                    break
        if margin_col is None:
            raise ValueError("No margin column found in data!")
        filtered = filtered[filtered[margin_col] > 0]
        if product_to_clear:
            target_skus = {str(product_to_clear)}
            if related_skus:
                target_skus |= set(map(str, related_skus))
            filtered['SKU_Set'] = filtered['SKUs'].apply(lambda s: set(map(str.strip, s.split(','))))
            filtered['JaccardSim'] = filtered['SKU_Set'].apply(lambda x: jaccard_similarity(x, target_skus))
            filtered = filtered.sort_values(['JaccardSim', 'Count', 'Original Total Price'], ascending=[False, False, False])
            filtered = filtered.drop(columns=['SKU_Set', 'JaccardSim'])
        else:
            filtered = filtered.sort_values(['Count', 'Original Total Price'], ascending=[False, False])
        columns_to_keep = [
            'SKUs', 'Products', 'Count', 'Bundle Size', 'Original Total Price', margin_col
        ]
        filtered = filtered.head(top_n)[columns_to_keep]
        filtered = filtered.rename(columns={margin_col: 'Suggested Bundle Price'})
        return filtered

    def local_search_bundle(
        initial_bundle,
        all_skus,
        sku_to_price,
        bundle_count_dict,
        bundle_size=3,
        target_margin=0.73,
        max_iters=100
    ):
        def margin_objective(bundle):
            prices = [sku_to_price.get(sku, 0) for sku in bundle]
            orig_sum = sum(prices)
            if orig_sum == 0: return 0
            bundle_str = ', '.join(sorted(bundle))
            freq = bundle_count_dict.get(bundle_str, 1)  # Use 1 for "never seen" (so not 0)
            # Weighted: (1-alpha) for margin, alpha for frequency
            margin_score = orig_sum * target_margin
            score = margin_score * (1 - alpha) + freq * alpha
            return score
        current = set(initial_bundle)
        best_score = margin_objective(current)
        for _ in range(max_iters):
            neighbors = []
            for sku_out in current:
                for sku_in in all_skus - current:
                    neighbor = set(current)
                    neighbor.remove(sku_out)
                    neighbor.add(sku_in)
                    neighbors.append(neighbor)
            if not neighbors:
                break
            scored = [(n, margin_objective(n)) for n in neighbors]
            scored.sort(key=lambda x: x[1], reverse=True)
            if scored and scored[0][1] > best_score:
                current, best_score = scored[0]
            else:
                break
        return current, best_score

    for sheet, df in wanted_sheets.items():
        size = int(sheet.split('_')[1])
        filtered = find_nearest_bundles(
            df,
            product_to_clear=product_to_clear,
            target_profit_margin_input=margin,
            top_n=top_n,
            related_skus=related_skus
        )
        output[sheet] = filtered

        sku_to_price = {}
        for idx, row in df.iterrows():
            margin_col = f'Suggested Price ({margin}% off)' if margin else None
            if margin_col and margin_col in row:
                price = row[margin_col]
            else:
                price_cols = [col for col in df.columns if col.startswith("Suggested Price")]
                price = row[price_cols[0]] if price_cols else 0
            for sku in map(str.strip, str(row['SKUs']).split(',')):
                if sku not in sku_to_price or price > sku_to_price[sku]:
                    sku_to_price[sku] = price

        all_skus = set(sku_to_price.keys())
        # ---- BUILD FREQUENCY DICTIONARY FOR BUNDLES ----
        bundle_count_dict = {}
        for idx, row in df.iterrows():
            key = ', '.join(sorted([s.strip() for s in str(row['SKUs']).split(',')]))
            bundle_count_dict[key] = int(row['Count']) if 'Count' in row else 0

        if filtered.shape[0] > 0:
            local_solutions = []
            for idx, row in filtered.iterrows():
                initial_bundle = set(map(str.strip, str(row['SKUs']).split(',')))
                opt_bundle, opt_score = local_search_bundle(
                    initial_bundle, all_skus, sku_to_price,
                    bundle_count_dict=bundle_count_dict,
                    bundle_size=size,
                    target_margin=1 - (margin or 27) / 100,
                    max_iters=30
                )
                # Robust SKU-to-product name mapping
                name_map = {}
                for idxx, rowx in df.iterrows():
                    sku_list = [s.strip() for s in str(rowx['SKUs']).split(',')]
                    prod_list = [p.strip() for p in str(rowx['Products']).split(',')]
                    for i, sku in enumerate(sku_list):
                        if i < len(prod_list):
                            name_map[sku] = prod_list[i]
                        elif len(prod_list) == 1:
                            name_map[sku] = prod_list[0]
                        else:
                            name_map[sku] = ""
                names = [name_map.get(sku, "") for sku in opt_bundle]
                local_solutions.append({
                    'SKUs': ', '.join(opt_bundle),
                    'Products': ', '.join(names),
                    'Optimized Score': opt_score,
                })
            local_df = pd.DataFrame(local_solutions).drop_duplicates('SKUs').sort_values('Optimized Score', ascending=False).head(top_n)
            local_search_output[sheet] = local_df

    # Convert DataFrames to dict and return in the expected format
    bundles_list = []
    for sheet_name, df in local_search_output.items():
        for _, row in df.iterrows():
            bundle = {
                'bundle_id': str(uuid.uuid4()),
                'name': f"Bundle {len(bundles_list) + 1}",
                'items': [{'item_name': p.strip(), 'qty': 1} for p in row['Products'].split(',')],
                'price': float(row.get('Original Total Price', 0)),
                'profitMargin': f"{margin}%",
                'duration': "2 weeks",  # Default duration
                'season': "All year",   # Default season
                'rationale': f"Optimized bundle with {len(row['Products'].split(','))} items"
            }
            bundles_list.append(bundle)
    
    return {'bundles': bundles_list}
    
def save_only_optimized_bundles(
    product_to_clear=None, 
    target_profit_margin_input="34", 
    top_n=20, 
    related_skus=None, 
    outfile=os.path.join(EXCEL_DIR, "optimized_bundles_all_sizes.xlsx")
    ):
    logger.info(f"Starting save_only_optimized_bundles")
    logger.info(f"Output file: {outfile}")
    
    try:
        bundles_dict = optimize_bundles(product_to_clear, target_profit_margin_input, top_n, related_skus)
        logger.info(f"Successfully generated bundles")
        
        for key, sheet_dict in bundles_dict['bundles']:
            logger.info(f"Processing bundle: {key}")
            with pd.ExcelWriter(outfile, engine='openpyxl', mode='a' if key != bundles_dict['bundles'][0]['bundle_id'] else 'w') as writer:
                pd.DataFrame([sheet_dict]).to_excel(writer, sheet_name=key, index=False)
                logger.info(f"Successfully wrote bundle {key} to {outfile}")
    except Exception as e:
        logger.error(f"Error in save_only_optimized_bundles: {e}")
        raise

# Example usage
if __name__ == "__main__":
    save_only_optimized_bundles(
        product_to_clear=None,
        target_profit_margin_input="34",
        top_n=20,
        related_skus=None,
        outfile=os.path.join(EXCEL_DIR, "optimized_bundles_all_sizes.xlsx")
    )
