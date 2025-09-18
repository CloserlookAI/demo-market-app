import { NextRequest, NextResponse } from "next/server"
import yahooFinance from "yahoo-finance2"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get("symbol")

    if (!symbol) {
      return NextResponse.json(
        { error: "Symbol parameter is required" },
        { status: 400 }
      )
    }

    // Get detailed stock information
    const quote = await yahooFinance.quote(symbol)

    if (!quote) {
      throw new Error(`No data found for symbol: ${symbol}`)
    }

    // Format the statistics data
    const statistics = {
      symbol: quote.symbol,
      name: quote.shortName || quote.longName || symbol,
      price: quote.regularMarketPrice || 0,
      change: quote.regularMarketChange || 0,
      changePercent: quote.regularMarketChangePercent || 0,
      volume: quote.regularMarketVolume || 0,
      averageVolume: quote.averageVolume,
      marketCap: quote.marketCap,
      peRatio: quote.trailingPE,
      eps: quote.trailingEps,
      dividendYield: quote.dividendYield,
      high52Week: quote.fiftyTwoWeekHigh,
      low52Week: quote.fiftyTwoWeekLow,
      beta: quote.beta,
      bookValue: quote.bookValue,
      priceToBook: quote.priceToBook,
      previousClose: quote.regularMarketPreviousClose,
      open: quote.regularMarketOpen,
      dayHigh: quote.regularMarketDayHigh,
      dayLow: quote.regularMarketDayLow
    }

    return NextResponse.json(statistics)
  } catch (error) {
    console.error("Statistics API error:", error)

    // Return mock statistics data if API fails
    const mockStats = {
      symbol: "AAPL",
      name: "Apple Inc.",
      price: 150.25,
      change: 2.15,
      changePercent: 1.45,
      volume: 45000000,
      averageVolume: 50000000,
      marketCap: 2500000000000,
      peRatio: 25.5,
      eps: 6.05,
      dividendYield: 0.0055,
      high52Week: 180.95,
      low52Week: 124.17,
      beta: 1.25,
      bookValue: 4.15,
      priceToBook: 36.2,
      previousClose: 148.10,
      open: 149.85,
      dayHigh: 151.20,
      dayLow: 148.95
    }

    return NextResponse.json({
      ...mockStats,
      fallback: true
    })
  }
}