"use client"

import { useState } from 'react'
import { StockSearch } from '@/components/stock-search'
import { WishlistManager } from '@/components/wishlist-manager'
import TradingViewWidget from '@/components/tradingview-widget'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Search, Star } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface StockData {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  marketCap: number
  dayLow: number
  dayHigh: number
  fiftyTwoWeekLow: number
  fiftyTwoWeekHigh: number
  currency: string
  exchange: string
  lastUpdated: string
}

export default function SearchPage() {
  const router = useRouter()
  const [selectedStock, setSelectedStock] = useState<StockData | null>(null)
  const [chartData, setChartData] = useState<any[]>([])
  const [isLoadingChart, setIsLoadingChart] = useState(false)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value)
  }

  const formatMarketCap = (value: number) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`
    return formatCurrency(value)
  }

  const handleStockSelect = async (stock: StockData) => {
    setSelectedStock(stock)
    setIsLoadingChart(true)

    try {
      // Fetch historical data for the selected stock
      const response = await fetch(`/api/stocks/historical?symbol=${stock.symbol}&period=1d&interval=5m`)
      const data = await response.json()
      if (data.data) {
        setChartData(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch chart data:', error)
    } finally {
      setIsLoadingChart(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/95 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/')}
                className="hover:bg-gray-100"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <Search className="w-5 h-5 text-gray-600" />
                <h1 className="text-xl font-bold text-gray-900">Stock Search & Watchlist</h1>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-800 border-green-200 font-medium">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              Market Open
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Search Section */}
        <section className="mb-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Find Your Next Investment</h2>
            <p className="text-gray-600">Search thousands of stocks and build your watchlist</p>
          </div>

          <div className="flex justify-center">
            <StockSearch onStockSelect={handleStockSelect} />
          </div>
        </section>

        {/* Selected Stock Details */}
        {selectedStock && (
          <section className="mb-8">
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardContent className="p-6">
                {/* Stock Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-bold text-gray-900">{selectedStock.symbol}</h3>
                      <Badge variant="outline" className="px-3 py-1 bg-gray-100 text-gray-600 border-gray-300">
                        {selectedStock.exchange}
                      </Badge>
                    </div>
                    <p className="text-gray-600 mb-2">{selectedStock.name}</p>
                    <div className="flex items-center gap-4">
                      <span className="text-3xl font-bold text-gray-900">
                        {formatCurrency(selectedStock.price)}
                      </span>
                      <div className={`flex items-center px-3 py-1 rounded text-sm font-medium ${
                        selectedStock.change >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        <span className="mr-1">
                          {selectedStock.change >= 0 ? '+' : ''}{selectedStock.change.toFixed(2)}
                        </span>
                        <span>
                          ({selectedStock.changePercent >= 0 ? '+' : ''}{selectedStock.changePercent.toFixed(2)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stock Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Market Cap</p>
                    <p className="font-semibold text-gray-900">{formatMarketCap(selectedStock.marketCap)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Volume</p>
                    <p className="font-semibold text-gray-900">{selectedStock.volume?.toLocaleString() || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Day Range</p>
                    <p className="font-semibold text-gray-900">
                      {selectedStock.dayLow.toFixed(2)} - {selectedStock.dayHigh.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">52W Range</p>
                    <p className="font-semibold text-gray-900">
                      {selectedStock.fiftyTwoWeekLow.toFixed(2)} - {selectedStock.fiftyTwoWeekHigh.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Chart */}
                {isLoadingChart ? (
                  <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
                      <span className="text-gray-600">Loading chart...</span>
                    </div>
                  </div>
                ) : chartData.length > 0 ? (
                  <TradingViewWidget
                    symbol={selectedStock.symbol}
                    currentPrice={selectedStock.price}
                    change={selectedStock.change}
                    changePercent={selectedStock.changePercent}
                    height={400}
                    theme="light"
                    widgetType="symbol-overview"
                    showDateRanges={true}
                    showMarketStatus={true}
                    showSymbolLogo={true}
                  />
                ) : (
                  <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200">
                    <div className="text-center">
                      <p className="text-gray-600 mb-2">Chart data not available</p>
                      <p className="text-sm text-gray-500">Historical data may be limited for this stock</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        )}

        {/* Wishlist Section */}
        <section>
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-6 h-6 text-yellow-500 fill-current" />
              <h2 className="text-2xl font-bold text-gray-900">Your Watchlist</h2>
            </div>
            <p className="text-gray-600">Track your favorite stocks and monitor their performance</p>
          </div>

          <WishlistManager onStockSelect={handleStockSelect} />
        </section>
      </main>
    </div>
  )
}