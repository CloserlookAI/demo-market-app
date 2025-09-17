"use client"

import { useState, useEffect, useRef } from 'react'
import { Search, Star, StarOff, Plus, TrendingUp, TrendingDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface SearchResult {
  symbol: string
  name: string
  exchange: string
  type: string
  sector: string
  industry: string
}

interface StockQuote {
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
}

interface StockSearchProps {
  onStockSelect?: (stock: StockQuote) => void
}

export function StockSearch({ onStockSelect }: StockSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [wishlist, setWishlist] = useState<string[]>([])
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load wishlist from localStorage
  useEffect(() => {
    const savedWishlist = localStorage.getItem('stockflow-wishlist')
    if (savedWishlist) {
      setWishlist(JSON.parse(savedWishlist))
    }
  }, [])

  // Save wishlist to localStorage
  const saveWishlist = (newWishlist: string[]) => {
    setWishlist(newWishlist)
    localStorage.setItem('stockflow-wishlist', JSON.stringify(newWishlist))
  }

  // Search stocks with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim() && query.length > 0) {
        searchStocks(query)
      } else {
        setResults([])
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const searchStocks = async (searchQuery: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/stocks/search?q=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      setResults(data.results || [])
      setIsOpen(true)
    } catch (error) {
      console.error('Search failed:', error)
      setResults([])
    }
    setIsLoading(false)
  }

  const getStockQuote = async (symbol: string) => {
    try {
      const response = await fetch(`/api/stocks/quote?symbol=${symbol}`)
      const stockData: StockQuote = await response.json()
      return stockData
    } catch (error) {
      console.error('Failed to get stock quote:', error)
      return null
    }
  }

  const handleStockClick = async (result: SearchResult) => {
    const stockData = await getStockQuote(result.symbol)
    if (stockData && onStockSelect) {
      onStockSelect(stockData)
    }
    setQuery('')
    setIsOpen(false)
    setResults([])
  }

  const toggleWishlist = (symbol: string) => {
    const newWishlist = wishlist.includes(symbol)
      ? wishlist.filter(s => s !== symbol)
      : [...wishlist, symbol]
    saveWishlist(newWishlist)
  }

  const formatCurrency = (value: number) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`
    return `$${value.toFixed(2)}`
  }

  return (
    <div className="relative w-full max-w-2xl" ref={searchRef}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && setIsOpen(true)}
          placeholder="Search stocks (e.g., AAPL, Tesla, Microsoft)..."
          className="w-full pl-10 pr-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white text-gray-900 placeholder-gray-500 transition-all duration-200"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (results.length > 0 || isLoading) && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 shadow-xl border border-gray-200 bg-white max-h-96 overflow-y-auto">
          <CardContent className="p-0">
            {results.map((result, index) => (
              <div
                key={`${result.symbol}-${index}`}
                className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 group transition-colors duration-200"
                onClick={() => handleStockClick(result)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-semibold text-gray-900 group-hover:text-black">
                      {result.symbol}
                    </span>
                    <Badge variant="outline" className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 border-gray-300">
                      {result.exchange}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600 truncate mb-1">
                    {result.name}
                  </div>
                  {(result.sector || result.industry) && (
                    <div className="text-xs text-gray-500">
                      {result.sector}{result.sector && result.industry ? ' • ' : ''}{result.industry}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleWishlist(result.symbol)
                    }}
                    className="p-2 hover:bg-gray-200"
                  >
                    {wishlist.includes(result.symbol) ? (
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    ) : (
                      <StarOff className="w-4 h-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>
            ))}

            {results.length === 0 && !isLoading && query && (
              <div className="p-4 text-center text-gray-500">
                No stocks found for "{query}"
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Popular Searches */}
      {!query && !isOpen && (
        <div className="mt-4">
          <div className="text-xs text-gray-500 mb-2">Popular searches:</div>
          <div className="flex flex-wrap gap-2">
            {['AAPL', 'TSLA', 'GOOGL', 'MSFT', 'NVDA', 'AMZN', 'META', 'NFLX'].map((symbol) => (
              <Button
                key={symbol}
                variant="outline"
                size="sm"
                onClick={() => setQuery(symbol)}
                className="text-xs px-3 py-1 bg-gray-50 hover:bg-gray-100 border-gray-300 text-gray-700"
              >
                {symbol}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}