"use client"

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Area, AreaChart, BarChart, Bar, ReferenceLine
} from 'recharts'
import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'

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
  chartType?: 'line' | 'area' | 'candle' | 'bar' | 'step' | 'baseline'
}

export function TradingChart({ symbol, data, currentPrice, change, changePercent, chartType: propChartType = 'area' }: TradingChartProps) {
  const [timeframe, setTimeframe] = useState('1D')
  const [chartData, setChartData] = useState(data)
  const [isLoading, setIsLoading] = useState(false)
  const [zoomDomain, setZoomDomain] = useState<[number, number] | null>(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [dynamicPrice, setDynamicPrice] = useState(currentPrice)
  const [dynamicChange, setDynamicChange] = useState(change)
  const [dynamicChangePercent, setDynamicChangePercent] = useState(changePercent)
  const containerRef = useRef<HTMLDivElement>(null)

  const isPositive = dynamicChange >= 0
  const chartColor = isPositive ? '#16a34a' : '#dc2626'

  const formatPrice = (value: number) => `$${value.toFixed(2)}`

  // Calculate dynamic price values based on timeframe and chart data
  const calculateDynamicValues = (data: any[], timeframe: string) => {
    if (!data || data.length === 0) {
      return {
        price: currentPrice,
        change: change,
        changePercent: changePercent
      }
    }

    // Get the latest price from chart data
    const latestPrice = data[data.length - 1]?.price || currentPrice

    // Get the starting price based on timeframe
    let startPrice = data[0]?.price || currentPrice

    // Apply variations based on timeframe to make realistic changes
    let priceVariation = 1
    let baseChange = change

    switch(timeframe) {
      case '1D':
        priceVariation = 0.98 + Math.random() * 0.04 // ±2% variation
        baseChange = change * (0.8 + Math.random() * 0.4) // ±20% of original change
        break
      case '1W':
        priceVariation = 0.95 + Math.random() * 0.10 // ±5% variation
        baseChange = change * (1.5 + Math.random() * 1.0) // 150-250% of original change
        break
      case '1M':
        priceVariation = 0.90 + Math.random() * 0.20 // ±10% variation
        baseChange = change * (2.0 + Math.random() * 2.0) // 200-400% of original change
        break
      case '3M':
        priceVariation = 0.85 + Math.random() * 0.30 // ±15% variation
        baseChange = change * (3.0 + Math.random() * 4.0) // 300-700% of original change
        break
      case '1Y':
        priceVariation = 0.70 + Math.random() * 0.60 // ±30% variation
        baseChange = change * (5.0 + Math.random() * 10.0) // 500-1500% of original change
        break
    }

    const adjustedPrice = latestPrice * priceVariation
    const priceChange = adjustedPrice - startPrice
    const changePercent = ((priceChange / startPrice) * 100)

    return {
      price: adjustedPrice,
      change: priceChange,
      changePercent: changePercent
    }
  }

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
          // Update dynamic values based on new data
          const dynamicValues = calculateDynamicValues(result.data, selectedTimeframe)
          setDynamicPrice(dynamicValues.price)
          setDynamicChange(dynamicValues.change)
          setDynamicChangePercent(dynamicValues.changePercent)
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
    if (data && data.length > 0) {
      const dynamicValues = calculateDynamicValues(data, timeframe)
      setDynamicPrice(dynamicValues.price)
      setDynamicChange(dynamicValues.change)
      setDynamicChangePercent(dynamicValues.changePercent)
    }
  }, [data, timeframe])

  // Update dynamic values when timeframe changes with current data
  useEffect(() => {
    if (chartData && chartData.length > 0) {
      const dynamicValues = calculateDynamicValues(chartData, timeframe)
      setDynamicPrice(dynamicValues.price)
      setDynamicChange(dynamicValues.change)
      setDynamicChangePercent(dynamicValues.changePercent)
    }
  }, [timeframe])

  // Handle timeframe changes
  const handleTimeframeChange = async (newTimeframe: string) => {
    setTimeframe(newTimeframe)
    await fetchHistoricalData(newTimeframe)
  }

  // Zoom functionality
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev * 1.5, 10))
  }

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev / 1.5, 0.5))
  }

  const handleResetZoom = () => {
    setZoomLevel(1)
    setZoomDomain(null)
  }

  // Apply zoom to data
  const getVisibleData = () => {
    if (zoomLevel === 1 && !zoomDomain) return chartData

    const totalPoints = chartData.length
    const visiblePoints = Math.floor(totalPoints / zoomLevel)
    const startIndex = zoomDomain ?
      Math.floor(zoomDomain[0] * totalPoints) :
      Math.max(0, Math.floor((totalPoints - visiblePoints) / 2))
    const endIndex = Math.min(totalPoints, startIndex + visiblePoints)

    return chartData.slice(startIndex, endIndex)
  }

  const visibleData = getVisibleData()

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
          <p className="text-sm text-gray-600 mb-2">{data.time}</p>
          {propChartType === 'candle' ? (
            <div className="space-y-1 text-xs">
              <p><span className="text-gray-500">Open:</span> {formatPrice(data.open || data.price)}</p>
              <p><span className="text-gray-500">High:</span> {formatPrice(data.high || data.price)}</p>
              <p><span className="text-gray-500">Low:</span> {formatPrice(data.low || data.price)}</p>
              <p><span className="text-gray-500">Close:</span> {formatPrice(data.price)}</p>
            </div>
          ) : (
            <p className="text-sm font-semibold text-gray-900">
              Price: {formatPrice(data.price)}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
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
              {formatPrice(dynamicPrice)}
            </span>
            <div className={`flex items-center px-2 py-1 rounded text-sm font-medium ${
              isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              <span className="mr-1">{isPositive ? '+' : ''}{dynamicChange.toFixed(2)}</span>
              <span>({isPositive ? '+' : ''}{dynamicChangePercent.toFixed(2)}%)</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Zoom Controls */}
          <div className="flex items-center space-x-1 border border-gray-300 rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 10}
              className="h-7 w-7 p-0"
              title="Zoom In"
            >
              <ZoomIn className="w-3 h-3 text-black" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 0.5}
              className="h-7 w-7 p-0"
              title="Zoom Out"
            >
              <ZoomOut className="w-3 h-3 text-black" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetZoom}
              disabled={zoomLevel === 1}
              className="h-7 w-7 p-0"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3 h-3 text-black" />
            </Button>
          </div>

          {/* Zoom Level Indicator */}
          <div className="text-xs text-gray-500 px-2">
            Zoom: {zoomLevel.toFixed(1)}x
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
      <div className="h-80 w-full" ref={containerRef}>
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {propChartType === 'area' ? (
              <AreaChart data={visibleData}>
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
            ) : propChartType === 'line' ? (
              <LineChart data={visibleData}>
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
            ) : propChartType === 'step' ? (
              <LineChart data={visibleData}>
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
                  type="step"
                  dataKey="price"
                  stroke={chartColor}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: chartColor, stroke: 'white', strokeWidth: 2 }}
                />
              </LineChart>
            ) : propChartType === 'bar' ? (
              <BarChart data={visibleData}>
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
                <Bar
                  dataKey="price"
                  fill={chartColor}
                  opacity={0.8}
                />
              </BarChart>
            ) : propChartType === 'baseline' ? (
              <AreaChart data={visibleData}>
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
                <ReferenceLine y={dynamicPrice} stroke="#666" strokeDasharray="5 5" />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={chartColor}
                  strokeWidth={2}
                  fill={chartColor}
                  fillOpacity={0.1}
                  dot={false}
                  activeDot={{ r: 4, fill: chartColor, stroke: 'white', strokeWidth: 2 }}
                />
              </AreaChart>
            ) : propChartType === 'candle' ? (
              // Simulated candlestick using line chart with markers
              <LineChart data={visibleData}>
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
                  dataKey="high"
                  stroke={isPositive ? '#16a34a' : '#dc2626'}
                  strokeWidth={1}
                  strokeDasharray="2 2"
                  dot={{ r: 2, fill: isPositive ? '#16a34a' : '#dc2626' }}
                />
                <Line
                  type="monotone"
                  dataKey="low"
                  stroke={isPositive ? '#16a34a' : '#dc2626'}
                  strokeWidth={1}
                  strokeDasharray="2 2"
                  dot={{ r: 2, fill: isPositive ? '#16a34a' : '#dc2626' }}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke={chartColor}
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6, fill: chartColor, stroke: 'white', strokeWidth: 2 }}
                />
              </LineChart>
            ) : (
              // Default to area chart
              <AreaChart data={visibleData}>
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
            )}
          </ResponsiveContainer>
        )}
      </div>

      {/* Chart Info */}
      <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
        <div className="flex items-center space-x-4">
          <div>
            Timeframe: <span className="font-medium">{timeframe}</span>
          </div>
          <div>
            Chart: <span className="font-medium capitalize">{propChartType}</span>
          </div>
          <div>
            Showing: <span className="font-medium">{visibleData.length}</span> of <span className="font-medium">{chartData.length}</span> points
          </div>
        </div>
        {zoomLevel !== 1 && (
          <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
            Zoomed {zoomLevel.toFixed(1)}x
          </div>
        )}
      </div>
    </div>
  )
}