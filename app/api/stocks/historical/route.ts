import { NextRequest, NextResponse } from 'next/server'
import yahooFinance from 'yahoo-finance2'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const symbol = searchParams.get('symbol')
  const period = searchParams.get('period') || '1d'
  const interval = searchParams.get('interval') || '5m'

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 })
  }

  try {
    // Calculate date range based on period
    const endDate = new Date()
    const startDate = new Date()

    switch (period) {
      case '1d':
        startDate.setDate(endDate.getDate() - 1)
        break
      case '5d':
        startDate.setDate(endDate.getDate() - 5)
        break
      case '1mo':
        startDate.setMonth(endDate.getMonth() - 1)
        break
      case '3mo':
        startDate.setMonth(endDate.getMonth() - 3)
        break
      case '6mo':
        startDate.setMonth(endDate.getMonth() - 6)
        break
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1)
        break
      case '2y':
        startDate.setFullYear(endDate.getFullYear() - 2)
        break
      default:
        startDate.setDate(endDate.getDate() - 1)
    }

    // Get historical data
    const historical = await yahooFinance.historical(symbol, {
      period1: startDate,
      period2: endDate,
      interval: interval as any,
    })

    // Format the data for charts
    const chartData = historical.map(item => ({
      time: item.date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
      date: item.date.toISOString(),
      price: item.close,
      open: item.open,
      high: item.high,
      low: item.low,
      volume: item.volume,
    }))

    return NextResponse.json({ data: chartData })
  } catch (error) {
    console.error('Error fetching historical data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch historical data' },
      { status: 500 }
    )
  }
}