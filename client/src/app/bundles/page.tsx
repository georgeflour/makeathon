'use client'
import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Edit, Trash2, ArrowLeft } from 'lucide-react'
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

// Transformed bundle type for UI
interface Bundle {
  id: string
  name: string
  description: string
  products: string[]
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
  profitMargin: string
  itemCount: number
  rationale?: string // Optional field for bundle rationale
}

export default function BundlesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [bundles, setBundles] = useState<Bundle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
        forecastedRevenue: bundle.price * 100, // Estimated based on price
        actualRevenue: status === 'active' ? bundle.price * 75 : 0, // Mock actual revenue
        createdAt: bundle.startDate, // Using start date as created date
        profitMargin: bundle.profitMargin,
        itemCount: bundle.items.length
      }
    })
  }

  // Fetch bundles from Flask backend
  const fetchBundles = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Replace with your Flask backend URL
      const response = await fetch('http://localhost:5000/bundles', {
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
    } catch (err) {
      console.error('Error fetching bundles:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch bundles')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBundles()
  }, [])

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
        <Button onClick={() => setShowCreateModal(true)} className="mt-4 sm:mt-0">
          <Plus className="h-4 w-4 mr-2" />
          Create Bundle
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
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
          <Button 
            variant="secondary" 
            onClick={fetchBundles}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </Card>

      {/* Bundle List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card animate-pulse">
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
        <Card>
          <div className="text-center py-8">
            <p className="text-red-600 mb-2">Error loading bundles:</p>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <Button variant="secondary" onClick={fetchBundles}>
              Retry
            </Button>
          </div>
        </Card>
      ) : filteredBundles.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-600">
              {searchTerm || filterStatus !== 'all' 
                ? 'No bundles match your search criteria' 
                : 'No bundles found'
              }
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBundles.map((bundle) => (
            <BundleCard key={bundle.id} bundle={bundle} />
          ))}
        </div>
      )}

      {/* Create Bundle Modal */}
      {showCreateModal && (
        <CreateBundleModal 
          onClose={() => setShowCreateModal(false)} 
          onSubmit={fetchBundles}
        />
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
      case 'complementary': return 'Complementary'
      case 'thematic': return 'Thematic'
      case 'volume': return 'Volume'
      case 'cross-sell': return 'Cross-sell'
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
      <div className="card hover:shadow-md transition-shadow">
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
    <div className="card hover:shadow-md transition-shadow">
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
                className="flex-1 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                View
              </button>
              <button className="flex-1 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
                Edit
              </button>
              <button className="px-3 py-2 text-sm bg-red-100 hover:bg-red-200 text-red-600 rounded-md transition-colors">
                🗑
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
    type: 'complementary' as Bundle['type'],
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
      const response = await fetch('http://localhost:5000/api/bundles', {
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