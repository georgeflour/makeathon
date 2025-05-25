export interface Product {
  sku: string
  title: string
  category: string
  brand: string
  originalPrice: number
  finalPrice: number
  stockQuantity: number
}

export interface Bundle {
  id: string
  name: string
  description: string
  products: Product[]
  originalPrice: number
  bundlePrice: number
  discount: number
  type: 'complementary' | 'thematic' | 'volume' | 'cross-sell'
  status: 'active' | 'inactive' | 'scheduled'
  startDate: string
  endDate: string
  forecastedRevenue: number
  actualRevenue: number
  createdAt: string
}

export interface Order {
  orderNumber: string
  createdDate: string
  userID: string | null
  items: OrderItem[]
  totalAmount: number
  shippingTotal: number
}

export interface OrderItem {
  sku: string
  title: string
  category: string
  brand: string
  quantity: number
  originalUnitPrice: number
  finalUnitPrice: number
  originalLineTotal: number
  finalLineTotal: number
}

export interface CustomerSegment {
  id: string
  name: string
  description: string
  customerCount: number
  avgOrderValue: number
  totalRevenue: number
  characteristics: string[]
}

export interface InventoryAlert {
  sku: string
  title: string
  currentStock: number
  threshold: number
  severity: 'low' | 'critical' | 'out-of-stock'
  lastUpdated: string
}
