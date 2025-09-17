"use client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AIChatbot } from "@/components/ai-chatbot"
import { TradingChart } from "@/components/trading-chart"
import { useState, useEffect } from "react"
import { getStockChartData } from "@/lib/chart-data"
import { useRouter } from 'next/navigation'

// Professional icon components
const TrendingUpIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
)

const TrendingDownIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17H21M21 17V9M21 17L13 9L9 13L3 7" />
  </svg>
)

const BarChartIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)

const DollarSignIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
  </svg>
)

const PieChartIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
  </svg>
)

const ActivityIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
)

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value)
}

interface Stock {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  marketCap?: number
  currency?: string
  exchange?: string
}

export default function StockMarketDashboard() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null)
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | '3M' | '1Y'>('1D')
  const [trendingStocks, setTrendingStocks] = useState<Stock[]>([])
  const [watchlistStocks, setWatchlistStocks] = useState<Stock[]>([])
  const [chartData, setChartData] = useState<any[]>([])
  const [isLoadingChart, setIsLoadingChart] = useState(false)
  const [marketIndices, setMarketIndices] = useState([
    { name: "S&P 500", symbol: "SPX", value: 0, change: 0, changePercent: 0 },
    { name: "NASDAQ", symbol: "IXIC", value: 0, change: 0, changePercent: 0 },
    { name: "DOW JONES", symbol: "DJI", value: 0, change: 0, changePercent: 0 },
  ])

  useEffect(() => {
    loadRealTimeData()
  }, [])

  const loadRealTimeData = async () => {
    setIsLoading(true)
    try {
      // Popular stocks to display as trending
      const popularSymbols = ['AAPL', 'TSLA', 'GOOGL', 'MSFT', 'NVDA', 'AMZN']

      // Fetch trending stocks
      const trendingPromises = popularSymbols.map(async (symbol) => {
        try {
          const response = await fetch(`/api/stocks/quote?symbol=${symbol}`)
          if (response.ok) {
            return await response.json()
          }
          return null
        } catch (error) {
          console.error(`Failed to fetch ${symbol}:`, error)
          return null
        }
      })

      const trendingResults = await Promise.all(trendingPromises)
      const validTrendingStocks = trendingResults.filter(Boolean) as Stock[]
      setTrendingStocks(validTrendingStocks)

      // Load watchlist from localStorage
      const savedWishlist = localStorage.getItem('stockflow-wishlist')
      if (savedWishlist) {
        const watchlistSymbols = JSON.parse(savedWishlist)
        const watchlistPromises = watchlistSymbols.slice(0, 4).map(async (symbol: string) => {
          try {
            const response = await fetch(`/api/stocks/quote?symbol=${symbol}`)
            if (response.ok) {
              return await response.json()
            }
            return null
          } catch (error) {
            console.error(`Failed to fetch ${symbol}:`, error)
            return null
          }
        })

        const watchlistResults = await Promise.all(watchlistPromises)
        const validWatchlistStocks = watchlistResults.filter(Boolean) as Stock[]
        setWatchlistStocks(validWatchlistStocks)
      }

      // Fetch market indices
      const indexSymbols = ['^GSPC', '^IXIC', '^DJI'] // S&P 500, NASDAQ, Dow Jones
      const indexNames = ['S&P 500', 'NASDAQ', 'DOW JONES']

      const indexPromises = indexSymbols.map(async (symbol, index) => {
        try {
          const response = await fetch(`/api/stocks/quote?symbol=${symbol}`)
          if (response.ok) {
            const data = await response.json()
            return {
              name: indexNames[index],
              symbol: data.symbol,
              value: data.price || 0,
              change: data.change || 0,
              changePercent: data.changePercent || 0
            }
          }
          return {
            name: indexNames[index],
            symbol: symbol,
            value: 0,
            change: 0,
            changePercent: 0
          }
        } catch (error) {
          console.error(`Failed to fetch ${symbol}:`, error)
          return {
            name: indexNames[index],
            symbol: symbol,
            value: 0,
            change: 0,
            changePercent: 0
          }
        }
      })

      const indexResults = await Promise.all(indexPromises)
      setMarketIndices(indexResults)

    } catch (error) {
      console.error('Error loading real-time data:', error)
    }
    setIsLoading(false)
  }

  // Load chart data when stock or timeframe changes
  useEffect(() => {
    const mainStock = selectedStock || trendingStocks[0]
    if (mainStock) {
      loadChartData(mainStock.symbol, timeframe)
    }
  }, [selectedStock, timeframe, trendingStocks])

  const loadChartData = async (symbol: string, period: string) => {
    setIsLoadingChart(true)
    try {
      // Map timeframes to API parameters
      const periodMap: { [key: string]: { period: string, interval: string } } = {
        '1D': { period: '1d', interval: '5m' },
        '1W': { period: '5d', interval: '1h' },
        '1M': { period: '1mo', interval: '1d' },
        '3M': { period: '3mo', interval: '1d' },
        '1Y': { period: '1y', interval: '1wk' }
      }

      const params = periodMap[period] || periodMap['1D']
      const response = await fetch(`/api/stocks/historical?symbol=${symbol}&period=${params.period}&interval=${params.interval}`)

      if (response.ok) {
        const data = await response.json()
        if (data.data && data.data.length > 0) {
          setChartData(data.data)
        } else {
          // Fallback to mock data if no real data available
          const mainStock = selectedStock || trendingStocks[0]
          if (mainStock) {
            setChartData(getStockChartData(mainStock.symbol, mainStock.price, timeframe))
          }
        }
      } else {
        // Fallback to mock data
        const mainStock = selectedStock || trendingStocks[0]
        if (mainStock) {
          setChartData(getStockChartData(mainStock.symbol, mainStock.price, timeframe))
        }
      }
    } catch (error) {
      console.error('Failed to load chart data:', error)
      // Fallback to mock data
      const mainStock = selectedStock || trendingStocks[0]
      if (mainStock) {
        setChartData(getStockChartData(mainStock.symbol, mainStock.price, timeframe))
      }
    }
    setIsLoadingChart(false)
  }

  // Default to first trending stock for the main chart
  const mainStock = selectedStock || trendingStocks[0]

  const handleStockClick = (stock: Stock) => {
    setSelectedStock(stock)
  }

  const handleTimeframeChange = (newTimeframe: '1D' | '1W' | '1M' | '3M' | '1Y') => {
    setTimeframe(newTimeframe)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-6 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded-lg mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-64 bg-gray-200 rounded-lg"></div>
              <div className="h-64 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/95 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">StockFlow</h1>
                <p className="text-sm text-gray-600">Professional Trading Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className="bg-green-100 text-green-800 border-green-200 font-medium">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Market Open
              </Badge>
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Market Overview */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Market Overview</h2>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live updates</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {marketIndices.map((index, i) => {
              const isPositive = index.change >= 0
              const TrendIcon = isPositive ? TrendingUpIcon : TrendingDownIcon
              const trendColor = isPositive ? "text-green-600" : "text-red-600"
              const bgColor = isPositive ? "bg-green-50" : "bg-red-50"

              return (
                <Card key={i} className="card-hover bg-white border border-gray-200 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">{index.name}</CardTitle>
                    <BarChartIcon />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900 mb-2">{index.value.toLocaleString()}</div>
                    <div className={`flex items-center gap-2 text-sm px-2 py-1 rounded ${bgColor}`}>
                      <TrendIcon />
                      <span className={`font-medium ${trendColor}`}>
                        {index.changePercent > 0 ? "+" : ""}
                        {index.changePercent.toFixed(1)}%
                      </span>
                      <span className="text-gray-600">
                        ({index.change > 0 ? "+" : ""}
                        {index.change.toFixed(2)})
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            {/* Portfolio Value Card */}
            <Card className="card-hover bg-white border border-gray-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Portfolio Value</CardTitle>
                <DollarSignIcon />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 mb-2">{formatCurrency(127456.78)}</div>
                <div className="flex items-center gap-2 text-sm px-2 py-1 rounded bg-green-50">
                  <TrendingUpIcon />
                  <span className="font-medium text-green-600">+2.1%</span>
                  <span className="text-gray-600">(+{formatCurrency(2634.12)})</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Interactive Trading Chart */}
        <section className="mb-12">
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              {mainStock ? (
                <>
                  {isLoadingChart ? (
                    <div className="h-96 flex items-center justify-center">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
                        <span className="text-gray-600">Loading chart data...</span>
                      </div>
                    </div>
                  ) : (
                    <TradingChart
                      symbol={`${mainStock.symbol} - ${mainStock.name}`}
                      data={chartData}
                      currentPrice={mainStock.price}
                      change={mainStock.change}
                      changePercent={mainStock.changePercent}
                    />
                  )}
                </>
              ) : (
                <div className="h-96 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-gray-600 mb-4">Loading stock data...</p>
                    <div className="w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin mx-auto"></div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Trending Stocks */}
          <div className="lg:col-span-2">
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl text-gray-900">Trending Stocks</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/search')}
                    className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {trendingStocks.map((stock, i) => {
                  const isPositive = stock.change >= 0
                  const TrendIcon = isPositive ? TrendingUpIcon : TrendingDownIcon
                  const trendColor = isPositive ? "text-green-600" : "text-red-600"
                  const bgColor = isPositive ? "bg-green-50" : "bg-red-50"
                  const isSelected = selectedStock?.symbol === stock.symbol

                  return (
                    <div
                      key={i}
                      onClick={() => handleStockClick(stock)}
                      className={`flex items-center justify-between p-4 rounded-lg hover:bg-gray-100 transition-all duration-200 cursor-pointer group border ${
                        isSelected ? 'border-black bg-gray-50' : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isSelected ? 'bg-black' : 'bg-black'
                        }`}>
                          <span className="text-white font-bold text-sm">{stock.symbol[0]}</span>
                        </div>
                        <div>
                          <div className={`font-semibold transition-colors ${
                            isSelected ? 'text-black' : 'text-gray-900 group-hover:text-black'
                          }`}>
                            {stock.symbol}
                          </div>
                          <div className="text-sm text-gray-600">{stock.name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">{formatCurrency(stock.price)}</div>
                        <div className={`flex items-center gap-1 justify-end px-2 py-1 rounded ${bgColor}`}>
                          <TrendIcon />
                          <span className={`text-sm font-medium ${trendColor}`}>
                            {stock.changePercent > 0 ? "+" : ""}
                            {stock.changePercent.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>

          {/* Watchlist */}
          <div className="lg:col-span-1">
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
                    <PieChartIcon />
                    Watchlist
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/search')}
                    className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    + Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {watchlistStocks.length > 0 ? (
                  watchlistStocks.map((stock, i) => {
                    const isPositive = stock.changePercent >= 0
                    const trendColor = isPositive ? "text-green-600" : "text-red-600"
                    const isSelected = selectedStock?.symbol === stock.symbol

                    return (
                      <div
                        key={i}
                        onClick={() => handleStockClick(stock)}
                        className={`flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 transition-all duration-200 cursor-pointer border ${
                          isSelected ? 'border-black bg-gray-50' : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <span className="font-semibold text-gray-900">{stock.symbol}</span>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">{formatCurrency(stock.price)}</div>
                          <div className={`text-xs font-medium ${trendColor}`}>
                            {stock.changePercent > 0 ? "+" : ""}{stock.changePercent.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-8">
                    <PieChartIcon />
                    <p className="text-gray-600 mt-2 mb-4">No stocks in watchlist</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push('/search')}
                      className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Add Stocks
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <section className="mb-8">
          <h2 className="text-3xl font-bold mb-8 text-gray-900">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                icon: TrendingUpIcon,
                title: "Buy Stocks",
                description: "Execute trades with live market data",
              },
              {
                icon: BarChartIcon,
                title: "Market Analysis",
                description: "Deep dive into trends and patterns",
              },
              {
                icon: PieChartIcon,
                title: "Portfolio Review",
                description: "Track performance and allocation",
              },
              {
                icon: ActivityIcon,
                title: "AI Assistant",
                description: "Get personalized trading insights",
              },
            ].map((action, index) => (
              <Card
                key={action.title}
                className="card-hover bg-white border border-gray-200 shadow-sm cursor-pointer group"
              >
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-black group-hover:text-white transition-all duration-300">
                    <action.icon />
                  </div>
                  <h3 className="font-semibold mb-2 text-gray-900 group-hover:text-black transition-colors duration-300">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Status */}
        <div className="text-center">
          <Badge className="bg-gray-100 text-gray-900 border-gray-200 font-medium px-4 py-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
            Real-time market data • AI assistant ready • Professional trading tools
          </Badge>
        </div>
      </main>

      {/* AI Chatbot */}
      <AIChatbot />
    </div>
  )
}