"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Send, Bot, User, ArrowLeft, Loader2, MessageCircle, FileText, Download, Copy, Edit3, Maximize2, Minimize2 } from "lucide-react"

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ReportStats {
  lastUpdated: Date
  stockSymbol: string
  dataPoints: number
  analysisType: string
  reportSize: string
  contentLength: number
}

export default function DiscussPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [htmlContent, setHtmlContent] = useState("")
  const [isCanvasFullscreen, setIsCanvasFullscreen] = useState(false)
  const [reportContext, setReportContext] = useState<string>("")
  const [reportStats, setReportStats] = useState<ReportStats>({
    lastUpdated: new Date(),
    stockSymbol: 'Loading Report...',
    dataPoints: 0,
    analysisType: 'Performance Analysis',
    reportSize: '0 KB',
    contentLength: 0
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  // Initialize with a welcome message and fetch HTML report
  useEffect(() => {
    const welcomeMessage: Message = {
      id: "welcome",
      type: "assistant",
      content: "Hello! I've loaded the stock performance report. You can now ask me questions about the analysis, request specific insights, or discuss any metrics you see in the report.",
      timestamp: new Date()
    }
    setMessages([welcomeMessage])

    // Fetch the HTML report from the URL via API route to avoid CORS
    const fetchHtmlReport = async () => {
      try {
        const response = await fetch('/api/fetch-html?url=' + encodeURIComponent('https://ra-hyp-1.raworc.com/content/stock-performance-agent/simple.html'))
        const data = await response.json()
        if (data.success) {
          setHtmlContent(data.html)

          // Extract text content from HTML for context (remove HTML tags)
          const parser = new DOMParser()
          const doc = parser.parseFromString(data.html, 'text/html')
          const textContent = doc.body.textContent || ""
          setReportContext(textContent)

          // Extract report statistics
          const titleElement = doc.querySelector('h1, h2, title')
          // Try to extract stock symbol or use a better default
          let stockSymbol = 'Stock Analysis'
          const titleText = titleElement?.textContent || ''
          const symbolMatch = titleText.match(/\b[A-Z]{2,5}\b/)
          if (symbolMatch) {
            stockSymbol = symbolMatch[0]
          } else if (titleText.includes('Stock') || titleText.includes('Performance')) {
            stockSymbol = 'Performance Report'
          }

          const dataPoints = doc.querySelectorAll('td, tr, .data-point, [class*="value"], [class*="metric"]').length
          const reportSize = `${(data.html.length / 1024).toFixed(1)} KB`
          const contentLength = textContent.length

          setReportStats({
            lastUpdated: new Date(),
            stockSymbol,
            dataPoints,
            analysisType: 'Performance Analysis',
            reportSize,
            contentLength
          })
        } else {
          console.error('Failed to fetch HTML report:', data.error)
        }
      } catch (error) {
        console.error('Failed to fetch HTML report:', error)
      }
    }

    fetchHtmlReport()
  }, [])

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
      // Dummy response for now
      const dummyResponses = [
        "Based on the stock performance report, I can see that the key metrics indicate strong momentum. The data shows positive trends in the recent trading sessions with notable volume patterns.",
        "Looking at the analysis, the technical indicators suggest a bullish outlook. The moving averages are aligned favorably, and the price action demonstrates sustained upward pressure.",
        "The report highlights several important factors: market volatility has decreased, trading volume is above average, and the overall sentiment appears optimistic based on the recent data points.",
        "From what I can observe in the report, the stock's performance metrics are showing improvement quarter-over-quarter. The fundamental indicators align well with the technical analysis presented.",
        "The data reveals interesting patterns in the trading behavior. Price consolidation zones are clearly marked, and the support/resistance levels provide good reference points for decision-making."
      ]

      const randomResponse = dummyResponses[Math.floor(Math.random() * dummyResponses.length)]

      // Create assistant message with empty content first
      const assistantMessageId = (Date.now() + 1).toString()
      const assistantMessage: Message = {
        id: assistantMessageId,
        type: 'assistant',
        content: '',
        timestamp: new Date()
      }

      // Add assistant message AFTER a small delay to ensure user message is rendered first
      setTimeout(() => {
        setMessages(prev => [...prev, assistantMessage])

        // Simulate streaming by adding characters gradually
        let currentIndex = 0
        const typingInterval = setInterval(() => {
          if (currentIndex <= randomResponse.length) {
            setMessages(prev => prev.map(msg =>
              msg.id === assistantMessageId
                ? { ...msg, content: randomResponse.slice(0, currentIndex) }
                : msg
            ))
            currentIndex += 3
          } else {
            clearInterval(typingInterval)
            setIsLoading(false)
          }
        }, 30)
      }, 100)

    } catch (error: any) {
      console.error('Failed to send message:', error)
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const copyHtmlContent = async () => {
    try {
      await navigator.clipboard.writeText(htmlContent)
      alert('HTML content copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy HTML:', error)
    }
  }

  const downloadHtml = () => {
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const element = document.createElement('a')
    element.href = url
    element.download = `stock-analysis-${new Date().toISOString().split('T')[0]}.html`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="h-screen bg-gray-50 overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white h-18 flex-shrink-0 shadow-sm">
        <div className="flex items-center space-x-4">
          {/* <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-gray-900 to-black rounded-xl shadow-md">
            <Bot className="w-6 h-6 text-white" />
          </div> */}
          <div>
            <h1 className="text-xl font-bold text-gray-900">Stock Performance Discussion</h1>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="font-medium">Performance Agent Active</span>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push('/analysis')}
          className="flex items-center space-x-2 border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Analysis</span>
        </Button>
      </div>

      {/* Main Content Area */}
      <div className="flex h-[calc(100vh-72px)]">
        {/* Left Chat - 70% */}
        {!isCanvasFullscreen && (
          <div className="w-[70%] border-r border-gray-200 bg-white flex flex-col">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8 bg-gradient-to-b from-white to-gray-50">
              {messages.filter(msg => msg.content.trim()).map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-3 ${
                    message.type === 'user' ? 'flex-row-reverse' : ''
                  }`}
                >
                  {/* Avatar */}
                  {/* <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
                    message.type === 'user'
                      ? 'bg-black text-white'
                      : 'bg-white text-gray-800 border border-gray-300'
                  }`}>
                    {message.type === 'user' ? (
                      <User className="w-5 h-5" />
                    ) : (
                      <Bot className="w-5 h-5" />
                    )}
                  </div> */}

                  {/* Message Content */}
                  <div className={`flex-1 ${message.type === 'user' ? 'flex flex-col items-end' : 'flex flex-col items-start'}`}>
                    <div className={`inline-block max-w-[85%] px-6 py-4 shadow-sm ${
                      message.type === 'user'
                        ? 'bg-black text-white rounded-[20px] rounded-tr-md'
                        : 'bg-white text-gray-900 rounded-[20px] rounded-tl-md border border-gray-200'
                    }`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>
                    <div className={`mt-1.5 text-[11px] font-medium text-gray-400 px-1`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}

              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="border-t border-gray-200 px-8 py-6 bg-white">
              <div className="relative">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask questions about the report or request specific insights..."
                  className="w-full px-6 py-4 pr-16 text-sm border border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-gray-50 hover:bg-white transition-colors font-medium placeholder:text-gray-400"
                  rows={1}
                  style={{ minHeight: '56px', maxHeight: '120px' }}
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isLoading}
                  className="absolute right-2 bottom-2 bg-gradient-to-br from-gray-900 to-black hover:from-gray-800 hover:to-gray-900 text-white w-12 h-12 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all duration-200 hover:shadow-xl flex items-center justify-center"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Right HTML Preview - 30% */}
        <div className={`${isCanvasFullscreen ? 'w-full' : 'w-[30%]'} bg-gray-100 flex flex-col`}>
          {/* Canvas Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-gray-900">Live Report</h3>
                  <p className="text-xs text-gray-600 truncate font-medium">{reportStats.stockSymbol}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyHtmlContent}
                  disabled={!htmlContent}
                  className="text-xs border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadHtml}
                  disabled={!htmlContent}
                  className="text-xs border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCanvasFullscreen(!isCanvasFullscreen)}
                  className="text-xs border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  {isCanvasFullscreen ? (
                    <Minimize2 className="w-3 h-3" />
                  ) : (
                    <Maximize2 className="w-3 h-3" />
                  )}
                </Button>
              </div>
            </div>

            {/* Real-time Stats */}
            {htmlContent && (
              <div className="space-y-2">
                {/* Compact Info Grid */}
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg px-4 py-3 border border-gray-200">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 font-medium">Report Size</span>
                      <span className="text-sm font-bold text-gray-900">{reportStats.reportSize}</span>
                    </div>
                    <div className="h-px bg-gray-200"></div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 font-medium">Content Length</span>
                      <span className="text-sm font-bold text-gray-900">{reportStats.contentLength.toLocaleString()} chars</span>
                    </div>
                    <div className="h-px bg-gray-200"></div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 font-medium">Last Updated</span>
                      <span className="text-sm font-bold text-gray-900">{reportStats.lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="bg-black rounded-lg px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <div className="absolute inset-0 w-2 h-2 bg-green-400 rounded-full animate-ping opacity-75"></div>
                    </div>
                    <span className="text-xs font-bold text-white">Live Preview</span>
                  </div>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Active</span>
                </div>
              </div>
            )}
          </div>

          {/* HTML Preview */}
          <div className="flex-1 overflow-hidden bg-white m-4 rounded-xl shadow-sm border border-gray-200">
            {htmlContent ? (
              <iframe
                ref={iframeRef}
                srcDoc={htmlContent}
                className="w-full h-full border-none rounded-xl"
                title="HTML Report Preview"
                sandbox="allow-same-origin allow-scripts"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                  <FileText className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">No Report Generated</h3>
                <p className="text-gray-500 text-sm max-w-sm leading-relaxed">
                  Start a conversation with the performance agent to generate your first interactive HTML stock analysis report.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}