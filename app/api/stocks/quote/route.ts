import { NextRequest, NextResponse } from 'next/server'
import yahooFinance from 'yahoo-finance2'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const symbol = searchParams.get('symbol')

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 })
  }

  try {
    // Get quote data
    const quote = await yahooFinance.quote(symbol)

    if (!quote) {
      return NextResponse.json({ error: 'Stock not found' }, { status: 404 })
    }

    // Format the response
    const stockData = {
      symbol: quote.symbol,
      name: quote.longName || quote.shortName || symbol,
      price: quote.regularMarketPrice || 0,
      change: quote.regularMarketChange || 0,
      changePercent: quote.regularMarketChangePercent || 0,
      volume: quote.regularMarketVolume || 0,
      marketCap: quote.marketCap || 0,
      dayLow: quote.regularMarketDayLow || 0,
      dayHigh: quote.regularMarketDayHigh || 0,
      fiftyTwoWeekLow: quote.fiftyTwoWeekLow || 0,
      fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh || 0,
      currency: quote.currency || 'USD',
      exchange: quote.fullExchangeName || quote.exchange || '',
      lastUpdated: new Date().toISOString()
    }

    return NextResponse.json(stockData)
  } catch (error) {
    console.error('Error fetching stock quote:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stock data' },
      { status: 500 }
    )
  }
}