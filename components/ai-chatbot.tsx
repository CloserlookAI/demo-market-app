"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Send, X, Minimize2, Maximize2, Bot, User, Sparkles, Settings, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRemoteAgent } from "@/hooks/useRemoteAgent"

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<string>("")
  const [useRemoteAgentMode, setUseRemoteAgentMode] = useState(false)
  const [defaultAgentName, setDefaultAgentName] = useState<string>("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant" as const,
      content: `Welcome to StockFlow AI Assistant!

I'm your professional trading companion, ready to help you navigate the markets with confidence. Here's what I can assist you with:

**Market Analysis & Insights**
• Real-time stock analysis and technical indicators
• Market trends and sentiment analysis

**Trading & Investment Strategies**
• Portfolio optimization and diversification advice
• Risk management and position sizing

**Financial Education**
• Explaining complex financial concepts
• Trading terminology and market mechanics

**Data Interpretation**
• Chart pattern recognition
• Earnings reports and financial statements

Ready to explore the markets together? Ask me anything about stocks, trading, or investments!`,
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<any>(null)

  const {
    sendMessage: sendRemoteAgentMessage,
    isLoading: remoteAgentLoading,
    currentStatus,
    error: remoteAgentError,
  } = useRemoteAgent({
    onStatusUpdate: (status) => {
      // Update loading message with current status
      setMessages(prev => {
        const newMessages = [...prev]
        const lastMessage = newMessages[newMessages.length - 1]
        if (lastMessage && lastMessage.role === "assistant" && lastMessage.id === "loading") {
          lastMessage.content = `Processing your request... Status: ${status}`
        }
        return newMessages
      })
    },
    onComplete: (response) => {
      // Replace loading message with final response
      setMessages(prev => {
        const newMessages = [...prev]
        const lastMessage = newMessages[newMessages.length - 1]
        if (lastMessage && lastMessage.id === "loading") {
          lastMessage.content = response
          lastMessage.id = Date.now().toString()
        }
        return newMessages
      })
    },
    onError: (errorMessage) => {
      setError(errorMessage)
      // Replace loading message with error
      setMessages(prev => {
        const newMessages = [...prev]
        const lastMessage = newMessages[newMessages.length - 1]
        if (lastMessage && lastMessage.id === "loading") {
          lastMessage.content = `Sorry, I encountered an error: ${errorMessage}`
          lastMessage.id = Date.now().toString()
        }
        return newMessages
      })
    }
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage = {
      id: Date.now().toString(),
      role: "user" as const,
      content: input.trim()
    }
    setMessages(prev => [...prev, userMessage])
    const messageText = input.trim()
    setInput("")

    // Debug logging
    console.log('Submit Debug:', {
      useRemoteAgentMode,
      selectedAgent,
      defaultAgentName,
      condition: useRemoteAgentMode && (selectedAgent || defaultAgentName)
    })

    if (useRemoteAgentMode && (selectedAgent || defaultAgentName)) {
      // Use RemoteAgent
      setIsLoading(true)

      // Add loading message
      const loadingMessage = {
        id: "loading",
        role: "assistant" as const,
        content: "Connecting to RemoteAgent..."
      }
      setMessages(prev => [...prev, loadingMessage])

      try {
        await sendRemoteAgentMessage(messageText, selectedAgent || defaultAgentName)
      } catch (error) {
        console.error('RemoteAgent error:', error)
      } finally {
        setIsLoading(false)
      }
    } else {
      // Use default behavior (fallback message)
      setIsLoading(true)

      // Add debug info to the fallback message
      const debugInfo = !useRemoteAgentMode
        ? "RemoteAgent mode is disabled. Enable it in settings ⚙️"
        : "No agent configured. Check environment variables."

      setTimeout(() => {
        const assistantMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant" as const,
          content: `**Thank you for your question!**

I understand you're looking for insights about: "${messageText}"

**Current Status:** The AI assistant is configured and ready to help with market analysis once the API connection is established.

**In the meantime, here's what I recommend:**

**For ${messageText.toLowerCase().includes('stock') ? 'Stock Analysis' : messageText.toLowerCase().includes('market') ? 'Market Research' : 'Investment Research'}:**
• Check the real-time data in your dashboard
• Review recent market trends and patterns
• Consider technical indicators and volume analysis

**Quick Tips:**
• Always do your own research before investing
• Diversify your portfolio to manage risk
• Keep up with market news and earnings reports

**Technical Note:** ${debugInfo}

Feel free to ask more questions - I'm here to help guide your trading journey!`
        }
        setMessages(prev => [...prev, assistantMessage])
        setIsLoading(false)
      }, 1000)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen, isMinimized])

  // Fetch default agent name when component mounts or settings are opened
  useEffect(() => {
    if (isOpen && showSettings) {
      // Fetch default agent name from server
      fetch('/api/remoteagent/config')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.defaultAgentName) {
            setDefaultAgentName(data.defaultAgentName)
            if (!selectedAgent) {
              setSelectedAgent(data.defaultAgentName)
            }
          }
        })
        .catch(console.error)
    }
  }, [isOpen, showSettings, selectedAgent])

  const suggestedQuestions = [
    "Analyze the current market trend and volatility patterns",
    "What are the best risk management strategies for day trading?",
    "How do I interpret technical indicators like RSI and MACD?",
    "Explain portfolio diversification for a $50k investment",
    "What are the key metrics to evaluate before buying stocks?",
    "How do earnings reports impact stock prices?",
  ]

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="relative group">
          <Button
            onClick={() => setIsOpen(true)}
            size="lg"
            className="rounded-full w-16 h-16 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 bg-white border-2 border-gray-200 hover:border-gray-300 p-0"
          >
            <img
              src="https://avatars.githubusercontent.com/u/223376538?s=200&v=4"
              alt="AI Assistant"
              className="w-full h-full rounded-full object-cover"
            />
          </Button>

          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
              Chat with AI Assistant
              <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-16 right-4 z-50">
      <Card className={cn(
        "w-[450px] shadow-2xl border border-gray-300/50 transition-all duration-300 bg-white backdrop-blur-sm",
        isMinimized ? "h-16" : "h-[650px]",
        "animate-fade-in"
      )}>
        <CardHeader className="flex flex-row items-center justify-between p-4 bg-gradient-to-r from-gray-900 to-black text-white rounded-t-lg border-b border-gray-200 shadow-md">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-white/30 shadow-lg overflow-hidden bg-white">
              <img
                src="https://avatars.githubusercontent.com/u/223376538?s=200&v=4"
                alt="AI Assistant"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base font-bold leading-tight truncate text-white">StockFlow AI</CardTitle>
              <div className="flex items-center gap-2 text-xs opacity-90 mt-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="truncate">Professional Assistant • Online</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
              className={cn(
                "h-8 w-8 text-white hover:bg-white/10 rounded-md",
                showSettings && "bg-white/20"
              )}
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-8 w-8 text-white hover:bg-white/10 rounded-md"
              title={isMinimized ? "Maximize" : "Minimize"}
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 text-white hover:bg-white/10 rounded-md"
              title="Close"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="flex flex-col h-[calc(650px-64px)] p-0 bg-gradient-to-b from-gray-50/30 to-white">
            {/* Settings Panel */}
            {showSettings && (
              <div className="border-b border-gray-200 p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-900">RemoteAgent Settings</h3>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="useRemoteAgent"
                      checked={useRemoteAgentMode}
                      onChange={(e) => setUseRemoteAgentMode(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor="useRemoteAgent" className="text-sm text-gray-700">
                      Use RemoteAgent API
                    </label>
                  </div>

                  {useRemoteAgentMode && (
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-600">Agent Configuration:</label>

                      {defaultAgentName ? (
                        <div className="text-sm bg-green-50 border border-green-200 rounded-md px-3 py-2">
                          <div className="font-medium text-green-800">{defaultAgentName}</div>
                          <div className="text-xs text-green-600">✅ Ready to use</div>
                        </div>
                      ) : (
                        <div className="text-xs text-red-600 flex items-center gap-2">
                          <AlertCircle className="w-3 h-3" />
                          Set REMOTEAGENT_AGENT_NAME in environment variables
                        </div>
                      )}
                    </div>
                  )}

                  {remoteAgentError && (
                    <div className="text-xs text-red-600 flex items-center gap-2">
                      <AlertCircle className="w-3 h-3" />
                      {remoteAgentError}
                    </div>
                  )}

                  {currentStatus && (
                    <div className="text-xs text-blue-600">
                      Status: {currentStatus}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-transparent to-gray-50/20">
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3 animate-fade-in",
                    message.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  {message.role === "assistant" && (
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg border border-gray-200 overflow-hidden">
                      <img
                        src="https://avatars.githubusercontent.com/u/223376538?s=200&v=4"
                        alt="AI Assistant"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-md transition-all duration-200",
                      message.role === "user"
                        ? "bg-gradient-to-r from-gray-900 to-black text-white ml-auto shadow-lg"
                        : "bg-white text-gray-900 border border-gray-200/80 shadow-sm hover:shadow-md",
                    )}
                  >
                    <div className="whitespace-pre-wrap leading-relaxed text-sm">
                      {message.role === "assistant" ? (
                        <div className="space-y-3">
                          {message.content.split('\n\n').map((paragraph, i) => (
                            <div key={i} className={cn(
                              "leading-relaxed",
                              paragraph.startsWith('•') ? "ml-3 pl-2 border-l-2 border-blue-200 text-gray-700" : "",
                              paragraph.startsWith('**Technical Note:') ? "text-gray-700 text-xs bg-gray-50 px-3 py-2 rounded-lg border border-gray-200" : "",
                              paragraph.includes('**') ? "font-semibold text-gray-800" : "text-gray-700"
                            )}>
                              <div dangerouslySetInnerHTML={{
                                __html: paragraph
                                  .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>')
                                  .replace(/\n/g, '<br />')
                              }} />
                            </div>
                          ))}
                        </div>
                      ) : (
                        message.content
                      )}
                    </div>
                    {message.role === "assistant" && (
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Sparkles className="w-3 h-3 text-gray-500" />
                          <span>AI Assistant</span>
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    )}
                  </div>
                  {message.role === "user" && (
                    <div className="w-9 h-9 bg-gradient-to-br from-gray-700 to-black rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              ))}

              {(isLoading || remoteAgentLoading) && (
                <div className="flex gap-3 justify-start animate-fade-in">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg border border-gray-200 overflow-hidden">
                    <img
                      src="https://avatars.githubusercontent.com/u/223376538?s=200&v=4"
                      alt="AI Assistant"
                      className="w-full h-full object-cover animate-pulse"
                    />
                  </div>
                  <div className="bg-white border border-gray-200/80 rounded-2xl px-4 py-3 text-sm shadow-md">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" />
                        <div
                          className="w-2 h-2 bg-gray-700 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        />
                        <div
                          className="w-2 h-2 bg-gray-800 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        />
                      </div>
                      <span className="text-gray-600 font-medium">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex gap-3 justify-start animate-fade-in">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg border border-red-200 overflow-hidden">
                    <img
                      src="https://avatars.githubusercontent.com/u/223376538?s=200&v=4"
                      alt="AI Assistant"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 shadow-sm">
                    I encountered an error. Please try again.
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Questions */}
            {messages.length <= 1 && (
              <div className="px-6 pb-4 border-t border-gray-200 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
                <div className="text-sm font-semibold text-gray-700 mb-4 pt-4 flex items-center gap-2">
                  <span className="text-gray-600">▶</span>
                  Popular questions:
                </div>
                <div className="grid gap-2">
                  {suggestedQuestions.slice(0, 3).map((question, index) => (
                    <div
                      key={index}
                      className="cursor-pointer hover:bg-gradient-to-r hover:from-gray-900 hover:to-black hover:text-white transition-all duration-300 text-xs py-3 px-4 rounded-xl border border-gray-200 bg-white text-gray-700 hover:shadow-md hover:scale-[1.02] group"
                      onClick={() => {
                        setInput(question)
                        setTimeout(() => {
                          const form = inputRef.current?.closest("form")
                          if (form) {
                            form.requestSubmit()
                          }
                        }, 100)
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600 group-hover:text-white transition-colors">→</span>
                        {question}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="border-t border-gray-200 p-4 bg-gradient-to-r from-gray-50 to-white flex-shrink-0 mt-auto shadow-inner">
              <form onSubmit={handleSubmit} className="flex gap-3 items-center">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Ask about stocks, market trends, or trading..."
                    className="w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500 transition-all duration-200 shadow-sm hover:shadow-md"
                    disabled={isLoading || remoteAgentLoading}
                  />
                  {input && (
                    <button
                      type="button"
                      onClick={() => setInput("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isLoading || remoteAgentLoading || !input.trim()}
                  className="px-4 h-12 bg-gradient-to-r from-gray-900 to-black hover:from-gray-800 hover:to-gray-900 text-white border-0 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 flex-shrink-0 hover:scale-105"
                >
                  {(isLoading || remoteAgentLoading) ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </form>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}