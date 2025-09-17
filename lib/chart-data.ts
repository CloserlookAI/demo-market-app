// Generate realistic stock chart data
export function generateChartData(
  symbol: string,
  basePrice: number,
  timeframe: '1D' | '1W' | '1M' | '3M' | '1Y' = '1D',
  trend: 'up' | 'down' | 'volatile' = 'up'
) {
  const dataPoints: Array<{
    time: string
    price: number
    volume: number
  }> = []

  let currentPrice = basePrice
  let pointCount: number
  let timeIncrement: number
  let timeUnit: string

  // Configure data points based on timeframe
  switch (timeframe) {
    case '1D':
      pointCount = 78 // Every 5 minutes during market hours (6.5 hours)
      timeIncrement = 5
      timeUnit = 'minutes'
      break
    case '1W':
      pointCount = 35 // Every hour for 5 days
      timeIncrement = 1
      timeUnit = 'hours'
      break
    case '1M':
      pointCount = 30 // Daily for 1 month
      timeIncrement = 1
      timeUnit = 'days'
      break
    case '3M':
      pointCount = 65 // Every 1.4 days for 3 months
      timeIncrement = 1.4
      timeUnit = 'days'
      break
    case '1Y':
      pointCount = 52 // Weekly for 1 year
      timeIncrement = 7
      timeUnit = 'days'
      break
  }

  const volatility = {
    up: 0.02,
    down: 0.02,
    volatile: 0.05
  }[trend]

  const trendDirection = {
    up: 0.0003,
    down: -0.0003,
    volatile: 0
  }[trend]

  // Generate data points
  for (let i = 0; i < pointCount; i++) {
    const randomChange = (Math.random() - 0.5) * 2 * volatility
    const trendChange = trendDirection * i
    const priceChange = randomChange + trendChange

    currentPrice = Math.max(currentPrice * (1 + priceChange), 0.01)

    // Generate time label
    let timeLabel: string
    const now = new Date()

    switch (timeframe) {
      case '1D':
        const marketOpen = new Date(now)
        marketOpen.setHours(9, 30, 0, 0) // 9:30 AM market open
        const time = new Date(marketOpen.getTime() + i * timeIncrement * 60000)
        timeLabel = time.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })
        break
      case '1W':
        const weekStart = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000)
        const hourTime = new Date(weekStart.getTime() + i * timeIncrement * 60 * 60 * 1000)
        timeLabel = hourTime.toLocaleDateString('en-US', {
          weekday: 'short',
          hour: 'numeric'
        })
        break
      case '1M':
        const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        const dayTime = new Date(monthStart.getTime() + i * timeIncrement * 24 * 60 * 60 * 1000)
        timeLabel = dayTime.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        })
        break
      case '3M':
        const threeMonthStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        const dayTime3M = new Date(threeMonthStart.getTime() + i * timeIncrement * 24 * 60 * 60 * 1000)
        timeLabel = dayTime3M.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        })
        break
      case '1Y':
        const yearStart = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        const weekTime = new Date(yearStart.getTime() + i * timeIncrement * 24 * 60 * 60 * 1000)
        timeLabel = weekTime.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        })
        break
    }

    // Generate volume (higher volume during price movements)
    const volumeBase = 1000000 + Math.random() * 5000000
    const volumeMultiplier = 1 + Math.abs(priceChange) * 10
    const volume = Math.floor(volumeBase * volumeMultiplier)

    dataPoints.push({
      time: timeLabel,
      price: currentPrice,
      volume: volume
    })
  }

  return dataPoints
}

// Stock data with trends
export const stockTrends: Record<string, 'up' | 'down' | 'volatile'> = {
  'AAPL': 'up',
  'TSLA': 'volatile',
  'GOOGL': 'down',
  'MSFT': 'up',
  'NVDA': 'up',
  'AMZN': 'down',
  'META': 'volatile',
  'NFLX': 'up'
}

export function getStockChartData(symbol: string, basePrice: number, timeframe: '1D' | '1W' | '1M' | '3M' | '1Y' = '1D') {
  const trend = stockTrends[symbol] || 'volatile'
  return generateChartData(symbol, basePrice, timeframe, trend)
}