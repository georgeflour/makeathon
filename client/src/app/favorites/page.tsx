'use client'
import { useState, useEffect } from 'react'
import { Eye } from 'lucide-react'
import { Bundle, FlaskBundle, transformFlaskData } from '../bundles/page'
import Link from 'next/link'

interface ViewBundleModalProps {
  bundle: Bundle
  onClose: () => void
}

function ViewBundleModal({ bundle, onClose }: ViewBundleModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{bundle.name}</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Bundle Information</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium capitalize">{bundle.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Original Price:</span>
                <span className="line-through text-gray-500">€{bundle.originalPrice}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Bundle Price:</span>
                <span className="font-bold text-green-600">€{bundle.bundlePrice}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Discount:</span>
                <span className="font-medium text-red-600">{bundle.discount}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Profit Margin:</span>
                <span className="font-medium text-blue-600">{bundle.profitMargin}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Products</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-2">
                {bundle.products.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                    <span className="text-gray-900">{product}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-3">
                Total Items: {bundle.itemCount}
              </p>
            </div>

            {bundle.rationale && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Rationale</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700">{bundle.rationale}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function FavoritesPage() {
  const [bundles, setBundles] = useState<Bundle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewBundle, setViewBundle] = useState<Bundle | null>(null)

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
      const response = await fetch('http://127.0.0.1:5000/bundles/favorite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bundle_id: bundleId,
          is_favorite: false
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to remove from favorites')
      }

      // Refresh the favorites list
      fetchFavorites()
    } catch (error) {
      console.error('Error removing favorite:', error)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Favorite Bundles</h1>
          <p className="text-gray-600 mt-1">Your saved bundle collection</p>
        </div>
        <Link 
          href="/bundles"
          className="mt-4 sm:mt-0 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Bundles
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      ) : bundles.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600 mb-4">You haven't added any bundles to your favorites yet.</p>
          <Link 
            href="/bundles"
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            Go back to browse bundles
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bundles.map((bundle) => (
            <div key={bundle.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">{bundle.name}</h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  bundle.status === 'active' ? 'bg-green-100 text-green-800' :
                  bundle.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {bundle.status}
                </span>
              </div>
              
              <p className="text-gray-600 text-sm mb-4">{bundle.description}</p>
              
              <div className="space-y-2 mb-4">
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
                  <span>Start: {new Date(bundle.startDate).toLocaleDateString()}</span>
                  <span>End: {new Date(bundle.endDate).toLocaleDateString()}</span>
                </div>
                
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setViewBundle(bundle)}
                    className="flex-1 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors flex items-center justify-center gap-1"
                  >
                    <Eye className="h-3 w-3" />
                    View Details
                  </button>
                  <button 
                    onClick={() => handleRemoveFavorite(bundle.id)}
                    className="flex-1 px-4 py-2 text-sm bg-red-100 hover:bg-red-200 text-red-600 rounded-md transition-colors flex items-center justify-center gap-1"
                  >
                    ❤️ Remove from Favorites
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewBundle && (
        <ViewBundleModal
          bundle={viewBundle}
          onClose={() => setViewBundle(null)}
        />
      )}
    </div>
  )
} 