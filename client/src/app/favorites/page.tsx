'use client'

import {
  ArrowRight,
  Calendar,
  Eye,
  Heart,
  Package,
  ShoppingBag,
  Star,
  TrendingUp,
} from 'lucide-react'

import { useEffect, useState } from 'react'

import Link from 'next/link'

import { Bundle } from '@/types/bundles'
import { transformFlaskData } from '@/utils/bundleTransforms'

interface ViewBundleModalProps {
  bundle: Bundle
  onClose: () => void
}

function ViewBundleModal({ bundle, onClose }: ViewBundleModalProps) {
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
          <div>
            <h3 className='text-lg font-semibold text-gray-900 mb-3'>Bundle Information</h3>
            <div className='bg-gray-50 rounded-lg p-4 space-y-3'>
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
              <div className='flex justify-between text-sm'>
                <span className='text-gray-500'>Profit Margin:</span>
                <span className='font-medium text-blue-600'>{bundle.profitMargin}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className='text-lg font-semibold text-gray-900 mb-3'>Products</h3>
            <div className='bg-gray-50 rounded-lg p-4'>
              <div className='space-y-2'>
                {bundle.products.map((product, index) => (
                  <div
                    key={index}
                    className='flex items-center justify-between p-2 bg-white rounded border border-gray-200'
                  >
                    <span className='text-gray-900'>{product}</span>
                  </div>
                ))}
              </div>
              <p className='text-sm text-gray-500 mt-3'>Total Items: {bundle.itemCount}</p>
            </div>

            {bundle.rationale && (
              <div className='mt-4'>
                <h3 className='text-lg font-semibold text-gray-900 mb-3'>Rationale</h3>
                <div className='bg-gray-50 rounded-lg p-4'>
                  <p className='text-gray-700'>{bundle.rationale}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatsCard({
  icon: Icon,
  title,
  value,
  color,
}: {
  icon: any
  title: string
  value: string
  color: string
}) {
  return (
    <div className='bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300'>
      <div className='flex items-center gap-4'>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className='h-6 w-6 text-white' />
        </div>
        <div>
          <p className='text-gray-600 text-sm font-medium'>{title}</p>
          <p className='text-2xl font-bold text-gray-900'>{value}</p>
        </div>
      </div>
    </div>
  )
}

function getTypeLabel(type: string | undefined): string {
  if (!type) return 'Standard'
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()
}

export default function FavoritesPage() {
  const [bundles, setBundles] = useState<Bundle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewBundle, setViewBundle] = useState<Bundle | null>(null)
  const [removingFavorite, setRemovingFavorite] = useState<string | null>(null)

  const fetchFavorites = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('http://127.0.0.1:5000/bundles/favorites', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const transformedBundles = transformFlaskData(data.bundles)
      setBundles(transformedBundles)
    } catch (err) {
      console.error('Error fetching favorites:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch favorites')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFavorites()
  }, [])

  const handleRemoveFavorite = async (bundleId: string) => {
    try {
      setRemovingFavorite(bundleId)
      const response = await fetch('http://127.0.0.1:5000/bundles/favorite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bundle_id: bundleId,
          is_favorite: false,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to remove from favorites')
      }

      // Refresh the favorites list
      fetchFavorites()
    } catch (error) {
      console.error('Error removing favorite:', error)
    } finally {
      setRemovingFavorite(null)
    }
  }

  // Calculate stats
  const totalSavings = bundles.reduce(
    (sum, bundle) => sum + (bundle.originalPrice - bundle.bundlePrice),
    0
  )
  const averageDiscount =
    bundles.length > 0
      ? Math.round(bundles.reduce((sum, bundle) => sum + bundle.discount, 0) / bundles.length)
      : 0
  const totalItems = bundles.reduce((sum, bundle) => sum + bundle.itemCount, 0)

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50'>
      <div className='p-6 max-w-7xl mx-auto'>
        {/* Header Section */}
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8'>
          <div>
            <h1 className='text-4xl font-bold text-gray-900 mb-2'>
              Favorite Bundles
              <Heart className='inline-block ml-3 h-8 w-8 text-red-500' />
            </h1>
            <p className='text-gray-600 text-lg'>Your curated collection of amazing deals</p>
          </div>
          <Link
            href='/bundles'
            className='mt-4 sm:mt-0 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2 font-semibold'
          >
            Browse More Bundles
            <ArrowRight className='h-4 w-4' />
          </Link>
        </div>

        {/* Stats Section */}
        {bundles.length > 0 && (
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
            <StatsCard
              icon={TrendingUp}
              title='Discount'
              value={`€${totalSavings.toFixed(2)}`}
              color='bg-gradient-to-r from-green-500 to-emerald-500'
            />
            <StatsCard
              icon={Star}
              title='Average Discount'
              value={`${averageDiscount}%`}
              color='bg-gradient-to-r from-yellow-500 to-orange-500'
            />
            <StatsCard
              icon={Package}
              title='Total Items'
              value={totalItems.toString()}
              color='bg-gradient-to-r from-blue-500 to-indigo-500'
            />
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className='flex flex-col items-center justify-center p-16'>
            <div className='relative'>
              <div className='animate-spin rounded-full h-16 w-16 border-4 border-blue-200'></div>
              <div className='animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent absolute top-0'></div>
            </div>
            <p className='text-gray-600 mt-4 text-lg'>Loading your favorites...</p>
          </div>
        ) : error ? (
          <div className='bg-red-50 border-l-4 border-red-400 rounded-lg p-6 shadow-sm'>
            <div className='flex items-center'>
              <div className='flex-shrink-0'>
                <svg className='h-5 w-5 text-red-400' viewBox='0 0 20 20' fill='currentColor'>
                  <path
                    fillRule='evenodd'
                    d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                    clipRule='evenodd'
                  />
                </svg>
              </div>
              <div className='ml-3'>
                <p className='text-red-800 font-medium'>Error loading favorites</p>
                <p className='text-red-600 text-sm'>{error}</p>
              </div>
            </div>
          </div>
        ) : bundles.length === 0 ? (
          <div className='bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-lg'>
            <div className='w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center'>
              <Heart className='h-12 w-12 text-gray-400' />
            </div>
            <h3 className='text-2xl font-bold text-gray-900 mb-4'>No favorites yet</h3>
            <p className='text-gray-600 mb-8 text-lg max-w-md mx-auto'>
              Start building your collection by adding bundles you love to your favorites
            </p>
            <Link
              href='/bundles'
              className='inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold text-lg'
            >
              Discover Bundles
              <ArrowRight className='h-5 w-5' />
            </Link>
          </div>
        ) : (
          <>
            {/* Bundles Grid */}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
              {bundles.map((bundle) => (
                <div
                  key={bundle.id}
                  className='bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1'
                >
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
                      <span className='line-through text-gray-400 text-lg'>
                        €{bundle.originalPrice}
                      </span>
                    </div>
                    <div className='flex justify-between items-center'>
                      <span className='text-gray-500 font-medium'>Bundle Price:</span>
                      <span className='font-bold text-green-600 text-xl'>
                        €{bundle.bundlePrice}
                      </span>
                    </div>
                    <div className='flex justify-between items-center'>
                      <span className='text-gray-500 font-medium'>Profit Margin:</span>
                      <span className='font-bold text-blue-600 text-lg'>
                        €{(bundle.originalPrice - bundle.bundlePrice).toFixed(2)} (
                        {bundle.profitMargin})
                      </span>
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
                        onClick={() => setViewBundle(bundle)}
                        className='flex-1 px-4 py-3 text-sm bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 font-medium'
                      >
                        <Eye className='h-4 w-4' />
                        View Details
                      </button>
                      <button
                        onClick={() => handleRemoveFavorite(bundle.id)}
                        disabled={removingFavorite === bundle.id}
                        className='group relative px-4 py-3 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium overflow-hidden'
                      >
                        <div className='absolute inset-0 bg-gradient-to-r from-pink-600 to-red-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left'></div>
                        <div className='relative flex items-center gap-2'>
                          {removingFavorite === bundle.id ? (
                            <>
                              <div className='animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent'></div>
                              <span className='text-sm'>Removing...</span>
                            </>
                          ) : (
                            <>
                              <Heart className='h-4 w-4 fill-current' />
                            </>
                          )}
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom CTA Section */}
            <div className='mt-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-center text-white shadow-2xl'>
              <h3 className='text-2xl font-bold mb-4'>Want to discover more amazing deals?</h3>
              <p className='text-blue-100 mb-6 text-lg'>
                Browse our full collection of bundles and find your next favorite
              </p>
              <Link
                href='/bundles'
                className='inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-xl hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold text-lg'
              >
                Explore All Bundles
                <ArrowRight className='h-5 w-5' />
              </Link>
            </div>
          </>
        )}

        {/* View Bundle Modal */}
        {viewBundle && <ViewBundleModal bundle={viewBundle} onClose={() => setViewBundle(null)} />}
      </div>
    </div>
  )
}
