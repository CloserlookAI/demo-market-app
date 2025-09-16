"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AnimatedStockCard } from "@/components/animated-stock-card"
import { getMockStockQuote } from "@/lib/stock-api"
import { Plus, Star } from "lucide-react"

export function Watchlist() {
  const watchlistSymbols = ["AAPL", "TSLA", "NVDA"]
  const watchlistStocks = watchlistSymbols.map((symbol) => getMockStockQuote(symbol))

  return (
    <Card className="animate-fade-in hover-glow transition-all duration-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-accent animate-pulse-subtle" />
            <CardTitle>My Watchlist</CardTitle>
          </div>
          <Button variant="outline" size="sm" className="gap-2 bg-transparent hover-lift">
            <Plus className="w-4 h-4" />
            Add Stock
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {watchlistStocks.map((stock, index) => (
          <AnimatedStockCard key={stock.symbol} stock={stock} detailed index={index} />
        ))}
      </CardContent>
    </Card>
  )
}
