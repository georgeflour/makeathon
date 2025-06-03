// Flask API response types
export interface FlaskBundle {
  bundle_id: string
  name: string
  items: {
    item_name: string
    qty: number
  }[]
  price: number
  profitMargin: string
  duration: string
  season: string
  rationale: string
}

export interface FlaskResponse {
  bundles: FlaskBundle[]
}

// UI bundle type
export interface Bundle {
  id: string
  name: string
  description: string
  products: string[]
  originalPrice: number
  bundlePrice: number
  discount: number
  type: 'all' | 'complementary' | 'thematic' | 'volume' | 'cross-sell' | 'seasonal'
  status: 'active' | 'inactive' | 'scheduled'
  startDate: string
  endDate: string
  forecastedRevenue: number
  actualRevenue: number
  createdAt: string
  profitMargin: string
  itemCount: number
  rationale?: string
  duration: string
  season: string
}

// Search parameters interface
export interface SearchParameters {
  product_name: string
  profit_margin: number
  objective: 'Max Cart' | 'Sell Out'
  quantity: number
  timeframe: string
  bundle_type: 'all' | 'complementary' | 'volume' | 'thematic' | 'seasonal' | 'cross-sell'
}

// Inventory item type
export interface InventoryItem {
  item_id: string
  name: string
  category?: string
  price?: number
} 