"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useState, useEffect } from "react"
import { generateIntradayData, generateHistoricalData, type ChartDataPoint } from "@/lib/chart-data"
import { formatCurrency } from "@/lib/stock-api"
import { TrendingUp, TrendingDown } from "lucide-react"

interface StockChartProps {
  symbol: string
  currentPrice: number
  change: number
  changePercent: number
}

type TimeRange = "1D" | "5D" | "1M" | "3M" | "1Y"

export function StockChart({ symbol, currentPrice, change, changePercent }: StockChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("1D")
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [chartType, setChartType] = useState<"line" | "area" | "candle">("area")

  useEffect(() => {
    setLoading(true)

    // Simulate API call delay
    const timer = setTimeout(() => {
      let data: ChartDataPoint[]

      switch (timeRange) {
        case "1D":
          data = generateIntradayData(symbol, currentPrice)
          break
        case "5D":
          data = generateHistoricalData(symbol, currentPrice, 5)
          break
        case "1M":
          data = generateHistoricalData(symbol, currentPrice, 30)
          break
        case "3M":
          data = generateHistoricalData(symbol, currentPrice, 90)
          break
        case "1Y":
          data = generateHistoricalData(symbol, currentPrice, 365)
          break
        default:
          data = generateIntradayData(symbol, currentPrice)
      }

      setChartData(data)
      setLoading(false)
    }, 800)

    return () => clearTimeout(timer)
  }, [timeRange, symbol, currentPrice])

  const isPositive = change >= 0
  const trendColor = isPositive ? "#22c55e" : "#ef4444"
  const TrendIcon = isPositive ? TrendingUp : TrendingDown

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          <div className="space-y-1">
            <p className="text-sm font-medium">
              Price: <span className="text-foreground">{formatCurrency(data.price)}</span>
            </p>
            {data.volume && (
              <p className="text-sm font-medium">
                Volume: <span className="text-foreground">{data.volume.toLocaleString()}</span>
              </p>
            )}
            {chartType === "candle" && (
              <>
                <p className="text-sm">Open: {formatCurrency(data.open)}</p>
                <p className="text-sm">High: {formatCurrency(data.high)}</p>
                <p className="text-sm">Low: {formatCurrency(data.low)}</p>
                <p className="text-sm">Close: {formatCurrency(data.close)}</p>
              </>
            )}
          </div>
        </div>
      )
    }
    return null
  }

  const renderChart = () => {
    if (loading) {
      return (
        <div className="h-[400px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-muted-foreground">Loading chart data...</span>
        </div>
      )
    }

    const commonProps = {
      data: chartData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    }

    switch (chartType) {
      case "line":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(value) => `$${value}`} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="price"
                stroke={trendColor}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, stroke: trendColor, strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )

      case "area":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart {...commonProps}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={trendColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={trendColor} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(value) => `$${value}`} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="price"
                stroke={trendColor}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorPrice)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )

      default:
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart {...commonProps}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={trendColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={trendColor} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(value) => `$${value}`} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="price"
                stroke={trendColor}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorPrice)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )
    }
  }

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">{symbol}</CardTitle>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-3xl font-bold">{formatCurrency(currentPrice)}</span>
              <Badge variant={isPositive ? "default" : "destructive"} className="gap-1">
                <TrendIcon className="w-3 h-3" />
                {changePercent > 0 ? "+" : ""}
                {changePercent.toFixed(2)}%
              </Badge>
              <span className={`text-sm ${isPositive ? "text-chart-4" : "text-destructive"}`}>
                {change > 0 ? "+" : ""}
                {formatCurrency(change)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Chart Type Selector */}
            <div className="flex rounded-lg border border-border p-1">
              {[
                { type: "area" as const, label: "Area" },
                { type: "line" as const, label: "Line" },
              ].map((option) => (
                <Button
                  key={option.type}
                  variant={chartType === option.type ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setChartType(option.type)}
                  className="h-7 px-3 text-xs"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-1 mt-4">
          {(["1D", "5D", "1M", "3M", "1Y"] as TimeRange[]).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? "default" : "ghost"}
              size="sm"
              onClick={() => setTimeRange(range)}
              className="h-8 px-3 text-xs"
            >
              {range}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent>{renderChart()}</CardContent>
    </Card>
  )
}
