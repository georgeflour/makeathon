import { Bundle, FlaskBundle } from '@/types/bundles'

export const transformFlaskData = (flaskData: FlaskBundle[]): Bundle[] => {
  return flaskData.map((bundle) => {
    // Calculate original price based on profit margin
    const profitMarginPercentage = parseInt(bundle.profitMargin) / 100
    const originalPrice = bundle.price / (1 - profitMarginPercentage)
    const discount = Math.round(((originalPrice - bundle.price) / originalPrice) * 100)

    // Determine status based on season and duration
    let status: 'active' | 'inactive' | 'scheduled'
    const currentDate = new Date()

    if (bundle.duration === 'Until stock runs out') {
      status = 'active'
    } else if (!bundle.season) {
      status = 'inactive'
    } else {
      const [startMonth, endMonth] = bundle.season.split('–')
      const months = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ]
      const currentMonth = months[currentDate.getMonth()]

      if (startMonth && endMonth) {
        const startIdx = months.indexOf(startMonth)
        const endIdx = months.indexOf(endMonth)
        const currentIdx = months.indexOf(currentMonth)

        if (startIdx <= currentIdx && currentIdx <= endIdx) {
          status = 'active'
        } else if (currentIdx < startIdx) {
          status = 'scheduled'
        } else {
          status = 'inactive'
        }
      } else {
        status = bundle.season ? 'active' : 'inactive'
      }
    }

    // Generate description based on items
    const itemDescriptions = bundle.items.map((item) => `${item.qty}x ${item.item_name}`).join(', ')
    const description = `Bundle containing: ${itemDescriptions}`

    // Determine bundle type based on items and rationale
    let type: Bundle['type'] = 'all'
    if (bundle.rationale.toLowerCase().includes('volume')) {
      type = 'volume'
    } else if (bundle.rationale.toLowerCase().includes('cross-sell')) {
      type = 'cross-sell'
    } else if (bundle.rationale.toLowerCase().includes('seasonal')) {
      type = 'seasonal'
    } else if (bundle.rationale.toLowerCase().includes('complementary')) {
      type = 'complementary'
    } else if (bundle.rationale.toLowerCase().includes('theme')) {
      type = 'thematic'
    }

    // Calculate dates
    const startDate = new Date()
    let endDate = new Date()
    if (bundle.duration !== 'Until stock runs out') {
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
      id: bundle.bundle_id,
      name: bundle.name,
      description,
      products: bundle.items.map((item) => item.item_name),
      originalPrice: Math.round(originalPrice * 100) / 100,
      bundlePrice: bundle.price,
      discount,
      type,
      status,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      forecastedRevenue: bundle.price * 100, // Example forecast
      actualRevenue: status === 'active' ? bundle.price * 75 : 0, // Example actual revenue
      createdAt: startDate.toISOString(),
      profitMargin: bundle.profitMargin,
      itemCount: bundle.items.reduce((acc, item) => acc + item.qty, 0),
      rationale: bundle.rationale,
      duration: bundle.duration,
      season: bundle.season,
    }
  })
} 