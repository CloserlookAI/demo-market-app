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
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"
    script.type = "text/javascript"
    script.async = true

    // Build studies array - add comparison symbol as overlay if present
    const studies = compareSymbol ? [
      {
        id: "compare@tv-basicstudies",
        inputs: {
          symbol: compareSymbol
        }
      }
    ] : []

    const config = {
      symbol: primarySymbol,
      interval: "D",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      enable_publishing: false,
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      backgroundColor: "rgba(19, 23, 34, 1)",
      gridColor: "rgba(42, 46, 57, 0)",
      hide_side_toolbar: false,
      allow_symbol_change: true,
      studies: studies,
      show_popup_button: false,
      popup_width: "1000",
      popup_height: "650",
      container_id: "tradingview_chart",
      width: "100%",
      height: "100%",
      autosize: true
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
    <div className="tradingview-widget-container w-full h-full" style={{ width: '100%', height: '100%' }}>
      <div className="tradingview-widget-container__widget w-full h-full" ref={container} style={{ width: '100%', height: '100%' }}></div>
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
  const [htmlContent, setHtmlContent] = useState("")
  const [currentAgentName, setCurrentAgentName] = useState<string | null>(null)
  const [isRemixing, setIsRemixing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const hasRemixed = useRef(false)

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

  // Function to load HTML from agent
  const loadHtmlFromAgent = async (agentName: string, retryCount = 0) => {
    try {
      console.log('Loading HTML from agent:', agentName, 'retry:', retryCount)
      // Add cache-busting parameter to ensure fresh data
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/agent-files/read?agent=${agentName}&path=report.html&_=${timestamp}`)
      const data = await response.json()

      console.log('HTML load response:', data)

      if (data.success && data.content && data.content.trim()) {
        console.log('HTML content loaded successfully, length:', data.content.length)
        setHtmlContent(data.content)
        return true
      } else {
        console.error('Failed to load HTML:', data.error, data.details)
        console.log('Paths attempted:', data.pathsAttempted)

        // If content not found and retries left, try loading from parent agent
        if (retryCount === 0 && agentName !== 'competitive-overview-agent') {
          console.log('Content not found in remixed agent, trying parent agent...')
          return await loadHtmlFromAgent('competitive-overview-agent', 1)
        } else {
          console.error('Failed to load HTML from both remixed and parent agent')
          console.error('This likely means the stock_report.html file does not exist in the agent workspace yet')
          console.error('The agent needs to generate the file first before it can be displayed')
          return false
        }
      }
    } catch (error) {
      console.error('Error loading HTML from agent:', error)
      // If failed and it was remixed agent, try parent agent
      if (retryCount === 0 && agentName !== 'competitive-overview-agent') {
        console.log('Error loading from remixed agent, trying parent agent...')
        return await loadHtmlFromAgent('competitive-overview-agent', 1)
      }
      return false
    }
  }

  // Function to create a remixed agent
  const createRemixedAgent = async (): Promise<string | null> => {
    if (hasRemixed.current || isRemixing) {
      console.log('Already remixed or remixing, returning current agent:', currentAgentName)
      return currentAgentName
    }

    setIsRemixing(true)
    hasRemixed.current = true

    try {
      console.log('Creating remixed agent for competitive-overview-agent...')
      const response = await fetch('/api/agents/remix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          baseAgentName: 'competitive-overview-agent'
        })
      })

      console.log('Remix API response status:', response.status)
      const data = await response.json()
      console.log('Remix API response data:', data)

      if (data.success && data.agent) {
        console.log('Remixed agent created successfully:', data.agent.name)
        const agentName = data.agent.name
        setCurrentAgentName(agentName)

        // Reload HTML content from the remixed agent
        console.log('Loading HTML from remixed agent:', agentName)
        await loadHtmlFromAgent(agentName)

        return agentName
      } else {
        console.error('Failed to create remixed agent:', data.error, data)
        return null
      }
    } catch (error) {
      console.error('Error creating remixed agent:', error)
      return null
    } finally {
      setIsRemixing(false)
    }
  }

  // Initialize with remixed agent on mount
  useEffect(() => {
    const initializeWithRemixedAgent = async () => {
      try {
        console.log('Initializing with remixed agent...')
        const agentName = await createRemixedAgent()

        if (!agentName) {
          console.log('Failed to create remixed agent, attempting fallback to base agent...')
          // Fallback to base agent if remix fails
          const timestamp = new Date().getTime()
          const fallbackResponse = await fetch(`/api/agent-files/read?agent=competitive-overview-agent&path=report.html&_=${timestamp}`)
          const data = await fallbackResponse.json()

          console.log('Fallback API response:', data)

          if (data.success && data.content && data.content.trim()) {
            console.log('Loaded fallback HTML from base agent, length:', data.content.length)
            setHtmlContent(data.content)
            setCurrentAgentName('competitive-overview-agent')
          } else {
            console.error('Fallback failed:', data.error)
          }
        }
      } catch (error) {
        console.error('Failed to initialize with remixed agent:', error)
      }
    }

    initializeWithRemixedAgent()
  }, [])

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

    setIsLoading(true)

    try {
      // Wait for remixed agent to be ready if still initializing
      let agentName = currentAgentName
      let waitCount = 0

      while (!agentName && waitCount < 30) {
        console.log('Waiting for remixed agent to be ready...')
        await new Promise(resolve => setTimeout(resolve, 1000))
        agentName = currentAgentName
        waitCount++
      }

      if (!agentName) {
        throw new Error('Remixed agent not ready. Please refresh and try again.')
      }

      console.log('Sending message to agent:', agentName)

      // Send message to the remixed agent (use original input without modification)
      const response = await fetch('/api/agents/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          agentName: agentName,
          message: currentInput
        })
      })

      const data = await response.json()

      // Always expect success since backend retries indefinitely
      if (data.success && data.response) {
        // Add agent response to messages
        const assistantMessage: Message = {
          id: data.response.id || `response-${Date.now()}`,
          type: 'assistant',
          content: data.response.text || 'No response received from agent.',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, assistantMessage])

        // Reload the HTML file from the agent to show any changes
        console.log('Reloading HTML from agent after response...')
        await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds
        await loadHtmlFromAgent(agentName)
      }

    } catch (error: any) {
      console.error('Unexpected error:', error)
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        type: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const copyCanvasContent = async () => {
    try {
      await navigator.clipboard.writeText(htmlContent)
      alert('HTML content copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const downloadCanvasContent = () => {
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const element = document.createElement('a')
    element.href = url
    element.download = `competitive-analysis-${primaryStock}${compareStock ? `-vs-${compareStock}` : ''}-${new Date().toISOString().split('T')[0]}.html`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
    URL.revokeObjectURL(url)
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
              <span>
                {currentAgentName ? `Agent: ${currentAgentName}` : isRemixing ? 'Creating session agent...' : 'Real-time comparison'}
              </span>
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

      {/* Main Content Area - 35-65 Split */}
      <div className="flex h-[calc(100vh-64px)]">
        {/* Left Side - Chat Interface (35%) */}
        <div className="w-[35%] border-r border-gray-200 bg-white flex flex-col">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
          <div className="border-t border-gray-200 bg-white p-4">
            <div className="flex items-center space-x-2">
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

        {/* Right Side - Chart & Analysis (65%) */}
        <div className="w-[65%] bg-white flex flex-col">
          {/* Chart Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-900">
                {primaryStock ? (
                  isComparing && compareStock
                    ? `${primaryStock} vs ${compareStock}`
                    : `${primaryStock} Performance`
                ) : 'Chart & Analysis'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
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
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* TradingView Chart - Smaller for more report space */}
            <div className="h-[35%] bg-gray-900 border-b border-gray-700 flex items-center justify-center p-2">
              {primaryStock ? (
                <div className="w-full h-full">
                  <ComparisonWidget
                    primarySymbol={primaryStock}
                    compareSymbol={isComparing ? compareStock : undefined}
                    height={350}
                  />
                </div>
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

            {/* Analysis Report Canvas - Much more space */}
            <div className="h-[65%] bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
              {/* Canvas Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-white shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-gray-900">Competitive Analysis Report</h3>
                      <p className="text-xs text-gray-600 truncate font-medium">
                        {primaryStock ? (
                          isComparing && compareStock
                            ? `${primaryStock} vs ${compareStock}`
                            : primaryStock
                        ) : 'No stock selected'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {htmlContent && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={copyCanvasContent}
                          className="text-xs border-gray-300 hover:bg-gray-50 transition-colors"
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Copy
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={downloadCanvasContent}
                          className="text-xs border-gray-300 hover:bg-gray-50 transition-colors"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Report Content */}
              <div className="flex-1 overflow-hidden p-6">
                <div className="h-full bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
                  {isRemixing || (!htmlContent && !isLoading) ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                      <div className="w-24 h-24 bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl flex items-center justify-center mb-6 shadow-md">
                        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">Loading Report...</h3>
                      <p className="text-gray-500 text-sm max-w-md leading-relaxed mb-6">
                        Preparing your competitive analysis report from the agent.
                      </p>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  ) : htmlContent ? (
                    <iframe
                      ref={iframeRef}
                      srcDoc={htmlContent}
                      className="w-full h-full border-none"
                      title="Competitive Analysis Report"
                      sandbox="allow-same-origin allow-scripts"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                      <div className="w-24 h-24 bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl flex items-center justify-center mb-6 shadow-md">
                        <FileText className="w-12 h-12 text-blue-500" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">Ready for Analysis</h3>
                      <p className="text-gray-500 text-sm max-w-md leading-relaxed mb-6">
                        {primaryStock
                          ? `Ask the AI assistant to analyze ${primaryStock}${compareStock ? ` vs ${compareStock}` : ' and its competitors'}. Your analysis report will appear here.`
                          : 'Select a stock above and start a conversation to generate competitive analysis reports.'}
                      </p>
                      {primaryStock && (
                        <div className="flex flex-col space-y-2 mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setInputValue(`Compare ${primaryStock}${compareStock ? ` with ${compareStock}` : ' with its main competitors'} in terms of market performance`)}
                            className="text-xs"
                          >
                            Market Performance Comparison
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setInputValue(`Analyze competitive advantages of ${primaryStock}${compareStock ? ` vs ${compareStock}` : ''}`)}
                            className="text-xs"
                          >
                            Competitive Advantages Analysis
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}