import { Bundle, FlaskBundle } from '@/types/bundles'

export const transformFlaskData = (flaskData: FlaskBundle[]): Bundle[] => {
  if (!Array.isArray(flaskData) || flaskData.length === 0) {
    console.warn('No bundles data received from backend')
    return []
  }

  return flaskData.map((bundle) => {
    try {
      // Ensure required fields exist
      if (!bundle || !bundle.items || !Array.isArray(bundle.items)) {
        console.error('Invalid bundle data:', bundle)
        return null
      }

      // Calculate original price based on profit margin
      const profitMarginPercentage = parseInt(bundle.profitMargin || '35') / 100
      const originalPrice = bundle.price / (1 - profitMarginPercentage) || 0
      const discount = Math.round(((originalPrice - (bundle.price || 0)) / originalPrice) * 100) || 0

      // Determine status based on season and duration
      let status: 'active' | 'inactive' | 'scheduled' = 'inactive'

      if (!bundle.duration || !bundle.season) {
        status = 'inactive'
      } else if (bundle.duration.toLowerCase() === 'until stock runs out') {
        status = 'active'
      } else {
        const currentDate = new Date()
        const [startMonth, endMonth] = (bundle.season || '').split('–')
        const months = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ]
        const currentMonth = months[currentDate.getMonth()]

        if (startMonth && endMonth) {
          const startIdx = months.indexOf(startMonth.trim())
          const endIdx = months.indexOf(endMonth.trim())
          const currentIdx = months.indexOf(currentMonth)

          if (startIdx !== -1 && endIdx !== -1) {
            if (startIdx <= currentIdx && currentIdx <= endIdx) {
              status = 'active'
            } else if (currentIdx < startIdx) {
              status = 'scheduled'
            }
          }
        } else if (bundle.season) {
          status = 'active'
        }
      }

      // Generate description based on items
      const itemDescriptions = bundle.items
        .filter(item => item && item.item_name)
        .map((item) => `${item.qty || 1}x ${item.item_name}`)
        .join(', ')
      const description = `Bundle containing: ${itemDescriptions}`

      // Determine bundle type based on items and rationale
      let type: Bundle['type'] = 'all'
      const rationale = (bundle.rationale || '').toLowerCase()
      if (rationale.includes('volume')) {
        type = 'volume'
      } else if (rationale.includes('cross-sell')) {
        type = 'cross-sell'
      } else if (rationale.includes('seasonal')) {
        type = 'seasonal'
      } else if (rationale.includes('complementary')) {
        type = 'complementary'
      } else if (rationale.includes('theme')) {
        type = 'thematic'
      }

      // Calculate dates
      const startDate = new Date()
      let endDate = new Date()
      
      if (bundle.duration && bundle.duration !== 'Until stock runs out') {
        const durationMatch = bundle.duration.match(/(\d+)\s+(week|month)s?/)
        if (durationMatch) {
          const [, amount, unit] = durationMatch
          if (unit === 'week') {
            endDate.setDate(endDate.getDate() + parseInt(amount) * 7)
          } else if (unit === 'month') {
            endDate.setMonth(endDate.getMonth() + parseInt(amount))
          }
        }
      } else {
        endDate.setMonth(endDate.getMonth() + 6) // Default 6 months for "Until stock runs out"
      }

      return {
        id: bundle.bundle_id || `bundle_${Math.random().toString(36).substr(2, 9)}`,
        name: bundle.name || 'Unnamed Bundle',
        description,
        products: bundle.items.map((item) => item.item_name || '').filter(Boolean),
        originalPrice: Math.round(originalPrice * 100) / 100,
        bundlePrice: bundle.price || 0,
        discount,
        type,
        status,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        forecastedRevenue: (bundle.price || 0) * 100, // Example forecast
        actualRevenue: status === 'active' ? (bundle.price || 0) * 75 : 0, // Example actual revenue
        createdAt: startDate.toISOString(),
        profitMargin: bundle.profitMargin || '35%',
        itemCount: bundle.items.reduce((acc, item) => acc + (item.qty || 1), 0),
        rationale: bundle.rationale || '',
        duration: bundle.duration || '',
        season: bundle.season || '',
      }
    } catch (error) {
      console.error('Error transforming bundle:', error, bundle)
      return null
    }
  }).filter(Boolean) as Bundle[] // Remove any null entries from failed transformations
} 