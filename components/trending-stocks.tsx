"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AnimatedStockCard } from "@/components/animated-stock-card"
import { getTrendingStocks } from "@/lib/stock-api"
import { useEffect, useState } from "react"
import type { StockQuote } from "@/lib/stock-api"

export function TrendingStocks() {
  const [stocks, setStocks] = useState<StockQuote[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate API loading
    const timer = setTimeout(() => {
      setStocks(getTrendingStocks())
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <section className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-balance">Trending Stocks</h2>
          <Button variant="outline" disabled>
            View All
          </Button>
        </div>
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-muted-foreground">Loading market data...</span>
            </div>
          </CardContent>
        </Card>
      </section>
    )
  }

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-6 animate-slide-right">
        <h2 className="text-3xl font-bold text-balance">Trending Stocks</h2>
        <Button variant="outline" className="hover-lift bg-transparent">
          View All
        </Button>
      </div>

      <Card className="animate-fade-in hover-glow transition-all duration-300">
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {stocks.map((stock, index) => (
              <AnimatedStockCard key={stock.symbol} stock={stock} index={index} />
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
