"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Send, X, Minimize2, Maximize2, Bot, User, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant" as const,
      content: `Welcome to StockFlow AI Assistant! I'm here to help you with:

• Stock analysis and market insights
• Trading strategies and recommendations
• Portfolio management guidance
• Financial education and explanations
• Real-time market data interpretation

How can I assist you with your trading today?`,
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<any>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage = {
      id: Date.now().toString(),
      role: "user" as const,
      content: input.trim()
    }
    setMessages(prev => [...prev, userMessage])
    setInput("")

    setTimeout(() => {
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant" as const,
        content: "Thank you for your question! The AI assistant is ready to help once the API configuration is complete. In the meantime, I can provide general guidance on stock market topics."
      }
      setMessages(prev => [...prev, assistantMessage])
    }, 1000)
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

  const suggestedQuestions = [
    "What are the top performing stocks today?",
    "Should I invest in tech stocks right now?",
    "How do I analyze market volatility?",
    "What's a good portfolio diversification strategy?",
    "Explain P/E ratios in simple terms",
  ]

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative group">
          <Button
            onClick={() => setIsOpen(true)}
            size="lg"
            className="rounded-full w-16 h-16 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-black hover:bg-gray-800 border-2 border-gray-200"
          >
            <MessageCircle className="w-7 h-7 text-white" />
          </Button>

          {/* Status indicator */}
          <div className="absolute -top-1 -right-1">
            <div className="w-5 h-5 bg-green-500 rounded-full animate-pulse shadow-md">
              <div className="w-full h-full bg-white/20 rounded-full animate-ping"></div>
            </div>
          </div>

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
    <div className="fixed bottom-6 right-6 z-50">
      <Card className={cn(
        "w-[420px] shadow-xl border border-gray-200 transition-all duration-300 bg-white",
        isMinimized ? "h-16" : "h-[650px]",
        "animate-fade-in"
      )}>
        <CardHeader className="flex flex-row items-center justify-between p-4 bg-black text-white rounded-t-lg border-b border-gray-200">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/20">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm font-semibold leading-tight truncate text-white">StockFlow AI</CardTitle>
              <div className="flex items-center gap-2 text-xs opacity-90 mt-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-sm" />
                <span className="truncate">Professional Assistant</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
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
          <CardContent className="flex flex-col h-[calc(650px-64px)] p-0 bg-white">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3 animate-fade-in",
                    message.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[75%] rounded-lg px-4 py-3 text-sm shadow-sm",
                      message.role === "user"
                        ? "bg-black text-white ml-auto"
                        : "bg-gray-50 text-gray-900 border border-gray-200",
                    )}
                  >
                    <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
                    {message.role === "assistant" && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
                        <Sparkles className="w-3 h-3" />
                        <span>AI Assistant</span>
                      </div>
                    )}
                  </div>
                  {message.role === "user" && (
                    <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                      <User className="w-4 h-4 text-gray-600" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 justify-start animate-fade-in">
                  <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-black rounded-full animate-bounce" />
                      <div
                        className="w-2 h-2 bg-black rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      />
                      <div
                        className="w-2 h-2 bg-black rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                      <span className="text-gray-600 ml-2">Analyzing...</span>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex gap-3 justify-start animate-fade-in">
                  <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Bot className="w-4 h-4 text-white" />
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
              <div className="px-6 pb-4 border-t border-gray-200 bg-gray-50/30">
                <div className="text-xs font-medium text-gray-600 mb-3 pt-4">💡 Try asking:</div>
                <div className="flex flex-wrap gap-2">
                  {suggestedQuestions.slice(0, 3).map((question, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="cursor-pointer hover:bg-black hover:text-white hover:border-black transition-all duration-200 text-xs py-2 px-3 rounded-md border-gray-300 bg-white text-gray-700 hover:scale-105"
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
                      {question}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="border-t border-gray-200 p-4 bg-gray-50/50">
              <form onSubmit={handleSubmit} className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Ask about stocks, market trends, or trading..."
                    className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white text-gray-900 placeholder-gray-500 transition-all duration-200"
                    disabled={isLoading}
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
                  disabled={isLoading || !input.trim()}
                  className="px-4 py-3 bg-black hover:bg-gray-800 text-white border-0 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </form>
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mt-3">
                <Sparkles className="w-3 h-3" />
                <span>AI responses are for informational purposes. Always do your own research.</span>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}