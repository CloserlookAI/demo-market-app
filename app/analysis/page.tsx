"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DashboardLayout } from "@/components/dashboard-layout"
import { BarChart3, TrendingUp, Building2, Users, Eye, Download, Send, Bot } from "lucide-react"

export default function AnalysisPage() {
  const [inputValue, setInputValue] = useState("")
  const router = useRouter()

  const handleStarterClick = (text: string) => {
    setInputValue(text)
  }

  const handleSend = () => {
    if (inputValue.trim()) {
      // Navigate to chat page with the query
      router.push(`/chat?query=${encodeURIComponent(inputValue)}`)
    }
  }


  return (
    <DashboardLayout hideChatWidget={true}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-8 h-8" />
            <h1 className="text-3xl font-bold text-gray-900">Analysis</h1>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Real-time data</span>
          </div>
        </div>

        {/* Welcome Section */}
        <Card className="text-center py-8 mb-8">
          <CardContent>
            <BarChart3 className="mx-auto mb-4 text-gray-400 w-12 h-12" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Analysis Dashboard
            </h3>
            <p className="text-gray-600">
              Comprehensive stock analysis tools and reports for informed investment decisions.
            </p>
          </CardContent>
        </Card>

        {/* Analysis Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Performance Report Card */}
          <Card className="hover:shadow-lg transition-all duration-200">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-black" />
                </div>
                <div>
                  <CardTitle className="text-xl text-gray-900">Performance Report</CardTitle>
                  <p className="text-base text-gray-600 mt-1">Track stock performance metrics</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-base text-gray-600 mb-6">
                Generate and discuss interactive HTML reports with AI assistance for comprehensive stock performance analysis.
              </p>
              <Button
                onClick={() => router.push('/analysis/discuss')}
                className="w-full bg-black hover:bg-gray-800 text-white py-3 text-base font-medium"
              >
                Discuss
              </Button>
            </CardContent>
          </Card>

          {/* Market Report Card */}
          <Card className="hover:shadow-lg transition-all duration-200">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Building2 className="w-6 h-6 text-black" />
                </div>
                <div>
                  <CardTitle className="text-xl text-gray-900">Market Report</CardTitle>
                  <p className="text-base text-gray-600 mt-1">Overall market analysis</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-base text-gray-600 mb-6">
                In-depth market analysis covering sector trends, market sentiment, and macroeconomic factors affecting stock performance.
              </p>
              <Button
                disabled
                className="w-full bg-gray-400 text-white py-3 text-base font-medium cursor-not-allowed"
              >
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          {/* Competitive Overview Card */}
          <Card className="hover:shadow-lg transition-all duration-200">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Users className="w-6 h-6 text-black" />
                </div>
                <div>
                  <CardTitle className="text-xl text-gray-900">Competitive Overview</CardTitle>
                  <p className="text-base text-gray-600 mt-1">Industry and peer comparison</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-base text-gray-600 mb-6">
                Detailed competitive analysis comparing performance against industry peers and market leaders in the same sector.
              </p>
              <Button
                onClick={() => router.push('/analysis/competitive')}
                className="w-full bg-black hover:bg-gray-800 text-white py-3 text-base font-medium"
              >
                Discuss
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* RemoteAgent Assistant Section */}
        <div className="mt-12">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Bot className="w-6 h-6 text-black" />
                </div>
                <div>
                  <CardTitle className="text-xl text-gray-900">RemoteAgent Assistant</CardTitle>
                  <p className="text-base text-gray-600 mt-1">Ask our AI assistant for detailed market analysis and insights</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Input Field and Send Button */}
              <div className="flex space-x-3 mb-6">
                <input
                  type="text"
                  placeholder="Ask RemoteAgent about stocks, markets, or analysis..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  className="flex-1 px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white"
                />
                <Button
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                  className="bg-black hover:bg-gray-800 text-white px-6 text-base disabled:opacity-50 disabled:cursor-not-allowed h-[52px]"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send
                </Button>
              </div>

            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}