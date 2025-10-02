import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const url = searchParams.get('url')

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'URL parameter is required' },
        { status: 400 }
      )
    }

    // Fetch the HTML content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: `Failed to fetch: ${response.statusText}` },
        { status: response.status }
      )
    }

    const html = await response.text()

    return NextResponse.json({
      success: true,
      html: html
    })

  } catch (error: any) {
    console.error('Error fetching HTML:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch HTML' },
      { status: 500 }
    )
  }
}