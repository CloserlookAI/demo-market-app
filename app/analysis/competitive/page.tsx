"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Users, TrendingUp, TrendingDown, ArrowLeft, Bot, Send, Loader2, FileText, Copy, Download, Maximize2, X, Plus } from "lucide-react"
import { useRouter } from "next/navigation"

interface SearchResult {
  symbol: string
  name: string
  exchange?: string
}

interface StockQuote {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
}

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ComparisonWidgetProps {
  primarySymbol: string
  compareSymbol?: string
  height?: number
}

function ComparisonWidget({ primarySymbol, compareSymbol, height = 500 }: ComparisonWidgetProps) {
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!container.current || !primarySymbol) return

    const script = document.createElement("script")
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js"
    script.type = "text/javascript"
    script.async = true

    const config = {
      symbols: compareSymbol ?
        [[primarySymbol, primarySymbol], [compareSymbol, compareSymbol]] :
        [[primarySymbol, primarySymbol]],
      chartOnly: false,
      width: "100%",
      height: height,
      locale: "en",
      colorTheme: "dark",
      autosize: true,
      showVolume: true,
      showMA: false,
      hideDateRanges: false,
      hideMarketStatus: false,
      hideSymbolLogo: false,
      scalePosition: "right",
      scaleMode: "Normal",
      fontFamily: "-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif",
      fontSize: "10",
      noTimeScale: false,
      valuesTracking: "1",
      changeMode: "price-and-percent",
      chartType: "line",
      lineWidth: 2,
      lineType: 0,
      ...(compareSymbol && {
        compareSymbol: {
          symbol: compareSymbol,
          position: "SameScale"
        }
      })
    }

    script.innerHTML = JSON.stringify(config)

    // Clear previous widget
    container.current.innerHTML = ''
    container.current.appendChild(script)

    return () => {
      if (container.current) {
        container.current.innerHTML = ''
      }
    }
  }, [primarySymbol, compareSymbol, height])

  if (!primarySymbol) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium mb-2">No Stock Selected</h3>
          <p className="text-gray-400">Search and select a stock to view its chart</p>
        </div>
      </div>
    )
  }

  return (
    <div className="tradingview-widget-container" style={{ height: `${height}px` }}>
      <div className="tradingview-widget-container__widget h-full" ref={container}></div>
    </div>
  )
}

export default function CompetitivePage() {
  const router = useRouter()
  const [primaryStock, setPrimaryStock] = useState("")
  const [compareStock, setCompareStock] = useState("")
  const [isComparing, setIsComparing] = useState(false)
  const [primaryQuote, setPrimaryQuote] = useState<StockQuote | null>(null)
  const [compareQuote, setCompareQuote] = useState<StockQuote | null>(null)
  const [showSearchResults, setShowSearchResults] = useState(false)

  // Chat functionality
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [canvasContent, setCanvasContent] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  const popularStocks = [
    { symbol: "AAPL", name: "Apple Inc." },
    { symbol: "GOOGL", name: "Alphabet Inc." },
    { symbol: "MSFT", name: "Microsoft Corp." },
    { symbol: "AMZN", name: "Amazon.com Inc." },
    { symbol: "TSLA", name: "Tesla Inc." },
    { symbol: "META", name: "Meta Platforms Inc." },
    { symbol: "NVDA", name: "NVIDIA Corp." },
    { symbol: "NFLX", name: "Netflix Inc." },
  ]

  // Fetch stock quote
  const getStockQuote = async (symbol: string): Promise<StockQuote | null> => {
    try {
      const response = await fetch(`/api/stocks/quote?symbol=${symbol}`)
      const data = await response.json()
      return {
        symbol: data.symbol || symbol,
        name: data.name || symbol,
        price: data.price || Math.random() * 200 + 100, // Mock data for demo
        change: data.change || (Math.random() - 0.5) * 10,
        changePercent: data.changePercent || (Math.random() - 0.5) * 5
      }
    } catch (error) {
      // Return mock data for demo
      return {
        symbol,
        name: symbol,
        price: Math.random() * 200 + 100,
        change: (Math.random() - 0.5) * 10,
        changePercent: (Math.random() - 0.5) * 5
      }
    }
  }


  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false)
      }
    }

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowSearchResults(false)
      }
    }

    if (showSearchResults) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscapeKey)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [showSearchResults])

  // Load initial quotes
  useEffect(() => {
    if (primaryStock) {
      getStockQuote(primaryStock).then(setPrimaryQuote)
    } else {
      setPrimaryQuote(null)
    }
  }, [primaryStock])

  useEffect(() => {
    if (compareStock) {
      getStockQuote(compareStock).then(setCompareQuote)
    }
  }, [compareStock])

  // Chat scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  const handleStockSelect = (result: SearchResult) => {
    if (!primaryStock) {
      // If no primary stock is selected, set this as primary
      setPrimaryStock(result.symbol)
    } else if (!isComparing) {
      // If primary exists but no comparison, set as comparison
      setCompareStock(result.symbol)
      setIsComparing(true)
    } else {
      // If both exist, replace comparison
      setCompareStock(result.symbol)
    }
    setShowSearchResults(false)
  }

  const handleRemoveAll = () => {
    setPrimaryStock("")
    setCompareStock("")
    setIsComparing(false)
    setPrimaryQuote(null)
    setCompareQuote(null)
    setShowSearchResults(false) // Also close any open dialogs
  }

  const handleSwapStocks = () => {
    if (compareStock) {
      const tempStock = primaryStock
      const tempQuote = primaryQuote
      setPrimaryStock(compareStock)
      setPrimaryQuote(compareQuote)
      setCompareStock(tempStock)
      setCompareQuote(tempQuote)
    }
  }

  // Chat functionality
  const getRemoteAgentResponse = async (prompt: string) => {
    setIsLoading(true)
    try {
      const requestBody = {
        prompt: `Analyze competitive comparison between ${primaryStock}${compareStock ? ` and ${compareStock}` : ''}: ${prompt}`,
        symbol: primaryStock,
        data: { primaryStock, compareStock }
      }

      const response = await fetch('/api/remoteagent/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      const result = await response.json()

      if (result.success && result.analysis) {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: result.analysis,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, aiResponse])
        setCanvasContent(result.analysis)
      } else {
        const errorResponse: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: result.error || 'Sorry, I encountered an error while processing your request.',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, errorResponse])
      }
    } catch (error) {
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Sorry, I\'m having trouble connecting to the analysis service. Please try again later.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorResponse])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    const currentInput = inputValue
    setInputValue("")
    await getRemoteAgentResponse(currentInput)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const copyCanvasContent = async () => {
    try {
      await navigator.clipboard.writeText(canvasContent)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const downloadCanvasContent = () => {
    const element = document.createElement('a')
    const file = new Blob([canvasContent], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = `competitive-analysis-${primaryStock}${compareStock ? `-vs-${compareStock}` : ''}-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <div className="h-screen bg-white overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white h-16 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center justify-center w-10 h-10 bg-black rounded-full">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Competitive Analysis</h1>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Real-time comparison</span>
            </div>
          </div>
        </div>

        {/* Stock Comparison Display */}
        <div className="flex items-center space-x-6">
          {/* Show stock display only when there are stocks selected */}
          {primaryStock && (
            <>
              {/* Primary Stock Card */}
              <div className="flex items-center space-x-3 bg-gray-50 rounded-xl px-4 py-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="font-mono text-white text-xs font-bold">{primaryStock.slice(0, 2)}</span>
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="default" className="font-mono text-xs">{primaryStock}</Badge>
                    <span className="text-xs text-gray-500">PRIMARY</span>
                  </div>
                  {primaryQuote && (
                    <div className={`flex items-center space-x-1 text-xs font-medium ${
                      primaryQuote.change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {primaryQuote.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      <span>${primaryQuote.price.toFixed(2)}</span>
                      <span>({primaryQuote.changePercent > 0 ? '+' : ''}{primaryQuote.changePercent.toFixed(2)}%)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Comparison vs indicator */}
              {isComparing && compareStock && (
                <>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-0.5 bg-gray-300"></div>
                    <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded-full">VS</span>
                    <div className="w-8 h-0.5 bg-gray-300"></div>
                  </div>

                  {/* Compare Stock Card */}
                  <div className="flex items-center space-x-3 bg-gray-50 rounded-xl px-4 py-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <span className="font-mono text-white text-xs font-bold">{compareStock.slice(0, 2)}</span>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="font-mono text-xs">{compareStock}</Badge>
                        <span className="text-xs text-gray-500">COMPARE</span>
                      </div>
                      {compareQuote && (
                        <div className={`flex items-center space-x-1 text-xs font-medium ${
                          compareQuote.change >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {compareQuote.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          <span>${compareQuote.price.toFixed(2)}</span>
                          <span>({compareQuote.changePercent > 0 ? '+' : ''}{compareQuote.changePercent.toFixed(2)}%)</span>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveAll}
                      className="text-gray-400 hover:text-red-600 p-1 ml-2"
                      title="Remove all stocks"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>

                  {/* Performance Comparison Indicator */}
                  {primaryQuote && compareQuote && (
                    <div className="flex items-center space-x-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
                      <div className="text-xs text-gray-500">Performance:</div>
                      <div className={`text-xs font-semibold ${
                        primaryQuote.changePercent > compareQuote.changePercent ? 'text-blue-600' :
                        primaryQuote.changePercent < compareQuote.changePercent ? 'text-purple-600' : 'text-gray-600'
                      }`}>
                        {primaryQuote.changePercent > compareQuote.changePercent ?
                          `${primaryStock} +${(primaryQuote.changePercent - compareQuote.changePercent).toFixed(2)}%` :
                          primaryQuote.changePercent < compareQuote.changePercent ?
                          `${compareStock} +${(compareQuote.changePercent - primaryQuote.changePercent).toFixed(2)}%` :
                          'Equal'
                        }
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* Search */}
          <div className="relative" ref={searchRef}>
            <Button
              variant="outline"
              onClick={() => setShowSearchResults(true)}
              className="flex items-center space-x-2 px-4 py-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Stock to Compare</span>
            </Button>

            {/* Search Results Dropdown */}
            {showSearchResults && (
              <div className="absolute top-full right-0 mt-2 w-96 bg-white border border-gray-200 rounded-xl shadow-xl z-[9999] max-h-96 overflow-hidden">
                <div className="p-3 bg-gray-50 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Search className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-900">
                        {!primaryStock ? 'Select a primary stock to start' : 'Select a stock to compare'}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowSearchResults(false)
                      }}
                      className="p-1"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {/* Popular Stocks */}
                  <div className="p-2">
                    <div className="text-xs text-gray-500 font-medium uppercase tracking-wider px-2 py-1 mb-2">Popular Stocks</div>
                    <div className="grid grid-cols-1 gap-1">
                      {popularStocks.map((stock) => (
                        <button
                          key={stock.symbol}
                          onClick={() => handleStockSelect(stock)}
                          disabled={compareStock === stock.symbol || primaryStock === stock.symbol}
                          className="w-full flex items-center justify-between p-3 hover:bg-blue-50 rounded-lg text-left transition-colors duration-150 group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg flex items-center justify-center">
                              <span className="font-mono text-white text-xs font-bold">{stock.symbol.slice(0, 2)}</span>
                            </div>
                            <div>
                              <div className="font-mono text-sm font-semibold text-gray-900">{stock.symbol}</div>
                              <div className="text-xs text-gray-600 truncate max-w-60">{stock.name}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {(compareStock === stock.symbol || primaryStock === stock.symbol) ? (
                              <Badge variant="default" className="text-xs">Selected</Badge>
                            ) : (
                              <Plus className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area - 60-40 Split */}
      <div className="flex h-[calc(100vh-64px)]">
        {/* Left Side - Chat Interface (60%) */}
        <div className="w-[60%] border-r border-gray-200 bg-white flex flex-col">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Bot className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Competitive Analysis Assistant</h3>
                <p className="text-gray-500 max-w-sm">
                  {primaryStock
                    ? `Ask me to analyze the competitive landscape of ${primaryStock}${compareStock ? ` compared to ${compareStock}` : ' and other stocks'}.`
                    : 'Select a stock from the search above to start competitive analysis.'
                  }
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {primaryStock && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setInputValue(`Compare ${primaryStock}${compareStock ? ` with ${compareStock}` : ' with its main competitors'} in terms of market performance`)}
                      >
                        Market Performance
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setInputValue(`Analyze competitive advantages of ${primaryStock}${compareStock ? ` vs ${compareStock}` : ''}`)}
                      >
                        Competitive Advantages
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-3 ${
                  message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.type === 'user'
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {message.type === 'user' ? (
                    <Users className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>
                <div className={`flex-1 ${message.type === 'user' ? 'text-right' : ''}`}>
                  <div className={`inline-block max-w-[85%] p-4 rounded-2xl ${
                    message.type === 'user'
                      ? 'bg-black text-white rounded-tr-md'
                      : 'bg-gray-100 text-gray-900 rounded-tl-md'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>
                  <div className={`mt-1 text-xs text-gray-500 ${
                    message.type === 'user' ? 'text-right' : 'text-left'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="inline-block bg-gray-100 p-4 rounded-2xl rounded-tl-md">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                      <span className="text-sm text-gray-600">Analyzing competitive data...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="border-t border-gray-200 bg-white p-6">
            <div className="flex items-center space-x-3">
              <div className="flex-1 relative">
                <textarea
                  rows={1}
                  placeholder={primaryStock ?
                    `Ask about ${primaryStock}${compareStock ? ` vs ${compareStock}` : ' competitive analysis'}...` :
                    'Select a stock above to start analysis...'
                  }
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  className="w-full resize-none border border-gray-300 rounded-2xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
                  style={{ minHeight: '44px', maxHeight: '120px' }}
                />
                <Button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isLoading}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full bg-black hover:bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed p-0 flex items-center justify-center"
                >
                  {isLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Send className="w-3 h-3" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Chart & Analysis (40%) */}
        <div className="w-[40%] bg-white flex flex-col">
          {/* Chart Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-900">
                {isComparing && compareStock
                  ? `${primaryStock} vs ${compareStock} Chart`
                  : `${primaryStock} Performance Chart`
                }
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {canvasContent && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyCanvasContent}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadCanvasContent}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </>
              )}
              {isComparing && compareStock && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSwapStocks}
                  title="Swap stocks"
                >
                  Swap
                </Button>
              )}
            </div>
          </div>

          {/* Chart Content */}
          <div className="flex-1 flex flex-col">
            {/* TradingView Chart */}
            <div className="flex-1 bg-gray-900 min-h-0">
              <div className="h-full p-2">
                {primaryStock ? (
                  <ComparisonWidget
                    primarySymbol={primaryStock}
                    compareSymbol={isComparing ? compareStock : undefined}
                    height={380}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center bg-gray-900 text-white">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">No Stock Selected</h3>
                      <p className="text-gray-400">Use "Add Stock to Compare" to select a stock</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Analysis Canvas */}
            <div className="flex-1 border-t border-gray-200 min-h-0">
              <div className="p-4 h-full overflow-y-auto"
                   style={{ maxHeight: 'calc(50vh - 200px)' }}>
                {canvasContent ? (
                  <div
                    className="prose prose-sm max-w-none text-gray-800 leading-relaxed h-full"
                    style={{
                      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
                    }}
                  >
                    <pre className="whitespace-pre-wrap text-xs leading-relaxed text-gray-800">
                      {canvasContent}
                    </pre>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-3">
                      <FileText className="w-6 h-6 text-gray-400" />
                    </div>
                    <h3 className="text-base font-medium text-gray-900 mb-2">Analysis Results</h3>
                    <p className="text-gray-500 text-sm max-w-xs">
                      Start a conversation to generate competitive analysis that will appear here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}