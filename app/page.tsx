"use client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useState, useEffect } from "react"

// Simple icon components to replace lucide-react
const TrendingUpIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
)

const TrendingDownIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17H21M21 17V9M21 17L13 9L9 13L3 7" />
  </svg>
)

const BarChartIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    />
  </svg>
)

const SparklesIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
    />
  </svg>
)

const PlusIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
)

const DollarSignIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
    />
  </svg>
)

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value)
}

const formatVolume = (volume: number): string => {
  if (volume >= 1e9) {
    return `${(volume / 1e9).toFixed(2)}B`
  }
  if (volume >= 1e6) {
    return `${(volume / 1e6).toFixed(2)}M`
  }
  if (volume >= 1e3) {
    return `${(volume / 1e3).toFixed(2)}K`
  }
  return volume.toString()
}

export default function StockMarketDashboard() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  // Mock data
  const marketIndices = [
    { name: "S&P 500", symbol: "SPX", value: 4567.89, change: 54.32, changePercent: 1.2 },
    { name: "NASDAQ", symbol: "IXIC", value: 14234.56, change: 113.87, changePercent: 0.8 },
    { name: "DOW JONES", symbol: "DJI", value: 34123.45, change: -102.34, changePercent: -0.3 },
  ]

  const trendingStocks = [
    { symbol: "AAPL", name: "Apple Inc.", price: 175.43, change: 3.61, changePercent: 2.1, volume: 45678900 },
    { symbol: "TSLA", name: "Tesla Inc.", price: 248.87, change: 12.54, changePercent: 5.3, volume: 78901234 },
    { symbol: "GOOGL", name: "Alphabet Inc.", price: 138.21, change: -1.67, changePercent: -1.2, volume: 23456789 },
    { symbol: "MSFT", name: "Microsoft Corp.", price: 378.85, change: 3.01, changePercent: 0.8, volume: 34567890 },
  ]

  const watchlistStocks = [
    { symbol: "AAPL", price: 175.43, changePercent: 2.1 },
    { symbol: "TSLA", price: 248.87, changePercent: 5.3 },
    { symbol: "NVDA", price: 875.28, changePercent: 5.5 },
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="container mx-auto px-6 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-700 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-slate-700 rounded-lg"></div>
              ))}
            </div>
            <div className="h-96 bg-slate-700 rounded-lg mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-64 bg-slate-700 rounded-lg"></div>
              <div className="h-64 bg-slate-700 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  StockFlow Pro
                </h1>
                <p className="text-sm text-slate-400">Premium Trading Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Market Open</Badge>
              <div className="w-8 h-8 bg-slate-700 rounded-full"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Market Overview */}
        <section className="mb-8">
          <h2 className="text-3xl font-bold mb-6 text-balance">Market Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {marketIndices.map((index, i) => {
              const isPositive = index.change >= 0
              const TrendIcon = isPositive ? TrendingUpIcon : TrendingDownIcon
              const trendColor = isPositive ? "text-green-400" : "text-red-400"

              return (
                <Card
                  key={i}
                  className="bg-slate-800/50 backdrop-blur-sm border-slate-700 hover:bg-slate-800/70 transition-all duration-300"
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-400">{index.name}</CardTitle>
                    <BarChartIcon />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{index.value.toLocaleString()}</div>
                    <div className="flex items-center gap-1 text-sm">
                      <TrendIcon />
                      <span className={trendColor}>
                        {index.changePercent > 0 ? "+" : ""}
                        {index.changePercent.toFixed(1)}%
                      </span>
                      <span className="text-slate-400">
                        {index.change > 0 ? "+" : ""}
                        {index.change.toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            {/* Portfolio Value Card */}
            <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700 hover:bg-slate-800/70 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Portfolio Value</CardTitle>
                <DollarSignIcon />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{formatCurrency(127456.78)}</div>
                <div className="flex items-center gap-1 text-sm">
                  <TrendingUpIcon />
                  <span className="text-green-400">+2.1%</span>
                  <span className="text-slate-400">+{formatCurrency(2634.12)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Featured Chart */}
        <section className="mb-8">
          <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl text-white">AAPL - Apple Inc.</CardTitle>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="text-2xl font-bold text-white">$175.43</span>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      <TrendingUpIcon />
                      +2.34 (+1.35%)
                    </Badge>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {["1D", "1W", "1M", "3M", "1Y"].map((period) => (
                    <Button
                      key={period}
                      variant="outline"
                      size="sm"
                      className="bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600"
                    >
                      {period}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gradient-to-r from-slate-700/30 to-slate-600/30 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChartIcon />
                  <span className="text-slate-400 block mt-2">Interactive Chart Area</span>
                  <span className="text-slate-500 text-sm">Real-time data visualization</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Trending Stocks */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl text-white">Trending Stocks</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {trendingStocks.map((stock, i) => {
                  const isPositive = stock.change >= 0
                  const TrendIcon = isPositive ? TrendingUpIcon : TrendingDownIcon
                  const trendColor = isPositive ? "text-green-400" : "text-red-400"

                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-all duration-300 cursor-pointer group"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-xs">{stock.symbol[0]}</span>
                        </div>
                        <div>
                          <div className="font-semibold text-white group-hover:text-cyan-400 transition-colors">
                            {stock.symbol}
                          </div>
                          <div className="text-sm text-slate-400">{stock.name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-white">{formatCurrency(stock.price)}</div>
                        <div className="flex items-center gap-1">
                          <TrendIcon />
                          <span className={`text-sm ${trendColor}`}>
                            {stock.changePercent > 0 ? "+" : ""}
                            {stock.changePercent.toFixed(2)}%
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
            <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl text-white flex items-center gap-2">
                    <SparklesIcon />
                    My Watchlist
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <PlusIcon />
                    Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {watchlistStocks.map((stock, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-all duration-300 cursor-pointer"
                  >
                    <span className="font-semibold text-white">{stock.symbol}</span>
                    <div className="text-right">
                      <div className="text-sm font-medium text-white">{formatCurrency(stock.price)}</div>
                      <div className="text-green-400 text-xs">+{stock.changePercent.toFixed(1)}%</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <section className="mb-8">
          <h2 className="text-3xl font-bold mb-6 text-balance">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                icon: TrendingUpIcon,
                title: "Buy Stocks",
                description: "Purchase shares from top companies",
                color: "cyan",
              },
              {
                icon: BarChartIcon,
                title: "View Analytics",
                description: "Deep dive into market trends",
                color: "blue",
              },
              {
                icon: SparklesIcon,
                title: "AI Assistant",
                description: "Get personalized trading advice",
                color: "purple",
              },
              {
                icon: PlusIcon,
                title: "Add to Portfolio",
                description: "Build your investment portfolio",
                color: "green",
              },
            ].map((action, index) => (
              <Card
                key={action.title}
                className="bg-slate-800/50 backdrop-blur-sm border-slate-700 hover:bg-slate-800/70 hover:scale-105 transition-all duration-300 cursor-pointer group"
              >
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <action.icon />
                  </div>
                  <h3 className="font-semibold mb-2 text-white group-hover:text-cyan-400 transition-colors duration-300">
                    {action.title}
                  </h3>
                  <p className="text-sm text-slate-400">{action.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Status Badge */}
        <div className="text-center">
          <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 animate-pulse">
            <SparklesIcon />
            <span className="ml-2">Interactive Charts & AI Assistant Active • Real-time Updates Coming Soon</span>
          </Badge>
        </div>
      </main>

      {/* AI Chatbot Button */}
      <div className="fixed bottom-6 right-6">
        <Button className="w-14 h-14 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full shadow-lg hover:scale-110 transition-transform duration-300">
          <SparklesIcon />
        </Button>
      </div>
    </div>
  )
}
