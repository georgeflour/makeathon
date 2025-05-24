import psycopg2
import pandas as pd
from pathlib import Path
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
import logging
from datetime import datetime

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('db_operations.log'),
        logging.StreamHandler()
    ]
)

load_dotenv()

def get_db_connection():
    """Create and return a database connection"""
    conn = psycopg2.connect(
        dbname='makeathon',
        user='makeathon_user',
        password='makeathon_pass',
        host='localhost',
        port='5432'
    )
    return conn

def init_db():
    """Initialize database tables if they don't exist"""
    logging.info("Starting database initialization...")
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS Orders (
            OrderNumber VARCHAR(50),
            CreatedDate TIMESTAMP,
            SKU VARCHAR(50),
            ItemTitle VARCHAR(255),
            Category VARCHAR(100),
            Brand VARCHAR(100),
            Quantity BIGINT,
            OriginalUnitPrice DECIMAL(10,2),
            FinalUnitPrice DECIMAL(10,2),
            UserID VARCHAR(50)
        )
        """)
        logging.info("Orders table created/verified")
        
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS Inventory (
            SKU VARCHAR(50) PRIMARY KEY,
            Quantity BIGINT,
            ItemTitle VARCHAR(255),
            Category VARCHAR(100),
            Brand VARCHAR(100)
        )
        """)
        logging.info("Inventory table created/verified")
        
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS Bundles (
            BundleID VARCHAR(50) PRIMARY KEY,
            Name VARCHAR(255),
            Type VARCHAR(50),
            CreatedDate TIMESTAMP,
            StartDate TIMESTAMP,
            EndDate TIMESTAMP,
            Status VARCHAR(50),
            Rules JSONB,
            Metadata JSONB
        )
        """)
        logging.info("Bundles table created/verified")
        
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS BundleItems (
            BundleID VARCHAR(50),
            SKU VARCHAR(50),
            Quantity BIGINT,
            Discount DECIMAL(5,2),
            FOREIGN KEY (BundleID) REFERENCES Bundles(BundleID),
            FOREIGN KEY (SKU) REFERENCES Inventory(SKU),
            PRIMARY KEY (BundleID, SKU)
        )
        """)
        logging.info("BundleItems table created/verified")
        
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS BundlePerformance (
            BundleID VARCHAR(50),
            Date DATE,
            SalesCount BIGINT,
            Revenue DECIMAL(12,2),
            FOREIGN KEY (BundleID) REFERENCES Bundles(BundleID),
            PRIMARY KEY (BundleID, Date)
        )
        """)
        logging.info("BundlePerformance table created/verified")
        
        cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_orders_sku ON Orders(SKU);
        CREATE INDEX IF NOT EXISTS idx_orders_date ON Orders(CreatedDate);
        CREATE INDEX IF NOT EXISTS idx_bundle_items_sku ON BundleItems(SKU);
        CREATE INDEX IF NOT EXISTS idx_bundle_performance_date ON BundlePerformance(Date);
        """)
        logging.info("Indexes created/verified")
        
        conn.commit()
        logging.info("Database initialization completed successfully")
        
    except Exception as e:
        logging.error(f"Error during database initialization: {str(e)}")
        raise
    finally:
        conn.close()

def load_data_from_excel():
    """Load data from Excel into PostgreSQL database"""
    logging.info("Starting data loading process...")
    try:
        excel_path = '/Users/iasonaspassam/makeathon/Data.xlsx'
        logging.info(f"Reading Excel file from: {excel_path}")
        
        xls = pd.ExcelFile(excel_path)
        orders_df = pd.read_excel(xls, 'orders')
        inventory_df = pd.read_excel(xls, 'inventory')

        logging.info(f"Orders data shape: {orders_df.shape}")
        logging.info(f"Inventory data shape: {inventory_df.shape}")

        # Map Excel columns to database columns
        orders_cols = {
            'OrderNumber': 'OrderNumber',
            'CreatedDate': 'CreatedDate',
            'SKU': 'SKU',
            'Item title': 'ItemTitle',
            'Category': 'Category',
            'Brand': 'Brand',
            'Quantity': 'Quantity',
            'OriginalUnitPrice': 'OriginalUnitPrice',
            'FinalUnitPrice': 'FinalUnitPrice',
            'UserID': 'UserID'
        }
        
        # Log the actual columns in the DataFrame
        logging.info(f"Available columns in orders DataFrame: {orders_df.columns.tolist()}")
        
        # Rename columns to match database schema
        orders_df = orders_df.rename(columns=orders_cols)
        
        # Select only the columns we need
        orders_df = orders_df[list(orders_cols.values())]
        
        # For inventory, map the columns correctly
        inventory_cols = {
            'SKU': 'SKU',
            'Quantity': 'Quantity'
        }
        
        # Log the actual columns in the inventory DataFrame
        logging.info(f"Available columns in inventory DataFrame: {inventory_df.columns.tolist()}")
        
        # Get unique SKUs with their details from orders
        sku_details = orders_df[['SKU', 'ItemTitle', 'Category', 'Brand']].drop_duplicates()
        
        # Merge inventory with SKU details
        inventory_df = pd.merge(
            inventory_df,
            sku_details,
            on='SKU',
            how='left'
        )
        
        # Rename inventory columns
        inventory_df = inventory_df.rename(columns=inventory_cols)
        
        # Select only the columns we need for inventory
        inventory_df = inventory_df[['SKU', 'Quantity', 'ItemTitle', 'Category', 'Brand']]
        
        # Connect using SQLAlchemy
        engine = create_engine('postgresql+psycopg2://makeathon_user:makeathon_pass@localhost:5432/makeathon')

        # Clear existing data before loading new data
        logging.info("Clearing existing data...")
        with engine.connect() as connection:
            connection.execute(text("TRUNCATE TABLE \"Orders\" CASCADE;"))
            connection.execute(text("TRUNCATE TABLE \"Inventory\" CASCADE;"))
            connection.execute(text("COMMIT;"))

        # Load new data
        logging.info("Loading Orders data...")
        orders_df.to_sql('Orders', engine, if_exists='append', index=False, method='multi')
        logging.info(f"Loaded {len(orders_df)} orders")

        logging.info("Loading Inventory data...")
        inventory_df.to_sql('Inventory', engine, if_exists='append', index=False, method='multi')
        logging.info(f"Loaded {len(inventory_df)} inventory items")

        engine.dispose()

        # Verify
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM Orders;")
        orders_count = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM Inventory;")
        inventory_count = cur.fetchone()[0]
        conn.close()

       
    except Exception as e:
        logging.error(f"Error loading data: {str(e)}")
        raise

if __name__ == "__main__":
    logging.info("=== Starting database operations ===")
    init_db()
    load_data_from_excel()
    logging.info("=== Database operations completed ===")
