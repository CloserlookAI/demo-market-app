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

    // Get detailed company information including profile data
    const quote = await yahooFinance.quote(symbol)

    if (!quote) {
      throw new Error(`No data found for symbol: ${symbol}`)
    }

    // Format the comprehensive profile data
    const profile = {
      // Basic Information
      symbol: quote.symbol,
      name: quote.shortName || quote.longName || symbol,
      longName: quote.longName,
      sector: quote.sector,
      industry: quote.industry,
      fullTimeEmployees: quote.fullTimeEmployees,

      // Location Details
      city: quote.city,
      state: quote.state,
      country: quote.country,
      address1: quote.address1,
      zip: quote.zip,
      phone: quote.phone,
      website: quote.website,

      // Business Information
      businessSummary: quote.longBusinessSummary,
      governanceEpochDate: quote.governanceEpochDate,
      compensationAsOfEpochDate: quote.compensationAsOfEpochDate,

      // Financial Metrics
      marketCap: quote.marketCap,
      price: quote.regularMarketPrice,
      change: quote.regularMarketChange,
      changePercent: quote.regularMarketChangePercent,
      previousClose: quote.previousClose,
      open: quote.open,
      dayLow: quote.regularMarketDayLow,
      dayHigh: quote.regularMarketDayHigh,
      volume: quote.regularMarketVolume,
      averageVolume: quote.averageDailyVolume3Month,

      // Valuation Metrics
      beta: quote.beta,
      peRatio: quote.trailingPE,
      forwardPE: quote.forwardPE,
      pegRatio: quote.pegRatio,
      priceToBook: quote.priceToBook,
      enterpriseValue: quote.enterpriseValue,
      enterpriseToRevenue: quote.enterpriseToRevenue,
      enterpriseToEbitda: quote.enterpriseToEbitda,

      // Dividend Information
      dividendYield: quote.dividendYield,
      dividendRate: quote.dividendRate,
      exDividendDate: quote.exDividendDate,
      payoutRatio: quote.payoutRatio,

      // Price Ranges
      high52Week: quote.fiftyTwoWeekHigh,
      low52Week: quote.fiftyTwoWeekLow,
      fiftyDayAverage: quote.fiftyDayAverage,
      twoHundredDayAverage: quote.twoHundredDayAverage,

      // Financial Health
      totalCash: quote.totalCash,
      totalCashPerShare: quote.totalCashPerShare,
      totalDebt: quote.totalDebt,
      debtToEquity: quote.debtToEquity,
      revenuePerShare: quote.revenuePerShare,
      returnOnAssets: quote.returnOnAssets,
      returnOnEquity: quote.returnOnEquity,
      grossProfits: quote.grossProfits,
      freeCashflow: quote.freeCashflow,
      operatingCashflow: quote.operatingCashflow,

      // Revenue and Growth
      totalRevenue: quote.totalRevenue,
      revenueGrowth: quote.revenueGrowth,
      earningsGrowth: quote.earningsGrowth,
      earningsQuarterlyGrowth: quote.earningsQuarterlyGrowth,

      // Profitability
      profitMargins: quote.profitMargins,
      grossMargins: quote.grossMargins,
      operatingMargins: quote.operatingMargins,
      ebitdaMargins: quote.ebitdaMargins,

      // Share Information
      sharesOutstanding: quote.sharesOutstanding,
      floatShares: quote.floatShares,
      sharesShort: quote.sharesShort,
      sharesShortPriorMonth: quote.sharesShortPriorMonth,
      shortRatio: quote.shortRatio,
      shortPercentOfFloat: quote.shortPercentOfFloat,

      // Exchange Information
      exchange: quote.fullExchangeName || quote.exchange,
      exchangeTimezoneName: quote.exchangeTimezoneName,
      exchangeTimezoneShortName: quote.exchangeTimezoneShortName,
      currency: quote.currency,
      quoteType: quote.quoteType,

      // Analyst Recommendations
      recommendationMean: quote.recommendationMean,
      recommendationKey: quote.recommendationKey,
      numberOfAnalystOpinions: quote.numberOfAnalystOpinions,
      targetHighPrice: quote.targetHighPrice,
      targetLowPrice: quote.targetLowPrice,
      targetMeanPrice: quote.targetMeanPrice,
      targetMedianPrice: quote.targetMedianPrice,

      // ESG Scores (if available)
      esgPopulated: quote.esgPopulated,
      sustainabilityFlag: quote.sustainabilityFlag,

      // Additional Fields
      bookValue: quote.bookValue,
      priceHint: quote.priceHint,
      regularMarketTime: quote.regularMarketTime,
      postMarketChangePercent: quote.postMarketChangePercent,
      postMarketChange: quote.postMarketChange,
      postMarketTime: quote.postMarketTime,
      postMarketPrice: quote.postMarketPrice,

      // Technical Indicators
      trendIndicator: quote.regularMarketPrice && quote.fiftyDayAverage ?
        (quote.regularMarketPrice > quote.fiftyDayAverage ? 'bullish' : 'bearish') : null,
      momentumIndicator: quote.regularMarketChangePercent && Math.abs(quote.regularMarketChangePercent) > 2 ?
        'high' : 'normal'
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error("Profile API error:", error)

    // Return mock profile data if API fails
    const mockProfile = {
      symbol: "AAPL",
      name: "Apple Inc.",
      sector: "Technology",
      industry: "Consumer Electronics",
      fullTimeEmployees: 164000,
      city: "Cupertino",
      state: "CA",
      country: "United States",
      website: "https://www.apple.com",
      businessSummary: "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide. It also sells various related services. In addition, the company offers iPhone, a line of smartphones; Mac, a line of personal computers; iPad, a line of multi-purpose tablets; AirPods, a wireless headphone that deliver industry-leading audio experiences; and Apple Watch, a smartwatch that tracks daily activity and health.",
      marketCap: 2500000000000,
      price: 150.25,
      change: 2.15,
      changePercent: 1.45,
      exchange: "NASDAQ Global Select",
      currency: "USD",
      beta: 1.25,
      peRatio: 25.5,
      dividendYield: 0.0055,
      high52Week: 180.95,
      low52Week: 124.17
    }

    return NextResponse.json({
      ...mockProfile,
      fallback: true
    })
  }
}