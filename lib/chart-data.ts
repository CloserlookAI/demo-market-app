// Chart data utilities for generating realistic stock market data
export interface ChartDataPoint {
  timestamp: string
  date: string
  price: number
  volume: number
  high: number
  low: number
  open: number
  close: number
}

export interface TimeSeriesData {
  symbol: string
  data: ChartDataPoint[]
}

// Generate realistic intraday data for charts
export const generateIntradayData = (symbol: string, basePrice: number): ChartDataPoint[] => {
  const data: ChartDataPoint[] = []
  const now = new Date()
  const marketOpen = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 30) // 9:30 AM
  const currentTime = new Date()

  let currentPrice = basePrice
  let currentVolume = Math.floor(Math.random() * 1000000) + 500000

  // Generate data points every 5 minutes from market open to current time
  for (let time = new Date(marketOpen); time <= currentTime; time.setMinutes(time.getMinutes() + 5)) {
    // Simulate price movement with some volatility
    const volatility = 0.02 // 2% volatility
    const change = (Math.random() - 0.5) * volatility * currentPrice
    currentPrice += change

    // Ensure price doesn't go negative
    currentPrice = Math.max(currentPrice, basePrice * 0.8)

    // Generate OHLC data
    const high = currentPrice + Math.random() * 0.01 * currentPrice
    const low = currentPrice - Math.random() * 0.01 * currentPrice
    const open = data.length > 0 ? data[data.length - 1].close : currentPrice

    // Volume varies throughout the day
    currentVolume = Math.floor(Math.random() * 200000) + 100000

    data.push({
      timestamp: time.toISOString(),
      date: time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      price: Number(currentPrice.toFixed(2)),
      volume: currentVolume,
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      open: Number(open.toFixed(2)),
      close: Number(currentPrice.toFixed(2)),
    })
  }

  return data
}

// Generate historical data for longer time periods
export const generateHistoricalData = (symbol: string, basePrice: number, days: number): ChartDataPoint[] => {
  const data: ChartDataPoint[] = []
  const now = new Date()

  let currentPrice = basePrice * 0.9 // Start 10% lower to show growth

  for (let i = days; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)

    // Skip weekends for stock data
    if (date.getDay() === 0 || date.getDay() === 6) continue

    // Simulate daily price movement
    const dailyChange = (Math.random() - 0.45) * 0.05 * currentPrice // Slight upward bias
    currentPrice += dailyChange

    // Ensure reasonable bounds
    currentPrice = Math.max(currentPrice, basePrice * 0.5)
    currentPrice = Math.min(currentPrice, basePrice * 1.5)

    const high = currentPrice + Math.random() * 0.03 * currentPrice
    const low = currentPrice - Math.random() * 0.03 * currentPrice
    const open = data.length > 0 ? data[data.length - 1].close : currentPrice
    const volume = Math.floor(Math.random() * 5000000) + 1000000

    data.push({
      timestamp: date.toISOString(),
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      price: Number(currentPrice.toFixed(2)),
      volume: volume,
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      open: Number(open.toFixed(2)),
      close: Number(currentPrice.toFixed(2)),
    })
  }

  return data
}

// Market sentiment data for additional charts
export interface SentimentData {
  date: string
  bullish: number
  bearish: number
  neutral: number
}

export const generateSentimentData = (): SentimentData[] => {
  const data: SentimentData[] = []
  const now = new Date()

  for (let i = 30; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)

    // Generate sentiment percentages that add up to 100
    const bullish = Math.floor(Math.random() * 40) + 30 // 30-70%
    const bearish = Math.floor(Math.random() * 30) + 10 // 10-40%
    const neutral = 100 - bullish - bearish

    data.push({
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      bullish,
      bearish,
      neutral,
    })
  }

  return data
}

// Sector performance data
export interface SectorData {
  sector: string
  performance: number
  marketCap: number
}

export const getSectorData = (): SectorData[] => [
  { sector: "Technology", performance: 2.4, marketCap: 15.2 },
  { sector: "Healthcare", performance: 1.8, marketCap: 8.7 },
  { sector: "Financial", performance: -0.5, marketCap: 12.1 },
  { sector: "Consumer", performance: 1.2, marketCap: 6.8 },
  { sector: "Energy", performance: 3.1, marketCap: 4.2 },
  { sector: "Industrial", performance: 0.8, marketCap: 5.9 },
  { sector: "Materials", performance: -1.2, marketCap: 3.4 },
  { sector: "Utilities", performance: 0.3, marketCap: 2.8 },
]
