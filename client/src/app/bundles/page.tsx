'use client'
import { useState } from 'react'
import { Plus, Search, Filter, Edit, Trash2, Eye } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { Bundle } from '@/lib/types'
import { useApi } from '@/hooks/useApi'
import { apiClient } from '@/lib/api'

export default function BundlesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)

  const { data: bundles, loading, error } = useApi<Bundle[]>(
    () => apiClient.getBundles(),
    []
  )

  // Mock data for development
  const mockBundles: Bundle[] = [
    {
      id: '1',
      name: 'Summer Essentials',
      description: 'Perfect bundle for summer activities',
      products: [],
      originalPrice: 89.99,
      bundlePrice: 69.99,
      discount: 22,
      type: 'thematic',
      status: 'active',
      startDate: '2024-06-01',
      endDate: '2024-08-31',
      forecastedRevenue: 12500,
      actualRevenue: 8750,
      createdAt: '2024-05-15'
    },
    {
      id: '2',
      name: 'Professional Makeup Kit',
      description: 'Complete makeup set for professionals',
      products: [],
      originalPrice: 156.50,
      bundlePrice: 129.99,
      discount: 17,
      type: 'complementary',
      status: 'active',
      startDate: '2024-05-01',
      endDate: '2024-12-31',
      forecastedRevenue: 25000,
      actualRevenue: 18500,
      createdAt: '2024-04-20'
    },
    {
      id: '3',
      name: 'Back to School',
      description: 'Everything students need for the new semester',
      products: [],
      originalPrice: 75.00,
      bundlePrice: 59.99,
      discount: 20,
      type: 'thematic',
      status: 'scheduled',
      startDate: '2024-08-15',
      endDate: '2024-09-30',
      forecastedRevenue: 15000,
      actualRevenue: 0,
      createdAt: '2024-05-10'
    }
  ]

  const displayBundles = bundles || mockBundles

  const filteredBundles = displayBundles.filter(bundle => {
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
            <p className="text-red-600">Error loading bundles: {error}</p>
            <Button variant="secondary" className="mt-4" onClick={() => window.location.reload()}>
              Retry
            </Button>
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
        <CreateBundleModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  )
}

interface BundleCardProps {
  bundle: Bundle
}

function BundleCard({ bundle }: BundleCardProps) {
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
      </div>

      <div className="border-t pt-4">
        <div className="flex justify-between text-xs text-gray-500 mb-3">
          <span>Forecast: €{bundle.forecastedRevenue.toLocaleString()}</span>
          <span>Actual: €{bundle.actualRevenue.toLocaleString()}</span>
        </div>
        
        <div className="flex space-x-2">
          <Button size="sm" variant="secondary" className="flex-1">
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
          <Button size="sm" variant="secondary" className="flex-1">
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </Button>
          <Button size="sm" variant="danger">
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}

interface CreateBundleModalProps {
  onClose: () => void
}

function CreateBundleModal({ onClose }: CreateBundleModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'complementary' as Bundle['type'],
    startDate: '',
    endDate: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle bundle creation
    console.log('Creating bundle:', formData)
    onClose()
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bundle Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value as Bundle['type']})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="complementary">Complementary</option>
              <option value="thematic">Thematic</option>
              <option value="volume">Volume</option>
              <option value="cross-sell">Cross-sell</option>
            </select>
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
            <Button type="submit" className="flex-1">
              Create Bundle
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