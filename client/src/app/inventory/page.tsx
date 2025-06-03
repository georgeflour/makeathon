'use client'

import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Package,
  Search,
  Truck,
} from 'lucide-react'

import { useEffect, useState } from 'react'

// Button Component
interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md'
  onClick?: () => void
  disabled?: boolean
  [key: string]: any
}

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  ...props
}: ButtonProps) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2'
  const variants: Record<string, string> = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900 focus:ring-gray-500',
  }
  const sizes: Record<string, string> = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
  }

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}

// Card Component
interface CardProps {
  children: React.ReactNode
  className?: string
  title?: string
  subtitle?: string
}

const Card = ({ children, className = '', title, subtitle }: CardProps) => (
  <div className={`bg-white rounded-lg shadow border border-gray-200 p-6 ${className}`}>
    {title && (
      <div className='mb-4'>
        <h3 className='text-lg font-medium text-gray-900'>{title}</h3>
        {subtitle && <p className='text-sm text-gray-600 mt-1'>{subtitle}</p>}
      </div>
    )}
    {children}
  </div>
)

// Updated interfaces to match backend data structure
interface BackendProduct {
  SKU: string
  Quantity: number
  'Item title': string
  Category: string
  Brand: string
  price: number
}

interface Product {
  sku: string
  title: string
  category: string
  brand: string
  originalPrice: number
  finalPrice: number
  stockQuantity: number
}

interface InventoryAlert {
  sku: string
  title: string
  currentStock: number
  threshold: number
  severity: 'low'
  lastUpdated: string
}

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStock, setFilterStock] = useState('all')
  const [inventory, setInventory] = useState<Product[]>([])
  const [alerts, setAlerts] = useState<InventoryAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Function to transform backend data to frontend format
  const transformBackendData = (backendData: BackendProduct[]): Product[] => {
    return backendData.map((item) => ({
      sku: item.SKU,
      title: item['Item title'],
      category: item.Category,
      brand: item.Brand,
      originalPrice: item.price,
      finalPrice: item.price,
      stockQuantity: item.Quantity,
    }))
  }

  // Function to generate alerts based on stock levels (only for items < 5)
  const generateAlerts = (products: Product[]): InventoryAlert[] => {
    const criticalStockThreshold = 5

    return products
      .filter((product) => product.stockQuantity < criticalStockThreshold)
      .map((product) => ({
        sku: product.sku,
        title: product.title,
        currentStock: product.stockQuantity,
        threshold: criticalStockThreshold,
        severity: 'low' as const,
        lastUpdated: new Date().toISOString(),
      }))
  }

  // Fetch inventory data from backend
  const fetchInventory = async () => {
    try {
      setLoading(true)
      setError(null)

      // Replace with your actual Flask backend URL
      const response = await fetch('http://127.0.0.1:5001/inventory', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add any authentication headers if needed
          // 'Authorization': `Bearer ${token}`
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // Parse the JSON string if it's double-encoded
      let parsedData: BackendProduct[]
      if (typeof data === 'string') {
        parsedData = JSON.parse(data)
      } else {
        parsedData = data
      }

      // Transform backend data to match frontend structure
      const transformedInventory = transformBackendData(parsedData)
      setInventory(transformedInventory)

      // Generate alerts based on stock levels
      const generatedAlerts = generateAlerts(transformedInventory)
      setAlerts(generatedAlerts)
    } catch (err) {
      console.error('Error fetching inventory:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch inventory data')
    } finally {
      setLoading(false)
    }
  }

  // Fetch data on component mount
  useEffect(() => {
    fetchInventory()
  }, [])

  // Filter inventory based on search and filters
  const filteredInventory = inventory.filter((product) => {
    const matchesSearch =
      product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory
    const matchesStock =
      filterStock === 'all' ||
      (filterStock === 'low' && product.stockQuantity < 5) ||
      (filterStock === 'out' && product.stockQuantity === 0) ||
      (filterStock === 'in' && product.stockQuantity > 0)
    return matchesSearch && matchesCategory && matchesStock
  })

  // Pagination calculations
  const totalItems = filteredInventory.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = filteredInventory.slice(startIndex, endIndex)

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterCategory, filterStock])

  // Get unique categories for filter dropdown
  const categories = Array.from(new Set(inventory.map((p) => p.category)))

  // Retry function for error state
  const handleRetry = () => {
    fetchInventory()
  }

  // Pagination handlers
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const goToPrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const goToNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  // Alert Pagination
  const [alertsPage, setAlertsPage] = useState(1)
  const alertsPerPage = 3

  const totalAlertPages = Math.ceil(alerts.length / alertsPerPage)
  const startAlertIndex = (alertsPage - 1) * alertsPerPage
  const currentAlerts = alerts.slice(startAlertIndex, startAlertIndex + alertsPerPage)

  const goToNextAlerts = () => {
    if (alertsPage < totalAlertPages) setAlertsPage(alertsPage + 1)
  }
  const goToPreviousAlerts = () => {
    if (alertsPage > 1) setAlertsPage(alertsPage - 1)
  }

  return (
    <div className='p-6 max-w-7xl mx-auto'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Inventory Management</h1>
          <p className='text-gray-600 mt-1'>Monitor stock levels and manage inventory</p>
        </div>
        <div className='flex space-x-3 mt-4 sm:mt-0'>
          <Button variant='secondary' onClick={handleRetry}>
            <Package className='h-4 w-4 mr-2' />
            Refresh
          </Button>
          <Button variant='secondary' onClick={() => {}}>
            <Truck className='h-4 w-4 mr-2' />
            Reorder
          </Button>
          <Button variant='secondary' onClick={() => {}}>
            <Download className='h-4 w-4 mr-2' />
            Export
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className='mb-6 border-red-200 bg-red-50'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center'>
              <AlertTriangle className='h-5 w-5 text-red-500 mr-3' />
              <div>
                <p className='font-medium text-red-800'>Error loading inventory</p>
                <p className='text-sm text-red-600'>{error}</p>
              </div>
            </div>
            <Button onClick={handleRetry} size='sm'>
              Retry
            </Button>
          </div>
        </Card>
      )}

      {/* Stock Alerts - Only orange warnings for items < 5 */}
      {!loading && alerts.length > 0 && (
        <Card
          className='mb-6'
          title='Stock Alerts'
          subtitle={`${alerts.length} items need attention`}
        >
          <div className='space-y-3'>
            {currentAlerts.map((alert) => (
              <div
                key={alert.sku}
                className='flex items-center justify-between p-3 rounded-lg bg-orange-50 border border-orange-200'
              >
                <div className='flex items-center'>
                  <AlertTriangle className='h-5 w-5 mr-3 text-orange-500' />
                  <div>
                    <p className='font-medium text-gray-900'>{alert.title}</p>
                    <p className='text-sm text-gray-600'>
                      Current stock: {alert.currentStock} (Below threshold of {alert.threshold})
                    </p>
                  </div>
                </div>
                <Button size='sm' onClick={() => {}}>
                  Reorder
                </Button>
              </div>
            ))}

            {totalAlertPages > 1 && (
              <div className='flex items-center justify-between mt-4'>
                <Button
                  size='sm'
                  variant='secondary'
                  onClick={goToPreviousAlerts}
                  disabled={alertsPage === 1}
                >
                  <ChevronLeft className='h-4 w-4 mr-1' />
                  Previous
                </Button>
                <span className='text-sm text-gray-600'>
                  Page {alertsPage} from {totalAlertPages}
                </span>
                <Button
                  size='sm'
                  variant='secondary'
                  onClick={goToNextAlerts}
                  disabled={alertsPage === totalAlertPages}
                >
                  Next
                  <ChevronRight className='h-4 w-4 ml-1' />
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card className='mb-6'>
        <div className='flex flex-col lg:flex-row gap-4'>
          <div className='flex-1'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
              <input
                type='text'
                placeholder='Search products...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                disabled={loading}
              />
            </div>
          </div>
          <div className='flex flex-col sm:flex-row gap-2'>
            <div className='flex items-center gap-2'>
              <Filter className='h-4 w-4 text-gray-400' />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className='border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent max-w-xs truncate'
                disabled={loading}
                style={{
                  maxWidth: '16rem',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                }}
              >
                <option value='all'>All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <select
              value={filterStock}
              onChange={(e) => setFilterStock(e.target.value)}
              className='border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              disabled={loading}
            >
              <option value='all'>All Stock Levels</option>
              <option value='in'>In Stock</option>
              <option value='low'>Low Stock (&lt; 5)</option>
              <option value='out'>Out of Stock</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Inventory Table */}
      <Card>
        <div className='overflow-x-auto'>
          {loading ? (
            <div className='space-y-4'>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className='animate-pulse flex space-x-4 py-4'>
                  <div className='h-4 bg-gray-200 rounded w-32'></div>
                  <div className='h-4 bg-gray-200 rounded w-48'></div>
                  <div className='h-4 bg-gray-200 rounded w-24'></div>
                  <div className='h-4 bg-gray-200 rounded w-20'></div>
                  <div className='h-4 bg-gray-200 rounded w-16'></div>
                  <div className='h-4 bg-gray-200 rounded w-16'></div>
                </div>
              ))}
            </div>
          ) : filteredInventory.length === 0 ? (
            <div className='text-center py-12'>
              <Package className='h-12 w-12 text-gray-400 mx-auto mb-4' />
              <p className='text-gray-500 text-lg'>No inventory items found</p>
              <p className='text-gray-400 text-sm'>
                {searchTerm || filterCategory !== 'all' || filterStock !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Check your backend connection'}
              </p>
            </div>
          ) : (
            <>
              <table className='min-w-full divide-y divide-gray-200'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      SKU
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Product
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Category
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Brand
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Price
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Stock
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className='bg-white divide-y divide-gray-200'>
                  {currentItems.map((product) => (
                    <tr key={product.sku} className='hover:bg-gray-50'>
                      <td className='px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900'>
                        {product.sku}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='text-sm font-medium text-gray-900'>{product.title}</div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                        {product.category}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                        {product.brand}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                        €{product.finalPrice.toFixed(2)}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                        {product.stockQuantity}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            product.stockQuantity === 0
                              ? 'bg-red-100 text-red-800'
                              : product.stockQuantity < 5
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {product.stockQuantity === 0
                            ? 'Out of Stock'
                            : product.stockQuantity < 5
                              ? 'Low Stock'
                              : 'In Stock'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className='flex items-center justify-between border-t border-gray-200 bg-white px-6 py-3'>
                  <div className='flex flex-1 justify-between sm:hidden'>
                    <Button
                      onClick={goToPrevious}
                      disabled={currentPage === 1}
                      variant='secondary'
                      size='sm'
                    >
                      Previous
                    </Button>
                    <Button
                      onClick={goToNext}
                      disabled={currentPage === totalPages}
                      variant='secondary'
                      size='sm'
                    >
                      Next
                    </Button>
                  </div>
                  <div className='hidden sm:flex sm:flex-1 sm:items-center sm:justify-between'>
                    <div>
                      <p className='text-sm text-gray-700'>
                        Showing <span className='font-medium'>{startIndex + 1}</span> to{' '}
                        <span className='font-medium'>{Math.min(endIndex, totalItems)}</span> of{' '}
                        <span className='font-medium'>{totalItems}</span> results
                      </p>
                    </div>
                    <div>
                      <nav
                        className='isolate inline-flex -space-x-px rounded-md shadow-sm'
                        aria-label='Pagination'
                      >
                        <button
                          onClick={goToPrevious}
                          disabled={currentPage === 1}
                          className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                            currentPage === 1
                              ? 'cursor-not-allowed opacity-50'
                              : 'hover:text-gray-600'
                          }`}
                        >
                          <ChevronLeft className='h-5 w-5' />
                        </button>

                        {/* Page numbers */}
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                          // Show first page, last page, current page, and pages around current page
                          const showPage =
                            page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1

                          if (!showPage && page === 2 && currentPage > 4) {
                            return (
                              <span
                                key={page}
                                className='relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700'
                              >
                                ...
                              </span>
                            )
                          }
                          if (
                            !showPage &&
                            page === totalPages - 1 &&
                            currentPage < totalPages - 3
                          ) {
                            return (
                              <span
                                key={page}
                                className='relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700'
                              >
                                ...
                              </span>
                            )
                          }
                          if (!showPage) return null

                          return (
                            <button
                              key={page}
                              onClick={() => goToPage(page)}
                              className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                page === currentPage
                                  ? 'z-10 bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                                  : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                              }`}
                            >
                              {page}
                            </button>
                          )
                        })}

                        <button
                          onClick={goToNext}
                          disabled={currentPage === totalPages}
                          className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                            currentPage === totalPages
                              ? 'cursor-not-allowed opacity-50'
                              : 'hover:text-gray-600'
                          }`}
                        >
                          <ChevronRight className='h-5 w-5' />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  )
}
