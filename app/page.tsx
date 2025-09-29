"use client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import TradingViewWidget from "@/components/tradingview-widget"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useState, useEffect } from "react"
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
  const [trendingStocks, setTrendingStocks] = useState<Stock[]>([])
  const [watchlistStocks, setWatchlistStocks] = useState<Stock[]>([])
  const [marketIndices, setMarketIndices] = useState([
    { name: "S&P 500", symbol: "SPX", value: 0, change: 0, changePercent: 0 },
    { name: "NASDAQ", symbol: "IXIC", value: 0, change: 0, changePercent: 0 },
    { name: "DOW JONES", symbol: "DJI", value: 0, change: 0, changePercent: 0 },
  ])

  // Search functionality
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)

  useEffect(() => {
    loadRealTimeData()

    // Set up quiet background refresh every 60 seconds (longer interval, less intrusive)
    const interval = setInterval(() => {
      // Refresh data quietly in background without showing loading state
      loadRealTimeData(false) // false = don't show loader
    }, 60000) // 60 seconds - less frequent

    return () => clearInterval(interval)
  }, [])

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.search-container')) {
        setShowSearchResults(false)
      }
    }

    if (showSearchResults) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSearchResults])

  const loadRealTimeData = async (showLoader = true) => {
    // Only show loading state on initial load, not on background refreshes
    if (showLoader) {
      setIsLoading(true)
    }
    try {
      // Popular stocks to display as trending
      const popularSymbols = ['GOOGL', 'AAPL', 'TSLA', 'MSFT', 'NVDA', 'AMZN']

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
    if (showLoader) {
      setIsLoading(false)
    }
  }


  // Default to first trending stock for the main chart
  const mainStock = selectedStock || trendingStocks[0]

  const handleStockClick = (stock: Stock) => {
    setSelectedStock(stock)
  }


  // Search functions
  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)

    if (query.length < 2) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/stocks/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      setSearchResults(data.results || [])
      setShowSearchResults(true)
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectSearchResult = async (stock: any) => {
    try {
      // Get real-time quote for the selected stock
      const response = await fetch(`/api/stocks/quote?symbol=${stock.symbol}`)
      if (response.ok) {
        const quoteData = await response.json()
        const newStock: Stock = {
          symbol: stock.symbol,
          name: stock.name,
          price: quoteData.price,
          change: quoteData.change,
          changePercent: quoteData.changePercent,
          volume: quoteData.volume,
          marketCap: quoteData.marketCap,
          currency: quoteData.currency,
          exchange: quoteData.exchange
        }
        setSelectedStock(newStock)
      }
    } catch (error) {
      console.error('Error fetching stock quote:', error)
    }
    setShowSearchResults(false)
    setSearchQuery('')
  }

  const handleAddToWishlist = (stock: Stock) => {
    const isAlreadyInWishlist = watchlistStocks.some(w => w.symbol === stock.symbol)
    if (!isAlreadyInWishlist) {
      setWatchlistStocks(prev => [...prev, stock])
    }
  }

  const handleRemoveFromWishlist = (symbol: string) => {
    setWatchlistStocks(prev => prev.filter(stock => stock.symbol !== symbol))
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
    <DashboardLayout>
      <div className="p-6">
        {/* Market Overview */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Market Overview</h2>
            <div className="flex items-center space-x-4">
              {/* Search Bar */}
              <div className="relative search-container">
                <input
                  type="text"
                  placeholder="Search stocks..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-80 px-4 py-2 pl-10 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                {/* Search Results Dropdown */}
                {showSearchResults && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto z-50">
                    {isSearching ? (
                      <div className="p-4 text-center text-gray-500">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black mx-auto mb-2"></div>
                        Searching...
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="py-2">
                        {searchResults.map((result, i) => (
                          <div
                            key={i}
                            onClick={() => handleSelectSearchResult(result)}
                            className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="font-semibold text-gray-900">{result.symbol}</div>
                                <div className="text-sm text-gray-600 truncate">{result.name}</div>
                                <div className="text-xs text-gray-500">{result.exchange} • {result.type}</div>
                              </div>
                              <div className="ml-3">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-500">No results found</div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Live updates</span>
              </div>
            </div>
          </div>
          {/* Top Performing Stocks Marquee */}
          <div className="bg-black rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 mb-3">
              <TrendingUpIcon className="w-5 h-5 text-green-400" />
              <span className="text-white font-semibold text-sm">TOP PERFORMERS TODAY</span>
            </div>
            <div className="overflow-hidden">
              <div className="flex space-x-8 animate-marquee">
                {[...trendingStocks, ...trendingStocks].map((stock, i) => {
                  const isPositive = stock.changePercent >= 0
                  return (
                    <div
                      key={`${stock.symbol}-${i}`}
                      className="flex items-center space-x-3 whitespace-nowrap cursor-pointer hover:bg-gray-800 px-3 py-2 rounded-lg transition-colors"
                      onClick={() => handleStockClick(stock)}
                    >
                      <span className="text-white font-semibold text-sm">{stock.symbol}</span>
                      <span className="text-white font-bold">{formatCurrency(stock.price)}</span>
                      <div className={`flex items-center space-x-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                        {isPositive ? (
                          <TrendingUpIcon className="w-3 h-3" />
                        ) : (
                          <TrendingDownIcon className="w-3 h-3" />
                        )}
                        <span className="font-medium text-xs">
                          {stock.changePercent > 0 ? "+" : ""}{stock.changePercent.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>


        </section>

        {/* Interactive Trading Chart */}
        <section className="mb-12">
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              {mainStock ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <h3 className="text-xl font-bold text-gray-900">{mainStock.symbol} - {mainStock.name}</h3>
                    </div>
                    <Button
                      onClick={() => handleAddToWishlist(mainStock)}
                      className="bg-black hover:bg-gray-800 text-white"
                      disabled={watchlistStocks.some(w => w.symbol === mainStock.symbol)}
                    >
                      {watchlistStocks.some(w => w.symbol === mainStock.symbol) ? (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                          </svg>
                          In Wishlist
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          Add to Wishlist
                        </>
                      )}
                    </Button>
                  </div>
                  <TradingViewWidget
                    symbol={mainStock.symbol}
                    currentPrice={mainStock.price}
                    change={mainStock.change}
                    changePercent={mainStock.changePercent}
                    height={400}
                    theme="light"
                    widgetType="symbol-overview"
                    showDateRanges={true}
                    showMarketStatus={true}
                    showSymbolLogo={true}
                  />
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

        {/* Wishlist */}
        {watchlistStocks.length > 0 && (
          <section className="mb-12">
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                    My Wishlist
                  </CardTitle>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span>{watchlistStocks.length} stocks</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {watchlistStocks.map((stock, index) => (
                  <div
                    key={stock.symbol}
                    className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all duration-200 cursor-pointer"
                    onClick={() => handleStockClick(stock)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">{stock.symbol[0]}</span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{stock.symbol}</div>
                        <div className="text-sm text-gray-600 truncate">{stock.name}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="font-bold text-gray-900">{formatCurrency(stock.price)}</div>
                        <div className={`flex items-center gap-1 text-sm font-medium ${
                          stock.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {stock.changePercent >= 0 ? (
                            <TrendingUpIcon className="w-3 h-3" />
                          ) : (
                            <TrendingDownIcon className="w-3 h-3" />
                          )}
                          {stock.changePercent > 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveFromWishlist(stock.symbol)
                        }}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove from wishlist"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        )}

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

      </div>
    </DashboardLayout>
  )
}