"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, Star, Plus, MoreHorizontal } from "lucide-react"
import { type StockQuote, formatCurrency, formatNumber, formatVolume } from "@/lib/stock-api"
import { cn } from "@/lib/utils"

interface AnimatedStockCardProps {
  stock: StockQuote
  detailed?: boolean
  index?: number
}

export function AnimatedStockCard({ stock, detailed = false, index = 0 }: AnimatedStockCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isWatchlisted, setIsWatchlisted] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  const isPositive = stock.change >= 0
  const TrendIcon = isPositive ? TrendingUp : TrendingDown
  const trendColor = isPositive ? "text-chart-4" : "text-destructive"

  if (detailed) {
    return (
      <Card
        className={cn(
          "hover-lift hover-glow transition-all duration-500 animate-scale-in group cursor-pointer",
          isHovered && "scale-[1.02] shadow-2xl",
        )}
        style={{ animationDelay: `${index * 0.1}s` }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setShowDetails(!showDetails)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
                  isPositive
                    ? "bg-chart-4/10 group-hover:bg-chart-4/20"
                    : "bg-destructive/10 group-hover:bg-destructive/20",
                )}
              >
                <span
                  className={cn(
                    "text-lg font-bold transition-all duration-300",
                    isPositive ? "text-chart-4" : "text-destructive",
                  )}
                >
                  {stock.symbol.slice(0, 2)}
                </span>
              </div>
              <div>
                <CardTitle className="text-lg group-hover:text-primary transition-colors duration-300">
                  {stock.symbol}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{stock.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={isPositive ? "default" : "destructive"}
                className={cn("gap-1 transition-all duration-300", isHovered && "scale-110")}
              >
                <TrendIcon className="w-3 h-3" />
                {stock.changePercent > 0 ? "+" : ""}
                {stock.changePercent.toFixed(2)}%
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-all duration-300"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsWatchlisted(!isWatchlisted)
                }}
              >
                <Star
                  className={cn("w-4 h-4 transition-all duration-300", isWatchlisted && "fill-current text-accent")}
                />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{formatCurrency(stock.price)}</span>
            <span
              className={cn("text-sm font-medium transition-all duration-300", trendColor, isHovered && "scale-110")}
            >
              {stock.change > 0 ? "+" : ""}
              {formatCurrency(stock.change)}
            </span>
          </div>

          <div
            className={cn(
              "grid grid-cols-2 gap-4 text-sm transition-all duration-500 overflow-hidden",
              showDetails ? "max-h-96 opacity-100" : "max-h-24 opacity-100",
            )}
          >
            <div className="space-y-2">
              <div className="flex justify-between hover:bg-muted/50 p-1 rounded transition-colors duration-200">
                <span className="text-muted-foreground">Open:</span>
                <span className="font-medium">{formatCurrency(stock.open)}</span>
              </div>
              <div className="flex justify-between hover:bg-muted/50 p-1 rounded transition-colors duration-200">
                <span className="text-muted-foreground">High:</span>
                <span className="font-medium text-chart-4">{formatCurrency(stock.high)}</span>
              </div>
              <div className="flex justify-between hover:bg-muted/50 p-1 rounded transition-colors duration-200">
                <span className="text-muted-foreground">Low:</span>
                <span className="font-medium text-destructive">{formatCurrency(stock.low)}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between hover:bg-muted/50 p-1 rounded transition-colors duration-200">
                <span className="text-muted-foreground">Volume:</span>
                <span className="font-medium">{formatVolume(stock.volume)}</span>
              </div>
              <div className="flex justify-between hover:bg-muted/50 p-1 rounded transition-colors duration-200">
                <span className="text-muted-foreground">Prev Close:</span>
                <span className="font-medium">{formatCurrency(stock.previousClose)}</span>
              </div>
              {stock.marketCap && (
                <div className="flex justify-between hover:bg-muted/50 p-1 rounded transition-colors duration-200">
                  <span className="text-muted-foreground">Market Cap:</span>
                  <span className="font-medium">{formatNumber(stock.marketCap)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
            <Button size="sm" className="flex-1 hover-scale">
              <Plus className="w-4 h-4 mr-1" />
              Buy
            </Button>
            <Button variant="outline" size="sm" className="flex-1 hover-scale bg-transparent">
              <MoreHorizontal className="w-4 h-4 mr-1" />
              Details
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between p-4 hover:bg-muted/50 transition-all duration-300 cursor-pointer group animate-slide-up border-l-4 border-transparent hover:border-primary",
        isHovered && "bg-muted/50 scale-[1.01]",
      )}
      style={{ animationDelay: `${index * 0.05}s` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110",
            isPositive ? "bg-chart-4/10 group-hover:bg-chart-4/20" : "bg-destructive/10 group-hover:bg-destructive/20",
          )}
        >
          <span
            className={cn(
              "text-sm font-bold transition-colors duration-300",
              isPositive ? "text-chart-4" : "text-destructive",
            )}
          >
            {stock.symbol.slice(0, 2)}
          </span>
        </div>
        <div>
          <div className="font-semibold group-hover:text-primary transition-colors duration-300">{stock.symbol}</div>
          <div className="text-sm text-muted-foreground">{stock.name}</div>
        </div>
      </div>

      <div className="text-right">
        <div className="font-bold text-lg">{formatCurrency(stock.price)}</div>
        <div className="flex items-center gap-1">
          <TrendIcon className={cn("w-4 h-4 transition-all duration-300", trendColor, isHovered && "scale-110")} />
          <span className={cn("transition-all duration-300", trendColor)}>
            {stock.changePercent > 0 ? "+" : ""}
            {stock.changePercent.toFixed(2)}%
          </span>
          <span className="text-muted-foreground text-sm">{formatCurrency(stock.change)}</span>
        </div>
      </div>

      <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 ml-4">
        <Button variant="ghost" size="icon" className="h-8 w-8 hover-scale">
          <Star className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
