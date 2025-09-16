"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown } from "lucide-react"
import { type StockQuote, formatCurrency, formatNumber, formatVolume } from "@/lib/stock-api"

interface StockCardProps {
  stock: StockQuote
  detailed?: boolean
}

export function StockCard({ stock, detailed = false }: StockCardProps) {
  const isPositive = stock.change >= 0
  const TrendIcon = isPositive ? TrendingUp : TrendingDown
  const trendColor = isPositive ? "text-chart-4" : "text-destructive"

  if (detailed) {
    return (
      <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <span className="text-lg font-bold text-primary">{stock.symbol.slice(0, 2)}</span>
              </div>
              <div>
                <CardTitle className="text-lg">{stock.symbol}</CardTitle>
                <p className="text-sm text-muted-foreground">{stock.name}</p>
              </div>
            </div>
            <Badge variant={isPositive ? "default" : "destructive"} className="gap-1">
              <TrendIcon className="w-3 h-3" />
              {stock.changePercent > 0 ? "+" : ""}
              {stock.changePercent.toFixed(2)}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{formatCurrency(stock.price)}</span>
            <span className={`text-sm font-medium ${trendColor}`}>
              {stock.change > 0 ? "+" : ""}
              {formatCurrency(stock.change)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Open:</span>
                <span className="font-medium">{formatCurrency(stock.open)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">High:</span>
                <span className="font-medium">{formatCurrency(stock.high)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Low:</span>
                <span className="font-medium">{formatCurrency(stock.low)}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Volume:</span>
                <span className="font-medium">{formatVolume(stock.volume)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Prev Close:</span>
                <span className="font-medium">{formatCurrency(stock.previousClose)}</span>
              </div>
              {stock.marketCap && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Market Cap:</span>
                  <span className="font-medium">{formatNumber(stock.marketCap)}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer group">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
          <span className="text-sm font-bold text-primary">{stock.symbol.slice(0, 2)}</span>
        </div>
        <div>
          <div className="font-semibold">{stock.symbol}</div>
          <div className="text-sm text-muted-foreground">{stock.name}</div>
        </div>
      </div>

      <div className="text-right">
        <div className="font-bold text-lg">{formatCurrency(stock.price)}</div>
        <div className="flex items-center gap-1">
          <TrendIcon className={`w-4 h-4 ${trendColor}`} />
          <span className={trendColor}>
            {stock.changePercent > 0 ? "+" : ""}
            {stock.changePercent.toFixed(2)}%
          </span>
          <span className="text-muted-foreground text-sm">{formatCurrency(stock.change)}</span>
        </div>
      </div>
    </div>
  )
}
