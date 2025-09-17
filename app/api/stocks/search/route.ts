import { NextRequest, NextResponse } from 'next/server'
import yahooFinance from 'yahoo-finance2'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')

  if (!query || query.length < 1) {
    return NextResponse.json({ results: [] })
  }

  try {
    // Search for stocks
    const searchResults = await yahooFinance.search(query, {
      quotesCount: 10,
      newsCount: 0,
    })

    // Format the results
    const formattedResults = searchResults.quotes
      .filter(quote => quote.typeDisp !== 'Cryptocurrency') // Filter out crypto
      .slice(0, 10) // Limit to 10 results
      .map(quote => ({
        symbol: quote.symbol,
        name: quote.longname || quote.shortname || quote.symbol,
        exchange: quote.exchDisp || quote.exchange || '',
        type: quote.typeDisp || 'Stock',
        sector: quote.sector || '',
        industry: quote.industry || '',
      }))

    return NextResponse.json({ results: formattedResults })
  } catch (error) {
    console.error('Error searching stocks:', error)
    return NextResponse.json(
      { error: 'Failed to search stocks' },
      { status: 500 }
    )
  }
}