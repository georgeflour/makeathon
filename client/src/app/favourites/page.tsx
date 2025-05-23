// src/app/favorites/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { 
  Heart, 
  Star, 
  Package, 
  TrendingUp, 
  Calendar, 
  DollarSign,
  Edit3,
  Trash2,
  Play,
  Pause,
  Copy,
  MoreVertical,
  Filter,
  Search,
  Grid,
  List
} from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

// Sample data for favorite bundles
const favoriteBundles = [
  {
    id: '1',
    name: 'Summer Beach Essentials',
    description: 'Perfect bundle for beach lovers with sunscreen, towel, and accessories',
    type: 'thematic',
    status: 'active',
    originalPrice: 89.99,
    bundlePrice: 69.99,
    discount: 22,
    products: ['Sunscreen SPF 50', 'Beach Towel', 'Sunglasses', 'Water Bottle'],
    revenue: 15400,
    orders: 230,
    rating: 4.8,
    createdAt: '2024-03-15',
    lastModified: '2024-05-20',
    tags: ['summer', 'beach', 'outdoor'],
    isFavorite: true
  },
  {
    id: '2',
    name: 'Skincare Routine Bundle',
    description: 'Complete morning and evening skincare essentials',
    type: 'complementary',
    status: 'active',
    originalPrice: 124.99,
    bundlePrice: 94.99,
    discount: 24,
    products: ['Cleanser', 'Toner', 'Serum', 'Moisturizer', 'SPF'],
    revenue: 18200,
    orders: 340,
    rating: 4.9,
    createdAt: '2024-02-10',
    lastModified: '2024-05-18',
    tags: ['skincare', 'beauty', 'routine'],
    isFavorite: true
  },
  {
    id: '3',
    name: 'Work From Home Setup',
    description: 'Everything needed for a productive home office',
    type: 'thematic',
    status: 'paused',
    originalPrice: 199.99,
    bundlePrice: 159.99,
    discount: 20,
    products: ['Wireless Mouse', 'Keyboard', 'Monitor Stand', 'Notebook', 'Pen Set'],
    revenue: 12800,
    orders: 80,
    rating: 4.6,
    createdAt: '2024-01-20',
    lastModified: '2024-04-25',
    tags: ['office', 'productivity', 'work'],
    isFavorite: true
  },
  {
    id: '4',
    name: 'Fitness Starter Pack',
    description: 'Get started with your fitness journey',
    type: 'cross-sell',
    status: 'active',
    originalPrice: 149.99,
    bundlePrice: 119.99,
    discount: 20,
    products: ['Yoga Mat', 'Water Bottle', 'Resistance Bands', 'Workout Towel'],
    revenue: 9600,
    orders: 120,
    rating: 4.7,
    createdAt: '2024-03-01',
    lastModified: '2024-05-15',
    tags: ['fitness', 'health', 'workout'],
    isFavorite: true
  },
  {
    id: '5',
    name: 'Coffee Lover\'s Dream',
    description: 'Premium coffee experience bundle',
    type: 'thematic',
    status: 'scheduled',
    originalPrice: 79.99,
    bundlePrice: 59.99,
    discount: 25,
    products: ['Premium Coffee Beans', 'Coffee Mug', 'French Press', 'Coffee Grinder'],
    revenue: 0,
    orders: 0,
    rating: 0,
    createdAt: '2024-05-22',
    lastModified: '2024-05-22',
    tags: ['coffee', 'beverage', 'premium'],
    isFavorite: true
  }
]

const favoriteReports = [
  {
    id: 'r1',
    name: 'Weekly Bundle Performance',
    type: 'performance',
    description: 'Detailed analysis of bundle sales and revenue',
    lastGenerated: '2024-05-20',
    frequency: 'weekly',
    isFavorite: true
  },
  {
    id: 'r2',
    name: 'Customer Segment Analysis',
    type: 'analytics',
    description: 'Breakdown of customer behavior by segments',
    lastGenerated: '2024-05-18',
    frequency: 'monthly',
    isFavorite: true
  },
  {
    id: 'r3',
    name: 'Inventory Turnover Report',
    type: 'inventory',
    description: 'Stock movement and turnover rates',
    lastGenerated: '2024-05-19',
    frequency: 'bi-weekly',
    isFavorite: true
  }
]

interface BundleCardProps {
  bundle: any
  viewMode: 'grid' | 'list'
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onToggleStatus: (id: string) => void
  onRemoveFavorite: (id: string) => void
}

function BundleCard({ bundle, viewMode, onEdit, onDelete, onToggleStatus, onRemoveFavorite }: BundleCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'complementary': return 'bg-purple-100 text-purple-800'
      case 'thematic': return 'bg-blue-100 text-blue-800'
      case 'cross-sell': return 'bg-green-100 text-green-800'
      case 'volume': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (viewMode === 'list') {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900 truncate">{bundle.name}</h3>
                <Heart className="h-4 w-4 text-red-500 fill-current" />
              </div>
              <p className="text-sm text-gray-600 mb-2">{bundle.description}</p>
              <div className="flex items-center space-x-4 flex-wrap">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bundle.status)}`}>
                  {bundle.status}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(bundle.type)}`}>
                  {bundle.type}
                </span>
                <span className="text-sm text-gray-500">
                  {bundle.orders} orders • €{bundle.revenue.toLocaleString()} revenue
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-gray-900">€{bundle.bundlePrice}</div>
              <div className="text-sm text-gray-500 line-through">€{bundle.originalPrice}</div>
              <div className="text-sm text-green-600 font-medium">{bundle.discount}% off</div>
            </div>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            <Button variant="secondary" size="sm" onClick={() => onEdit(bundle.id)}>
              <Edit3 className="h-4 w-4" />
            </Button>
            <Button 
              variant={bundle.status === 'active' ? 'secondary' : 'primary'} 
              size="sm"
              onClick={() => onToggleStatus(bundle.id)}
            >
              {bundle.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button variant="secondary" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Package className="h-5 w-5 text-gray-400" />
          <Heart className="h-4 w-4 text-red-500 fill-current" />
        </div>
        <div className="flex items-center space-x-1">
          <Button variant="secondary" size="sm" onClick={() => onEdit(bundle.id)}>
            <Edit3 className="h-4 w-4" />
          </Button>
          <Button variant="secondary" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">{bundle.name}</h3>
      <p className="text-sm text-gray-600 mb-4">{bundle.description}</p>

      <div className="flex items-center space-x-2 mb-4">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bundle.status)}`}>
          {bundle.status}
        </span>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(bundle.type)}`}>
          {bundle.type}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Revenue</span>
          <span className="font-medium">€{bundle.revenue.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Orders</span>
          <span className="font-medium">{bundle.orders}</span>
        </div>
        {bundle.rating > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Rating</span>
            <div className="flex items-center">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="font-medium ml-1">{bundle.rating}</span>
            </div>
          </div>
        )}
      </div>

      <div className="border-t pt-4">
        <div className="flex justify-between items-center mb-3">
          <div className="text-sm text-gray-500 line-through">€{bundle.originalPrice}</div>
          <div className="text-lg font-bold text-gray-900">€{bundle.bundlePrice}</div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-green-600 font-medium">{bundle.discount}% discount</span>
          <Button 
            variant={bundle.status === 'active' ? 'secondary' : 'primary'} 
            size="sm"
            onClick={() => onToggleStatus(bundle.id)}
          >
            {bundle.status === 'active' ? (
              <>
                <Pause className="h-4 w-4 mr-1" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-1" />
                Activate
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function FavoritesPage() {
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [activeTab, setActiveTab] = useState('bundles')

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  const handleEdit = (id: string) => {
    console.log('Edit bundle:', id)
    // Implement edit functionality
  }

  const handleDelete = (id: string) => {
    console.log('Delete bundle:', id)
    // Implement delete functionality
  }

  const handleToggleStatus = (id: string) => {
    console.log('Toggle status for bundle:', id)
    // Implement status toggle
  }

  const handleRemoveFavorite = (id: string) => {
    console.log('Remove from favorites:', id)
    // Implement remove from favorites
  }

  const filteredBundles = favoriteBundles.filter(bundle => {
    const matchesSearch = bundle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bundle.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || bundle.status === filterStatus
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Heart className="h-6 w-6 text-red-500 mr-2" />
            Favorites
          </h1>
          <p className="text-gray-600 mt-1">Your most important bundles and reports</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <Button variant="secondary" size="sm">
            <Copy className="h-4 w-4 mr-2" />
            Duplicate
          </Button>
          <Button variant="primary" size="sm">
            <Package className="h-4 w-4 mr-2" />
            Create Bundle
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('bundles')}
            className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'bundles'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Package className="h-4 w-4 inline mr-2" />
            Favorite Bundles ({favoriteBundles.length})
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'reports'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <TrendingUp className="h-4 w-4 inline mr-2" />
            Favorite Reports ({favoriteReports.length})
          </button>
        </nav>
      </div>

      {activeTab === 'bundles' && (
        <>
          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search favorite bundles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">View:</span>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Bundles Grid/List */}
          {filteredBundles.length > 0 ? (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
              : "space-y-4"
            }>
              {filteredBundles.map((bundle) => (
                <BundleCard
                  key={bundle.id}
                  bundle={bundle}
                  viewMode={viewMode}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleStatus={handleToggleStatus}
                  onRemoveFavorite={handleRemoveFavorite}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No favorite bundles found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-4">
          {favoriteReports.map((report) => (
            <div key={report.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-semibold text-gray-900">{report.name}</h3>
                      <Heart className="h-4 w-4 text-red-500 fill-current" />
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{report.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Last generated: {report.lastGenerated}</span>
                      <span>Frequency: {report.frequency}</span>
                      <span className="px-2 py-1 bg-gray-100 rounded-full capitalize">{report.type}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="secondary" size="sm">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule
                  </Button>
                  <Button variant="primary" size="sm">
                    <Play className="h-4 w-4 mr-2" />
                    Generate
                  </Button>
                  <Button variant="secondary" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Favorite Bundles Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">€56,000</p>
              <p className="text-sm text-green-600 mt-1">
                <TrendingUp className="h-4 w-4 inline mr-1" />
                +18.2% vs last month
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">770</p>
              <p className="text-sm text-blue-600 mt-1">
                <TrendingUp className="h-4 w-4 inline mr-1" />
                +12.5% vs last month
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Rating</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">4.75</p>
              <div className="flex items-center mt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                ))}
              </div>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Star className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}