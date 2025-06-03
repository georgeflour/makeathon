'use client'

import {
  Calendar,
  Edit,
  Eye,
  Filter,
  Heart,
  Plus,
  Search,
  Settings,
  Sparkles,
  Trash2,
} from 'lucide-react'

import { useEffect, useState } from 'react'

import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { Bundle, FlaskBundle, FlaskResponse, InventoryItem, SearchParameters } from '@/types/bundles'
import { transformFlaskData } from '@/utils/bundleTransforms'

interface BundleCardProps {
  bundle: Bundle
  onDelete: (bundleId: string) => Promise<void>
  onView: (bundle: Bundle) => void
}

interface ViewBundleModalProps {
  bundle: Bundle
  onClose: () => void
}

interface CreateBundleModalProps {
  onClose: () => void
  onSubmit: () => void
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
    profit_margin: 35,
    objective: 'Max Cart',
    quantity: 2,
    timeframe: '1 month',
    bundle_type: 'all',
  })
  const [isCustomSearch, setIsCustomSearch] = useState(false)
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [inventoryLoading, setInventoryLoading] = useState(false)
  const [inventoryError, setInventoryError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [viewBundle, setViewBundle] = useState<Bundle | null>(null)

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
          console.error('Error parsing JSON:', e)
          data = []
        }
      }

      let items: InventoryItem[] = []

      if (Array.isArray(data)) {
        items = data.map((item: any) => ({
          item_id: item.index,
          name: item.title || `Item ${item.index}`,
          category: item.category || '',
          price: item.price || 0,
        }))
      } else {
        console.error('Inventory format not recognized:', data)
      }

      setInventoryItems(items)
    } catch (error) {
      console.error('Error fetching inventory:', error)
      setInventoryError('Failed to fetch inventory items')
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
      // Filter out bundles with less than 2 items before transforming
      const validBundles = data.bundles.filter(
        (bundle: FlaskBundle) =>
          bundle.items.reduce((acc: number, item: any) => acc + item.qty, 0) >= 2
      )
      const transformedBundles = transformFlaskData(validBundles)
      setBundles(transformedBundles)
      setIsCustomSearch(false)
    } catch (err) {
      console.error('Error fetching bundles:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch bundles')
    } finally {
      setLoading(false)
    }
  }

  // Generate bundles with default parameters (for main button)
  const generateDefaultBundles = async () => {
    try {
      setIsGenerating(true)
      setLoading(true)

      const response = await fetch('http://127.0.0.1:5000/bundles/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // Send empty object for default parameters
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: FlaskResponse = await response.json()
      const validBundles = data.bundles.filter(
        (bundle: FlaskBundle) =>
          bundle.items.reduce((acc: number, item: any) => acc + item.qty, 0) >= 2
      )

      const transformedBundles = transformFlaskData(validBundles)
      setBundles(transformedBundles)
      setIsCustomSearch(false)
    } catch (err) {
      console.error('Error generating bundles:', err)
      setError(err instanceof Error ? err.message : 'Error loading bundles. Please try again.')
    } finally {
      setIsGenerating(false)
      setLoading(false)
    }
  }

  // Generate bundles with custom parameters (for advanced search)
  const generateCustomBundles = async () => {
    try {
      setIsGenerating(true)
      setLoading(true)

      const response = await fetch('http://127.0.0.1:5000/bundles/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchParameters),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Server error response:', errorText)
        throw new Error(`Server error: ${errorText || response.statusText}`)
      }

      const data = await response.json()
      console.log('Received data from server:', data)

      const validBundles = data.bundles.filter(
        (bundle: FlaskBundle) =>
          bundle.items.reduce((acc: number, item: any) => acc + item.qty, 0) >= 2
      )

      const transformedBundles = transformFlaskData(validBundles)
      setBundles(transformedBundles)
      setShowAdvancedSearch(false)
      setIsCustomSearch(true)
    } catch (err) {
      console.error('Error generating bundles:', err)
      setError(err instanceof Error ? err.message : 'Error loading bundles. Please try again.')
    } finally {
      setIsGenerating(false)
      setLoading(false)
    }
  }

  // Reset to default bundles
  const resetToDefault = () => {
    fetchBundles()
    setShowAdvancedSearch(false)
    setSearchParameters({
      product_name: '',
      profit_margin: 35,
      objective: 'Max Cart',
      quantity: 2,
      timeframe: '1 month',
      bundle_type: 'all',
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

  const filteredBundles = bundles.filter((bundle) => {
    const matchesSearch =
      bundle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bundle.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || bundle.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const handleDelete = async (bundleId: string) => {
    try {
      const response = await fetch('http://127.0.0.1:5000/bundles/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bundle_id: bundleId }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Server error response:', errorText)
        throw new Error(`Server error: ${errorText || response.statusText}`)
      }

      // After successful deletion, refresh the bundles list
      await fetchBundles()
    } catch (error) {
      console.error('Error deleting bundle:', error)
      setError(error instanceof Error ? error.message : 'Failed to delete bundle')
    }
  }

  return (
    <div className='p-6 max-w-7xl mx-auto'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Bundle Management</h1>
          <p className='text-gray-600 mt-1'>Create and manage product bundles</p>
        </div>
      </div>

      {/* Advanced Search Panel */}
      <div className='mb-6'>
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center gap-4'>
            <button
              onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
              className='flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors'
            >
              <Settings className='h-4 w-4' />
              Advanced Search
            </button>

            {isCustomSearch && (
              <button
                onClick={resetToDefault}
                className='px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors'
              >
                Show All Bundles
              </button>
            )}
          </div>

          <button
            onClick={generateDefaultBundles}
            disabled={isGenerating}
            className='relative overflow-hidden bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-none group'
          >
            <div className='absolute inset-0 bg-gradient-to-r from-purple-400 via-blue-400 to-indigo-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300'></div>
            {isGenerating ? (
              <div className='flex items-center gap-2 relative z-10'>
                <div className='animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full' />
                <span className='font-semibold'>Generating Magic...</span>
              </div>
            ) : (
              <div className='flex items-center gap-2 relative z-10'>
                <Sparkles className='h-4 w-4' />
                <span className='font-semibold'>Generate Bundles</span>
              </div>
            )}
          </button>
        </div>

        {showAdvancedSearch && (
          <div className='bg-white border border-gray-200 rounded-lg p-6 shadow-sm'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>Bundle Search Parameters</h3>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6'>
              {/* Product Selection */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Product (Optional)
                </label>
                {inventoryLoading ? (
                  <div className='w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500'>
                    Loading products...
                  </div>
                ) : inventoryError ? (
                  <div className='w-full px-3 py-2 border border-red-300 rounded-lg bg-red-50 text-red-600 text-sm'>
                    Error loading products
                  </div>
                ) : (
                  <select
                    value={searchParameters.product_name}
                    onChange={(e) =>
                      setSearchParameters({ ...searchParameters, product_name: e.target.value })
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-40 overflow-y-auto'
                    style={{ maxHeight: '10rem' }}
                  >
                    <option value=''>Select a product (optional)</option>
                    {inventoryItems.map((item) => (
                      <option key={item.item_id} value={item.item_id}>
                        {item.name} {item.category && `(${item.category})`} - ID: {item.item_id}
                      </option>
                    ))}
                  </select>
                )}
                {inventoryItems.length > 20 && (
                  <p className='text-xs text-gray-500 mt-1'>
                    {inventoryItems.length} products available - scroll to see more
                  </p>
                )}
              </div>

              {/* Profit Margin */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Profit Margin (0-35%)
                </label>
                <div className='flex items-center gap-2'>
                  <input
                    type='range'
                    min='0'
                    max='35'
                    value={searchParameters.profit_margin}
                    onChange={(e) =>
                      setSearchParameters({
                        ...searchParameters,
                        profit_margin: parseInt(e.target.value),
                      })
                    }
                    className='flex-1'
                  />
                  <span className='w-12 text-sm font-medium'>
                    {searchParameters.profit_margin}%
                  </span>
                </div>
              </div>

              {/* Objective */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Objective</label>
                <select
                  value={searchParameters.objective}
                  onChange={(e) =>
                    setSearchParameters({
                      ...searchParameters,
                      objective: e.target.value as 'Max Cart' | 'Sell Out',
                    })
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                >
                  <option value='Max Cart'>Max Cart</option>
                  <option value='Sell Out'>Sell Out</option>
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Products in Bundle
                </label>
                <input
                  type='number'
                  min='2'
                  max='10'
                  value={searchParameters.quantity}
                  onChange={(e) =>
                    setSearchParameters({ ...searchParameters, quantity: parseInt(e.target.value) })
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>

              {/* Timeframe */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Timeframe / Duration
                </label>
                <select
                  value={searchParameters.timeframe}
                  onChange={(e) =>
                    setSearchParameters({ ...searchParameters, timeframe: e.target.value })
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                >
                  <option value='1 month'>1 month</option>
                  <option value='3 months'>3 months</option>
                  <option value='6 months'>6 months</option>
                  <option value='1 year'>1 year</option>
                </select>
              </div>

              {/* Bundle Type */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Bundle Type</label>
                <select
                  value={searchParameters.bundle_type}
                  onChange={(e) =>
                    setSearchParameters({
                      ...searchParameters,
                      bundle_type: e.target.value as Bundle['type'],
                    })
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                >
                  <option value='all'>All</option>
                  <option value='complementary'>Complementary</option>
                  <option value='thematic'>Thematic</option>
                  <option value='seasonal'>Seasonal</option>
                  <option value='cross-sell'>Cross-sell</option>
                  <option value='volume'>Volume</option>
                </select>
              </div>
            </div>

            <div className='flex gap-3'>
              <button
                onClick={generateCustomBundles}
                disabled={loading}
                className='px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg transition-colors flex items-center gap-2'
              >
                <Search className='h-4 w-4' />
                Search Bundles
              </button>
              <button
                onClick={() => setShowAdvancedSearch(false)}
                className='px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors'
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Regular Filters */}
      <div className='bg-white border border-gray-200 rounded-lg p-4 mb-6'>
        <div className='flex flex-col sm:flex-row gap-4'>
          <div className='flex-1'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
              <input
                type='text'
                placeholder='Search bundles...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              />
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <Filter className='h-4 w-4 text-gray-400' />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className='border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            >
              <option value='all'>All Status</option>
              <option value='active'>Active</option>
              <option value='inactive'>Inactive</option>
              <option value='scheduled'>Scheduled</option>
            </select>
          </div>
          <button
            onClick={fetchBundles}
            disabled={loading}
            className='px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-300 text-gray-700 rounded-lg transition-colors'
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Results Info */}
      {isCustomSearch && (
        <div className='mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
          <p className='text-blue-800 text-sm'>
            Showing results for custom search
            {searchParameters.product_name && (
              <>
                {' '}
                with Product ID: <strong>{searchParameters.product_name}</strong>
                {inventoryItems.find((item) => item.item_id === searchParameters.product_name) && (
                  <span className='ml-1'>
                    (
                    {
                      inventoryItems.find((item) => item.item_id === searchParameters.product_name)
                        ?.name
                    }
                    )
                  </span>
                )}
              </>
            )}
          </p>
        </div>
      )}

      {/* Bundle List */}
      {loading ? (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className='bg-white border border-gray-200 rounded-lg p-6 animate-pulse'>
              <div className='h-4 bg-gray-200 rounded w-3/4 mb-4'></div>
              <div className='h-3 bg-gray-200 rounded w-full mb-2'></div>
              <div className='h-3 bg-gray-200 rounded w-2/3 mb-4'></div>
              <div className='flex justify-between items-center'>
                <div className='h-6 bg-gray-200 rounded w-20'></div>
                <div className='h-6 bg-gray-200 rounded w-16'></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className='bg-white border border-gray-200 rounded-lg p-6'>
          <div className='text-center py-8'>
            <p className='text-red-600 mb-2'>Error loading bundles:</p>
            <p className='text-sm text-gray-600 mb-4'>{error}</p>
            <button
              onClick={isCustomSearch ? generateCustomBundles : fetchBundles}
              className='px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors'
            >
              Retry
            </button>
          </div>
        </div>
      ) : filteredBundles.length === 0 ? (
        <div className='bg-white border border-gray-200 rounded-lg p-6'>
          <div className='text-center py-8'>
            <p className='text-gray-600'>
              {searchTerm || filterStatus !== 'all'
                ? 'No bundles match your search criteria'
                : isCustomSearch
                  ? 'No bundles found for the specified parameters'
                  : 'No bundles found'}
            </p>
          </div>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {filteredBundles.map((bundle) => (
            <BundleCard
              key={bundle.id}
              bundle={bundle}
              onDelete={handleDelete}
              onView={setViewBundle}
            />
          ))}
        </div>
      )}

      {viewBundle && <ViewBundleModal bundle={viewBundle} onClose={() => setViewBundle(null)} />}
    </div>
  )
}

function ViewBundleModal({ bundle, onClose }: ViewBundleModalProps) {
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'all':
        return 'Default'
      case 'complementary':
        return 'Complementary'
      case 'thematic':
        return 'Thematic'
      case 'volume':
        return 'Volume'
      case 'cross-sell':
        return 'Cross-sell'
      case 'seasonal':
        return 'Seasonal'
      default:
        return type
    }
  }

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto'>
        <div className='flex items-center justify-between mb-6'>
          <h2 className='text-2xl font-bold text-gray-900'>{bundle.name}</h2>
          <button onClick={onClose} className='text-gray-500 hover:text-gray-700'>
            ✕
          </button>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {/* Left Column - Bundle Details */}
          <div className='space-y-6'>
            <div>
              <h3 className='text-lg font-semibold text-gray-900 mb-3'>Bundle Information</h3>
              <div className='bg-gray-50 rounded-lg p-4 space-y-3'>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Type:</span>
                  <span className='font-medium'>{getTypeLabel(bundle.type)}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Status:</span>
                  <span className='font-medium capitalize'>{bundle.status}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Original Price:</span>
                  <span className='line-through text-gray-500'>€{bundle.originalPrice}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Bundle Price:</span>
                  <span className='font-bold text-green-600'>€{bundle.bundlePrice}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Discount:</span>
                  <span className='font-medium text-red-600'>{bundle.discount}%</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Profit Margin:</span>
                  <span className='font-medium text-blue-600'>{bundle.profitMargin}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Duration:</span>
                  <span className='font-medium'>{bundle.duration || 'Not specified'}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Season:</span>
                  <span className='font-medium'>{bundle.season || 'Not specified'}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className='text-lg font-semibold text-gray-900 mb-3'>Performance</h3>
              <div className='bg-gray-50 rounded-lg p-4 space-y-3'>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Forecasted Revenue:</span>
                  <span className='font-medium'>€{bundle.forecastedRevenue}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Actual Revenue:</span>
                  <span className='font-medium'>€{bundle.actualRevenue}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Start Date:</span>
                  <span className='font-medium'>
                    {new Date(bundle.startDate).toLocaleDateString()}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>End Date:</span>
                  <span className='font-medium'>
                    {new Date(bundle.endDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Products & Rationale */}
          <div className='space-y-6'>
            <div>
              <h3 className='text-lg font-semibold text-gray-900 mb-3'>Products in Bundle</h3>
              <div className='bg-gray-50 rounded-lg p-4'>
                <div className='space-y-2'>
                  {bundle.products.map((productName, index) => (
                    <div
                      key={index}
                      className='flex items-center justify-between p-2 bg-white rounded border border-gray-200'
                    >
                      <div className='flex-1'>
                        <span className='font-medium'>Product {index + 1}</span>
                        <p className='text-sm text-gray-600 mt-1'>{productName}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className='text-sm text-gray-500 mt-3'>Total Items: {bundle.itemCount}</p>
              </div>
            </div>

            <div>
              <h3 className='text-lg font-semibold text-gray-900 mb-3'>Bundle Rationale</h3>
              <div className='bg-gray-50 rounded-lg p-4'>
                <p className='text-gray-700 whitespace-pre-wrap'>
                  {bundle.rationale || 'No rationale provided for this bundle.'}
                </p>
              </div>
            </div>

            <div>
              <h3 className='text-lg font-semibold text-gray-900 mb-3'>Description</h3>
              <div className='bg-gray-50 rounded-lg p-4'>
                <p className='text-gray-700'>{bundle.description}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function BundleCard({ bundle, onDelete, onView }: BundleCardProps) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchFavoriteStatus()
  }, [])

  const fetchFavoriteStatus = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/bundles/favorite/${bundle.id}`)
      const data = await response.json()
      setIsFavorite(data.is_favorite)
    } catch (error) {
      console.error('Error fetching favorite status:', error)
    }
  }

  const toggleFavorite = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('http://127.0.0.1:5000/bundles/favorite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bundle_id: bundle.id,
          is_favorite: !isFavorite,
        }),
      })

      if (response.ok) {
        setIsFavorite(!isFavorite)
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'all':
        return 'Default'
      case 'complementary':
        return 'Complementary'
      case 'thematic':
        return 'Thematic'
      case 'volume':
        return 'Volume'
      case 'cross-sell':
        return 'Cross-sell'
      case 'seasonal':
        return 'Seasonal'
      default:
        return type
    }
  }

  return (
    <div className='bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1'>
      <div className='flex items-start justify-between mb-4'>
        <h3 className='text-xl font-bold text-gray-900 flex-1 pr-2'>{bundle.name}</h3>
        <span
          className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
            bundle.status === 'active'
              ? 'bg-green-100 text-green-700'
              : bundle.status === 'scheduled'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700'
          }`}
        >
          {bundle.status}
        </span>
      </div>

      <p className='text-gray-600 mb-6 leading-relaxed'>{bundle.description}</p>

      <div className='space-y-3 mb-6'>
        <div className='flex justify-between items-center'>
          <span className='text-gray-500 font-medium'>Type:</span>
          <span className='text-gray-400 text-lg'>{getTypeLabel(bundle.type)}</span>
        </div>
        <div className='flex justify-between items-center'>
          <span className='text-gray-500 font-medium'>Items:</span>
          <span className='text-gray-400 text-lg'>{bundle.itemCount}</span>
        </div>
        <div className='flex justify-between items-center'>
          <span className='text-gray-500 font-medium'>Original Price:</span>
          <span className='line-through text-gray-400 text-lg'>€{bundle.originalPrice}</span>
        </div>
        <div className='flex justify-between items-center'>
          <span className='text-gray-500 font-medium'>Bundle Price:</span>
          <span className='font-bold text-green-600 text-xl'>€{bundle.bundlePrice}</span>
        </div>
        <div className='flex justify-between items-center'>
          <span className='text-gray-500 font-medium'>Profit Margin:</span>
          <span className='font-bold text-blue-600 text-lg'>({bundle.profitMargin})</span>
        </div>
      </div>

      <div className='border-t border-gray-100 pt-4'>
        <div className='flex justify-between text-sm text-gray-500 mb-4'>
          <span className='flex items-center gap-1'>
            <Calendar className='h-3 w-3' />
            {new Date(bundle.startDate).toLocaleDateString()}
          </span>
          <span className='flex items-center gap-1'>
            <Calendar className='h-3 w-3' />
            {new Date(bundle.endDate).toLocaleDateString()}
          </span>
        </div>

        <div className='flex gap-3'>
          <button
            onClick={() => onView(bundle)}
            className='flex-1 px-4 py-3 text-sm bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 font-medium'
          >
            <Eye className='h-4 w-4' />
            View Details
          </button>
          <button
            onClick={toggleFavorite}
            disabled={isLoading}
            className={`group relative px-4 py-3 ${
              isFavorite
                ? 'bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white'
                : 'bg-white hover:bg-gray-50 text-red-500'
            } rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium overflow-hidden`}
          >
            <div
              className={`absolute inset-0 bg-gradient-to-r ${
                isFavorite ? 'from-pink-600 to-red-600' : 'from-gray-50 to-gray-100'
              } transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`}
            ></div>
            <div className='relative flex items-center gap-2'>
              {isLoading ? (
                <>
                  <div
                    className={`animate-spin rounded-full h-4 w-4 border-2 ${isFavorite ? 'border-white border-t-transparent' : 'border-red-500 border-t-transparent'}`}
                  ></div>
                  <span className='text-sm'>Loading...</span>
                </>
              ) : (
                <>
                  <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : 'stroke-current'}`} />
                </>
              )}
            </div>
          </button>
          <button
            onClick={() => onDelete(bundle.id)}
            className='px-4 py-3 text-sm bg-red-100 hover:bg-red-200 text-red-600 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 font-medium'
          >
            <Trash2 className='h-4 w-4' />
          </button>
        </div>
      </div>
    </div>
  )
}

function CreateBundleModal({ onClose, onSubmit }: CreateBundleModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'all' as Bundle['type'],
    startDate: '',
    endDate: '',
    price: '',
    originalPrice: '',
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
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-lg max-w-md w-full p-6'>
        <h2 className='text-xl font-bold text-gray-900 mb-4'>Create New Bundle</h2>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Bundle Name</label>
            <input
              type='text'
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              required
            />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Original Price (€)
              </label>
              <input
                type='number'
                step='0.01'
                value={formData.originalPrice}
                onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                required
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Bundle Price (€)
              </label>
              <input
                type='number'
                step='0.01'
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                required
              />
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Start Date</label>
              <input
                type='date'
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                required
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>End Date</label>
              <input
                type='date'
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                required
              />
            </div>
          </div>

          <div className='flex space-x-3 pt-4'>
            <Button type='submit' className='flex-1' disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Bundle'}
            </Button>
            <Button type='button' variant='secondary' onClick={onClose} className='flex-1'>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
