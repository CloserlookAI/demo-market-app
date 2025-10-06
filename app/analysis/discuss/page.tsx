"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Send, Bot, User, ArrowLeft, Loader2, MessageCircle, FileText, Download, Copy, Edit3, Maximize2, Minimize2, RefreshCw } from "lucide-react"

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
  const [currentAgentName, setCurrentAgentName] = useState<string | null>(null)
  const [isRemixing, setIsRemixing] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
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
  const hasRemixed = useRef(false)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  // Function to create a remixed agent
  const createRemixedAgent = async (): Promise<string | null> => {
    if (hasRemixed.current || isRemixing) {
      console.log('Already remixed or remixing, returning current agent:', currentAgentName)
      return currentAgentName
    }

    setIsRemixing(true)
    hasRemixed.current = true

    try {
      console.log('Creating remixed agent for new session...')
      const response = await fetch('/api/agents/remix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
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

  // Function to load HTML report from a specific agent
  const loadHtmlFromAgent = async (agentName: string) => {
    try {
      console.log('Loading HTML report from agent:', agentName)
      // Add cache-busting parameter to ensure fresh data
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/agent-files/read?agent=${agentName}&_=${timestamp}`)
      const data = await response.json()

      if (data.success && data.content && data.content.trim()) {
        console.log('HTML content loaded from remixed agent, length:', data.content.length)
        setHtmlContent(data.content)

        // Extract text content from HTML for context
        const parser = new DOMParser()
        const doc = parser.parseFromString(data.content, 'text/html')
        const textContent = doc.body.textContent || ""
        setReportContext(textContent)

        // Update report stats
        const titleElement = doc.querySelector('h1, h2, title')
        let stockSymbol = 'Stock Analysis'
        const titleText = titleElement?.textContent || ''
        const symbolMatch = titleText.match(/\b[A-Z]{2,5}\b/)
        if (symbolMatch) {
          stockSymbol = symbolMatch[0]
        } else if (titleText.includes('Stock') || titleText.includes('Performance')) {
          stockSymbol = 'Performance Report'
        }

        const dataPoints = doc.querySelectorAll('td, tr, .data-point, [class*="value"], [class*="metric"]').length
        const reportSize = `${(data.content.length / 1024).toFixed(1)} KB`
        const contentLength = textContent.length

        setReportStats({
          lastUpdated: new Date(),
          stockSymbol,
          dataPoints,
          analysisType: 'Performance Analysis',
          reportSize,
          contentLength
        })
      }
    } catch (error) {
      console.error('Failed to load HTML from remixed agent:', error)
    }
  }

  // Initialize - create remixed agent and load its HTML on page load
  useEffect(() => {
    setMessages([])

    const initializeWithRemixedAgent = async () => {
      try {
        console.log('Creating remixed agent on page load...')

        // Create the remixed agent immediately
        const newAgentName = await createRemixedAgent()

        if (newAgentName) {
          console.log('Remixed agent created on load:', newAgentName)
          // HTML is already loaded by createRemixedAgent via loadHtmlFromAgent
        } else {
          console.error('Failed to create remixed agent on load, trying fallback...')
          // Fallback to original report if remix fails
          const timestamp = new Date().getTime()
          const response = await fetch(`/api/agent-files/read?_=${timestamp}`)
          const data = await response.json()

          console.log('Fallback API response:', data)

          if (data.success && data.content && data.content.trim()) {
            console.log('Loaded fallback HTML from original agent, length:', data.content.length)
            setHtmlContent(data.content)

            // Extract and set report stats
            const parser = new DOMParser()
            const doc = parser.parseFromString(data.content, 'text/html')
            const textContent = doc.body.textContent || ""

            const titleElement = doc.querySelector('h1, h2, title')
            let stockSymbol = 'Stock Analysis'
            const titleText = titleElement?.textContent || ''
            const symbolMatch = titleText.match(/\b[A-Z]{2,5}\b/)
            if (symbolMatch) {
              stockSymbol = symbolMatch[0]
            }

            setReportStats({
              lastUpdated: new Date(),
              stockSymbol,
              dataPoints: doc.querySelectorAll('td, tr').length,
              analysisType: 'Performance Analysis',
              reportSize: `${(data.content.length / 1024).toFixed(1)} KB`,
              contentLength: textContent.length
            })
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

      // Send message to the remixed agent
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
        // Add a small delay to ensure the file is written on the server
        console.log('Reloading HTML from agent after response...')
        await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds
        await loadHtmlFromAgent(agentName)
      }

    } catch (error: any) {
      // Log error but don't show to user - just keep loading state
      console.error('Unexpected error:', error)
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

  const refreshHtml = async () => {
    if (isRefreshing || !currentAgentName) return

    setIsRefreshing(true)
    try {
      console.log('Manually refreshing HTML from agent:', currentAgentName)
      await loadHtmlFromAgent(currentAgentName)
    } catch (error) {
      console.error('Failed to refresh HTML:', error)
    } finally {
      setIsRefreshing(false)
    }
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
              <span className="font-medium">
                {currentAgentName ? `Agent: ${currentAgentName}` : isRemixing ? 'Creating session agent...' : 'Performance Agent Active'}
              </span>
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
        {/* Left Chat - 50% */}
        {!isCanvasFullscreen && (
          <div className="w-[50%] border-r border-gray-200 bg-white flex flex-col">
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

              {/* Loading Animation */}
              {isLoading && (
                <div className="flex items-start gap-3">
                  <div className="flex-1 flex flex-col items-start">
                    <div className="inline-block px-6 py-4 bg-white text-gray-900 rounded-[20px] rounded-tl-md border border-gray-200 shadow-sm">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Agent responding</span>
                        <span className="flex space-x-1">
                          <span className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

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

        {/* Right HTML Preview - 50% */}
        <div className={`${isCanvasFullscreen ? 'w-full' : 'w-[50%]'} bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col`}>
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
                  onClick={refreshHtml}
                  disabled={isRefreshing || !currentAgentName}
                  className="text-xs border-gray-300 hover:bg-gray-50 transition-colors"
                  title="Refresh report"
                >
                  <RefreshCw className={`w-3 h-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
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

          </div>

          {/* HTML Preview */}
          <div className="flex-1 overflow-hidden p-6">
            <div className="h-full bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
              {htmlContent ? (
                <iframe
                  ref={iframeRef}
                  srcDoc={htmlContent}
                  className="w-full h-full border-none"
                  title="HTML Report Preview"
                  sandbox="allow-same-origin allow-scripts"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl flex items-center justify-center mb-6 shadow-md">
                    <FileText className="w-12 h-12 text-blue-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Loading Report...</h3>
                  <p className="text-gray-500 text-sm max-w-md leading-relaxed mb-6">
                    Preparing your stock performance report from the remixed agent.
                  </p>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}