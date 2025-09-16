"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts"
import { getSectorData, generateSentimentData, type SectorData, type SentimentData } from "@/lib/chart-data"
import { useState, useEffect } from "react"

export function MarketCharts() {
  const [sectorData, setSectorData] = useState<SectorData[]>([])
  const [sentimentData, setSentimentData] = useState<SentimentData[]>([])

  useEffect(() => {
    setSectorData(getSectorData())
    setSentimentData(generateSentimentData())
  }, [])

  const COLORS = {
    positive: "#22c55e",
    negative: "#ef4444",
    neutral: "#64748b",
    primary: "hsl(var(--primary))",
    secondary: "hsl(var(--secondary))",
    accent: "hsl(var(--accent))",
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm font-medium">
              {entry.name}: <span style={{ color: entry.color }}>{entry.value}</span>
              {entry.name === "performance" && "%"}
              {entry.name === "marketCap" && "T"}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Sector Performance Chart */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle>Sector Performance</CardTitle>
          <p className="text-sm text-muted-foreground">Daily performance by sector</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sectorData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="sector"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(value) => `${value}%`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="performance"
                fill={(entry: any) => (entry.performance >= 0 ? COLORS.positive : COLORS.negative)}
                radius={[4, 4, 0, 0]}
              >
                {sectorData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.performance >= 0 ? COLORS.positive : COLORS.negative} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Market Sentiment Chart */}
      <Card className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
        <CardHeader>
          <CardTitle>Market Sentiment</CardTitle>
          <p className="text-sm text-muted-foreground">30-day sentiment trend</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={sentimentData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="bullish" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.positive} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.positive} stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="bearish" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.negative} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.negative} stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="neutral" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.neutral} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.neutral} stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(value) => `${value}%`} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="bullish"
                stackId="1"
                stroke={COLORS.positive}
                fill="url(#bullish)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="neutral"
                stackId="1"
                stroke={COLORS.neutral}
                fill="url(#neutral)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="bearish"
                stackId="1"
                stroke={COLORS.negative}
                fill="url(#bearish)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
