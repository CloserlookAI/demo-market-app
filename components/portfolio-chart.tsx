"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"
import { useState } from "react"
import { formatCurrency, formatNumber } from "@/lib/stock-api"

interface PortfolioHolding {
  symbol: string
  name: string
  value: number
  shares: number
  avgCost: number
  currentPrice: number
  change: number
  changePercent: number
}

interface PortfolioPerformance {
  date: string
  value: number
  benchmark: number
}

export function PortfolioChart() {
  const [view, setView] = useState<"allocation" | "performance">("allocation")

  // Mock portfolio data
  const holdings: PortfolioHolding[] = [
    {
      symbol: "AAPL",
      name: "Apple Inc.",
      value: 45000,
      shares: 250,
      avgCost: 165.5,
      currentPrice: 175.43,
      change: 2475,
      changePercent: 5.8,
    },
    {
      symbol: "TSLA",
      name: "Tesla Inc.",
      value: 32000,
      shares: 130,
      avgCost: 235.2,
      currentPrice: 248.87,
      change: 1777,
      changePercent: 5.9,
    },
    {
      symbol: "GOOGL",
      name: "Alphabet Inc.",
      value: 28000,
      shares: 200,
      avgCost: 142.1,
      currentPrice: 138.21,
      change: -778,
      changePercent: -2.7,
    },
    {
      symbol: "MSFT",
      name: "Microsoft Corp.",
      value: 22456,
      shares: 60,
      avgCost: 365.8,
      currentPrice: 378.85,
      change: 782,
      changePercent: 3.6,
    },
  ]

  // Generate performance data
  const performanceData: PortfolioPerformance[] = Array.from({ length: 30 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (29 - i))

    const baseValue = 120000
    const portfolioGrowth = (Math.random() - 0.4) * 0.02 // Slight upward bias
    const benchmarkGrowth = (Math.random() - 0.45) * 0.015 // Market benchmark

    return {
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: baseValue + i * 250 + Math.random() * 2000,
      benchmark: baseValue + i * 200 + Math.random() * 1500,
    }
  })

  const COLORS = ["#0ea5e9", "#f59e0b", "#ef4444", "#22c55e", "#8b5cf6"]

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm font-medium">
              {entry.name}:{" "}
              <span style={{ color: entry.color }}>
                {entry.name === "value" || entry.name === "benchmark" ? formatCurrency(entry.value) : `${entry.value}%`}
              </span>
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const totalValue = holdings.reduce((sum, holding) => sum + holding.value, 0)
  const totalChange = holdings.reduce((sum, holding) => sum + holding.change, 0)
  const totalChangePercent = (totalChange / (totalValue - totalChange)) * 100

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Portfolio Overview</CardTitle>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-2xl font-bold">{formatCurrency(totalValue)}</span>
              <span className={`text-sm font-medium ${totalChange >= 0 ? "text-chart-4" : "text-destructive"}`}>
                {totalChange >= 0 ? "+" : ""}
                {formatCurrency(totalChange)} ({totalChangePercent.toFixed(2)}%)
              </span>
            </div>
          </div>

          <div className="flex rounded-lg border border-border p-1">
            <Button
              variant={view === "allocation" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("allocation")}
              className="h-8 px-3 text-xs"
            >
              Allocation
            </Button>
            <Button
              variant={view === "performance" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("performance")}
              className="h-8 px-3 text-xs"
            >
              Performance
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {view === "allocation" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={holdings}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {holdings.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Holdings List */}
            <div className="space-y-4">
              {holdings.map((holding, index) => (
                <div key={holding.symbol} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <div>
                      <div className="font-semibold text-sm">{holding.symbol}</div>
                      <div className="text-xs text-muted-foreground">{holding.shares} shares</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm">{formatCurrency(holding.value)}</div>
                    <div className={`text-xs ${holding.change >= 0 ? "text-chart-4" : "text-destructive"}`}>
                      {holding.changePercent >= 0 ? "+" : ""}
                      {holding.changePercent.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={performanceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => formatNumber(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={3} dot={false} name="Portfolio" />
              <Line
                type="monotone"
                dataKey="benchmark"
                stroke="#64748b"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="S&P 500"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
