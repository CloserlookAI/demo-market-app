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

export default function DiscussPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [htmlContent, setHtmlContent] = useState("")
  const [isCanvasFullscreen, setIsCanvasFullscreen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  // Initialize with a welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: "welcome",
      type: "assistant",
      content: "Hello! I'm your stock performance analyst. I can help you generate and discuss interactive HTML reports for comprehensive stock analysis. What would you like to analyze?",
      timestamp: new Date()
    }
    setMessages([welcomeMessage])
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

    // TODO: Replace with actual RemoteAgent API call
    setIsLoading(true)

    // Simulate response for now
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "I'll help you with that analysis. Here's a sample HTML report that we can discuss and modify together.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, assistantMessage])

      // Sample HTML content
      const sampleHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Stock Performance Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
            .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .metric { display: inline-block; margin: 10px; padding: 20px; background: #f8f9fa; border-radius: 8px; text-align: center; }
            .metric-value { font-size: 24px; font-weight: bold; color: #2563eb; }
            .metric-label { font-size: 14px; color: #6b7280; margin-top: 5px; }
            .positive { color: #10b981; }
            .negative { color: #ef4444; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Stock Performance Analysis</h1>
              <p>Generated on ${new Date().toLocaleDateString()}</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <div class="metric">
                <div class="metric-value positive">+12.5%</div>
                <div class="metric-label">YTD Return</div>
              </div>
              <div class="metric">
                <div class="metric-value">$156.78</div>
                <div class="metric-label">Current Price</div>
              </div>
              <div class="metric">
                <div class="metric-value negative">-2.3%</div>
                <div class="metric-label">30-Day Change</div>
              </div>
            </div>

            <h2>Key Insights</h2>
            <ul>
              <li>Strong year-to-date performance with 12.5% gains</li>
              <li>Recent volatility showing in 30-day decline</li>
              <li>Volume trending above average</li>
            </ul>

            <h2>Recommendations</h2>
            <p>Based on current market conditions and technical analysis, consider monitoring for potential entry points during the current pullback phase.</p>
          </div>
        </body>
        </html>
      `
      setHtmlContent(sampleHtml)
      setIsLoading(false)
    }, 1500)
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
          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-gray-900 to-black rounded-xl shadow-md">
            <Bot className="w-6 h-6 text-white" />
          </div>
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
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start space-x-4 ${
                    message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
                    message.type === 'user'
                      ? 'bg-gradient-to-br from-gray-900 to-black text-white'
                      : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 border border-gray-200'
                  }`}>
                    {message.type === 'user' ? (
                      <User className="w-5 h-5" />
                    ) : (
                      <Bot className="w-5 h-5" />
                    )}
                  </div>

                  {/* Message Content */}
                  <div className={`flex-1 ${message.type === 'user' ? 'text-right' : ''}`}>
                    <div className={`inline-block max-w-[85%] px-6 py-4 shadow-sm ${
                      message.type === 'user'
                        ? 'bg-gradient-to-br from-gray-900 to-black text-white rounded-[24px] rounded-tr-lg'
                        : 'bg-white text-gray-900 rounded-[24px] rounded-tl-lg border border-gray-100'
                    }`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
                        {message.content}
                      </p>
                    </div>
                    <div className={`mt-2 text-xs font-medium ${message.type === 'user' ? 'text-gray-400 text-right' : 'text-gray-400'}`}>
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 border border-gray-200 flex items-center justify-center shadow-sm">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="bg-white rounded-[24px] rounded-tl-lg border border-gray-100 px-6 py-4 shadow-sm">
                    <div className="flex items-center space-x-3">
                      <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
                      <span className="text-sm font-medium text-gray-600">Generating report...</span>
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
                  placeholder="Discuss the report, request modifications, or ask for analysis..."
                  className="w-full px-6 py-4 pr-16 text-sm border border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-gray-50 hover:bg-white transition-colors font-medium placeholder:text-gray-400"
                  rows={1}
                  style={{ minHeight: '56px', maxHeight: '120px' }}
                />
                <Button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isLoading}
                  className="absolute right-2 bottom-2 bg-gradient-to-br from-gray-900 to-black hover:from-gray-800 hover:to-gray-900 text-white w-12 h-12 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all duration-200 hover:shadow-xl flex items-center justify-center"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Right HTML Preview - 30% */}
        <div className={`${isCanvasFullscreen ? 'w-full' : 'w-[30%]'} bg-gray-100 flex flex-col`}>
          {/* Canvas Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-gray-600" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">HTML Report</h3>
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