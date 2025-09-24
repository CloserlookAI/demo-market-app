"use client"

import { useState, useEffect } from 'react'
import { Search, Star, StarOff, TrendingUp, TrendingDown, Plus, Trash2, Info, X, Building2, Calendar, Users, DollarSign, BarChart3, Activity, Bot, Globe, Clock, Target, PieChart, Zap, Shield, TrendingUpDown, Calculator, BookOpen, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { useRemoteAgent } from '@/hooks/useRemoteAgent'

interface Stock {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
}

interface DetailedStock {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  marketCap: string
  volume: string
  avgVolume: string
  peRatio: number
  eps: number
  dividend: number
  dividendYield: number
  weekHigh52: number
  weekLow52: number
  beta: number
  sector: string
  industry: string
  employees: string
  founded: string
  headquarters: string
  ceo: string
  description: string

  // Additional Financial Metrics
  pbRatio: number
  pegRatio: number
  psRatio: number
  priceToBook: number
  priceToSales: number
  enterpriseValue: string
  evToRevenue: number
  evToEbitda: number
  grossMargin: number
  operatingMargin: number
  netMargin: number
  roe: number // Return on Equity
  roa: number // Return on Assets
  debtToEquity: number
  currentRatio: number
  quickRatio: number

  // Revenue & Growth
  revenue: string
  revenueGrowthYoY: number
  revenueGrowthQoQ: number
  earningsGrowthYoY: number
  earningsGrowthQoQ: number

  // Cash Flow
  freeCashFlow: string
  operatingCashFlow: string

  // Analyst Data
  analystRating: string
  analystTargetPrice: number
  analystCount: number
  buyRatings: number
  holdRatings: number
  sellRatings: number

  // Market Performance
  dayHigh: number
  dayLow: number
  monthHigh1: number
  monthLow1: number
  monthHigh3: number
  monthLow3: number
  ytdReturn: number
  month1Return: number
  month3Return: number
  month6Return: number
  year1Return: number
  year3Return: number
  year5Return: number

  // Institutional Holdings
  institutionalOwnership: number
  insiderOwnership: number
  shortInterest: number
  shortRatio: number

  // Additional Company Info
  website: string
  exchange: string
  currency: string
  country: string
  timeZone: string
  lastEarningsDate: string
  nextEarningsDate: string
  exDividendDate: string

  // Risk Metrics
  volatility30Day: number
  volatility52Week: number
  sharpeRatio: number
  informationRatio: number
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Stock[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Stock[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedStock, setSelectedStock] = useState<DetailedStock | null>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [analysisInput, setAnalysisInput] = useState('')

  // RemoteAgent integration
  const {
    sendMessage: sendRemoteAgentMessage,
    isLoading: isAnalyzing,
    currentStatus,
    error: remoteAgentError,
  } = useRemoteAgent({
    onComplete: (response) => {
      // Analysis completed successfully
      console.log('✅ RemoteAgent analysis completed:', response)
      alert(`Analysis completed! The detailed response has been sent to your chat.`)
      setSelectedStock(null) // Close the modal
      setAnalysisInput('') // Clear the input
    },
    onError: (error) => {
      console.error('❌ RemoteAgent analysis failed:', error)
      alert(`Analysis failed: ${error}`)
    }
  })

  // Load and refresh favorites with real data
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        // Load symbols from localStorage or use defaults
        const savedFavoriteSymbols = localStorage.getItem('favoriteSymbols')
        const symbolsToLoad = savedFavoriteSymbols
          ? JSON.parse(savedFavoriteSymbols)
          : ['AAPL', 'NVDA'] // Default symbols

        // Fetch real-time data for each symbol
        const stockPromises = symbolsToLoad.map(async (symbol: string) => {
          try {
            const response = await fetch(`/api/stocks/quote?symbol=${symbol}`)
            if (response.ok) {
              const stockData = await response.json()
              return {
                symbol: stockData.symbol,
                name: stockData.name,
                price: stockData.price,
                change: stockData.change,
                changePercent: stockData.changePercent
              }
            }
            return null
          } catch (error) {
            console.error(`Failed to fetch data for ${symbol}:`, error)
            return null
          }
        })

        const stockResults = await Promise.all(stockPromises)
        const validStocks = stockResults.filter((stock): stock is Stock => stock !== null)

        setFavorites(validStocks)

        // Save the symbols for future use
        const symbols = validStocks.map(stock => stock.symbol)
        localStorage.setItem('favoriteSymbols', JSON.stringify(symbols))
      } catch (error) {
        console.error('Failed to load favorites:', error)
        // Fallback to empty array
        setFavorites([])
      }
    }

    loadFavorites()
  }, [])

  // Real-time stock search functionality

  // Get detailed stock data from API
  const getDetailedStockData = async (symbol: string): Promise<DetailedStock> => {
    try {
      const [profileResponse, quoteResponse] = await Promise.all([
        fetch(`/api/stocks/profile?symbol=${symbol}`),
        fetch(`/api/stocks/quote?symbol=${symbol}`)
      ])

      const [profileData, quoteData] = await Promise.all([
        profileResponse.json(),
        quoteResponse.json()
      ])

      // Combine data from both APIs to create comprehensive stock details
      const detailedStock: DetailedStock = {
        // Basic Information
        symbol: profileData.symbol || symbol,
        name: profileData.longName || profileData.name || symbol,
        price: quoteData.price || 0,
        change: quoteData.change || 0,
        changePercent: quoteData.changePercent || 0,

        // Market Data
        marketCap: formatLargeNumber(profileData.marketCap || 0),
        volume: formatLargeNumber(quoteData.volume || 0),
        avgVolume: formatLargeNumber(profileData.averageVolume || 0),

        // Financial Ratios
        peRatio: profileData.peRatio || profileData.trailingPE || 0,
        eps: (profileData.marketCap && profileData.sharesOutstanding)
          ? profileData.marketCap / profileData.sharesOutstanding : 0,
        dividend: profileData.dividendRate || 0,
        dividendYield: (profileData.dividendYield || 0) * 100,

        // Price Ranges
        weekHigh52: profileData.high52Week || quoteData.fiftyTwoWeekHigh || 0,
        weekLow52: profileData.low52Week || quoteData.fiftyTwoWeekLow || 0,
        dayHigh: quoteData.dayHigh || 0,
        dayLow: quoteData.dayLow || 0,

        // Company Info
        sector: profileData.sector || 'Unknown',
        industry: profileData.industry || 'Unknown',
        employees: formatLargeNumber(profileData.fullTimeEmployees || 0),
        founded: 'N/A', // Not available in Yahoo Finance
        headquarters: `${profileData.city || ''}, ${profileData.state || ''} ${profileData.country || ''}`.trim(),
        ceo: 'N/A', // Not available in Yahoo Finance
        description: profileData.businessSummary || 'No description available',
        website: profileData.website || '',

        // Advanced Financial Metrics
        pbRatio: profileData.priceToBook || 0,
        pegRatio: profileData.pegRatio || 0,
        psRatio: 0, // Calculate if revenue available
        priceToBook: profileData.priceToBook || 0,
        priceToSales: 0, // Calculate if revenue available
        enterpriseValue: formatLargeNumber(profileData.enterpriseValue || 0),
        evToRevenue: profileData.enterpriseToRevenue || 0,
        evToEbitda: profileData.enterpriseToEbitda || 0,
        grossMargin: (profileData.grossMargins || 0) * 100,
        operatingMargin: (profileData.operatingMargins || 0) * 100,
        netMargin: (profileData.profitMargins || 0) * 100,
        roe: (profileData.returnOnEquity || 0) * 100,
        roa: (profileData.returnOnAssets || 0) * 100,
        debtToEquity: profileData.debtToEquity || 0,
        currentRatio: 0, // Not available
        quickRatio: 0, // Not available

        // Revenue & Growth
        revenue: formatLargeNumber(profileData.totalRevenue || 0),
        revenueGrowthYoY: (profileData.revenueGrowth || 0) * 100,
        revenueGrowthQoQ: 0, // Not available
        earningsGrowthYoY: (profileData.earningsGrowth || 0) * 100,
        earningsGrowthQoQ: (profileData.earningsQuarterlyGrowth || 0) * 100,

        // Cash Flow
        freeCashFlow: formatLargeNumber(profileData.freeCashflow || 0),
        operatingCashFlow: formatLargeNumber(profileData.operatingCashflow || 0),

        // Analyst Data
        analystRating: mapRecommendationToRating(profileData.recommendationKey),
        analystTargetPrice: profileData.targetMeanPrice || 0,
        analystCount: profileData.numberOfAnalystOpinions || 0,
        buyRatings: 0, // Not available in detail
        holdRatings: 0, // Not available in detail
        sellRatings: 0, // Not available in detail

        // Market Performance
        monthHigh1: 0, // Not available
        monthLow1: 0, // Not available
        monthHigh3: 0, // Not available
        monthLow3: 0, // Not available
        ytdReturn: 0, // Not available
        month1Return: 0, // Not available
        month3Return: 0, // Not available
        month6Return: 0, // Not available
        year1Return: 0, // Not available
        year3Return: 0, // Not available
        year5Return: 0, // Not available

        // Holdings & Short Interest
        institutionalOwnership: 0, // Not available
        insiderOwnership: 0, // Not available
        shortInterest: (profileData.shortPercentOfFloat || 0) * 100,
        shortRatio: profileData.shortRatio || 0,

        // Exchange Info
        exchange: profileData.exchange || quoteData.exchange || '',
        currency: profileData.currency || quoteData.currency || 'USD',
        country: profileData.country || 'United States',
        timeZone: profileData.exchangeTimezoneName || 'America/New_York',
        lastEarningsDate: 'N/A',
        nextEarningsDate: 'N/A',
        exDividendDate: profileData.exDividendDate ? new Date(profileData.exDividendDate * 1000).toISOString().split('T')[0] : 'N/A',

        // Risk & Technical
        beta: profileData.beta || 0,
        volatility30Day: 0, // Not available
        volatility52Week: 0, // Not available
        sharpeRatio: 0, // Not available
        informationRatio: 0 // Not available
      }

      return detailedStock
    } catch (error) {
      console.error(`Failed to fetch detailed data for ${symbol}:`, error)

      // Return minimal data structure on error
      return {
        symbol,
        name: symbol,
        price: 0,
        change: 0,
        changePercent: 0,
        marketCap: 'N/A',
        volume: 'N/A',
        avgVolume: 'N/A',
        peRatio: 0,
        eps: 0,
        dividend: 0,
        dividendYield: 0,
        weekHigh52: 0,
        weekLow52: 0,
        beta: 0,
        sector: 'Unknown',
        industry: 'Unknown',
        employees: 'N/A',
        founded: 'N/A',
        headquarters: 'N/A',
        ceo: 'N/A',
        description: 'Data not available',
        website: '',

        // Set all other fields to default values
        pbRatio: 0, pegRatio: 0, psRatio: 0, priceToBook: 0, priceToSales: 0,
        enterpriseValue: 'N/A', evToRevenue: 0, evToEbitda: 0,
        grossMargin: 0, operatingMargin: 0, netMargin: 0, roe: 0, roa: 0,
        debtToEquity: 0, currentRatio: 0, quickRatio: 0,
        revenue: 'N/A', revenueGrowthYoY: 0, revenueGrowthQoQ: 0,
        earningsGrowthYoY: 0, earningsGrowthQoQ: 0,
        freeCashFlow: 'N/A', operatingCashFlow: 'N/A',
        analystRating: 'N/A', analystTargetPrice: 0, analystCount: 0,
        buyRatings: 0, holdRatings: 0, sellRatings: 0,
        dayHigh: 0, dayLow: 0, monthHigh1: 0, monthLow1: 0, monthHigh3: 0, monthLow3: 0,
        ytdReturn: 0, month1Return: 0, month3Return: 0, month6Return: 0,
        year1Return: 0, year3Return: 0, year5Return: 0,
        institutionalOwnership: 0, insiderOwnership: 0, shortInterest: 0, shortRatio: 0,
        exchange: '', currency: 'USD', country: '', timeZone: '',
        lastEarningsDate: 'N/A', nextEarningsDate: 'N/A', exDividendDate: 'N/A',
        volatility30Day: 0, volatility52Week: 0, sharpeRatio: 0, informationRatio: 0
      }
    }
  }

  // Helper functions
  const formatLargeNumber = (num: number): string => {
    if (num === 0) return '0'
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`
    return num.toString()
  }

  const mapRecommendationToRating = (key: string): string => {
    const ratingMap: { [key: string]: string } = {
      'STRONG_BUY': 'Strong Buy',
      'BUY': 'Buy',
      'HOLD': 'Hold',
      'UNDERPERFORM': 'Underperform',
      'SELL': 'Sell'
    }
    return ratingMap[key] || 'N/A'
  }

  // Real-time search functionality
  useEffect(() => {
    if (searchQuery.length > 1) {
      setIsSearching(true)

      const searchStocks = async () => {
        try {
          // Search for stocks using the real API
          const searchResponse = await fetch(`/api/stocks/search?q=${encodeURIComponent(searchQuery)}`)
          if (searchResponse.ok) {
            const searchData = await searchResponse.json()

            // Get quotes for the found stocks to include price data
            const stockPromises = searchData.results.slice(0, 6).map(async (result: any) => {
              try {
                const quoteResponse = await fetch(`/api/stocks/quote?symbol=${result.symbol}`)
                if (quoteResponse.ok) {
                  const quoteData = await quoteResponse.json()
                  return {
                    symbol: quoteData.symbol,
                    name: quoteData.name,
                    price: quoteData.price,
                    change: quoteData.change,
                    changePercent: quoteData.changePercent
                  }
                }
                // Fallback without price data
                return {
                  symbol: result.symbol,
                  name: result.name,
                  price: 0,
                  change: 0,
                  changePercent: 0
                }
              } catch (error) {
                console.error(`Failed to fetch quote for ${result.symbol}:`, error)
                return {
                  symbol: result.symbol,
                  name: result.name,
                  price: 0,
                  change: 0,
                  changePercent: 0
                }
              }
            })

            const stockResults = await Promise.all(stockPromises)
            setSearchResults(stockResults)
          } else {
            setSearchResults([])
          }
        } catch (error) {
          console.error('Search error:', error)
          setSearchResults([])
        } finally {
          setIsSearching(false)
        }
      }

      const timer = setTimeout(searchStocks, 300)
      return () => clearTimeout(timer)
    } else {
      setSearchResults([])
      setIsSearching(false)
    }
  }, [searchQuery])

  // Add to favorites
  const addToFavorites = (stock: Stock) => {
    const isAlreadyFavorite = favorites.some(fav => fav.symbol === stock.symbol)
    if (!isAlreadyFavorite) {
      const updatedFavorites = [...favorites, stock]
      setFavorites(updatedFavorites)

      // Save symbols for persistence
      const symbols = updatedFavorites.map(fav => fav.symbol)
      localStorage.setItem('favoriteSymbols', JSON.stringify(symbols))

      setSearchQuery('')
      setSearchResults([])
    }
  }

  // Remove from favorites
  const removeFromFavorites = (symbol: string) => {
    const updatedFavorites = favorites.filter(fav => fav.symbol !== symbol)
    setFavorites(updatedFavorites)

    // Save symbols for persistence
    const symbols = updatedFavorites.map(fav => fav.symbol)
    localStorage.setItem('favoriteSymbols', JSON.stringify(symbols))
  }

  // Check if stock is in favorites
  const isFavorite = (symbol: string) => {
    return favorites.some(fav => fav.symbol === symbol)
  }

  // Fetch detailed stock information
  const fetchStockDetails = async (symbol: string) => {
    setIsLoadingDetails(true)
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800))
      const detailedData = getDetailedStockData(symbol)
      setSelectedStock(detailedData)
    } catch (error) {
      console.error('Error fetching stock details:', error)
    } finally {
      setIsLoadingDetails(false)
    }
  }

  // Analyze stock with RemoteAgent
  const analyzeWithRemoteAgent = async (stock: DetailedStock, customRequest?: string) => {
    if (!customRequest && !analysisInput.trim()) {
      alert('Please enter what you want to analyze about this stock.')
      return
    }

    try {
      const userRequest = customRequest || analysisInput.trim()

      const baseStockInfo = `Stock Information for ${stock.name} (${stock.symbol}):

Current Price: $${stock.price}
Change: ${stock.change >= 0 ? '+' : ''}${stock.change} (${stock.changePercent}%)
Market Cap: ${stock.marketCap}
P/E Ratio: ${stock.peRatio}
EPS: $${stock.eps}
Revenue: ${stock.revenue}
Revenue Growth (YoY): ${stock.revenueGrowthYoY}%
Earnings Growth (YoY): ${stock.earningsGrowthYoY}%
52W High: $${stock.weekHigh52}
52W Low: $${stock.weekLow52}
Beta: ${stock.beta}
Volume: ${stock.volume}
ROE: ${stock.roe}%
Debt to Equity: ${stock.debtToEquity}
Sector: ${stock.sector}
Industry: ${stock.industry}
Analyst Rating: ${stock.analystRating}
Target Price: $${stock.analystTargetPrice}

Additional Metrics:
- Gross Margin: ${stock.grossMargin}%
- Operating Margin: ${stock.operatingMargin}%
- Free Cash Flow: ${stock.freeCashFlow}
- Current Ratio: ${stock.currentRatio}
- Quick Ratio: ${stock.quickRatio}
- Volatility (30D): ${stock.volatility30Day}%
- Institutional Ownership: ${stock.institutionalOwnership}%

User Request: "${userRequest}"

Please provide a detailed analysis focusing specifically on what the user asked about. Use the stock data provided to give comprehensive insights, recommendations, and actionable advice. Format your response professionally with clear sections and bullet points where appropriate.`

      console.log('🚀 Sending analysis request to RemoteAgent:', {
        userRequest,
        stockSymbol: stock.symbol,
        promptLength: baseStockInfo.length
      })

      // Send the analysis request to RemoteAgent
      await sendRemoteAgentMessage(baseStockInfo, 'stock-analysis-agent')

    } catch (error) {
      console.error('❌ Error analyzing stock:', error)
      alert('Failed to analyze stock. Please try again.')
    }
  }

  const formatPrice = (price: number) => `$${price.toFixed(2)}`
  const formatChange = (change: number, percent: number) => {
    const isPositive = change >= 0
    return (
      <span className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
        {isPositive ? '+' : ''}{change.toFixed(2)} ({isPositive ? '+' : ''}{percent.toFixed(2)}%)
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Favorites</h1>
          <p className="text-gray-600">Manage your favorite stocks and track them easily</p>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Search size={20} />
            Add to Favorites
          </h2>

          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search stocks by symbol or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Search Results */}
          {searchQuery && (
            <div className="space-y-2">
              {isSearching ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Searching...</p>
                </div>
              ) : searchResults.length > 0 ? (
                <>
                  <p className="text-sm text-gray-600 mb-3">{searchResults.length} results found</p>
                  {searchResults.map((stock) => (
                    <div
                      key={stock.symbol}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <h3 className="font-semibold text-gray-900">{stock.symbol}</h3>
                            <p className="text-sm text-gray-600">{stock.name}</p>
                          </div>
                          <div className="ml-auto text-right">
                            <p className="font-semibold text-gray-900">{formatPrice(stock.price)}</p>
                            {formatChange(stock.change, stock.changePercent)}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => addToFavorites(stock)}
                        disabled={isFavorite(stock.symbol)}
                        className={`ml-4 p-2 rounded-lg transition-colors ${
                          isFavorite(stock.symbol)
                            ? 'bg-yellow-100 text-yellow-600 cursor-not-allowed'
                            : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                        }`}
                        title={isFavorite(stock.symbol) ? 'Already in favorites' : 'Add to favorites'}
                      >
                        {isFavorite(stock.symbol) ? <Star size={16} fill="currentColor" /> : <Plus size={16} />}
                      </button>
                    </div>
                  ))}
                </>
              ) : (
                <p className="text-gray-500 text-center py-4">No stocks found</p>
              )}
            </div>
          )}
        </div>

        {/* Favorites List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Star size={20} className="text-yellow-500" />
            Your Favorites ({favorites.length})
          </h2>

          {favorites.length === 0 ? (
            <div className="text-center py-12">
              <Star size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">No favorites yet</p>
              <p className="text-gray-400">Search for stocks above to add them to your favorites</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {favorites.map((stock) => (
                <div
                  key={stock.symbol}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all group"
                >
                  <Link
                    href={`/stocks/${stock.symbol}`}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">{stock.symbol}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {stock.symbol}
                          </h3>
                          <p className="text-sm text-gray-600">{stock.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 text-lg">{formatPrice(stock.price)}</p>
                        {formatChange(stock.change, stock.changePercent)}
                      </div>
                    </div>
                  </Link>

                  <div className="ml-4 flex items-center gap-2">
                    <button
                      onClick={() => fetchStockDetails(stock.symbol)}
                      className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
                      title="Fetch full details"
                    >
                      <Info size={16} />
                    </button>
                    <button
                      onClick={() => removeFromFavorites(stock.symbol)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove from favorites"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detailed Stock Information Modal */}
      {(selectedStock || isLoadingDetails) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {isLoadingDetails ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
                <p className="text-black font-medium">Fetching stock details...</p>
              </div>
            ) : selectedStock && (
              <div>
                {/* Header */}
                <div className="border-b border-gray-200 p-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-black">{selectedStock.symbol}</h2>
                    <p className="text-gray-600 text-lg">{selectedStock.name}</p>
                  </div>
                  <button
                    onClick={() => setSelectedStock(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={24} className="text-gray-500" />
                  </button>
                </div>

                {/* Price Information */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center gap-6 mb-4">
                    <span className="text-4xl font-light text-black">${selectedStock.price.toFixed(2)}</span>
                    <div className={`flex items-center gap-1 px-3 py-1 rounded-lg ${
                      selectedStock.change >= 0 ? 'text-black bg-gray-100' : 'text-black bg-gray-100'
                    }`}>
                      {selectedStock.change >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                      <span className="font-semibold">
                        {selectedStock.change >= 0 ? '+' : ''}{selectedStock.change.toFixed(2)}
                        ({selectedStock.change >= 0 ? '+' : ''}{selectedStock.changePercent.toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Comprehensive Stock Analysis */}
                <div className="p-6 space-y-8">

                  {/* Key Metrics Overview */}
                  <section>
                    <h3 className="text-xl font-semibold text-black mb-4 flex items-center gap-2">
                      <BarChart3 size={20} />
                      Key Metrics Overview
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign size={16} className="text-gray-600" />
                          <span className="text-sm text-gray-600">Market Cap</span>
                        </div>
                        <p className="text-lg font-semibold text-black">{selectedStock.marketCap}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Activity size={16} className="text-gray-600" />
                          <span className="text-sm text-gray-600">Volume</span>
                        </div>
                        <p className="text-lg font-semibold text-black">{selectedStock.volume}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Calculator size={16} className="text-gray-600" />
                          <span className="text-sm text-gray-600">P/E Ratio</span>
                        </div>
                        <p className="text-lg font-semibold text-black">{selectedStock.peRatio}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign size={16} className="text-gray-600" />
                          <span className="text-sm text-gray-600">EPS</span>
                        </div>
                        <p className="text-lg font-semibold text-black">${selectedStock.eps}</p>
                      </div>
                    </div>
                  </section>

                  {/* Advanced Financial Ratios */}
                  <section>
                    <h3 className="text-xl font-semibold text-black mb-4 flex items-center gap-2">
                      <Calculator size={20} />
                      Advanced Financial Ratios
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold text-black mb-3">Valuation Ratios</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">P/B Ratio</span>
                            <span className="font-medium text-black">{selectedStock.pbRatio}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">PEG Ratio</span>
                            <span className="font-medium text-black">{selectedStock.pegRatio}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">P/S Ratio</span>
                            <span className="font-medium text-black">{selectedStock.psRatio}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">EV/Revenue</span>
                            <span className="font-medium text-black">{selectedStock.evToRevenue}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">EV/EBITDA</span>
                            <span className="font-medium text-black">{selectedStock.evToEbitda}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold text-black mb-3">Profitability</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Gross Margin</span>
                            <span className="font-medium text-black">{selectedStock.grossMargin}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Operating Margin</span>
                            <span className="font-medium text-black">{selectedStock.operatingMargin}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Net Margin</span>
                            <span className="font-medium text-black">{selectedStock.netMargin}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">ROE</span>
                            <span className="font-medium text-black">{selectedStock.roe}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">ROA</span>
                            <span className="font-medium text-black">{selectedStock.roa}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold text-black mb-3">Financial Health</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Debt to Equity</span>
                            <span className="font-medium text-black">{selectedStock.debtToEquity}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Current Ratio</span>
                            <span className="font-medium text-black">{selectedStock.currentRatio}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Quick Ratio</span>
                            <span className="font-medium text-black">{selectedStock.quickRatio}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Enterprise Value</span>
                            <span className="font-medium text-black">{selectedStock.enterpriseValue}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Beta</span>
                            <span className="font-medium text-black">{selectedStock.beta}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Revenue & Growth Analysis */}
                  <section>
                    <h3 className="text-xl font-semibold text-black mb-4 flex items-center gap-2">
                      <TrendingUpDown size={20} />
                      Revenue & Growth Analysis
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold text-black mb-3">Revenue Metrics</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Revenue</span>
                            <span className="font-medium text-black">{selectedStock.revenue}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Free Cash Flow</span>
                            <span className="font-medium text-black">{selectedStock.freeCashFlow}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Operating Cash Flow</span>
                            <span className="font-medium text-black">{selectedStock.operatingCashFlow}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold text-black mb-3">Growth Rates</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Revenue Growth (YoY)</span>
                            <span className={`font-medium ${selectedStock.revenueGrowthYoY >= 0 ? 'text-black' : 'text-gray-600'}`}>
                              {selectedStock.revenueGrowthYoY >= 0 ? '+' : ''}{selectedStock.revenueGrowthYoY}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Revenue Growth (QoQ)</span>
                            <span className={`font-medium ${selectedStock.revenueGrowthQoQ >= 0 ? 'text-black' : 'text-gray-600'}`}>
                              {selectedStock.revenueGrowthQoQ >= 0 ? '+' : ''}{selectedStock.revenueGrowthQoQ}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Earnings Growth (YoY)</span>
                            <span className={`font-medium ${selectedStock.earningsGrowthYoY >= 0 ? 'text-black' : 'text-gray-600'}`}>
                              {selectedStock.earningsGrowthYoY >= 0 ? '+' : ''}{selectedStock.earningsGrowthYoY}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Earnings Growth (QoQ)</span>
                            <span className={`font-medium ${selectedStock.earningsGrowthQoQ >= 0 ? 'text-black' : 'text-gray-600'}`}>
                              {selectedStock.earningsGrowthQoQ >= 0 ? '+' : ''}{selectedStock.earningsGrowthQoQ}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Market Performance & Returns */}
                  <section>
                    <h3 className="text-xl font-semibold text-black mb-4 flex items-center gap-2">
                      <TrendingUp size={20} />
                      Market Performance & Returns
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold text-black mb-3">Price Ranges</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Day Range</span>
                            <span className="font-medium text-black">${selectedStock.dayLow} - ${selectedStock.dayHigh}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">52W Range</span>
                            <span className="font-medium text-black">${selectedStock.weekLow52} - ${selectedStock.weekHigh52}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">1M Range</span>
                            <span className="font-medium text-black">${selectedStock.monthLow1} - ${selectedStock.monthHigh1}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">3M Range</span>
                            <span className="font-medium text-black">${selectedStock.monthLow3} - ${selectedStock.monthHigh3}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold text-black mb-3">Historical Returns</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">YTD Return</span>
                            <span className={`font-medium ${selectedStock.ytdReturn >= 0 ? 'text-black' : 'text-gray-600'}`}>
                              {selectedStock.ytdReturn >= 0 ? '+' : ''}{selectedStock.ytdReturn}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">1 Year Return</span>
                            <span className={`font-medium ${selectedStock.year1Return >= 0 ? 'text-black' : 'text-gray-600'}`}>
                              {selectedStock.year1Return >= 0 ? '+' : ''}{selectedStock.year1Return}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">3 Year Return</span>
                            <span className={`font-medium ${selectedStock.year3Return >= 0 ? 'text-black' : 'text-gray-600'}`}>
                              {selectedStock.year3Return >= 0 ? '+' : ''}{selectedStock.year3Return}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">5 Year Return</span>
                            <span className={`font-medium ${selectedStock.year5Return >= 0 ? 'text-black' : 'text-gray-600'}`}>
                              {selectedStock.year5Return >= 0 ? '+' : ''}{selectedStock.year5Return}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Analyst Recommendations */}
                  <section>
                    <h3 className="text-xl font-semibold text-black mb-4 flex items-center gap-2">
                      <Target size={20} />
                      Analyst Recommendations
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold text-black mb-3">Consensus Rating</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Overall Rating</span>
                            <span className="font-semibold text-black">{selectedStock.analystRating}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Target Price</span>
                            <span className="font-medium text-black">${selectedStock.analystTargetPrice}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Analysts Coverage</span>
                            <span className="font-medium text-black">{selectedStock.analystCount}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold text-black mb-3">Rating Breakdown</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Buy Ratings</span>
                            <span className="font-medium text-black">{selectedStock.buyRatings}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Hold Ratings</span>
                            <span className="font-medium text-black">{selectedStock.holdRatings}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Sell Ratings</span>
                            <span className="font-medium text-black">{selectedStock.sellRatings}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Upside Potential</span>
                            <span className={`font-medium ${((selectedStock.analystTargetPrice - selectedStock.price) / selectedStock.price * 100) >= 0 ? 'text-black' : 'text-gray-600'}`}>
                              {((selectedStock.analystTargetPrice - selectedStock.price) / selectedStock.price * 100) >= 0 ? '+' : ''}
                              {(((selectedStock.analystTargetPrice - selectedStock.price) / selectedStock.price) * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Risk Analysis */}
                  <section>
                    <h3 className="text-xl font-semibold text-black mb-4 flex items-center gap-2">
                      <Shield size={20} />
                      Risk Analysis
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold text-black mb-3">Volatility Metrics</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">30-Day Volatility</span>
                            <span className="font-medium text-black">{selectedStock.volatility30Day}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">52W Volatility</span>
                            <span className="font-medium text-black">{selectedStock.volatility52Week}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Sharpe Ratio</span>
                            <span className="font-medium text-black">{selectedStock.sharpeRatio}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Information Ratio</span>
                            <span className="font-medium text-black">{selectedStock.informationRatio}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold text-black mb-3">Ownership & Short Interest</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Institutional Ownership</span>
                            <span className="font-medium text-black">{selectedStock.institutionalOwnership}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Insider Ownership</span>
                            <span className="font-medium text-black">{selectedStock.insiderOwnership}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Short Interest</span>
                            <span className="font-medium text-black">{selectedStock.shortInterest}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Short Ratio</span>
                            <span className="font-medium text-black">{selectedStock.shortRatio}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Company Information */}
                  <section>
                    <h3 className="text-xl font-semibold text-black mb-4 flex items-center gap-2">
                      <Building2 size={20} />
                      Company Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold text-black mb-3">Corporate Details</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">CEO</span>
                            <span className="font-medium text-black">{selectedStock.ceo}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Employees</span>
                            <span className="font-medium text-black">{selectedStock.employees}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Founded</span>
                            <span className="font-medium text-black">{selectedStock.founded}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Headquarters</span>
                            <span className="font-medium text-black">{selectedStock.headquarters}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold text-black mb-3">Market Details</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Exchange</span>
                            <span className="font-medium text-black">{selectedStock.exchange}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Currency</span>
                            <span className="font-medium text-black">{selectedStock.currency}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Last Earnings</span>
                            <span className="font-medium text-black">{selectedStock.lastEarningsDate}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Next Earnings</span>
                            <span className="font-medium text-black">{selectedStock.nextEarningsDate}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Company Description */}
                    <div className="mt-6 bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-black mb-3 flex items-center gap-2">
                        <BookOpen size={18} />
                        Company Overview
                      </h4>
                      <p className="text-gray-600 leading-relaxed mb-4">{selectedStock.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-500">Sector: <span className="font-medium text-black">{selectedStock.sector}</span></span>
                        <span className="text-gray-500">Industry: <span className="font-medium text-black">{selectedStock.industry}</span></span>
                        <a
                          href={selectedStock.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-black hover:underline"
                        >
                          <Globe size={14} />
                          Website
                        </a>
                      </div>
                    </div>
                  </section>

                  {/* RemoteAgent Analysis Section */}
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <h4 className="font-semibold text-black mb-3 flex items-center gap-2">
                      <Bot size={18} />
                      Ask RemoteAgent to Analyze
                    </h4>
                    <p className="text-sm text-gray-500 mb-4">
                      Specify what you want to analyze about this stock (e.g., "financial health", "growth prospects", "risk assessment", "technical analysis")
                    </p>

                    <div className="flex gap-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="What do you want to analyze? (e.g., P/E ratio analysis, growth potential, risk factors...)"
                          value={analysisInput}
                          onChange={(e) => setAnalysisInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !isAnalyzing && analysisInput.trim()) {
                              analyzeWithRemoteAgent(selectedStock)
                            }
                          }}
                          disabled={isAnalyzing}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all placeholder-gray-400 disabled:bg-gray-50 disabled:text-gray-400"
                        />
                      </div>

                      <button
                        onClick={() => analyzeWithRemoteAgent(selectedStock)}
                        disabled={isAnalyzing || !analysisInput.trim()}
                        className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${
                          isAnalyzing || !analysisInput.trim()
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-black text-white hover:bg-gray-800 active:bg-gray-900 shadow-lg hover:shadow-xl'
                        }`}
                      >
                        {isAnalyzing ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                            <span>Analyzing...</span>
                          </>
                        ) : (
                          <>
                            <Bot size={16} />
                            <span>Analyze</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Quick Analysis Options */}
                    <div className="mt-4">
                      <p className="text-xs text-gray-400 mb-2">Quick options:</p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          'Financial health analysis',
                          'Growth potential assessment',
                          'Risk evaluation',
                          'Technical analysis',
                          'Valuation assessment',
                          'Dividend analysis'
                        ].map((option) => (
                          <button
                            key={option}
                            onClick={() => setAnalysisInput(option)}
                            disabled={isAnalyzing}
                            className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}