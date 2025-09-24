"use client"

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Area, AreaChart, ComposedChart, Bar, ReferenceLine, Brush
} from 'recharts'
import { useState, useEffect, useMemo } from 'react'
import { TrendingUp, TrendingDown, Volume2, Activity, Maximize2, Settings } from 'lucide-react'

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

interface ChartSettings {
  showVolume: boolean
  showGrid: boolean
  showMA: boolean
  compactMode: boolean
}

export function TradingChart({ symbol, data, currentPrice, change, changePercent }: TradingChartProps) {
  const [timeframe, setTimeframe] = useState('1D')
  const [chartData, setChartData] = useState(data || [])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [chartType, setChartType] = useState<'line' | 'area' | 'candlestick'>('line')
  const [settings, setSettings] = useState<ChartSettings>({
    showVolume: true,
    showGrid: true,
    showMA: false,
    compactMode: false
  })
  const [hoveredPoint, setHoveredPoint] = useState<any>(null)
  const [priceRange, setPriceRange] = useState({ min: 0, max: 0 })

  // Load initial chart data immediately on component mount
  useEffect(() => {
    if (symbol) {
      fetchHistoricalData('1D')
    }
  }, [symbol])

  // Update chart data when props change (fallback data)
  useEffect(() => {
    if (data && data.length > 0 && (!chartData || chartData.length === 0)) {
      setChartData(data)
      setError(null)
    }
  }, [data, chartData])

  // Calculate price range and moving averages
  const processedData = useMemo(() => {
    if (!chartData || chartData.length === 0) return { data: [], min: 0, max: 0 }

    const prices = chartData.map(d => d.price)
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    setPriceRange({ min, max })

    // Calculate 20-period moving average if enabled
    const dataWithMA = chartData.map((item, index) => {
      let ma20 = null
      if (settings.showMA && index >= 19) {
        const sum = chartData.slice(index - 19, index + 1).reduce((acc, d) => acc + d.price, 0)
        ma20 = sum / 20
      }
      return { ...item, ma20 }
    })

    return { data: dataWithMA, min, max }
  }, [chartData, settings.showMA])

  const isPositive = change >= 0
  const formatPrice = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(2)}K`
    return `$${value.toFixed(2)}`
  }
  const formatVolume = (value: number) => {
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
    return value.toString()
  }

  const chartColor = isPositive ? '#16a34a' : '#dc2626' // Modern green/red
  const gridColor = '#f1f5f9'
  const textColor = '#64748b'

  // Map timeframe to API period format - Yahoo Finance style
  const timeframeToPeriod = {
    '1D': '1d',
    '5D': '5d',
    '1M': '1mo',
    '3M': '3mo',
    '6M': '6mo',
    '1Y': '1y',
    '5Y': '5y',
    'MAX': '10y'
  }

  // Fetch historical data for different timeframes
  const fetchHistoricalData = async (selectedTimeframe: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const cleanSymbol = symbol.split(' - ')[0] // Extract just the symbol part
      const period = timeframeToPeriod[selectedTimeframe as keyof typeof timeframeToPeriod] || '1d'

      let interval = '2m' // More granular for 1D
      if (selectedTimeframe === '5D') interval = '5m' // More granular for 5D
      else if (selectedTimeframe === '1M') interval = '1d'
      else if (selectedTimeframe === '3M') interval = '1d'
      else if (selectedTimeframe === '6M') interval = '1d'
      else if (selectedTimeframe === '1Y') interval = '1wk'
      else if (selectedTimeframe === '5Y') interval = '1mo'
      else if (selectedTimeframe === 'MAX') interval = '1mo'

      const response = await fetch(`/api/stocks/historical?symbol=${cleanSymbol}&period=${period}&interval=${interval}`)

      if (response.ok) {
        const result = await response.json()
        if (result.data && result.data.length > 0) {
          setChartData(result.data)
          setError(null)
        } else {
          // If no data for the requested timeframe, try to use fallback data
          if (data && data.length > 0) {
            setChartData(data)
            setError(null)
          } else {
            setError(`No data available for ${selectedTimeframe} timeframe`)
            setChartData([])
          }
        }
      } else {
        const errorData = await response.json()
        // If API fails, try to use fallback data
        if (data && data.length > 0) {
          setChartData(data)
          setError(null)
        } else {
          setError(errorData.error || 'Failed to load chart data')
          setChartData([])
        }
      }
    } catch (error) {
      console.error('Failed to fetch historical data:', error)
      // If fetch fails, try to use fallback data
      if (data && data.length > 0) {
        setChartData(data)
        setError(null)
      } else {
        setError('Failed to load chart data')
        setChartData([])
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Handle timeframe changes
  const handleTimeframeChange = async (newTimeframe: string) => {
    setTimeframe(newTimeframe)
    await fetchHistoricalData(newTimeframe)
  }

  const timeframes = ['1D', '5D', '1M', '3M', '6M', '1Y', '5Y', 'MAX']

  // Professional Yahoo Finance style tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      setHoveredPoint(data)
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg shadow-xl p-4 text-sm min-w-[200px]">
          <div className="font-semibold text-slate-900 mb-2 border-b border-slate-100 pb-2">{label}</div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-medium">Price:</span>
              <span className="font-bold text-slate-900">{formatPrice(payload[0].value)}</span>
            </div>
            {data.open && (
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Open:</span>
                <span className="text-slate-700">{formatPrice(data.open)}</span>
              </div>
            )}
            {data.high && (
              <div className="flex justify-between items-center">
                <span className="text-slate-600">High:</span>
                <span className="text-green-600 font-medium">{formatPrice(data.high)}</span>
              </div>
            )}
            {data.low && (
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Low:</span>
                <span className="text-red-600 font-medium">{formatPrice(data.low)}</span>
              </div>
            )}
            {data.volume && settings.showVolume && (
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Volume:</span>
                <span className="text-slate-700 font-medium">{formatVolume(data.volume)}</span>
              </div>
            )}
            {data.ma20 && settings.showMA && (
              <div className="flex justify-between items-center">
                <span className="text-slate-600">MA(20):</span>
                <span className="text-blue-600 font-medium">{formatPrice(data.ma20)}</span>
              </div>
            )}
          </div>
        </div>
      )
    }
    return null
  }

  // Price change indicator
  const PriceDisplay = () => {
    const displayPrice = hoveredPoint ? hoveredPoint.price : currentPrice
    const displayChange = hoveredPoint
      ? (hoveredPoint.price - (processedData.data[0]?.price || currentPrice))
      : change
    const displayChangePercent = hoveredPoint
      ? (displayChange / (processedData.data[0]?.price || currentPrice)) * 100
      : changePercent

    const isDisplayPositive = displayChange >= 0

    return (
      <div className="flex items-center space-x-4">
        <span className="text-4xl font-light text-slate-900">{formatPrice(displayPrice)}</span>
        <div className={`flex items-center space-x-1 px-2 py-1 rounded-md ${
          isDisplayPositive ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'
        }`}>
          {isDisplayPositive ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
          <span className="font-semibold">
            {isDisplayPositive ? '+' : ''}{displayChange.toFixed(2)}
            ({isDisplayPositive ? '+' : ''}{displayChangePercent.toFixed(2)}%)
          </span>
        </div>
        {hoveredPoint && (
          <span className="text-sm text-slate-500">@ {hoveredPoint.time}</span>
        )}
      </div>
    )
  }

  return (
    <div className="w-full bg-white rounded-lg shadow-sm border border-slate-200">
      {/* Professional Header */}
      <div className="border-b border-slate-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-slate-900">{symbol}</h1>
              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <Activity size={16} />
                <span>Real-time</span>
              </div>
            </div>
            <PriceDisplay />
          </div>

          {/* Chart Controls */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1 bg-slate-50 rounded-lg p-1">
              <button
                onClick={() => setChartType('line')}
                className={`px-3 py-2 text-sm rounded-md transition-all ${
                  chartType === 'line'
                    ? 'bg-white text-slate-900 shadow-sm font-medium'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Line
              </button>
              <button
                onClick={() => setChartType('area')}
                className={`px-3 py-2 text-sm rounded-md transition-all ${
                  chartType === 'area'
                    ? 'bg-white text-slate-900 shadow-sm font-medium'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Area
              </button>
              <button
                onClick={() => setChartType('candlestick')}
                className={`px-3 py-2 text-sm rounded-md transition-all ${
                  chartType === 'candlestick'
                    ? 'bg-white text-slate-900 shadow-sm font-medium'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Candles
              </button>
            </div>

            {/* Settings Toggle */}
            <div className="relative group">
              <button
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                title="Chart Settings"
              >
                <Settings size={18} className="text-slate-600" />
              </button>
              <div className="absolute right-0 top-full mt-2 bg-white border border-slate-200 rounded-lg shadow-lg p-3 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 min-w-[160px]">
                <div className="space-y-2 text-sm">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.showVolume}
                      onChange={(e) => setSettings(prev => ({ ...prev, showVolume: e.target.checked }))}
                      className="rounded"
                    />
                    <span>Show Volume</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.showGrid}
                      onChange={(e) => setSettings(prev => ({ ...prev, showGrid: e.target.checked }))}
                      className="rounded"
                    />
                    <span>Grid Lines</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.showMA}
                      onChange={(e) => setSettings(prev => ({ ...prev, showMA: e.target.checked }))}
                      className="rounded"
                    />
                    <span>Moving Avg</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Timeframe Selector */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 bg-slate-50 rounded-lg p-1">
            {timeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => handleTimeframeChange(tf)}
                disabled={isLoading}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  timeframe === tf
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {tf}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-4 text-sm text-slate-600">
            {processedData.data.length > 0 && (
              <>
                <span className="flex items-center space-x-1">
                  <span>Range:</span>
                  <span className="font-medium text-red-600">{formatPrice(priceRange.min)}</span>
                  <span>-</span>
                  <span className="font-medium text-green-600">{formatPrice(priceRange.max)}</span>
                </span>
                <span>{processedData.data.length} points</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Professional Chart Container */}
      <div className="relative">
        <div className={`${settings.showVolume ? 'h-[500px]' : 'h-96'} w-full bg-white relative p-4`}>
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin"></div>
                <span className="text-slate-600 font-medium">Loading market data...</span>
              </div>
            </div>
          ) : !processedData.data || processedData.data.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-slate-500">
                <Activity size={48} className="mx-auto mb-4 text-slate-300" />
                <p className="font-medium">No chart data available</p>
                <p className="text-sm">Please try a different timeframe</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={processedData.data}
                margin={{ top: 10, right: 30, left: 20, bottom: settings.showVolume ? 100 : 20 }}
                onMouseMove={(e) => e?.activePayload && setHoveredPoint(e.activePayload[0].payload)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                <defs>
                  <linearGradient id={`areaGradient-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColor} stopOpacity={0.3}/>
                    <stop offset="50%" stopColor={chartColor} stopOpacity={0.1}/>
                    <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#64748b" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#64748b" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>

                {settings.showGrid && (
                  <CartesianGrid
                    strokeDasharray="2 2"
                    stroke={gridColor}
                    strokeWidth={0.5}
                    opacity={0.5}
                  />
                )}

                <XAxis
                  dataKey="time"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: textColor, fontWeight: 500 }}
                  interval={timeframe === '1D' ? 'preserveStart' : 'preserveStartEnd'}
                  minTickGap={timeframe === '1D' ? 60 : 40}
                  height={30}
                  tickFormatter={(value, index) => {
                    if (timeframe === '1D') {
                      // For 1D view, show only every 6th tick to prevent overcrowding
                      return index % 6 === 0 ? value : ''
                    }
                    return value
                  }}
                />

                <YAxis
                  yAxisId="price"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: textColor, fontWeight: 500 }}
                  tickFormatter={formatPrice}
                  domain={[(dataMin: number) => dataMin * 0.998, (dataMax: number) => dataMax * 1.002]}
                  width={80}
                  orientation="right"
                />

                {settings.showVolume && (
                  <YAxis
                    yAxisId="volume"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: textColor, fontWeight: 500 }}
                    tickFormatter={formatVolume}
                    orientation="left"
                    width={60}
                    domain={[0, (dataMax: number) => dataMax * 4]}
                  />
                )}

                <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />

                {/* Current price reference line */}
                <ReferenceLine
                  yAxisId="price"
                  y={currentPrice}
                  stroke={chartColor}
                  strokeDasharray="5 5"
                  strokeWidth={1}
                  opacity={0.8}
                />

                {/* Volume bars */}
                {settings.showVolume && (
                  <Bar
                    yAxisId="volume"
                    dataKey="volume"
                    fill="url(#volumeGradient)"
                    radius={[1, 1, 0, 0]}
                    opacity={0.7}
                  />
                )}

                {/* Moving average line */}
                {settings.showMA && (
                  <Line
                    yAxisId="price"
                    type="monotone"
                    dataKey="ma20"
                    stroke="#3b82f6"
                    strokeWidth={1}
                    dot={false}
                    strokeDasharray="2 2"
                    opacity={0.8}
                  />
                )}

                {/* Main price visualization */}
                {chartType === 'area' ? (
                  <Area
                    yAxisId="price"
                    type="monotone"
                    dataKey="price"
                    stroke={chartColor}
                    strokeWidth={2.5}
                    fill={`url(#areaGradient-${symbol})`}
                    dot={false}
                    activeDot={{
                      r: 5,
                      fill: chartColor,
                      strokeWidth: 2,
                      stroke: '#fff',
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                    }}
                  />
                ) : chartType === 'candlestick' ? (
                  // Simple candlestick representation using line with colored dots
                  <Line
                    yAxisId="price"
                    type="monotone"
                    dataKey="price"
                    stroke={chartColor}
                    strokeWidth={1.5}
                    dot={{
                      fill: chartColor,
                      r: 4,
                      strokeWidth: 0
                    }}
                    activeDot={{
                      r: 5,
                      fill: chartColor,
                      strokeWidth: 2,
                      stroke: '#fff'
                    }}
                  />
                ) : (
                  <Line
                    yAxisId="price"
                    type="monotone"
                    dataKey="price"
                    stroke={chartColor}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{
                      r: 5,
                      fill: chartColor,
                      strokeWidth: 2,
                      stroke: '#fff',
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                    }}
                  />
                )}

                {/* Interactive brush for larger datasets */}
                {processedData.data.length > 50 && timeframe !== '1D' && (
                  <Brush
                    dataKey="time"
                    height={40}
                    stroke={chartColor}
                    fill="#f8fafc"
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Professional Footer */}
      <div className="border-t border-slate-200 px-6 py-3">
        <div className="flex justify-between items-center text-xs text-slate-500">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <Activity size={12} />
              <span>Live Data</span>
            </span>
            <span>{processedData.data.length} data points</span>
            <span>Timeframe: {timeframe}</span>
            {settings.showVolume && <span>Volume included</span>}
            {settings.showMA && <span>MA(20) overlay</span>}
          </div>
          <div className="flex items-center space-x-2">
            <button
              className="p-1 hover:bg-slate-100 rounded transition-colors"
              title="Fullscreen"
            >
              <Maximize2 size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}