"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Building2, ExternalLink } from "lucide-react"

interface CompanyProfile {
  // Basic Information
  symbol: string
  name: string
  longName?: string
  sector?: string
  industry?: string
  fullTimeEmployees?: number

  // Location Details
  city?: string
  state?: string
  country?: string
  address1?: string
  zip?: string
  phone?: string
  website?: string

  // Business Information
  businessSummary?: string

  // Financial Metrics
  marketCap?: number
  price?: number
  change?: number
  changePercent?: number
  previousClose?: number
  open?: number
  dayLow?: number
  dayHigh?: number
  volume?: number
  averageVolume?: number

  // Valuation Metrics
  beta?: number
  peRatio?: number
  forwardPE?: number
  pegRatio?: number
  priceToBook?: number
  enterpriseValue?: number
  enterpriseToRevenue?: number
  enterpriseToEbitda?: number

  // Dividend Information
  dividendYield?: number
  dividendRate?: number
  exDividendDate?: string
  payoutRatio?: number

  // Price Ranges
  high52Week?: number
  low52Week?: number
  fiftyDayAverage?: number
  twoHundredDayAverage?: number

  // Financial Health
  totalCash?: number
  totalCashPerShare?: number
  totalDebt?: number
  debtToEquity?: number
  revenuePerShare?: number
  returnOnAssets?: number
  returnOnEquity?: number
  grossProfits?: number
  freeCashflow?: number
  operatingCashflow?: number

  // Revenue and Growth
  totalRevenue?: number
  revenueGrowth?: number
  earningsGrowth?: number
  earningsQuarterlyGrowth?: number

  // Profitability
  profitMargins?: number
  grossMargins?: number
  operatingMargins?: number
  ebitdaMargins?: number

  // Share Information
  sharesOutstanding?: number
  floatShares?: number
  sharesShort?: number
  sharesShortPriorMonth?: number
  shortRatio?: number
  shortPercentOfFloat?: number

  // Exchange Information
  exchange?: string
  exchangeTimezoneName?: string
  exchangeTimezoneShortName?: string
  currency?: string
  quoteType?: string

  // Analyst Recommendations
  recommendationMean?: number
  recommendationKey?: string
  numberOfAnalystOpinions?: number
  targetHighPrice?: number
  targetLowPrice?: number
  targetMeanPrice?: number
  targetMedianPrice?: number

  // ESG Scores
  esgPopulated?: boolean
  sustainabilityFlag?: boolean

  // Additional Fields
  bookValue?: number
  postMarketChangePercent?: number
  postMarketChange?: number
  postMarketPrice?: number

  // Technical Indicators
  trendIndicator?: string
  momentumIndicator?: string
}


export default function ProfilePage() {
  const [profile, setProfile] = useState<CompanyProfile | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)

  const formatNumber = (value: number | undefined): string => {
    if (value === undefined || value === null) return "N/A"
    if (value >= 1e12) {
      return `$${(value / 1e12).toFixed(2)}T`
    } else if (value >= 1e9) {
      return `$${(value / 1e9).toFixed(2)}B`
    } else if (value >= 1e6) {
      return `$${(value / 1e6).toFixed(2)}M`
    } else if (value >= 1e3) {
      return `$${(value / 1e3).toFixed(2)}K`
    }
    return value.toLocaleString()
  }

  const formatCurrency = (value: number | undefined): string => {
    if (value === undefined || value === null) return "N/A"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value)
  }

  const formatPercent = (value: number | undefined): string => {
    if (value === undefined || value === null) return "N/A"
    return `${(value * 100).toFixed(2)}%`
  }

  const formatLargeNumber = (value: number | undefined): string => {
    if (value === undefined || value === null) return "N/A"
    if (value >= 1e12) {
      return `${(value / 1e12).toFixed(2)}T`
    } else if (value >= 1e9) {
      return `${(value / 1e9).toFixed(2)}B`
    } else if (value >= 1e6) {
      return `${(value / 1e6).toFixed(2)}M`
    } else if (value >= 1e3) {
      return `${(value / 1e3).toFixed(2)}K`
    }
    return value.toLocaleString()
  }

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return "N/A"
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return dateString
    }
  }

  const formatRatio = (value: number | undefined): string => {
    if (value === undefined || value === null) return "N/A"
    return value.toFixed(2)
  }

  const getRecommendationText = (key: string | undefined): string => {
    if (!key) return "N/A"
    const recommendations: { [key: string]: string } = {
      'strongBuy': 'Strong Buy',
      'buy': 'Buy',
      'hold': 'Hold',
      'sell': 'Sell',
      'strongSell': 'Strong Sell'
    }
    return recommendations[key] || key
  }

  const getTrendIndicator = (indicator: string | undefined): { text: string, color: string } => {
    if (!indicator) return { text: "N/A", color: "text-black" }
    return indicator === 'bullish'
      ? { text: "Bullish", color: "text-black" }
      : { text: "Bearish", color: "text-black" }
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
    try {
      const response = await fetch(`/api/stocks/profile?symbol=${stock.symbol}`)
      if (response.ok) {
        const profileData = await response.json()
        setProfile(profileData)
      }
    } catch (error) {
      console.error('Error fetching company profile:', error)
    }
    setShowSearchResults(false)
    setSearchQuery('')
    setIsLoading(false)
  }

  const handleWebsiteClick = (url: string) => {
    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url
    }
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Building2 className="w-8 h-8" />
            <h1 className="text-3xl font-bold text-gray-900">Company Profile</h1>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Real-time data</span>
          </div>
        </div>

        {/* Stock Search */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Search Company Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <input
                type="text"
                placeholder="Search for companies to view their profile..."
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
              <span className="text-gray-600">Loading company profile...</span>
            </div>
          </div>
        )}

        {/* Comprehensive Profile Display */}
        {profile && !isLoading && (
          <div className="space-y-8">
            {/* Company Header */}
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 text-white p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-6">
                      <div className="w-20 h-20 bg-white/20 rounded-xl flex items-center justify-center border border-white/30">
                        <span className="text-white font-bold text-3xl">{profile.symbol[0]}</span>
                      </div>
                      <div>
                        <h1 className="text-3xl font-bold mb-2">
                          {profile.longName || profile.name}
                        </h1>
                        <div className="flex items-center space-x-3 mb-3">
                          <Badge className="bg-blue-500/20 text-blue-200 border-blue-400">
                            {profile.symbol}
                          </Badge>
                          {profile.exchange && (
                            <Badge className="bg-purple-500/20 text-purple-200 border-purple-400">
                              {profile.exchange}
                            </Badge>
                          )}
                          {profile.quoteType && (
                            <Badge className="bg-green-500/20 text-green-200 border-green-400">
                              {profile.quoteType}
                            </Badge>
                          )}
                        </div>
                        <div className="text-blue-200 text-sm">
                          {profile.sector && profile.industry && (
                            <span>{profile.sector} • {profile.industry}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Current Price */}
                    {profile.price && (
                      <div className="text-right">
                        <div className="text-3xl font-bold text-white mb-1">
                          {formatCurrency(profile.price)}
                        </div>
                        {profile.change && profile.changePercent && (
                          <div className={`text-lg font-semibold flex items-center justify-end space-x-2 ${
                            profile.changePercent >= 0 ? 'text-green-300' : 'text-red-300'
                          }`}>
                            <span>{profile.changePercent >= 0 ? '📈' : '📉'}</span>
                            <span>
                              {profile.change > 0 ? '+' : ''}{formatCurrency(profile.change)}
                              ({profile.changePercent > 0 ? '+' : ''}{profile.changePercent.toFixed(2)}%)
                            </span>
                          </div>
                        )}
                        <div className="text-white/70 text-sm mt-2">
                          Previous Close: {formatCurrency(profile.previousClose)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Company Details Bar */}
                <div className="bg-gray-50 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                    {(profile.address1 || profile.city || profile.state || profile.country) && (
                      <div className="flex items-center space-x-2">
                        <span className="text-blue-500">📍</span>
                        <span>
                          {[profile.address1, profile.city, profile.state, profile.country].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    )}
                    {profile.fullTimeEmployees && (
                      <div className="flex items-center space-x-2">
                        <span className="text-green-500">👥</span>
                        <span>{profile.fullTimeEmployees.toLocaleString()} employees</span>
                      </div>
                    )}
                    {profile.website && (
                      <button
                        onClick={() => handleWebsiteClick(profile.website!)}
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <span>🌐</span>
                        <span>Visit Website</span>
                      </button>
                    )}
                    {profile.phone && (
                      <div className="flex items-center space-x-2">
                        <span className="text-purple-500">📞</span>
                        <span>{profile.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Key Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {profile.marketCap && (
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-gray-900">
                          {formatNumber(profile.marketCap)}
                        </div>
                        <div className="text-sm text-gray-600">Market Capitalization</div>
                      </div>
                      <span className="text-2xl">💰</span>
                    </div>
                  </CardContent>
                </Card>
              )}
              {profile.totalRevenue && (
                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-gray-900">
                          {formatNumber(profile.totalRevenue)}
                        </div>
                        <div className="text-sm text-gray-600">Total Revenue</div>
                      </div>
                      <span className="text-2xl">📊</span>
                    </div>
                  </CardContent>
                </Card>
              )}
              {profile.grossProfits && (
                <Card className="border-l-4 border-l-emerald-500">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-gray-900">
                          {formatNumber(profile.grossProfits)}
                        </div>
                        <div className="text-sm text-gray-600">Gross Profits</div>
                      </div>
                      <span className="text-2xl">💵</span>
                    </div>
                  </CardContent>
                </Card>
              )}
              {profile.freeCashflow && (
                <Card className="border-l-4 border-l-purple-500">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-gray-900">
                          {formatNumber(profile.freeCashflow)}
                        </div>
                        <div className="text-sm text-gray-600">Free Cash Flow</div>
                      </div>
                      <span className="text-2xl">💸</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Comprehensive Metrics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* Valuation Metrics */}
              <Card>
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                  <CardTitle className="text-lg text-blue-800 flex items-center">
                    <span className="mr-2">📈</span>
                    Valuation Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {profile.peRatio && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">P/E Ratio (TTM)</span>
                        <span className="font-semibold">{formatRatio(profile.peRatio)}</span>
                      </div>
                    )}
                    {profile.forwardPE && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Forward P/E</span>
                        <span className="font-semibold">{formatRatio(profile.forwardPE)}</span>
                      </div>
                    )}
                    {profile.pegRatio && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">PEG Ratio</span>
                        <span className="font-semibold">{formatRatio(profile.pegRatio)}</span>
                      </div>
                    )}
                    {profile.priceToBook && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Price-to-Book</span>
                        <span className="font-semibold">{formatRatio(profile.priceToBook)}</span>
                      </div>
                    )}
                    {profile.enterpriseValue && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Enterprise Value</span>
                        <span className="font-semibold">{formatLargeNumber(profile.enterpriseValue)}</span>
                      </div>
                    )}
                    {profile.enterpriseToRevenue && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">EV/Revenue</span>
                        <span className="font-semibold">{formatRatio(profile.enterpriseToRevenue)}</span>
                      </div>
                    )}
                    {profile.enterpriseToEbitda && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">EV/EBITDA</span>
                        <span className="font-semibold">{formatRatio(profile.enterpriseToEbitda)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Financial Health */}
              <Card>
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                  <CardTitle className="text-lg text-green-800 flex items-center">
                    <span className="mr-2">💚</span>
                    Financial Health
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {profile.totalCash && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Cash</span>
                        <span className="font-semibold text-green-600">{formatLargeNumber(profile.totalCash)}</span>
                      </div>
                    )}
                    {profile.totalDebt && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Debt</span>
                        <span className="font-semibold text-red-600">{formatLargeNumber(profile.totalDebt)}</span>
                      </div>
                    )}
                    {profile.debtToEquity && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Debt-to-Equity</span>
                        <span className="font-semibold">{formatRatio(profile.debtToEquity)}</span>
                      </div>
                    )}
                    {profile.returnOnAssets && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Return on Assets</span>
                        <span className="font-semibold">{formatPercent(profile.returnOnAssets)}</span>
                      </div>
                    )}
                    {profile.returnOnEquity && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Return on Equity</span>
                        <span className="font-semibold">{formatPercent(profile.returnOnEquity)}</span>
                      </div>
                    )}
                    {profile.operatingCashflow && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Operating Cash Flow</span>
                        <span className="font-semibold">{formatLargeNumber(profile.operatingCashflow)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Profitability & Growth */}
              <Card>
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
                  <CardTitle className="text-lg text-purple-800 flex items-center">
                    <span className="mr-2">📊</span>
                    Profitability & Growth
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {profile.profitMargins && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Profit Margins</span>
                        <span className="font-semibold">{formatPercent(profile.profitMargins)}</span>
                      </div>
                    )}
                    {profile.grossMargins && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Gross Margins</span>
                        <span className="font-semibold">{formatPercent(profile.grossMargins)}</span>
                      </div>
                    )}
                    {profile.operatingMargins && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Operating Margins</span>
                        <span className="font-semibold">{formatPercent(profile.operatingMargins)}</span>
                      </div>
                    )}
                    {profile.revenueGrowth && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Revenue Growth</span>
                        <span className={`font-semibold ${profile.revenueGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercent(profile.revenueGrowth)}
                        </span>
                      </div>
                    )}
                    {profile.earningsGrowth && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Earnings Growth</span>
                        <span className={`font-semibold ${profile.earningsGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercent(profile.earningsGrowth)}
                        </span>
                      </div>
                    )}
                    {profile.earningsQuarterlyGrowth && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Quarterly Earnings Growth</span>
                        <span className={`font-semibold ${profile.earningsQuarterlyGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercent(profile.earningsQuarterlyGrowth)}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Additional Sections Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* Dividend & Share Information */}
              <Card>
                <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b">
                  <CardTitle className="text-lg text-orange-800 flex items-center">
                    <span className="mr-2">💎</span>
                    Dividend & Share Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {profile.dividendYield && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Dividend Yield</span>
                        <span className="font-semibold text-green-600">{formatPercent(profile.dividendYield)}</span>
                      </div>
                    )}
                    {profile.dividendRate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Dividend Rate</span>
                        <span className="font-semibold">{formatCurrency(profile.dividendRate)}</span>
                      </div>
                    )}
                    {profile.exDividendDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ex-Dividend Date</span>
                        <span className="font-semibold">{formatDate(profile.exDividendDate)}</span>
                      </div>
                    )}
                    {profile.payoutRatio && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payout Ratio</span>
                        <span className="font-semibold">{formatPercent(profile.payoutRatio)}</span>
                      </div>
                    )}
                    {profile.sharesOutstanding && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Shares Outstanding</span>
                        <span className="font-semibold">{formatLargeNumber(profile.sharesOutstanding)}</span>
                      </div>
                    )}
                    {profile.floatShares && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Float Shares</span>
                        <span className="font-semibold">{formatLargeNumber(profile.floatShares)}</span>
                      </div>
                    )}
                    {profile.sharesShort && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Shares Short</span>
                        <span className="font-semibold text-orange-600">{formatLargeNumber(profile.sharesShort)}</span>
                      </div>
                    )}
                    {profile.shortRatio && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Short Ratio</span>
                        <span className="font-semibold">{formatRatio(profile.shortRatio)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Technical & Analyst Data */}
              <Card>
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b">
                  <CardTitle className="text-lg text-indigo-800 flex items-center">
                    <span className="mr-2">🎯</span>
                    Technical & Analyst Data
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {profile.beta && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Beta (Volatility)</span>
                        <span className={`font-semibold ${profile.beta > 1 ? 'text-red-600' : profile.beta < 1 ? 'text-green-600' : 'text-gray-600'}`}>
                          {formatRatio(profile.beta)}
                        </span>
                      </div>
                    )}
                    {profile.fiftyDayAverage && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">50-Day Average</span>
                        <span className="font-semibold">{formatCurrency(profile.fiftyDayAverage)}</span>
                      </div>
                    )}
                    {profile.twoHundredDayAverage && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">200-Day Average</span>
                        <span className="font-semibold">{formatCurrency(profile.twoHundredDayAverage)}</span>
                      </div>
                    )}
                    {profile.trendIndicator && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Trend Indicator</span>
                        <span className={`font-semibold ${getTrendIndicator(profile.trendIndicator).color}`}>
                          {getTrendIndicator(profile.trendIndicator).text}
                        </span>
                      </div>
                    )}
                    {profile.recommendationKey && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Analyst Rating</span>
                        <span className="font-semibold">{getRecommendationText(profile.recommendationKey)}</span>
                      </div>
                    )}
                    {profile.numberOfAnalystOpinions && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Analyst Opinions</span>
                        <span className="font-semibold">{profile.numberOfAnalystOpinions}</span>
                      </div>
                    )}
                    {profile.targetMeanPrice && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Price Target</span>
                        <span className="font-semibold text-blue-600">{formatCurrency(profile.targetMeanPrice)}</span>
                      </div>
                    )}
                    {profile.targetHighPrice && profile.targetLowPrice && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Target Range</span>
                        <span className="font-semibold text-sm">
                          {formatCurrency(profile.targetLowPrice)} - {formatCurrency(profile.targetHighPrice)}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Trading Information */}
            <Card>
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle className="text-lg text-black flex items-center">
                  <span className="mr-2 font-bold">•</span>
                  Trading Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-700">Current Session</h4>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Open</span>
                      <span className="font-semibold">{formatCurrency(profile.open)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Day High</span>
                      <span className="font-semibold text-black">{formatCurrency(profile.dayHigh)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Day Low</span>
                      <span className="font-semibold text-black">{formatCurrency(profile.dayLow)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Volume</span>
                      <span className="font-semibold">{formatLargeNumber(profile.volume)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avg Volume</span>
                      <span className="font-semibold">{formatLargeNumber(profile.averageVolume)}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-700">52-Week Range</h4>
                    <div className="flex justify-between">
                      <span className="text-gray-600">52-Week High</span>
                      <span className="font-semibold text-black">{formatCurrency(profile.high52Week)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">52-Week Low</span>
                      <span className="font-semibold text-black">{formatCurrency(profile.low52Week)}</span>
                    </div>
                    {profile.high52Week && profile.price && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">% from 52W High</span>
                        <span className="font-semibold text-black">
                          {(((profile.price - profile.high52Week) / profile.high52Week) * 100).toFixed(2)}%
                        </span>
                      </div>
                    )}
                    {profile.low52Week && profile.price && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">% from 52W Low</span>
                        <span className="font-semibold text-black">
                          {(((profile.price - profile.low52Week) / profile.low52Week) * 100).toFixed(2)}%
                        </span>
                      </div>
                    )}
                  </div>

                  {(profile.postMarketPrice || profile.postMarketChange) && (
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-700">After Hours</h4>
                      {profile.postMarketPrice && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Post-Market Price</span>
                          <span className="font-semibold">{formatCurrency(profile.postMarketPrice)}</span>
                        </div>
                      )}
                      {profile.postMarketChange && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Post-Market Change</span>
                          <span className="font-semibold text-black">
                            {profile.postMarketChange > 0 ? '+' : ''}{formatCurrency(profile.postMarketChange)}
                          </span>
                        </div>
                      )}
                      {profile.postMarketChangePercent && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Post-Market %</span>
                          <span className="font-semibold text-black">
                            {profile.postMarketChangePercent > 0 ? '+' : ''}{profile.postMarketChangePercent.toFixed(2)}%
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Business Summary */}
            {profile.businessSummary && (
              <Card>
                <CardHeader className="bg-gray-50 border-b">
                  <CardTitle className="text-lg text-black flex items-center">
                    <span className="mr-2 font-bold">•</span>
                    Business Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed text-sm">
                      {profile.businessSummary}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Empty State */}
        {!profile && !isLoading && (
          <Card className="text-center py-16">
            <CardContent>
              <Building2 className="mx-auto mb-4 text-gray-400 w-12 h-12" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Select a company to view its profile
              </h3>
              <p className="text-gray-600">
                Search for and select a company symbol above to view detailed company information and business overview.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}