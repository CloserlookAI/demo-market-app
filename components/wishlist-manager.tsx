"use client"

import { useState, useEffect } from 'react'
import { Star, Trash2, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface WishlistStock {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  marketCap: number
  dayLow: number
  dayHigh: number
  currency: string
  exchange: string
  lastUpdated: string
}

interface WishlistManagerProps {
  onStockSelect?: (stock: WishlistStock) => void
}

export function WishlistManager({ onStockSelect }: WishlistManagerProps) {
  const [wishlistSymbols, setWishlistSymbols] = useState<string[]>([])
  const [wishlistData, setWishlistData] = useState<WishlistStock[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  // Load wishlist from localStorage
  useEffect(() => {
    loadWishlist()
  }, [])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (wishlistSymbols.length > 0) {
        refreshWishlistData()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [wishlistSymbols])

  const loadWishlist = () => {
    const savedWishlist = localStorage.getItem('stockflow-wishlist')
    if (savedWishlist) {
      const symbols = JSON.parse(savedWishlist)
      setWishlistSymbols(symbols)
      if (symbols.length > 0) {
        fetchWishlistData(symbols)
      }
    }
  }

  const saveWishlist = (symbols: string[]) => {
    setWishlistSymbols(symbols)
    localStorage.setItem('stockflow-wishlist', JSON.stringify(symbols))
  }

  const fetchWishlistData = async (symbols: string[]) => {
    setIsLoading(true)
    const promises = symbols.map(async (symbol) => {
      try {
        const response = await fetch(`/api/stocks/quote?symbol=${symbol}`)
        if (response.ok) {
          return await response.json()
        }
        return null
      } catch (error) {
        console.error(`Failed to fetch data for ${symbol}:`, error)
        return null
      }
    })

    try {
      const results = await Promise.all(promises)
      const validResults = results.filter(Boolean) as WishlistStock[]
      setWishlistData(validResults)
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Error fetching wishlist data:', error)
    }
    setIsLoading(false)
  }

  const refreshWishlistData = () => {
    if (wishlistSymbols.length > 0) {
      fetchWishlistData(wishlistSymbols)
    }
  }

  const removeFromWishlist = (symbol: string) => {
    const newSymbols = wishlistSymbols.filter(s => s !== symbol)
    const newData = wishlistData.filter(s => s.symbol !== symbol)
    saveWishlist(newSymbols)
    setWishlistData(newData)
  }

  const clearWishlist = () => {
    setWishlistSymbols([])
    setWishlistData([])
    localStorage.removeItem('stockflow-wishlist')
  }

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

  if (wishlistSymbols.length === 0) {
    return (
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardContent className="p-8 text-center">
          <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Wishlist is Empty</h3>
          <p className="text-gray-600 mb-4">
            Search for stocks and add them to your wishlist to track their performance.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white border border-gray-200 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500 fill-current" />
            <CardTitle className="text-xl text-gray-900">
              My Wishlist ({wishlistData.length})
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshWishlistData}
              disabled={isLoading}
              className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {wishlistSymbols.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearWishlist}
                className="bg-white border-red-300 text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>
        </div>
        {lastRefresh && (
          <p className="text-xs text-gray-500 mt-2">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && wishlistData.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin mr-2"></div>
            <span className="text-gray-600">Loading wishlist...</span>
          </div>
        ) : (
          wishlistData.map((stock, index) => {
            const isPositive = stock.change >= 0
            const TrendIcon = isPositive ? TrendingUp : TrendingDown
            const trendColor = isPositive ? "text-green-600" : "text-red-600"
            const bgColor = isPositive ? "bg-green-50" : "bg-red-50"

            return (
              <div
                key={stock.symbol}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-200 cursor-pointer group border border-gray-200"
                onClick={() => onStockSelect?.(stock)}
              >
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">{stock.symbol[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <div className="font-semibold text-gray-900 group-hover:text-black transition-colors">
                        {stock.symbol}
                      </div>
                      <Badge variant="outline" className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 border-gray-300">
                        {stock.exchange}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 truncate mb-1">{stock.name}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>Vol: {stock.volume?.toLocaleString() || 'N/A'}</span>
                      <span>•</span>
                      <span>Cap: {formatMarketCap(stock.marketCap)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{formatCurrency(stock.price)}</div>
                    <div className={`flex items-center gap-1 justify-end px-2 py-1 rounded ${bgColor}`}>
                      <TrendIcon className="w-3 h-3" />
                      <span className={`text-sm font-medium ${trendColor}`}>
                        {stock.changePercent > 0 ? "+" : ""}
                        {stock.changePercent.toFixed(2)}%
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {stock.dayLow.toFixed(2)} - {stock.dayHigh.toFixed(2)}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFromWishlist(stock.symbol)
                    }}
                    className="p-2 hover:bg-red-50 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}