import pandas as pd
import argparse
import random

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

    # --- Margin filtering ---
    margin_col = None
    if target_profit_margin_input is not None:
        margin_col_candidate = f'Suggested Price ({target_profit_margin_input}% off)'
        if margin_col_candidate in filtered.columns:
            margin_col = margin_col_candidate
        else:
            print(f"[Warning] Margin {target_profit_margin_input}% not found. Using closest available margin.")
    if margin_col is None:
        for col in filtered.columns:
            if col.startswith("Suggested Price"):
                margin_col = col
                print(f"[Info] Using margin column: {margin_col}")
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
    initial_bundle,            # set of SKUs
    all_skus,                  # set of all candidate SKUs
    sku_to_price,              # dict: SKU -> price
    bundle_size=3,
    target_margin=0.73,
    max_iters=100
):
    def margin_objective(bundle):
        prices = [sku_to_price.get(sku, 0) for sku in bundle]
        orig_sum = sum(prices)
        if orig_sum == 0: return 0
        target_price = orig_sum * target_margin
        return target_price

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

def parse_args():
    parser = argparse.ArgumentParser(description="Optimise bundles from all sheets in Excel with local search")
    parser.add_argument('--excel', default='product_bundle_suggestions.xlsx', help='Path to input Excel file')
    parser.add_argument('--margin', type=int, help='Target profit margin as integer (e.g. 27)')
    parser.add_argument('--product', help='Product to clear (SKU)')
    parser.add_argument('--topn', type=int, default=10, help='How many bundles to suggest per size')
    parser.add_argument('--related', nargs='*', help='Related SKUs (optional)')
    parser.add_argument('--outfile', default='nearest_bundles_all_sizes.xlsx', help='Output Excel file for filtered bundles')
    parser.add_argument('--optfile', default='optimized_bundles_all_sizes.xlsx', help='Output Excel file for locally optimized bundles')
    return parser.parse_args()

if __name__ == '__main__':
    args = parse_args()
    bundle_sheets = pd.read_excel(args.excel, sheet_name=None)
    wanted_sheets = {k: v for k, v in bundle_sheets.items() if k.startswith('Bundles_')}

    output = {}
    local_search_output = {}

    for sheet, df in wanted_sheets.items():
        print(f"Processing {sheet} ...")
        size = int(sheet.split('_')[1])
        filtered = find_nearest_bundles(
            df,
            product_to_clear=args.product,
            target_profit_margin_input=args.margin,
            top_n=args.topn,
            related_skus=args.related
        )
        output[sheet] = filtered

        # --- Local Search part: ---
        # Prepare price dict
        sku_to_price = {}
        for idx, row in df.iterrows():
            # Pick the correct margin column for price
            margin_col = f'Suggested Price ({args.margin}% off)' if args.margin else None
            if margin_col and margin_col in row:
                price = row[margin_col]
            else:
                price_cols = [col for col in df.columns if col.startswith("Suggested Price")]
                price = row[price_cols[0]] if price_cols else 0
            for sku in map(str.strip, str(row['SKUs']).split(',')):
                if sku not in sku_to_price or price > sku_to_price[sku]:
                    sku_to_price[sku] = price

        all_skus = set(sku_to_price.keys())
        if filtered.shape[0] > 0:
            local_solutions = []
            for idx, row in filtered.iterrows():
                initial_bundle = set(map(str.strip, str(row['SKUs']).split(',')))
                opt_bundle, opt_score = local_search_bundle(
                    initial_bundle, all_skus, sku_to_price,
                    bundle_size=size,
                    target_margin=1 - (args.margin or 27) / 100,
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
            # Output only top n unique bundles by score
            local_df = pd.DataFrame(local_solutions).drop_duplicates('SKUs').sort_values('Optimized Score', ascending=False).head(args.topn)
            local_search_output[sheet] = local_df

    with pd.ExcelWriter(args.outfile, engine='openpyxl') as writer:
        for sheet, df in output.items():
            df.to_excel(writer, sheet_name=sheet, index=False)
    with pd.ExcelWriter(args.optfile, engine='openpyxl') as writer:
        for sheet, df in local_search_output.items():
            df.to_excel(writer, sheet_name=sheet, index=False)

    print(f"Done! Filtered bundles saved to {args.outfile}")
    print(f"Optimized bundles saved to {args.optfile}")

    # Example: python3 optimise_bundles.py --margin 27 --product 9-4896000585 --topn 10 --related 9-4896001185 9-4896000227

