import pandas as pd
import numpy as np
from sklearn.cluster import KMeans, DBSCAN
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import silhouette_score, classification_report
import matplotlib.pyplot as plt
import seaborn as sns
from collections import Counter
import warnings
warnings.filterwarnings('ignore')

class EcommerceBundlingSystem:
    def __init__(self):
        self.orders_df = None
        self.inventory_df = None
        self.processed_data = None
        self.clusters = None
        self.bundles = []
        self.scaler = StandardScaler()
        self.label_encoders = {}
        
    def load_data(self, excel_path):
        """Load orders and inventory data from Excel file"""
        try:
            # Load both sheets
            self.orders_df = pd.read_excel(excel_path, sheet_name='orders')
            self.inventory_df = pd.read_excel(excel_path, sheet_name='inventory')
            
            print(f"Loaded {len(self.orders_df)} orders and {len(self.inventory_df)} inventory items")
            print("\nOrders columns:", list(self.orders_df.columns))
            print("Inventory columns:", list(self.inventory_df.columns))
            
            return True
        except Exception as e:
            print(f"Error loading data: {e}")
            return False
    
    def preprocess_data(self):
        """Preprocess and feature engineer the data for clustering"""
        df = self.orders_df.copy()
        
        # Handle missing values
        numeric_cols = ['Quantity', 'OriginalUnitPrice', 'FinalUnitPrice', 
                       'OriginalLineTotal', 'FinalLineTotal', 'TotalOrderAmount']
        for col in numeric_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
        
        # Handle categorical columns
        categorical_cols = ['Category', 'Brand', 'ItemTitle']
        for col in categorical_cols:
            if col in df.columns:
                df[col] = df[col].fillna('Unknown')
        
        # Feature engineering
        df['PriceDiscount'] = (df.get('OriginalUnitPrice', 0) - df.get('FinalUnitPrice', 0)) / (df.get('OriginalUnitPrice', 1) + 1e-6)
        df['ProfitMargin'] = (df.get('FinalUnitPrice', 0) - df.get('OriginalUnitPrice', 0)) / (df.get('FinalUnitPrice', 1) + 1e-6)
        df['OrderValue'] = df.get('Quantity', 0) * df.get('FinalUnitPrice', 0)
        
        # Create time features
        if 'CreatedDate' in df.columns:
            df['CreatedDate'] = pd.to_datetime(df['CreatedDate'], errors='coerce')
            df['Month'] = df['CreatedDate'].dt.month
            df['DayOfWeek'] = df['CreatedDate'].dt.dayofweek
            df['IsWeekend'] = df['DayOfWeek'].isin([5, 6]).astype(int)
        
        # Encode categorical variables
        for col in ['Category', 'Brand']:
            if col in df.columns:
                le = LabelEncoder()
                df[f'{col}_encoded'] = le.fit_transform(df[col].astype(str))
                self.label_encoders[col] = le
        
        # Create user behavior features
        user_stats = df.groupby('UserID').agg({
            'Quantity': ['sum', 'mean'],
            'FinalUnitPrice': 'mean',
            'TotalOrderAmount': ['sum', 'mean'],
            'OrderNumber': 'nunique'
        }).round(2)
        
        user_stats.columns = ['UserTotalQty', 'UserAvgQty', 'UserAvgPrice', 
                             'UserTotalSpent', 'UserAvgOrderValue', 'UserOrderCount']
        
        df = df.merge(user_stats, left_on='UserID', right_index=True, how='left')
        
        # Create product popularity features
        product_stats = df.groupby('SKU').agg({
            'Quantity': 'sum',
            'OrderNumber': 'nunique',
            'UserID': 'nunique'
        }).round(2)
        
        product_stats.columns = ['ProductTotalSold', 'ProductOrderCount', 'ProductUniqueUsers']
        df = df.merge(product_stats, left_on='SKU', right_index=True, how='left')
        
        self.processed_data = df
        print(f"Data preprocessing complete. Shape: {df.shape}")
        return df
    
    def perform_clustering(self, method='kmeans', n_clusters=8):
        """Perform clustering analysis"""
        if self.processed_data is None:
            print("Please preprocess data first")
            return None
        
        # Select features for clustering
        feature_cols = [
            'Quantity', 'FinalUnitPrice', 'OrderValue', 'PriceDiscount', 'ProfitMargin',
            'Category_encoded', 'Brand_encoded', 'UserTotalQty', 'UserAvgPrice',
            'ProductTotalSold', 'ProductOrderCount'
        ]
        
        # Filter available columns
        available_cols = [col for col in feature_cols if col in self.processed_data.columns]
        X = self.processed_data[available_cols].fillna(0)
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        if method == 'kmeans':
            # Find optimal number of clusters using elbow method
            inertias = []
            silhouette_scores = []
            K_range = range(2, min(15, len(X) // 10))
            
            for k in K_range:
                kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
                kmeans.fit(X_scaled)
                inertias.append(kmeans.inertia_)
                if k <= 10:  # Limit silhouette calculation for performance
                    silhouette_scores.append(silhouette_score(X_scaled, kmeans.labels_))
            
            # Use silhouette score to find optimal k
            if silhouette_scores:
                optimal_k = K_range[np.argmax(silhouette_scores)]
                print(f"Optimal number of clusters: {optimal_k} (silhouette score: {max(silhouette_scores):.3f})")
            else:
                optimal_k = n_clusters
            
            # Final clustering
            clusterer = KMeans(n_clusters=optimal_k, random_state=42, n_init=10)
            
        elif method == 'dbscan':
            clusterer = DBSCAN(eps=0.5, min_samples=5)
        else:
            raise ValueError("Method must be 'kmeans' or 'dbscan'")
        
        cluster_labels = clusterer.fit_predict(X_scaled)
        
        # Add cluster labels to data
        self.processed_data['Cluster'] = cluster_labels
        
        # Analyze clusters
        cluster_analysis = self.analyze_clusters()
        
        self.clusters = {
            'labels': cluster_labels,
            'model': clusterer,
            'features': available_cols,
            'analysis': cluster_analysis
        }
        
        print(f"Clustering complete. Found {len(np.unique(cluster_labels))} clusters")
        return cluster_labels
    
    def analyze_clusters(self):
        """Analyze cluster characteristics"""
        cluster_stats = []
        
        for cluster_id in self.processed_data['Cluster'].unique():
            if cluster_id == -1:  # Skip noise points in DBSCAN
                continue
                
            cluster_data = self.processed_data[self.processed_data['Cluster'] == cluster_id]
            
            stats = {
                'cluster_id': cluster_id,
                'size': len(cluster_data),
                'avg_quantity': cluster_data['Quantity'].mean(),
                'avg_price': cluster_data['FinalUnitPrice'].mean(),
                'avg_order_value': cluster_data['OrderValue'].mean(),
                'top_categories': cluster_data['Category'].value_counts().head(3).to_dict(),
                'top_brands': cluster_data['Brand'].value_counts().head(3).to_dict(),
                'unique_users': cluster_data['UserID'].nunique(),
                'unique_products': cluster_data['SKU'].nunique(),
                'avg_discount': cluster_data['PriceDiscount'].mean()
            }
            cluster_stats.append(stats)
        
        return cluster_stats
    
    def identify_bundle_opportunities(self):
        """Identify different types of bundle opportunities"""
        self.bundles = []
        
        # 1. Complementary Bundles (Market Basket Analysis)
        complementary_bundles = self.find_complementary_bundles()
        self.bundles.extend(complementary_bundles)
        
        # 2. Volume Bundles
        volume_bundles = self.find_volume_bundles()
        self.bundles.extend(volume_bundles)
        
        # 3. Thematic Bundles
        thematic_bundles = self.find_thematic_bundles()
        self.bundles.extend(thematic_bundles)
        
        # 4. Cross-sell Bundles
        cross_sell_bundles = self.find_cross_sell_bundles()
        self.bundles.extend(cross_sell_bundles)
        
        # Sort by confidence score
        self.bundles.sort(key=lambda x: x['confidence'], reverse=True)
        
        print(f"Identified {len(self.bundles)} bundle opportunities")
        return self.bundles
    
    def find_complementary_bundles(self):
        """Find complementary products using market basket analysis"""
        bundles = []
        
        # Group by order to find frequently bought together items
        order_items = self.processed_data.groupby('OrderNumber')['SKU'].apply(list).reset_index()
        order_items = order_items[order_items['SKU'].apply(len) >= 2]  # Orders with 2+ items
        
        # Find frequent item pairs
        item_pairs = {}
        for items in order_items['SKU']:
            for i in range(len(items)):
                for j in range(i+1, len(items)):
                    pair = tuple(sorted([items[i], items[j]]))
                    item_pairs[pair] = item_pairs.get(pair, 0) + 1
        
        # Filter significant pairs
        min_support = max(2, len(order_items) * 0.01)  # At least 1% support
        frequent_pairs = {pair: count for pair, count in item_pairs.items() 
                         if count >= min_support}
        
        for (sku1, sku2), frequency in frequent_pairs.items():
            # Get product details
            item1 = self.processed_data[self.processed_data['SKU'] == sku1].iloc[0]
            item2 = self.processed_data[self.processed_data['SKU'] == sku2].iloc[0]
            
            # Calculate confidence (lift)
            sku1_orders = len(self.processed_data[self.processed_data['SKU'] == sku1]['OrderNumber'].unique())
            sku2_orders = len(self.processed_data[self.processed_data['SKU'] == sku2]['OrderNumber'].unique())
            total_orders = len(self.processed_data['OrderNumber'].unique())
            
            confidence = frequency / min(sku1_orders, sku2_orders)
            lift = (frequency * total_orders) / (sku1_orders * sku2_orders)
            
            if confidence > 0.1 and lift > 1.2:  # Minimum thresholds
                bundles.append({
                    'type': 'Complementary',
                    'items': [
                        {'sku': sku1, 'title': item1.get('ItemTitle', ''), 'category': item1.get('Category', ''), 'price': item1.get('FinalUnitPrice', 0)},
                        {'sku': sku2, 'title': item2.get('ItemTitle', ''), 'category': item2.get('Category', ''), 'price': item2.get('FinalUnitPrice', 0)}
                    ],
                    'frequency': frequency,
                    'confidence': min(0.95, confidence),
                    'lift': lift,
                    'description': f"{item1.get('Category', 'Item')} + {item2.get('Category', 'Item')} bundle"
                })
        
        return bundles[:20]  # Top 20 complementary bundles
    
    def find_volume_bundles(self):
        """Find volume bundle opportunities"""
        bundles = []
        
        # Analyze products with high repeat purchase rates
        sku_stats = self.processed_data.groupby('SKU').agg({
            'Quantity': ['sum', 'mean', 'count'],
            'UserID': 'nunique',
            'FinalUnitPrice': 'mean',
            'Category': 'first',
            'Brand': 'first',
            'ItemTitle': 'first'
        }).round(2)
        
        sku_stats.columns = ['TotalQty', 'AvgQty', 'OrderCount', 'UniqueUsers', 'AvgPrice', 'Category', 'Brand', 'Title']
        
        # Find products suitable for volume bundles
        volume_candidates = sku_stats[
            (sku_stats['TotalQty'] >= 10) &
            (sku_stats['AvgQty'] >= 1.5) &
            (sku_stats['OrderCount'] >= 3)
        ].copy()
        
        for sku, row in volume_candidates.iterrows():
            # Calculate potential volume discount
            base_price = row['AvgPrice']
            recommended_quantity = min(5, max(2, int(row['AvgQty'] * 1.5)))
            volume_discount = 0.1 + (recommended_quantity - 2) * 0.05  # 10-20% discount
            
            confidence = min(0.9, (row['TotalQty'] / 100) * (row['UniqueUsers'] / 10))
            
            bundles.append({
                'type': 'Volume',
                'items': [{
                    'sku': sku,
                    'title': row['Title'],
                    'category': row['Category'],
                    'price': base_price,
                    'quantity': recommended_quantity
                }],
                'base_price': base_price,
                'bundle_price': base_price * recommended_quantity * (1 - volume_discount),
                'savings': base_price * recommended_quantity * volume_discount,
                'confidence': confidence,
                'description': f"{recommended_quantity}x {row['Title']} - Save {volume_discount*100:.0f}%"
            })
        
        return sorted(bundles, key=lambda x: x['confidence'], reverse=True)[:15]
    
    def find_thematic_bundles(self):
        """Find thematic bundle opportunities"""
        bundles = []
        
        # Define themes and keywords
        themes = {
            'Summer': ['summer', 'beach', 'sun', 'swimwear', 'shorts', 'sandals'],
            'Winter': ['winter', 'warm', 'coat', 'boots', 'scarf', 'gloves'],
            'Fitness': ['fitness', 'gym', 'workout', 'sports', 'athletic', 'running'],
            'Business': ['business', 'formal', 'office', 'professional', 'suit'],
            'Casual': ['casual', 'everyday', 'comfort', 'relaxed'],
            'Party': ['party', 'celebration', 'festive', 'elegant', 'dress'],
            'Travel': ['travel', 'luggage', 'portable', 'compact']
        }
        
        for theme_name, keywords in themes.items():
            # Find products matching theme
            theme_products = []
            for _, row in self.processed_data.iterrows():
                title = str(row.get('ItemTitle', '')).lower()
                category = str(row.get('Category', '')).lower()
                
                if any(keyword in title or keyword in category for keyword in keywords):
                    theme_products.append(row)
            
            if len(theme_products) >= 3:
                # Group by category to create diverse bundles
                theme_df = pd.DataFrame(theme_products)
                category_groups = theme_df.groupby('Category')
                
                if len(category_groups) >= 2:
                    # Select top products from different categories
                    bundle_items = []
                    for category, group in category_groups:
                        # Sort by popularity and take top item
                        top_item = group.nlargest(1, 'Quantity').iloc[0]
                        bundle_items.append({
                            'sku': top_item['SKU'],
                            'title': top_item.get('ItemTitle', ''),
                            'category': top_item.get('Category', ''),
                            'price': top_item.get('FinalUnitPrice', 0)
                        })
                        
                        if len(bundle_items) >= 4:  # Max 4 items per bundle
                            break
                    
                    if len(bundle_items) >= 2:
                        total_price = sum(item['price'] for item in bundle_items)
                        confidence = min(0.8, len(theme_products) / 50)  # Based on theme popularity
                        
                        bundles.append({
                            'type': 'Thematic',
                            'theme': theme_name,
                            'items': bundle_items,
                            'total_price': total_price,
                            'confidence': confidence,
                            'description': f"{theme_name} collection bundle"
                        })
        
        return sorted(bundles, key=lambda x: x['confidence'], reverse=True)
    
    def find_cross_sell_bundles(self):
        """Find cross-sell opportunities (high-margin + popular items)"""
        bundles = []
        
        # Calculate product metrics
        product_metrics = self.processed_data.groupby('SKU').agg({
            'ProfitMargin': 'mean',
            'Quantity': 'sum',
            'FinalUnitPrice': 'mean',
            'UserID': 'nunique',
            'Category': 'first',
            'Brand': 'first',
            'ItemTitle': 'first'
        }).round(3)
        
        # Identify high-margin products
        high_margin = product_metrics[product_metrics['ProfitMargin'] > product_metrics['ProfitMargin'].quantile(0.7)]
        
        # Identify popular products
        popular = product_metrics[product_metrics['Quantity'] > product_metrics['Quantity'].quantile(0.7)]
        
        # Create cross-sell bundles
        for margin_sku, margin_row in high_margin.head(10).iterrows():
            for popular_sku, popular_row in popular.head(10).iterrows():
                if margin_sku != popular_sku and margin_row['Category'] != popular_row['Category']:
                    
                    # Calculate bundle attractiveness
                    margin_score = margin_row['ProfitMargin']
                    popularity_score = popular_row['Quantity'] / product_metrics['Quantity'].max()
                    price_balance = 1 - abs(margin_row['FinalUnitPrice'] - popular_row['FinalUnitPrice']) / max(margin_row['FinalUnitPrice'], popular_row['FinalUnitPrice'])
                    
                    confidence = (margin_score * 0.4 + popularity_score * 0.4 + price_balance * 0.2)
                    confidence = min(0.85, max(0.1, confidence))
                    
                    if confidence > 0.3:
                        bundles.append({
                            'type': 'Cross-sell',
                            'items': [
                                {
                                    'sku': margin_sku,
                                    'title': margin_row['ItemTitle'],
                                    'category': margin_row['Category'],
                                    'price': margin_row['FinalUnitPrice'],
                                    'role': 'high-margin'
                                },
                                {
                                    'sku': popular_sku,
                                    'title': popular_row['ItemTitle'],
                                    'category': popular_row['Category'],
                                    'price': popular_row['FinalUnitPrice'],
                                    'role': 'popular'
                                }
                            ],
                            'confidence': confidence,
                            'margin_score': margin_score,
                            'popularity_score': popularity_score,
                            'description': f"High-margin {margin_row['Category']} + Popular {popular_row['Category']}"
                        })
        
        return sorted(bundles, key=lambda x: x['confidence'], reverse=True)[:10]
    
    def classify_bundle_performance(self):
        """Use ML to classify bundle performance potential"""
        if not self.bundles:
            print("No bundles found. Run identify_bundle_opportunities first.")
            return None
        
        # Create features for bundle classification
        bundle_features = []
        bundle_labels = []
        
        for bundle in self.bundles:
            features = [
                len(bundle['items']),  # Number of items
                sum(item.get('price', 0) for item in bundle['items']),  # Total price
                bundle.get('confidence', 0),  # Confidence score
                1 if bundle['type'] == 'Complementary' else 0,
                1 if bundle['type'] == 'Volume' else 0,
                1 if bundle['type'] == 'Thematic' else 0,
                1 if bundle['type'] == 'Cross-sell' else 0,
            ]
            
            bundle_features.append(features)
            
            # Create synthetic labels based on confidence and type
            if bundle['confidence'] > 0.7:
                label = 'High'
            elif bundle['confidence'] > 0.4:
                label = 'Medium'
            else:
                label = 'Low'
            bundle_labels.append(label)
        
        # Train classifier
        if len(set(bundle_labels)) > 1:  # Need multiple classes
            X = np.array(bundle_features)
            y = np.array(bundle_labels)
            
            # Encode labels
            le = LabelEncoder()
            y_encoded = le.fit_transform(y)
            
            # Train model
            clf = RandomForestClassifier(n_estimators=100, random_state=42)
            clf.fit(X, y_encoded)
            
            # Predict probabilities
            probabilities = clf.predict_proba(X)
            predictions = clf.predict(X)
            
            # Add predictions to bundles
            for i, bundle in enumerate(self.bundles):
                bundle['predicted_performance'] = le.inverse_transform([predictions[i]])[0]
                bundle['performance_probability'] = max(probabilities[i])
            
            return clf
        
        return None
    
    def visualize_results(self):
        """Create visualizations of the analysis"""
        fig, axes = plt.subplots(2, 3, figsize=(18, 12))
        fig.suptitle('E-commerce Bundle Analysis Results', fontsize=16, fontweight='bold')
        
        # 1. Cluster distribution
        if self.clusters:
            cluster_counts = pd.Series(self.clusters['labels']).value_counts().sort_index()
            axes[0, 0].bar(cluster_counts.index, cluster_counts.values, color='skyblue', alpha=0.7)
            axes[0, 0].set_title('Product Clusters Distribution')
            axes[0, 0].set_xlabel('Cluster ID')
            axes[0, 0].set_ylabel('Number of Products')
        
        # 2. Bundle types distribution
        if self.bundles:
            bundle_types = [bundle['type'] for bundle in self.bundles]
            type_counts = Counter(bundle_types)
            axes[0, 1].pie(type_counts.values(), labels=type_counts.keys(), autopct='%1.1f%%', startangle=90)
            axes[0, 1].set_title('Bundle Types Distribution')
        
        # 3. Confidence score distribution
        if self.bundles:
            confidences = [bundle['confidence'] for bundle in self.bundles]
            axes[0, 2].hist(confidences, bins=20, color='lightgreen', alpha=0.7, edgecolor='black')
            axes[0, 2].set_title('Bundle Confidence Scores')
            axes[0, 2].set_xlabel('Confidence Score')
            axes[0, 2].set_ylabel('Frequency')
        
        # 4. Price distribution by cluster
        if self.processed_data is not None and 'Cluster' in self.processed_data.columns:
            sns.boxplot(data=self.processed_data, x='Cluster', y='FinalUnitPrice', ax=axes[1, 0])
            axes[1, 0].set_title('Price Distribution by Cluster')
            axes[1, 0].tick_params(axis='x', rotation=45)
        
        # 5. Top categories in bundles
        if self.bundles:
            all_categories = []
            for bundle in self.bundles:
                for item in bundle['items']:
                    if 'category' in item:
                        all_categories.append(item['category'])
            
            if all_categories:
                cat_counts = Counter(all_categories).most_common(10)
                categories, counts = zip(*cat_counts)
                axes[1, 1].barh(range(len(categories)), counts, color='coral', alpha=0.7)
                axes[1, 1].set_yticks(range(len(categories)))
                axes[1, 1].set_yticklabels(categories)
                axes[1, 1].set_title('Top Categories in Bundles')
                axes[1, 1].set_xlabel('Frequency')
        
        # 6. Bundle value distribution
        if self.bundles:
            bundle_values = []
            for bundle in self.bundles:
                total_value = sum(item.get('price', 0) for item in bundle['items'])
                bundle_values.append(total_value)
            
            if bundle_values:
                axes[1, 2].scatter(range(len(bundle_values)), bundle_values, 
                                 c=[bundle['confidence'] for bundle in self.bundles], 
                                 cmap='viridis', alpha=0.6)
                axes[1, 2].set_title('Bundle Value vs Confidence')
                axes[1, 2].set_xlabel('Bundle Index')
                axes[1, 2].set_ylabel('Total Bundle Value ($)')
                plt.colorbar(axes[1, 2].collections[0], ax=axes[1, 2], label='Confidence')
        
        plt.tight_layout()
        plt.show()
    
    def generate_report(self, output_file='bundle_analysis_report.txt'):
        """Generate a comprehensive analysis report"""
        report = []
        report.append("="*80)
        report.append("E-COMMERCE BUNDLE INTELLIGENCE REPORT")
        report.append("="*80)
        report.append(f"Generated on: {pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report.append("")
        
        # Data Summary
        report.append("DATA SUMMARY")
        report.append("-" * 40)
        if self.orders_df is not None:
            report.append(f"Total Orders: {len(self.orders_df):,}")
            report.append(f"Unique Products: {self.orders_df['SKU'].nunique():,}")
            report.append(f"Unique Users: {self.orders_df['UserID'].nunique():,}")
            report.append(f"Total Revenue: ${self.orders_df['TotalOrderAmount'].sum():,.2f}")
        report.append("")
        
        # Clustering Results
        if self.clusters:
            report.append("CLUSTERING ANALYSIS")
            report.append("-" * 40)
            report.append(f"Number of Clusters: {len(self.clusters['analysis'])}")
            report.append("")
            
            for cluster in self.clusters['analysis'][:5]:  # Top 5 clusters
                report.append(f"Cluster {cluster['cluster_id']}:")
                report.append(f"  Size: {cluster['size']} products")
                report.append(f"  Avg Price: ${cluster['avg_price']:.2f}")
                report.append(f"  Avg Quantity: {cluster['avg_quantity']:.1f}")
                report.append(f"  Top Categories: {', '.join(cluster['top_categories'].keys())}")
                report.append("")
        
        # Bundle Opportunities
        if self.bundles:
            report.append("BUNDLE OPPORTUNITIES")
            report.append("-" * 40)
            
            # Summary by type
            bundle_summary = {}
            for bundle in self.bundles:
                btype = bundle['type']
                if btype not in bundle_summary:
                    bundle_summary[btype] = {'count': 0, 'avg_confidence': 0}
                bundle_summary[btype]['count'] += 1
                bundle_summary[btype]['avg_confidence'] += bundle['confidence']
            
            for btype, stats in bundle_summary.items():
                avg_conf = stats['avg_confidence'] / stats['count']
                report.append(f"{btype} Bundles: {stats['count']} opportunities (avg confidence: {avg_conf:.2f})")
            report.append("")
            
            # Top bundle recommendations
            report.append("TOP BUNDLE RECOMMENDATIONS")
            report.append("-" * 40)
            
            for i, bundle in enumerate(self.bundles[:10], 1):
                report.append(f"{i}. {bundle['type']} Bundle (Confidence: {bundle['confidence']:.2f})")
                report.append(f"   Description: {bundle['description']}")
                report.append(f"   Items: {len(bundle['items'])}")
                
                if 'items' in bundle:
                    for item in bundle['items'][:3]:  # Show first 3 items
                        title = item.get('title', item.get('sku', 'Unknown'))[:50]
                        price = item.get('price', 0)
                        report.append(f"     • {title} - ${price:.2f}")
                
                if bundle['type'] == 'Volume' and 'savings' in bundle:
                    report.append(f"   Potential Savings: ${bundle['savings']:.2f}")
                
                report.append("")
        
        # Recommendations
        report.append("STRATEGIC RECOMMENDATIONS")
        report.append("-" * 40)
        
        if self.bundles:
            high_confidence_bundles = [b for b in self.bundles if b['confidence'] > 0.6]
            report.append(f"1. Implement {len(high_confidence_bundles)} high-confidence bundles immediately")
            
            # Type-specific recommendations
            comp_bundles = [b for b in self.bundles if b['type'] == 'Complementary']
            if comp_bundles:
                report.append(f"2. Focus on Complementary bundles - {len(comp_bundles)} opportunities identified")
                report.append("   These show strong customer purchase patterns")
            
            volume_bundles = [b for b in self.bundles if b['type'] == 'Volume']
            if volume_bundles:
                report.append(f"3. Implement Volume discounts for {len(volume_bundles)} products")
                report.append("   Can increase average order value significantly")
            
            cross_sell_bundles = [b for b in self.bundles if b['type'] == 'Cross-sell']
            if cross_sell_bundles:
                report.append(f"4. Use {len(cross_sell_bundles)} Cross-sell bundles to improve margins")
                report.append("   Combine high-margin items with popular products")
        
        report.append("")
        report.append("="*80)
        
        # Write to file
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write('\n'.join(report))
        
        print(f"Report saved to {output_file}")
        return '\n'.join(report)
    
    def run_complete_analysis(self, excel_path):
        """Run the complete bundling analysis pipeline"""
        print("Starting E-commerce Bundle Intelligence Analysis...")
        print("="*60)
        
        # Step 1: Load data
        print("Step 1: Loading data...")
        if not self.load_data(excel_path):
            return False
        
        # Step 2: Preprocess data
        print("\nStep 2: Preprocessing data...")
        self.preprocess_data()
        
        # Step 3: Perform clustering
        print("\nStep 3: Performing clustering analysis...")
        self.perform_clustering()
        
        # Step 4: Identify bundles
        print("\nStep 4: Identifying bundle opportunities...")
        self.identify_bundle_opportunities()
        
        # Step 5: Classify performance
        print("\nStep 5: Classifying bundle performance...")
        self.classify_bundle_performance()
        
        # Step 6: Generate visualizations
        print("\nStep 6: Generating visualizations...")
        self.visualize_results()
        
        # Step 7: Generate report
        print("\nStep 7: Generating analysis report...")
        report = self.generate_report()
        
        print("\n" + "="*60)
        print("ANALYSIS COMPLETE!")
        print("="*60)
        
        return True
    
    def get_bundle_recommendations(self, bundle_type=None, min_confidence=0.3, top_n=10):
        """Get filtered bundle recommendations"""
        filtered_bundles = self.bundles.copy()
        
        # Filter by type
        if bundle_type:
            filtered_bundles = [b for b in filtered_bundles if b['type'] == bundle_type]
        
        # Filter by confidence
        filtered_bundles = [b for b in filtered_bundles if b['confidence'] >= min_confidence]
        
        # Return top N
        return filtered_bundles[:top_n]
    
    def export_bundles_to_csv(self, filename='recommended_bundles.csv'):
        """Export bundle recommendations to CSV"""
        if not self.bundles:
            print("No bundles to export")
            return
        
        export_data = []
        for i, bundle in enumerate(self.bundles):
            base_info = {
                'bundle_id': i + 1,
                'type': bundle['type'],
                'description': bundle['description'],
                'confidence': bundle['confidence'],
                'num_items': len(bundle['items'])
            }
            
            # Add item details
            for j, item in enumerate(bundle['items']):
                row = base_info.copy()
                row.update({
                    'item_position': j + 1,
                    'sku': item.get('sku', ''),
                    'item_title': item.get('title', ''),
                    'category': item.get('category', ''),
                    'price': item.get('price', 0),
                    'quantity': item.get('quantity', 1)
                })
                export_data.append(row)
        
        df = pd.DataFrame(export_data)
        df.to_csv(filename, index=False)
        print(f"Bundle recommendations exported to {filename}")


# Example usage and testing functions
def create_sample_data():
    """Create sample data for testing"""
    np.random.seed(42)
    
    # Sample orders data
    n_orders = 1000
    n_products = 200
    n_users = 150
    
    categories = ['Electronics', 'Clothing', 'Books', 'Home', 'Sports', 'Beauty']
    brands = ['BrandA', 'BrandB', 'BrandC', 'BrandD', 'BrandE']
    
    orders_data = []
    for i in range(n_orders):
        order_num = f"ORD{i+1:05d}"
        user_id = f"USER{np.random.randint(1, n_users+1):04d}"
        sku = f"SKU{np.random.randint(1, n_products+1):04d}"
        category = np.random.choice(categories)
        brand = np.random.choice(brands)
        
        quantity = np.random.randint(1, 5)
        original_price = np.random.uniform(10, 200)
        discount = np.random.uniform(0, 0.3)
        final_price = original_price * (1 - discount)
        
        orders_data.append({
            'OrderNumber': order_num,
            'CreatedDate': pd.Timestamp.now() - pd.Timedelta(days=np.random.randint(0, 365)),
            'SKU': sku,
            'ItemTitle': f"{category} Item {sku}",
            'Category': category,
            'Brand': brand,
            'Quantity': quantity,
            'OriginalUnitPrice': round(original_price, 2),
            'OriginalLineTotal': round(original_price * quantity, 2),
            'FinalUnitPrice': round(final_price, 2),
            'FinalLineTotal': round(final_price * quantity, 2),
            'FinalOrderItemsTotal': round(final_price * quantity, 2),
            'ShippingTotal': round(np.random.uniform(0, 15), 2),
            'TotalOrderAmount': round(final_price * quantity + np.random.uniform(0, 15), 2),
            'UserID': user_id
        })
    
    # Sample inventory data
    inventory_data = []
    for i in range(1, n_products + 1):
        inventory_data.append({
            'SKU': f"SKU{i:04d}",
            'Quantity': np.random.randint(0, 100)
        })
    
    # Create Excel file
    with pd.ExcelWriter('sample_ecommerce_data.xlsx', engine='openpyxl') as writer:
        pd.DataFrame(orders_data).to_excel(writer, sheet_name='orders', index=False)
        pd.DataFrame(inventory_data).to_excel(writer, sheet_name='inventory', index=False)
    
    print("Sample data created: sample_ecommerce_data.xlsx")
    return 'sample_ecommerce_data.xlsx'


def demo_analysis():
    """Run a demonstration of the bundling system"""
    print("Creating sample data...")
    excel_file = create_sample_data()
    
    print("\nInitializing Bundle Intelligence System...")
    system = EcommerceBundlingSystem()
    
    print("\nRunning complete analysis...")
    success = system.run_complete_analysis(excel_file)
    
    if success:
        print("\n" + "="*60)
        print("DEMO RESULTS SUMMARY")
        print("="*60)
        
        # Show top recommendations
        print("\nTOP 5 BUNDLE RECOMMENDATIONS:")
        top_bundles = system.get_bundle_recommendations(top_n=5)
        
        for i, bundle in enumerate(top_bundles, 1):
            print(f"\n{i}. {bundle['type']} Bundle (Confidence: {bundle['confidence']:.2f})")
            print(f"   {bundle['description']}")
            print(f"   Items ({len(bundle['items'])}):")
            for item in bundle['items'][:3]:
                print(f"     • {item.get('title', 'Unknown')} - ${item.get('price', 0):.2f}")
        
        # Export results
        system.export_bundles_to_csv()
        
        print(f"\nAnalysis complete! Check the generated files:")
        print("- bundle_analysis_report.txt")
        print("- recommended_bundles.csv")
        
    return system


if __name__ == "__main__":
    # Run demonstration
    system = demo_analysis()
    
    # Additional analysis examples
    if system and system.bundles:
        print("\n" + "="*60)
        print("ADDITIONAL ANALYSIS EXAMPLES")
        print("="*60)
        
        # Get specific bundle types
        print("\nComplementary Bundles:")
        comp_bundles = system.get_bundle_recommendations(bundle_type='Complementary', top_n=3)
        for bundle in comp_bundles:
            print(f"- {bundle['description']} (Confidence: {bundle['confidence']:.2f})")
        
        print("\nVolume Bundles:")
        vol_bundles = system.get_bundle_recommendations(bundle_type='Volume', top_n=3)
        for bundle in vol_bundles:
            print(f"- {bundle['description']} (Savings: ${bundle.get('savings', 0):.2f})")
        
        print("\nHigh-Confidence Bundles (>0.5):")
        high_conf = system.get_bundle_recommendations(min_confidence=0.5, top_n=5)
        print(f"Found {len(high_conf)} high-confidence bundle opportunities")
    
    print("\nDemo completed! You can now use your own data by calling:")
    print("system = EcommerceBundlingSystem()")
    print("system.run_complete_analysis('your_data.xlsx')")