"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Send, Bot, User, ArrowLeft, Loader2, MessageCircle, FileText, Download, Copy, Edit3, Maximize2, Minimize2 } from "lucide-react"

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
}

function ChatPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [canvasContent, setCanvasContent] = useState("")
  const [isCanvasFullscreen, setIsCanvasFullscreen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  useEffect(() => {
    const initialQuery = searchParams.get('query')
    if (initialQuery) {
      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: initialQuery,
        timestamp: new Date()
      }
      setMessages([userMessage])
      getRemoteAgentResponse(initialQuery)
    }
  }, [searchParams])

  const getRemoteAgentResponse = async (prompt: string) => {
    console.log('🔍 Sending prompt to RemoteAgent:', prompt)
    setIsLoading(true)
    try {
      const requestBody = {
        prompt: prompt,
        symbol: null,
        data: null
      }
      console.log('📤 Request body:', requestBody)

      const response = await fetch('/api/remoteagent/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

        // Update canvas with the analysis content
        setCanvasContent(result.analysis)
      } else {
        const errorResponse: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: result.error || 'Sorry, I encountered an error while processing your request. Please try again.',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, errorResponse])
      }
    } catch (error) {
      console.error('Error getting RemoteAgent response:', error)
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Sorry, I\'m having trouble connecting to the RemoteAgent service. Please try again later.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorResponse])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return

    console.log('💬 User sending message:', inputValue)

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    const currentInput = inputValue
    console.log('🚀 About to send to RemoteAgent:', currentInput)
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
    element.download = `analysis-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <div className="h-screen bg-white overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white h-16 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-black rounded-full">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">RemoteAgent Canvas</h1>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>AI Assistant Active</span>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push('/analysis')}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Analysis</span>
        </Button>
      </div>

      {/* Main Content Area */}
      <div className="flex h-[calc(100vh-64px)]">
        {/* Left Chat - 70% */}
        {!isCanvasFullscreen && (
          <div className="w-[70%] border-r border-gray-200 bg-white flex flex-col">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <MessageCircle className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Start a conversation</h3>
                  <p className="text-gray-500 max-w-sm">
                    Ask me anything about stocks, markets, financial analysis, or investment strategies.
                  </p>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start space-x-3 ${
                    message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.type === 'user'
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {message.type === 'user' ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </div>

                  {/* Message Content */}
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

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <div className="inline-block bg-gray-100 p-4 rounded-2xl rounded-tl-md">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                        <span className="text-sm text-gray-600">Analyzing and updating canvas...</span>
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
                    placeholder="Type your message..."
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
        )}

        {/* Right Canvas - 30% */}
        <div className={`${isCanvasFullscreen ? 'hidden' : 'w-[30%]'} bg-gray-50 flex flex-col`}>
          {/* Canvas Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-900">Analysis Canvas</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyCanvasContent}
                disabled={!canvasContent}
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadCanvasContent}
                disabled={!canvasContent}
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCanvasFullscreen(true)}
                disabled={!canvasContent}
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Canvas Content */}
          <div className="flex-1 p-4 overflow-y-auto">
            {canvasContent ? (
              <div
                ref={canvasRef}
                className="prose prose-sm max-w-none text-gray-800 leading-relaxed"
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
                <h3 className="text-base font-medium text-gray-900 mb-2">Analysis Canvas</h3>
                <p className="text-gray-500 text-sm max-w-xs">
                  Send a message to generate analysis content that will appear here.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Fullscreen Canvas */}
        {isCanvasFullscreen && (
          <div className="w-full flex flex-col bg-white">
            {/* Fullscreen Canvas Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-900">Analysis Canvas - Full Screen</span>
              </div>
              <div className="flex items-center space-x-2">
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCanvasFullscreen(false)}
                >
                  <Minimize2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Fullscreen Canvas Content */}
            <div className="flex-1 p-8 overflow-y-auto">
              <div
                className="prose prose-lg max-w-none text-gray-800 leading-relaxed"
                style={{
                  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
                }}
              >
                <pre className="whitespace-pre-wrap text-base leading-relaxed text-gray-800">
                  {canvasContent}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading canvas...</span>
        </div>
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  )
}