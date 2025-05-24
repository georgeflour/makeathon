'use client'
import { useState, useEffect } from 'react'
import { Search, Filter, Edit, Trash2, Settings, Plus, Eye } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

// Updated type to match Flask backend response
interface FlaskBundle {
  bundle_id: string
  name: string
  price: number
  OriginalPrice: number
  profitMargin: string
  startDate: string
  endDate: string
  items: {
    item_id: string
    classification: string
  }[]
}

interface FlaskResponse {
  bundles: FlaskBundle[]
}

// Inventory item type
interface InventoryItem {
  item_id: string
  name: string
  category?: string
  price?: number
}

// Transformed bundle type for UI
interface Bundle {
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
}

// Search parameters interface
interface SearchParameters {
  product_name: string
  profit_margin: number
  objective: 'Max Cart' | 'Sell Out'
  quantity: number
  timeframe: string
  bundle_type: 'all' | 'complementary' | 'volume' | 'thematic' | 'seasonal' | 'cross-sell'
}

export default function BundlesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [bundles, setBundles] = useState<Bundle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)
  const [searchParameters, setSearchParameters] = useState<SearchParameters>({
    product_name: '',
    profit_margin: 15,
    objective: 'Max Cart',
    quantity: 2,
    timeframe: '1 month',
    bundle_type: 'all'
  })
  const [isCustomSearch, setIsCustomSearch] = useState(false)
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [inventoryLoading, setInventoryLoading] = useState(false)
  const [inventoryError, setInventoryError] = useState<string | null>(null)

  // Function to transform Flask data to UI format
  const transformFlaskData = (flaskData: FlaskBundle[]): Bundle[] => {
    return flaskData.map(bundle => {
      const discount = Math.round(((bundle.OriginalPrice - bundle.price) / bundle.OriginalPrice) * 100)
      const currentDate = new Date()
      const startDate = new Date(bundle.startDate)
      const endDate = new Date(bundle.endDate)
      
      let status: 'active' | 'inactive' | 'scheduled'
      if (currentDate < startDate) {
        status = 'scheduled'
      } else if (currentDate > endDate) {
        status = 'inactive'
      } else {
        status = 'active'
      }

      // Generate description based on items
      const classifications = bundle.items.map(item => item.classification)
      const uniqueClassifications = [...new Set(classifications)]
      const description = `Bundle containing ${bundle.items.length} items: ${uniqueClassifications.join(', ')}`

      // Determine bundle type based on classifications
      let type: Bundle['type'] = 'complementary'
      if (uniqueClassifications.length > 2) {
        type = 'cross-sell'
      } else if (bundle.items.length > 3) {
        type = 'volume'
      } else if (uniqueClassifications.includes('electronics') || uniqueClassifications.includes('furniture')) {
        type = 'thematic'
      }

      return {
        id: bundle.bundle_id,
        name: bundle.name,
        description,
        products: bundle.items.map(item => item.item_id),
        originalPrice: bundle.OriginalPrice,
        bundlePrice: bundle.price,
        discount,
        type,
        status,
        startDate: bundle.startDate,
        endDate: bundle.endDate,
        forecastedRevenue: bundle.price * 100,
        actualRevenue: status === 'active' ? bundle.price * 75 : 0,
        createdAt: bundle.startDate,
        profitMargin: bundle.profitMargin,
        itemCount: bundle.items.length
      }
    })
  }

  // Fetch inventory items
  const fetchInventoryItems = async () => {
    try {
      setInventoryLoading(true)
      setInventoryError(null)
      
      const response = await fetch('http://127.0.0.1:5000/inventory-dropdown', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      let data = await response.json()

      if (typeof data === 'string') {
        try {
          data = JSON.parse(data)
        } catch (e) {
          console.error('Σφάλμα στο JSON.parse:', e)
          data = []
        }
      }

      let items: InventoryItem[] = []

      if (Array.isArray(data)) {
        items = data.map((item: any) => ({
          item_id: item.index,
          name: item.title || `Item ${item.index}`,
          category: item.category || '',
          price: item.price || 0
        }))
      } else {
        console.error('Inventory format not recognized:', data)
      }
      
      setInventoryItems(items)
    } catch (err) {
      console.error('Error fetching inventory:', err)
      setInventoryError(err instanceof Error ? err.message : 'Failed to fetch inventory')
    } finally {
      setInventoryLoading(false)
    }
  }

  // Fetch bundles from Flask backend (default endpoint)
  const fetchBundles = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('http://127.0.0.1:5000/bundles', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: FlaskResponse = await response.json()
      const transformedBundles = transformFlaskData(data.bundles)
      setBundles(transformedBundles)
      setIsCustomSearch(false)
    } catch (err) {
      console.error('Error fetching bundles:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch bundles')
    } finally {
      setLoading(false)
    }
  }

  // Search bundles with custom parameters
  const searchBundlesWithParameters = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('http://127.0.0.1:5000/bundles/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchParameters)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      // For now, we'll handle the response based on your backend implementation
      // If the backend returns bundles in the same format, transform them
      if (data.bundles) {
        const transformedBundles = transformFlaskData(data.bundles)
        setBundles(transformedBundles)
      } else {
        // If it returns different data, handle accordingly
        console.log('Search response:', data)
        setBundles([]) // Clear bundles or handle as needed
      }
      
      setIsCustomSearch(true)
    } catch (err) {
      console.error('Error searching bundles:', err)
      setError(err instanceof Error ? err.message : 'Failed to search bundles')
    } finally {
      setLoading(false)
    }
  }

  // Reset to default bundles
  const resetToDefault = () => {
    fetchBundles()
    setShowAdvancedSearch(false)
    setSearchParameters({
      product_name: '',
      profit_margin: 15,
      objective: 'Max Cart',
      quantity: 2,
      timeframe: '1 month',
      bundle_type: 'all'
    })
  }

  useEffect(() => {
    fetchBundles()
  }, [])

  // Fetch inventory when advanced search is opened
  useEffect(() => {
    if (showAdvancedSearch && inventoryItems.length === 0) {
      fetchInventoryItems()
    }
  }, [showAdvancedSearch])

  const filteredBundles = bundles.filter(bundle => {
    const matchesSearch = bundle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bundle.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || bundle.status === filterStatus
    return matchesSearch && matchesFilter
  })

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bundle Management</h1>
          <p className="text-gray-600 mt-1">Create and manage product bundles</p>
        </div>
      </div>

      {/* Advanced Search Panel */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
          >
            <Settings className="h-4 w-4" />
            Advanced Search
          </button>
          
          {isCustomSearch && (
            <button
              onClick={resetToDefault}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              Show All Bundles
            </button>
          )}
        </div>

        {showAdvancedSearch && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bundle Search Parameters</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {/* Product Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product (Optional)
                </label>
                {inventoryLoading ? (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                    Loading products...
                  </div>
                ) : inventoryError ? (
                  <div className="w-full px-3 py-2 border border-red-300 rounded-lg bg-red-50 text-red-600 text-sm">
                    Error loading products
                  </div>
                ) : (
                  <select
                    value={searchParameters.product_name}
                    onChange={(e) => setSearchParameters({...searchParameters, product_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-40 overflow-y-auto"
                    style={{ maxHeight: '10rem' }}
                  >
                    <option value="">Select a product (optional)</option>
                    {inventoryItems.map((item) => (
                      <option key={item.item_id} value={item.item_id}>
                        {item.name} {item.category && `(${item.category})`} - ID: {item.item_id}
                      </option>
                    ))}
                  </select>
                )}
                {inventoryItems.length > 20 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {inventoryItems.length} products available - scroll to see more
                  </p>
                )}
              </div>

              {/* Profit Margin */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profit Margin (0-35%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="35"
                    value={searchParameters.profit_margin}
                    onChange={(e) => setSearchParameters({...searchParameters, profit_margin: parseInt(e.target.value)})}
                    className="flex-1"
                  />
                  <span className="w-12 text-sm font-medium">{searchParameters.profit_margin}%</span>
                </div>
              </div>

              {/* Objective */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Objective
                </label>
                <select
                  value={searchParameters.objective}
                  onChange={(e) => setSearchParameters({...searchParameters, objective: e.target.value as 'Max Cart' | 'Sell Out'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Max Cart">Max Cart</option>
                  <option value="Sell Out">Sell Out</option>
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Products in Bundle
                </label>
                <input
                  type="number"
                  min="2"
                  max="10"
                  value={searchParameters.quantity}
                  onChange={(e) => setSearchParameters({...searchParameters, quantity: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Timeframe */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timeframe / Duration
                </label>
                <select
                  value={searchParameters.timeframe}
                  onChange={(e) => setSearchParameters({...searchParameters, timeframe: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="1 week">1 Week</option>
                  <option value="2 weeks">2 Weeks</option>
                  <option value="1 month">1 Month</option>
                  <option value="2 months">2 Months</option>
                  <option value="3 months">3 Months</option>
                  <option value="6 months">6 Months</option>
                </select>
              </div>

              {/* Bundle Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bundle Type
                </label>
                <select
                  value={searchParameters.bundle_type}
                  onChange={(e) => setSearchParameters({...searchParameters, bundle_type: e.target.value as Bundle['type']})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Default</option>
                  <option value="complementary">Complementary</option>
                  <option value="thematic">Thematic</option>
                  <option value="seasonal">Seasonal</option>
                  <option value="cross-sell">Cross-sell</option>
                  <option value="volume">Volume</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={searchBundlesWithParameters}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                Search Bundles
              </button>
              <button
                onClick={() => setShowAdvancedSearch(false)}
                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Regular Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search bundles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>
          <button 
            onClick={fetchBundles}
            disabled={loading}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-300 text-gray-700 rounded-lg transition-colors"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Results Info */}
      {isCustomSearch && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 text-sm">
            Showing results for custom search
            {searchParameters.product_name && (
              <>
                {' '}with Product ID: <strong>{searchParameters.product_name}</strong>
                {inventoryItems.find(item => item.item_id === searchParameters.product_name) && (
                  <span className="ml-1">
                    ({inventoryItems.find(item => item.item_id === searchParameters.product_name)?.name})
                  </span>
                )}
              </>
            )}
          </p>
        </div>
      )}

      {/* Bundle List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
              <div className="flex justify-between items-center">
                <div className="h-6 bg-gray-200 rounded w-20"></div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-center py-8">
            <p className="text-red-600 mb-2">Error loading bundles:</p>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <button 
              onClick={isCustomSearch ? searchBundlesWithParameters : fetchBundles}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      ) : filteredBundles.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-center py-8">
            <p className="text-gray-600">
              {searchTerm || filterStatus !== 'all' 
                ? 'No bundles match your search criteria' 
                : isCustomSearch
                ? 'No bundles found for the specified parameters'
                : 'No bundles found'
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBundles.map((bundle) => (
            <BundleCard key={bundle.id} bundle={bundle} />
          ))}
        </div>
      )}
    </div>
  )
}

interface BundleCardProps {
  bundle: Bundle
}

function BundleCard({ bundle }: BundleCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'all': return 'Default'
      case 'complementary': return 'Complementary'
      case 'thematic': return 'Thematic'
      case 'volume': return 'Volume'
      case 'cross-sell': return 'Cross-sell'
      case 'seasonal': return 'Seasonal'
      default: return type
    }
  }

  const handleViewClick = () => {
    setIsFlipped(true)
  }

  const handleBackClick = () => {
    setIsFlipped(false)
  }

  if (isFlipped) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Bundle Rationale</h3>
          <button 
            onClick={handleBackClick}
            className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            ← Back
          </button>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 min-h-[200px]">
          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
            {bundle.rationale || 'No rationale provided for this bundle.'}
          </p>
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Bundle: {bundle.name}</span>
            <span>Type: {getTypeLabel(bundle.type)}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">{bundle.name}</h3>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(bundle.status)}`}>
          {bundle.status}
        </span>
      </div>
      
      <p className="text-gray-600 text-sm mb-4">{bundle.description}</p>
      
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Type:</span>
          <span className="font-medium">{getTypeLabel(bundle.type)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Items:</span>
          <span className="font-medium">{bundle.itemCount}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Original Price:</span>
          <span className="line-through text-gray-400">€{bundle.originalPrice}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Bundle Price:</span>
          <span className="font-bold text-green-600">€{bundle.bundlePrice}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Discount:</span>
          <span className="font-medium text-red-600">{bundle.discount}%</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Profit Margin:</span>
          <span className="font-medium text-blue-600">{bundle.profitMargin}</span>
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="flex justify-between text-xs text-gray-500 mb-3">
          <span>Start: {new Date(bundle.startDate).toLocaleDateString()}</span>
          <span>End: {new Date(bundle.endDate).toLocaleDateString()}</span>
        </div>
        
        <div className="flex space-x-2">
          <button 
            onClick={handleViewClick}
            className="flex-1 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors flex items-center justify-center gap-1"
          >
            <Eye className="h-3 w-3" />
            View
          </button>
          <button className="flex-1 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors flex items-center justify-center gap-1">
            <Edit className="h-3 w-3" />
            Edit
          </button>
          <button className="px-3 py-2 text-sm bg-red-100 hover:bg-red-200 text-red-600 rounded-md transition-colors">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  )
}

interface CreateBundleModalProps {
  onClose: () => void
  onSubmit: () => void
}

function CreateBundleModal({ onClose, onSubmit }: CreateBundleModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'all' as Bundle['type'],
    startDate: '',
    endDate: '',
    price: '',
    originalPrice: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Replace with your Flask backend URL for creating bundles
      const response = await fetch('http://127.0.0.1:5000/api/bundles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          price: parseFloat(formData.price),
          OriginalPrice: parseFloat(formData.originalPrice),
          startDate: formData.startDate,
          endDate: formData.endDate,
          // Add other fields as needed by your Flask API
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Refresh the bundles list
      onSubmit()
      onClose()
    } catch (error) {
      console.error('Error creating bundle:', error)
      // You might want to show an error message to the user
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Bundle</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bundle Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Original Price (€)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.originalPrice}
                onChange={(e) => setFormData({...formData, originalPrice: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bundle Price (€)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Bundle'}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}