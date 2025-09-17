"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"

interface TradingChartProps {
  symbol: string
  data: Array<{
    time: string
    price: number
    open?: number
    high?: number
    low?: number
    volume: number
  }>
  currentPrice: number
  change: number
  changePercent: number
}

export function TradingChart({ symbol, data, currentPrice, change, changePercent }: TradingChartProps) {
  const [timeframe, setTimeframe] = useState('1D')
  const [chartType, setChartType] = useState<'line' | 'area'>('area')
  const [chartData, setChartData] = useState(data)
  const [isLoading, setIsLoading] = useState(false)

  const isPositive = change >= 0
  const chartColor = isPositive ? '#16a34a' : '#dc2626'

  const formatPrice = (value: number) => `$${value.toFixed(2)}`

  // Map timeframe to API period format
  const timeframeToPeriod = {
    '1D': '1d',
    '1W': '5d',
    '1M': '1mo',
    '3M': '3mo',
    '1Y': '1y'
  }

  // Fetch historical data for different timeframes
  const fetchHistoricalData = async (selectedTimeframe: string) => {
    setIsLoading(true)
    try {
      const cleanSymbol = symbol.split(' - ')[0] // Extract just the symbol part
      const period = timeframeToPeriod[selectedTimeframe as keyof typeof timeframeToPeriod] || '1d'
      const interval = selectedTimeframe === '1D' ? '5m' : selectedTimeframe === '1W' ? '30m' : '1d'

      const response = await fetch(`/api/stocks/historical?symbol=${cleanSymbol}&period=${period}&interval=${interval}`)

      if (response.ok) {
        const result = await response.json()
        if (result.data && result.data.length > 0) {
          setChartData(result.data)
        }
      }
    } catch (error) {
      console.error('Failed to fetch historical data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Update data when props change
  useEffect(() => {
    setChartData(data)
  }, [data])

  // Handle timeframe changes
  const handleTimeframeChange = async (newTimeframe: string) => {
    setTimeframe(newTimeframe)
    await fetchHistoricalData(newTimeframe)
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
          <p className="text-sm text-gray-600">{data.time}</p>
          <p className="text-sm font-semibold text-gray-900">
            Price: {formatPrice(data.price)}
          </p>
          <p className="text-xs text-gray-500">
            Volume: {data.volume?.toLocaleString() || 'N/A'}
          </p>
        </div>
      )
    }
    return null
  }

  const timeframes = ['1D', '1W', '1M', '3M', '1Y']

  return (
    <div className="w-full">
      {/* Chart Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{symbol}</h3>
          <div className="flex items-center space-x-3 mt-1">
            <span className="text-2xl font-bold text-gray-900">
              {formatPrice(currentPrice)}
            </span>
            <div className={`flex items-center px-2 py-1 rounded text-sm font-medium ${
              isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              <span className="mr-1">{isPositive ? '+' : ''}{change.toFixed(2)}</span>
              <span>({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Chart Type Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <Button
              variant={chartType === 'line' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setChartType('line')}
              className={`px-3 py-1 text-xs ${
                chartType === 'line'
                  ? 'bg-white shadow-sm text-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Line
            </Button>
            <Button
              variant={chartType === 'area' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setChartType('area')}
              className={`px-3 py-1 text-xs ${
                chartType === 'area'
                  ? 'bg-white shadow-sm text-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Area
            </Button>
          </div>

          {/* Timeframe Buttons */}
          <div className="flex space-x-1">
            {timeframes.map((tf) => (
              <Button
                key={tf}
                variant={timeframe === tf ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleTimeframeChange(tf)}
                disabled={isLoading}
                className={`px-3 py-1 text-xs ${
                  timeframe === tf
                    ? 'bg-black text-white hover:bg-gray-800'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoading && timeframe === tf ? '...' : tf}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80 w-full">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id={`gradient-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColor} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="time"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                />
                <YAxis
                  domain={['dataMin - 5', 'dataMax + 5']}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickFormatter={formatPrice}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={chartColor}
                  strokeWidth={2}
                  fill={`url(#gradient-${symbol})`}
                  dot={false}
                  activeDot={{ r: 4, fill: chartColor, stroke: 'white', strokeWidth: 2 }}
                />
              </AreaChart>
            ) : (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="time"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                />
                <YAxis
                  domain={['dataMin - 5', 'dataMax + 5']}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickFormatter={formatPrice}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke={chartColor}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: chartColor, stroke: 'white', strokeWidth: 2 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      {/* Chart Info */}
      <div className="mt-4 flex justify-between text-sm text-gray-600">
        <div>
          Timeframe: <span className="font-medium">{timeframe}</span>
        </div>
        <div>
          Data points: <span className="font-medium">{chartData.length}</span>
        </div>
      </div>
    </div>
  )
}