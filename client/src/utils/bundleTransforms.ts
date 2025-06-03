import { Bundle, FlaskBundle } from '@/types/bundles'

export const transformFlaskData = (flaskData: FlaskBundle[]): Bundle[] => {
  if (!Array.isArray(flaskData) || flaskData.length === 0) {
    console.warn('No bundles data received from backend')
    return []
  }

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  return flaskData.map((bundle) => {
    try {
      if (!bundle || !bundle.items || !Array.isArray(bundle.items)) {
        console.error('Invalid bundle data:', bundle)
        return null
      }

      // Calculate original price based on profit margin if available
      const marginString = (typeof bundle.profitMargin === 'string')
        ? bundle.profitMargin.replace('%', '') : '35'
      const profitMarginPercentage = parseFloat(marginString) / 100
      const bundlePrice = bundle.price || 0
      const originalPrice =
        profitMarginPercentage && profitMarginPercentage < 1
          ? bundlePrice / (1 - profitMarginPercentage)
          : bundlePrice
      const discount =
        originalPrice > 0
          ? Math.round(((originalPrice - bundlePrice) / originalPrice) * 100)
          : 0

      // Status logic
      let status: 'active' | 'inactive' | 'scheduled' = 'inactive'
      if (!bundle.duration || !bundle.season) {
        status = 'inactive'
      } else if (
        bundle.duration.toLowerCase().includes('until stock runs out')
      ) {
        status = 'active'
      } else if (bundle.season) {
        // Season logic, works for "September–November" or similar
        const now = new Date()
        const currentMonth = months[now.getMonth()]
        const dash = bundle.season.includes('–') ? '–' : '-'
        const [startMonth, endMonth] = bundle.season.split(dash).map((s) => s.trim())
        const startIdx = months.indexOf(startMonth)
        const endIdx = months.indexOf(endMonth)
        const currentIdx = months.indexOf(currentMonth)

        if (startIdx !== -1 && endIdx !== -1) {
          if (startIdx <= currentIdx && currentIdx <= endIdx) {
            status = 'active'
          } else if (currentIdx < startIdx) {
            status = 'scheduled'
          }
        } else if (bundle.season) {
          status = 'active'
        }
      }

      // Compose description
      const itemDescriptions = bundle.items
        .filter((item) => item && item.item_name)
        .map((item) => `${item.qty || 1}x ${item.item_name}`)
        .join(', ')
      const description = `Bundle containing: ${itemDescriptions}`

      // Determine bundle type
      let type: Bundle['type'] = 'all'
      const rationale = (bundle.rationale || '').toLowerCase()
      if (rationale.includes('volume')) type = 'volume'
      else if (rationale.includes('cross-sell')) type = 'cross-sell'
      else if (rationale.includes('seasonal')) type = 'seasonal'
      else if (rationale.includes('complementary')) type = 'complementary'
      else if (rationale.includes('theme')) type = 'thematic'

      // Dates logic (fallback: 6 months ahead)
      const startDate = new Date()
      let endDate = new Date(startDate)
      if (bundle.duration && !bundle.duration.toLowerCase().includes('until stock runs out')) {
        const durationMatch = bundle.duration.match(/(\d+)\s*(week|month)/i)
        if (durationMatch) {
          const [, amountStr, unit] = durationMatch
          const amount = parseInt(amountStr)
          if (unit.startsWith('week')) endDate.setDate(endDate.getDate() + amount * 7)
          else if (unit.startsWith('month')) endDate.setMonth(endDate.getMonth() + amount)
        }
      } else {
        endDate.setMonth(endDate.getMonth() + 6)
      }

      // Handle customer_segments (empty array if missing)
      const customerSegments = Array.isArray(bundle.customer_segments)
        ? bundle.customer_segments
        : []

      return {
        id: bundle.bundle_id || `bundle_${Math.random().toString(36).substr(2, 9)}`,
        name: bundle.name || 'Unnamed Bundle',
        description,
        products: bundle.items.map((item) => item.item_name || '').filter(Boolean),
        originalPrice: Math.round(originalPrice * 100) / 100,
        bundlePrice,
        discount,
        type,
        status,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        forecastedRevenue: bundlePrice * 100, // Adjust as needed
        actualRevenue: status === 'active' ? bundlePrice * 75 : 0, // Adjust as needed
        createdAt: startDate.toISOString(),
        profitMargin: bundle.profitMargin || '35%',
        itemCount: bundle.items.reduce((acc, item) => acc + (item.qty || 1), 0),
        rationale: bundle.rationale || '',
        duration: bundle.duration || '',
        season: bundle.season || '',
        customer_segments: customerSegments, // ADDED FIELD
      }
    } catch (error) {
      console.error('Error transforming bundle:', error, bundle)
      return null
    }
  }).filter(Boolean) as Bundle[]
}
