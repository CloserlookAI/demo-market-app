"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Newspaper, ExternalLink } from "lucide-react"

interface NewsItem {
  title: string
  summary: string
  url: string
  type: string
  uuid: string
  publisher: string
  providerPublishTime: number
  thumbnail?: {
    resolutions?: Array<{ url: string; width: number; height: number }>
  }
  relatedTickers?: string[]
}


export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState("general")

  const categories = [
    { id: "general", name: "General", color: "bg-blue-100 text-blue-800" },
    { id: "stocks", name: "Stocks", color: "bg-green-100 text-green-800" },
    { id: "crypto", name: "Crypto", color: "bg-purple-100 text-purple-800" },
    { id: "earnings", name: "Earnings", color: "bg-orange-100 text-orange-800" }
  ]

  useEffect(() => {
    loadNews(selectedCategory)
  }, [selectedCategory])

  const loadNews = async (category: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/news?category=${category}`)
      const data = await response.json()
      setNews(data.news || [])
    } catch (error) {
      console.error("Failed to load news:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const handleNewsClick = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer")
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Newspaper className="w-8 h-8" />
            <h1 className="text-3xl font-bold text-gray-900">Market News</h1>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live updates</span>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex space-x-3 mb-8 overflow-x-auto">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                selectedCategory === category.id
                  ? "bg-black text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-4"></div>
                  <div className="flex space-x-2">
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* News Grid */}
        {!isLoading && news.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {news.map((article) => (
              <Card
                key={article.uuid}
                className="cursor-pointer hover:shadow-lg transition-shadow duration-200 group"
                onClick={() => handleNewsClick(article.url)}
              >
                <CardContent className="p-6">
                  {/* Thumbnail */}
                  {article.thumbnail?.resolutions?.[0] && (
                    <div className="mb-4 rounded-lg overflow-hidden">
                      <img
                        src={article.thumbnail.resolutions[0].url}
                        alt=""
                        className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-200"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {/* Title */}
                  <h3 className="font-semibold text-gray-900 mb-3 line-clamp-3 group-hover:text-blue-600 transition-colors">
                    {article.title}
                  </h3>

                  {/* Summary */}
                  <p className="text-sm text-gray-600 mb-4 line-clamp-4">
                    {article.summary}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <span className="font-medium">{article.publisher}</span>
                    <span>{formatDate(article.providerPublishTime)}</span>
                  </div>

                  {/* Tags */}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {article.relatedTickers?.slice(0, 3).map((ticker) => (
                        <Badge
                          key={ticker}
                          variant="secondary"
                          className="text-xs bg-gray-100 text-gray-700"
                        >
                          {ticker}
                        </Badge>
                      ))}
                      <Badge
                        variant="secondary"
                        className={`text-xs ${
                          categories.find((c) => c.id === selectedCategory)?.color ||
                          "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {article.type}
                      </Badge>
                    </div>
                    <ExternalLink className="w-4 h-4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && news.length === 0 && (
          <Card className="text-center py-16">
            <CardContent>
              <Newspaper className="mx-auto mb-4 text-gray-400 w-12 h-12" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No news available</h3>
              <p className="text-gray-600">
                We couldn't load news for this category. Please try again later.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}