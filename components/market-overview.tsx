"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from "lucide-react"
import { type MarketIndex, getMockMarketIndices, formatCurrency } from "@/lib/stock-api"
import { useEffect, useState } from "react"

export function MarketOverview() {
  const [indices, setIndices] = useState<MarketIndex[]>([])
  const [portfolioValue] = useState(127456.78)
  const [portfolioChange] = useState(2634.12)
  const [portfolioChangePercent] = useState(2.1)

  useEffect(() => {
    setIndices(getMockMarketIndices())
  }, [])

  const getIcon = (symbol: string) => {
    switch (symbol) {
      case "SPX":
        return <BarChart3 className="h-4 w-4 text-chart-1" />
      case "IXIC":
        return <TrendingUp className="h-4 w-4 text-chart-2" />
      case "DJI":
        return <TrendingDown className="h-4 w-4 text-chart-3" />
      default:
        return <BarChart3 className="h-4 w-4 text-chart-4" />
    }
  }

  return (
    <section className="mb-8 animate-fade-in">
      <h2 className="text-3xl font-bold mb-6 text-balance">Market Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {indices.map((index, i) => {
          const isPositive = index.change >= 0
          const TrendIcon = isPositive ? TrendingUp : TrendingDown
          const trendColor = isPositive ? "text-chart-4" : "text-destructive"

          return (
            <Card
              key={index.symbol}
              className="animate-slide-up hover:shadow-lg transition-shadow"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{index.name}</CardTitle>
                {getIcon(index.symbol)}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{index.value.toLocaleString()}</div>
                <div className="flex items-center gap-1 text-sm">
                  <TrendIcon className={`h-4 w-4 ${trendColor}`} />
                  <span className={trendColor}>
                    {index.changePercent > 0 ? "+" : ""}
                    {index.changePercent.toFixed(1)}%
                  </span>
                  <span className="text-muted-foreground">
                    {index.change > 0 ? "+" : ""}
                    {index.change.toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {/* Portfolio Value Card */}
        <Card className="animate-slide-up hover:shadow-lg transition-shadow" style={{ animationDelay: "0.4s" }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Portfolio Value</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(portfolioValue)}</div>
            <div className="flex items-center gap-1 text-sm">
              <TrendingUp className="h-4 w-4 text-chart-4" />
              <span className="text-chart-4">+{portfolioChangePercent}%</span>
              <span className="text-muted-foreground">+{formatCurrency(portfolioChange)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
