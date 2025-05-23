'use client'
import { useState } from 'react'
import { Search, Filter, AlertTriangle, Package, Truck, Download } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { Product, InventoryAlert } from '@/lib/types'
import { useApi } from '@/hooks/useApi'
import { apiClient } from '@/lib/api'

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStock, setFilterStock] = useState('all')

  const { data: inventory, loading: inventoryLoading } = useApi<Product[]>(
    () => apiClient.getInventory(),
    []
  )

  const { data: alerts, loading: alertsLoading } = useApi<InventoryAlert[]>(
    () => apiClient.getStockAlerts(),
    []
  )

  // Mock data for development
  const mockInventory: Product[] = [
    {
      sku: 'TSH-001-M-BLU',
      title: 'Blue Cotton T-Shirt - Medium',
      category: 'Clothing',
      brand: 'BasicWear',
      originalPrice: 25.99,
      finalPrice: 22.99,
      stockQuantity: 150
    },
    {
      sku: 'SNK-102-9-WHT',
      title: 'White Running Sneakers - Size 9',
      category: 'Footwear',
      brand: 'SportMax',
      originalPrice: 89.99,
      finalPrice: 79.99,
      stockQuantity: 12
    },
    {
      sku: 'LIP-205-RED',
      title: 'Red Matte Lipstick',
      category: 'Beauty',
      brand: 'GlamCo',
      originalPrice: 18.50,
      finalPrice: 18.50,
      stockQuantity: 3
    },
    {
      sku: 'BAG-301-BLK',
      title: 'Black Leather Handbag',
      category: 'Accessories',
      brand: 'LuxBags',
      originalPrice: 149.99,
      finalPrice: 129.99,
      stockQuantity: 45
    }
  ]

  const mockAlerts: InventoryAlert[] = [
    {
      sku: 'SNK-102-9-WHT',
      title: 'White Running Sneakers - Size 9',
      currentStock: 12,
      threshold: 20,
      severity: 'low',
      lastUpdated: '2024-05-23T10:30:00Z'
    },
    {
      sku: 'LIP-205-RED',
      title: 'Red Matte Lipstick',
      currentStock: 3,
      threshold: 15,
      severity: 'critical',
      lastUpdated: '2024-05-23T09:15:00Z'
    }
  ]

  const displayInventory = inventory || mockInventory
  const displayAlerts = alerts || mockAlerts

  const filteredInventory = displayInventory.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory
    const matchesStock = filterStock === 'all' || 
                        (filterStock === 'low' && product.stockQuantity < 20) ||
                        (filterStock === 'out' && product.stockQuantity === 0) ||
                        (filterStock === 'in' && product.stockQuantity > 0)
    return matchesSearch && matchesCategory && matchesStock
  })

  const categories = Array.from(new Set(displayInventory.map(p => p.category)))

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600 mt-1">Monitor stock levels and manage inventory</p>
        </div>
        <div className="flex space-x-3 mt-4 sm:mt-0">
          <Button variant="secondary">
            <Truck className="h-4 w-4 mr-2" />
            Reorder
          </Button>
          <Button variant="secondary">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stock Alerts */}
      {displayAlerts.length > 0 && (
        <Card className="mb-6" title="Stock Alerts" subtitle={`${displayAlerts.length} items need attention`}>
          <div className="space-y-3">
            {displayAlerts.map((alert) => (
              <div key={alert.sku} className={`flex items-center justify-between p-3 rounded-lg ${
                alert.severity === 'critical' ? 'bg-red-50 border border-red-200' :
                alert.severity === 'low' ? 'bg-orange-50 border border-orange-200' :
                'bg-gray-50 border border-gray-200'
              }`}>
                <div className="flex items-center">
                  <AlertTriangle className={`h-5 w-5 mr-3 ${
                    alert.severity === 'critical' ? 'text-red-500' :
                    alert.severity === 'low' ? 'text-orange-500' :
                    'text-gray-500'
                  }`} />
                  <div>
                    <p className="font-medium text-gray-900">{alert.title}</p>
                    <p className="text-sm text-gray-600">
                      Current stock: {alert.currentStock} (Threshold: {alert.threshold})
                    </p>
                  </div>
                </div>
                <Button size="sm">
                  Reorder
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <select
              value={filterStock}
              onChange={(e) => setFilterStock(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Stock Levels</option>
              <option value="in">In Stock</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Inventory Table */}
      <Card>
        <div className="overflow-x-auto">
          {inventoryLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse flex space-x-4 py-4">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-4 bg-gray-200 rounded w-48"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
              ))}
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Brand
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInventory.map((product) => (
                  <tr key={product.sku} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {product.sku}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{product.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.brand}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      €{product.finalPrice}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.stockQuantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        product.stockQuantity === 0 ? 'bg-red-100 text-red-800' :
                        product.stockQuantity < 20 ? 'bg-orange-100 text-orange-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {product.stockQuantity === 0 ? 'Out of Stock' :
                         product.stockQuantity < 20 ? 'Low Stock' :
                         'In Stock'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  )
}