"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DashboardLayout } from "@/components/dashboard-layout"
import { History, Download } from "lucide-react"

interface HistoricalData {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  adjClose?: number
}


export default function HistoricalPage() {
  const [selectedStock, setSelectedStock] = useState<{symbol: string, name: string} | null>(null)
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState('1mo')
  const [selectedInterval, setSelectedInterval] = useState('1d')

  const periods = [
    { value: '5d', label: '5 Days' },
    { value: '1mo', label: '1 Month' },
    { value: '3mo', label: '3 Months' },
    { value: '6mo', label: '6 Months' },
    { value: '1y', label: '1 Year' },
    { value: '2y', label: '2 Years' },
    { value: '5y', label: '5 Years' }
  ]

  const intervals = [
    { value: '5m', label: '5 Minutes' },
    { value: '15m', label: '15 Minutes' },
    { value: '30m', label: '30 Minutes' },
    { value: '1h', label: '1 Hour' },
    { value: '1d', label: '1 Day' },
    { value: '1wk', label: '1 Week' },
    { value: '1mo', label: '1 Month' }
  ]

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value)
  }

  const formatVolume = (value: number): string => {
    if (value >= 1e9) {
      return `${(value / 1e9).toFixed(2)}B`
    } else if (value >= 1e6) {
      return `${(value / 1e6).toFixed(2)}M`
    } else if (value >= 1e3) {
      return `${(value / 1e3).toFixed(2)}K`
    }
    return value.toLocaleString()
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: selectedInterval.includes('m') || selectedInterval.includes('h') ? "2-digit" : undefined,
      minute: selectedInterval.includes('m') ? "2-digit" : undefined
    })
  }

  useEffect(() => {
    if (selectedStock) {
      loadHistoricalData()
    }
  }, [selectedStock, selectedPeriod, selectedInterval])

  const loadHistoricalData = async () => {
    if (!selectedStock) return

    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/stocks/historical?symbol=${selectedStock.symbol}&period=${selectedPeriod}&interval=${selectedInterval}`
      )
      const data = await response.json()

      if (data.data && data.data.length > 0) {
        setHistoricalData(data.data)
      }
    } catch (error) {
      console.error('Error loading historical data:', error)
    }
    setIsLoading(false)
  }

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

  const handleSelectSearchResult = (stock: any) => {
    setSelectedStock({
      symbol: stock.symbol,
      name: stock.name
    })
    setShowSearchResults(false)
    setSearchQuery('')
  }

  const downloadCSV = () => {
    if (!historicalData.length || !selectedStock) return

    const headers = ['Date', 'Open', 'High', 'Low', 'Close', 'Volume']
    const csvContent = [
      headers.join(','),
      ...historicalData.map(row => [
        row.date,
        row.open,
        row.high,
        row.low,
        row.close,
        row.volume
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${selectedStock.symbol}_historical_data.csv`
    link.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <History className="w-8 h-8" />
            <h1 className="text-3xl font-bold text-gray-900">Historical Data</h1>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Historical market data</span>
          </div>
        </div>

        {/* Stock Search */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Select Stock & Time Period</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search for stocks to view historical data..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Search Results */}
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

            {/* Period and Interval Selection */}
            {selectedStock && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time Period</label>
                  <div className="grid grid-cols-3 gap-2">
                    {periods.map((period) => (
                      <Button
                        key={period.value}
                        onClick={() => setSelectedPeriod(period.value)}
                        variant={selectedPeriod === period.value ? "default" : "outline"}
                        size="sm"
                        className={selectedPeriod === period.value ? "bg-black text-white" : ""}
                      >
                        {period.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Interval</label>
                  <div className="grid grid-cols-3 gap-2">
                    {intervals.map((interval) => (
                      <Button
                        key={interval.value}
                        onClick={() => setSelectedInterval(interval.value)}
                        variant={selectedInterval === interval.value ? "default" : "outline"}
                        size="sm"
                        className={selectedInterval === interval.value ? "bg-black text-white" : ""}
                      >
                        {interval.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Historical Data Display */}
        {selectedStock && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {selectedStock.symbol} - {selectedStock.name} Historical Data
                </CardTitle>
                {historicalData.length > 0 && (
                  <Button onClick={downloadCSV} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download CSV
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
                    <span className="text-gray-600">Loading historical data...</span>
                  </div>
                </div>
              ) : historicalData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left p-2 font-semibold text-gray-900">Date</th>
                        <th className="text-right p-2 font-semibold text-gray-900">Open</th>
                        <th className="text-right p-2 font-semibold text-gray-900">High</th>
                        <th className="text-right p-2 font-semibold text-gray-900">Low</th>
                        <th className="text-right p-2 font-semibold text-gray-900">Close</th>
                        <th className="text-right p-2 font-semibold text-gray-900">Volume</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historicalData.map((row, index) => {
                        const isPositive = index === 0 || row.close >= historicalData[index - 1]?.close
                        return (
                          <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="p-2 text-gray-900">{formatDate(row.date)}</td>
                            <td className="p-2 text-right text-gray-900">{formatCurrency(row.open)}</td>
                            <td className="p-2 text-right text-gray-900">{formatCurrency(row.high)}</td>
                            <td className="p-2 text-right text-gray-900">{formatCurrency(row.low)}</td>
                            <td className={`p-2 text-right font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(row.close)}
                            </td>
                            <td className="p-2 text-right text-gray-600">{formatVolume(row.volume)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No historical data available for the selected period.
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!selectedStock && (
          <Card className="text-center py-16">
            <CardContent>
              <History className="mx-auto mb-4 text-gray-400 w-12 h-12" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Select a stock to view historical data
              </h3>
              <p className="text-gray-600">
                Search for and select a stock symbol above to view its historical price data.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}