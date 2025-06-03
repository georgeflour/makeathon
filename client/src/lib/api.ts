import { Bundle } from '@/types/bundles'

interface Product {
  id: string
  name: string
  price: number
  stock: number
  category: string
}

interface InventoryAlert {
  id: string
  productId: string
  type: 'low_stock' | 'out_of_stock'
  message: string
  createdAt: string
}

interface Order {
  id: string
  customerId: string
  items: {
    productId: string
    quantity: number
    price: number
  }[]
  total: number
  status: 'pending' | 'completed' | 'cancelled'
  createdAt: string
}

interface CustomerSegment {
  id: string
  name: string
  size: number
  averageOrderValue: number
  description: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

class ApiClient {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error)
      throw error
    }
  }

  // Bundles API
  async getBundles(): Promise<Bundle[]> {
    return this.request<Bundle[]>('/bundles')
  }

  async createBundle(bundle: Partial<Bundle>): Promise<Bundle> {
    return this.request<Bundle>('/bundles', {
      method: 'POST',
      body: JSON.stringify(bundle),
    })
  }

  async optimizePrice(
    bundleId: string,
    params: any
  ): Promise<{ optimizedPrice: number; forecast: any }> {
    return this.request(`/bundles/${bundleId}/optimize-price`, {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }

  // Inventory API
  async getInventory(): Promise<Product[]> {
    return this.request<Product[]>('/inventory')
  }

  async getStockAlerts(): Promise<InventoryAlert[]> {
    return this.request<InventoryAlert[]>('/inventory/alerts')
  }

  // Orders API
  async getOrders(params?: any): Promise<Order[]> {
    const queryString = params ? `?${new URLSearchParams(params)}` : ''
    return this.request<Order[]>(`/orders${queryString}`)
  }

  async getOrderStats(): Promise<any> {
    return this.request('/orders/stats')
  }

  // Analytics API
  async getAnalytics(): Promise<any> {
    return this.request('/analytics')
  }

  async getCustomerSegments(): Promise<CustomerSegment[]> {
    return this.request<CustomerSegment[]>('/analytics/segments')
  }
}

export const apiClient = new ApiClient()
