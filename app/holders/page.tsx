"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Users, Building2, TrendingUp, TrendingDown } from "lucide-react"

interface Holder {
  organization: string
  pctHeld: number
  position: number
  value: number
}

interface HoldersData {
  institutionalHolders: Holder[]
  mutualFundHolders: Holder[]
  majorDirectHolders: Holder[]
  insiderTransactions: Array<{
    insider: string
    relation: string
    transactionType: string
    shares: number
    value: number
    date: string
  }>
  ownershipBreakdown: {
    institutionalPercent: number
    insiderPercent: number
    floatPercent: number
  }
}


export default function HoldersPage() {
  const [selectedStock, setSelectedStock] = useState<{symbol: string, name: string} | null>(null)
  const [holdersData, setHoldersData] = useState<HoldersData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [activeTab, setActiveTab] = useState<'institutional' | 'mutual' | 'insiders'>('institutional')

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value)
  }

  const formatNumber = (value: number): string => {
    if (value >= 1e12) {
      return `$${(value / 1e12).toFixed(2)}T`
    } else if (value >= 1e9) {
      return `$${(value / 1e9).toFixed(2)}B`
    } else if (value >= 1e6) {
      return `$${(value / 1e6).toFixed(2)}M`
    } else if (value >= 1e3) {
      return `$${(value / 1e3).toFixed(2)}K`
    }
    return formatCurrency(value)
  }

  const formatShares = (shares: number): string => {
    if (shares >= 1e9) {
      return `${(shares / 1e9).toFixed(2)}B`
    } else if (shares >= 1e6) {
      return `${(shares / 1e6).toFixed(2)}M`
    } else if (shares >= 1e3) {
      return `${(shares / 1e3).toFixed(2)}K`
    }
    return shares.toLocaleString()
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

  const handleSelectSearchResult = async (stock: any) => {
    setIsLoading(true)
    setSelectedStock({
      symbol: stock.symbol,
      name: stock.name
    })

    try {
      const response = await fetch(`/api/stocks/holders?symbol=${stock.symbol}`)
      if (response.ok) {
        const data = await response.json()
        setHoldersData(data)
      }
    } catch (error) {
      console.error('Error fetching holders data:', error)
    }

    setShowSearchResults(false)
    setSearchQuery('')
    setIsLoading(false)
  }

  const tabs = [
    { id: 'institutional', label: 'Institutional Holders', icon: Building2 },
    { id: 'mutual', label: 'Mutual Funds', icon: TrendingUp },
    { id: 'insiders', label: 'Insider Trading', icon: Users }
  ]

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Users className="w-8 h-8" />
            <h1 className="text-3xl font-bold text-gray-900">Shareholders & Holdings</h1>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Holdings data</span>
          </div>
        </div>

        {/* Stock Search */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Search Stock Holdings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <input
                type="text"
                placeholder="Search for stocks to view shareholder information..."
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
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
              <span className="text-gray-600">Loading holders data...</span>
            </div>
          </div>
        )}

        {/* Holdings Data Display */}
        {selectedStock && holdersData && !isLoading && (
          <>
            {/* Header */}
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {selectedStock.symbol} - {selectedStock.name}
                    </h2>
                    <p className="text-gray-600">Shareholder Information & Holdings</p>
                  </div>
                </div>

                {/* Ownership Breakdown */}
                {holdersData.ownershipBreakdown && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-900">
                        {holdersData.ownershipBreakdown.institutionalPercent?.toFixed(1) || "N/A"}%
                      </div>
                      <div className="text-sm text-blue-700">Institutional Ownership</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-900">
                        {holdersData.ownershipBreakdown.insiderPercent?.toFixed(1) || "N/A"}%
                      </div>
                      <div className="text-sm text-green-700">Insider Ownership</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-purple-900">
                        {holdersData.ownershipBreakdown.floatPercent?.toFixed(1) || "N/A"}%
                      </div>
                      <div className="text-sm text-purple-700">Public Float</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tabs */}
            <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors flex-1 justify-center ${
                    activeTab === tab.id
                      ? 'bg-white text-black shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'institutional' && (
              <Card>
                <CardHeader>
                  <CardTitle>Top Institutional Holders</CardTitle>
                </CardHeader>
                <CardContent>
                  {holdersData.institutionalHolders && holdersData.institutionalHolders.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left p-3 font-semibold text-gray-900">Institution</th>
                            <th className="text-right p-3 font-semibold text-gray-900">Shares</th>
                            <th className="text-right p-3 font-semibold text-gray-900">Value</th>
                            <th className="text-right p-3 font-semibold text-gray-900">% Held</th>
                          </tr>
                        </thead>
                        <tbody>
                          {holdersData.institutionalHolders.map((holder, index) => (
                            <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="p-3">
                                <div className="font-medium text-gray-900">{holder.organization}</div>
                              </td>
                              <td className="p-3 text-right text-gray-900">{formatShares(holder.position)}</td>
                              <td className="p-3 text-right text-gray-900">{formatNumber(holder.value)}</td>
                              <td className="p-3 text-right">
                                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                  {holder.pctHeld.toFixed(2)}%
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No institutional holders data available.
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === 'mutual' && (
              <Card>
                <CardHeader>
                  <CardTitle>Top Mutual Fund Holders</CardTitle>
                </CardHeader>
                <CardContent>
                  {holdersData.mutualFundHolders && holdersData.mutualFundHolders.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left p-3 font-semibold text-gray-900">Fund</th>
                            <th className="text-right p-3 font-semibold text-gray-900">Shares</th>
                            <th className="text-right p-3 font-semibold text-gray-900">Value</th>
                            <th className="text-right p-3 font-semibold text-gray-900">% Held</th>
                          </tr>
                        </thead>
                        <tbody>
                          {holdersData.mutualFundHolders.map((holder, index) => (
                            <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="p-3">
                                <div className="font-medium text-gray-900">{holder.organization}</div>
                              </td>
                              <td className="p-3 text-right text-gray-900">{formatShares(holder.position)}</td>
                              <td className="p-3 text-right text-gray-900">{formatNumber(holder.value)}</td>
                              <td className="p-3 text-right">
                                <Badge variant="secondary" className="bg-green-100 text-green-800">
                                  {holder.pctHeld.toFixed(2)}%
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No mutual fund holders data available.
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === 'insiders' && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Insider Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  {holdersData.insiderTransactions && holdersData.insiderTransactions.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left p-3 font-semibold text-gray-900">Insider</th>
                            <th className="text-left p-3 font-semibold text-gray-900">Relation</th>
                            <th className="text-left p-3 font-semibold text-gray-900">Transaction</th>
                            <th className="text-right p-3 font-semibold text-gray-900">Shares</th>
                            <th className="text-right p-3 font-semibold text-gray-900">Value</th>
                            <th className="text-right p-3 font-semibold text-gray-900">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {holdersData.insiderTransactions.map((transaction, index) => (
                            <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="p-3">
                                <div className="font-medium text-gray-900">{transaction.insider}</div>
                              </td>
                              <td className="p-3 text-gray-600">{transaction.relation}</td>
                              <td className="p-3">
                                <Badge
                                  variant="secondary"
                                  className={
                                    transaction.transactionType.toLowerCase().includes('sale')
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-green-100 text-green-800'
                                  }
                                >
                                  {transaction.transactionType}
                                </Badge>
                              </td>
                              <td className="p-3 text-right text-gray-900">{formatShares(transaction.shares)}</td>
                              <td className="p-3 text-right text-gray-900">{formatNumber(transaction.value)}</td>
                              <td className="p-3 text-right text-gray-600">
                                {new Date(transaction.date).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No insider transaction data available.
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Empty State */}
        {!selectedStock && !isLoading && (
          <Card className="text-center py-16">
            <CardContent>
              <Users className="mx-auto mb-4 text-gray-400 w-12 h-12" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Select a stock to view shareholder information
              </h3>
              <p className="text-gray-600">
                Search for and select a stock symbol above to view detailed shareholder and holdings data.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}