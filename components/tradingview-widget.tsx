"use client"

import React, { useEffect, useRef, memo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Activity } from 'lucide-react'

interface TradingViewWidgetProps {
  symbol?: string
  currentPrice?: number
  change?: number
  changePercent?: number
  widgetType?: 'symbol-overview' | 'advanced-chart' | 'mini-chart' | 'market-overview'
  height?: number | string
  width?: number | string
  theme?: 'light' | 'dark'
  interval?: '1m' | '3m' | '5m' | '15m' | '30m' | '1h' | '2h' | '4h' | '6h' | '8h' | '12h' | '1d' | '3d' | '1w' | '1M'
  hideToolbar?: boolean
  hideLegend?: boolean
  showSymbolLogo?: boolean
  showDateRanges?: boolean
  showMarketStatus?: boolean
  containerClass?: string
}

function TradingViewWidget({
  symbol = "NASDAQ:AAPL",
  currentPrice,
  change,
  changePercent,
  widgetType = 'symbol-overview',
  height = "100%",
  width = "100%",
  theme = 'dark',
  interval = '1d',
  hideToolbar = false,
  hideLegend = false,
  showSymbolLogo = true,
  showDateRanges = true,
  showMarketStatus = false,
  containerClass = ""
}: TradingViewWidgetProps) {
  const container = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Clean up symbol format for TradingView
  const formatSymbol = (sym: string) => {
    // Handle different symbol formats
    if (sym.includes(':')) return sym // Already formatted
    if (sym.includes(' - ')) sym = sym.split(' - ')[0] // Remove description

    // Add exchange prefix for common symbols
    const commonExchanges: { [key: string]: string } = {
      'AAPL': 'NASDAQ:AAPL',
      'GOOGL': 'NASDAQ:GOOGL',
      'MSFT': 'NASDAQ:MSFT',
      'AMZN': 'NASDAQ:AMZN',
      'TSLA': 'NASDAQ:TSLA',
      'META': 'NASDAQ:META',
      'NVDA': 'NASDAQ:NVDA',
      'NFLX': 'NASDAQ:NFLX',
      'AMD': 'NASDAQ:AMD',
      'INTC': 'NASDAQ:INTC'
    }

    return commonExchanges[sym.toUpperCase()] || `NASDAQ:${sym.toUpperCase()}`
  }

  const createWidgetConfig = () => {
    const formattedSymbol = formatSymbol(symbol)

    const baseConfig = {
      colorTheme: theme,
      isTransparent: false,
      locale: "en",
      autosize: true,
      width: typeof width === 'number' ? width.toString() : width,
      height: typeof height === 'number' ? height.toString() : height
    }

    switch (widgetType) {
      case 'advanced-chart':
        return {
          ...baseConfig,
          symbol: formattedSymbol,
          interval: interval,
          timezone: "Etc/UTC",
          theme: theme,
          style: "1",
          hide_top_toolbar: hideToolbar,
          hide_legend: hideLegend,
          save_image: false,
          container_id: "tradingview_chart"
        }

      case 'mini-chart':
        return {
          ...baseConfig,
          symbol: formattedSymbol,
          dateRange: "12M",
          trendLineColor: theme === 'dark' ? '#22ab94' : '#00BCD4',
          underLineColor: theme === 'dark' ? 'rgba(34, 171, 148, 0.3)' : 'rgba(0, 188, 212, 0.3)',
          lineWidth: 2,
          fontSize: "12",
          gridLineColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          fontColor: theme === 'dark' ? '#FFFFFF' : '#000000'
        }

      case 'market-overview':
        return {
          ...baseConfig,
          tabs: [
            {
              title: "Indices",
              symbols: [
                { s: "FOREXCOM:SPXUSD", d: "S&P 500" },
                { s: "FOREXCOM:NSXUSD", d: "US 100" },
                { s: "FOREXCOM:DJI", d: "Dow 30" },
                { s: "INDEX:NKY", d: "Nikkei 225" },
                { s: "INDEX:DEU40", d: "DAX Index" },
                { s: "FOREXCOM:UKXGBP", d: "UK 100" }
              ],
              originalTitle: "Indices"
            },
            {
              title: "Futures",
              symbols: [
                { s: "CME_MINI:ES1!", d: "S&P 500" },
                { s: "CME:6E1!", d: "Euro" },
                { s: "COMEX:GC1!", d: "Gold" },
                { s: "NYMEX:CL1!", d: "Crude Oil" },
                { s: "NYMEX:NG1!", d: "Natural Gas" },
                { s: "CBOT:ZC1!", d: "Corn" }
              ],
              originalTitle: "Futures"
            },
            {
              title: "Bonds",
              symbols: [
                { s: "CME:GE1!", d: "Eurodollar" },
                { s: "CBOT:ZB1!", d: "T-Bond" },
                { s: "CBOT:UB1!", d: "Ultra T-Bond" },
                { s: "EUREX:FGBL1!", d: "Euro Bund" },
                { s: "EUREX:FBTP1!", d: "Euro BTP" },
                { s: "EUREX:FGBM1!", d: "Euro BOBL" }
              ],
              originalTitle: "Bonds"
            }
          ],
          showChart: true,
          showFloatingTooltip: true,
          dateRange: "12M",
          showSymbolLogo: true,
          colorTheme: theme,
          trendLineColor: theme === 'dark' ? '#22ab94' : '#00BCD4',
          underLineColor: theme === 'dark' ? 'rgba(34, 171, 148, 0.3)' : 'rgba(0, 188, 212, 0.3)'
        }

      default: // symbol-overview
        return {
          ...baseConfig,
          lineWidth: 2,
          lineType: 0,
          chartType: "area",
          fontColor: theme === 'dark' ? "rgb(106, 109, 120)" : "rgb(106, 109, 120)",
          gridLineColor: theme === 'dark' ? "rgba(242, 242, 242, 0.06)" : "rgba(42, 42, 42, 0.06)",
          volumeUpColor: "rgba(34, 171, 148, 0.5)",
          volumeDownColor: "rgba(247, 82, 95, 0.5)",
          backgroundColor: theme === 'dark' ? "#0F0F0F" : "#FFFFFF",
          widgetFontColor: theme === 'dark' ? "#DBDBDB" : "#363A45",
          upColor: "#22ab94",
          downColor: "#f7525f",
          borderUpColor: "#22ab94",
          borderDownColor: "#f7525f",
          wickUpColor: "#22ab94",
          wickDownColor: "#f7525f",
          chartOnly: false,
          scalePosition: "right",
          scaleMode: "Normal",
          fontFamily: "-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif",
          valuesTracking: "1",
          changeMode: "price-and-percent",
          symbols: [
            [formattedSymbol.split(':')[1] || "AAPL", formattedSymbol]
          ],
          dateRanges: showDateRanges ? [
            "1d|1",
            "1m|30",
            "3m|60",
            "12m|1D",
            "60m|1W",
            "all|1M"
          ] : [],
          fontSize: "10",
          headerFontSize: "medium",
          noTimeScale: false,
          hideDateRanges: !showDateRanges,
          hideMarketStatus: !showMarketStatus,
          hideSymbolLogo: !showSymbolLogo
        }
    }
  }

  useEffect(() => {
    if (!container.current) return

    setIsLoading(true)
    setError(null)

    const script = document.createElement("script")
    script.type = "text/javascript"
    script.async = true

    const widgetScripts = {
      'symbol-overview': 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js',
      'advanced-chart': 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js',
      'mini-chart': 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js',
      'market-overview': 'https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js'
    }

    script.src = widgetScripts[widgetType] || widgetScripts['symbol-overview']

    script.onload = () => {
      setTimeout(() => setIsLoading(false), 1000)
    }

    script.onerror = () => {
      setError('Failed to load TradingView widget')
      setIsLoading(false)
    }

    try {
      script.innerHTML = JSON.stringify(createWidgetConfig())

      // Clear previous widget
      if (container.current) {
        container.current.innerHTML = ''
        container.current.appendChild(script)
      }
    } catch (err) {
      setError('Failed to configure TradingView widget')
      setIsLoading(false)
    }

    return () => {
      if (container.current) {
        container.current.innerHTML = ''
      }
    }
  }, [symbol, widgetType, theme, interval, hideToolbar, hideLegend, showSymbolLogo, showDateRanges, showMarketStatus])

  const isPositive = change ? change >= 0 : true
  const TrendIcon = isPositive ? TrendingUp : TrendingDown

  return (
    <Card className={`animate-fade-in bg-card border-border ${containerClass}`}>
      {(currentPrice || change !== undefined) && (
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                {symbol.split(':').pop() || symbol}
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Activity size={16} />
                  <span>Real-time</span>
                </div>
              </CardTitle>
              {currentPrice && (
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-3xl font-bold">
                    ${currentPrice.toFixed(2)}
                  </span>
                  {change !== undefined && changePercent !== undefined && (
                    <>
                      <Badge variant={isPositive ? "default" : "destructive"} className="gap-1">
                        <TrendIcon className="w-3 h-3" />
                        {changePercent > 0 ? "+" : ""}
                        {changePercent.toFixed(2)}%
                      </Badge>
                      <span className={`text-sm ${isPositive ? "text-green-600" : "text-red-600"}`}>
                        {change > 0 ? "+" : ""}
                        ${change.toFixed(2)}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      )}

      <CardContent className="p-0">
        <div className={`tradingview-widget-container relative ${typeof height === 'string' ? `h-[${height}]` : ''}`} style={{ height: typeof height === 'number' ? `${height}px` : height }}>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/90 backdrop-blur-sm z-10">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin"></div>
                <span className="text-muted-foreground font-medium">Loading real-time data...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/90 backdrop-blur-sm z-10">
              <div className="text-center text-destructive">
                <Activity size={48} className="mx-auto mb-4 text-muted-foreground" />
                <p className="font-medium">{error}</p>
                <p className="text-sm text-muted-foreground">Please try again later</p>
              </div>
            </div>
          )}

          <div className="tradingview-widget-container__widget h-full" ref={container}></div>

        </div>
      </CardContent>
    </Card>
  )
}

export default memo(TradingViewWidget)

// Export additional pre-configured components for common use cases
export const TradingViewChart = memo((props: Omit<TradingViewWidgetProps, 'widgetType'>) => (
  <TradingViewWidget {...props} widgetType="symbol-overview" />
))

export const TradingViewAdvancedChart = memo((props: Omit<TradingViewWidgetProps, 'widgetType'>) => (
  <TradingViewWidget {...props} widgetType="advanced-chart" height={600} />
))

export const TradingViewMiniChart = memo((props: Omit<TradingViewWidgetProps, 'widgetType'>) => (
  <TradingViewWidget {...props} widgetType="mini-chart" height={200} />
))

export const TradingViewMarketOverview = memo((props: Omit<TradingViewWidgetProps, 'widgetType'>) => (
  <TradingViewWidget {...props} widgetType="market-overview" height={400} />
))