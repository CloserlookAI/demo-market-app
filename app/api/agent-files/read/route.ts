import { NextRequest, NextResponse } from 'next/server'

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Get optional agent name from query params, otherwise use canvas-specific agent name
    const searchParams = request.nextUrl.searchParams
    const queryAgentName = searchParams.get('agent')
    const agentName = queryAgentName || process.env.REMOTEAGENT_CANVAS_AGENT_NAME || process.env.REMOTEAGENT_AGENT_NAME
    const token = process.env.REMOTEAGENT_TOKEN
    const baseUrl = process.env.REMOTEAGENT_BASE_URL

    console.log('Read API - Agent name:', agentName)
    console.log('Read API - Has token:', !!token)
    console.log('Read API - Base URL:', baseUrl)

    if (!agentName || !token || !baseUrl) {
      console.error('Missing environment variables:', {
        hasAgentName: !!agentName,
        hasToken: !!token,
        hasBaseUrl: !!baseUrl
      })
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required environment variables',
          details: {
            hasAgentName: !!agentName,
            hasToken: !!token,
            hasBaseUrl: !!baseUrl
          }
        },
        { status: 500 }
      )
    }

    // Get optional file path from query params, default to stock_report.html
    const filePath = searchParams.get('path') || 'stock_report.html'

    // Extract the base domain from baseUrl (remove /api/v0)
    const baseDomain = baseUrl.replace('/api/v0', '')

    // The correct path structure is: baseDomain/content/agentName/fileName
    const url = `${baseDomain}/content/${agentName}/${filePath}`

    console.log('Fetching file from:', url)

    // Fetch the HTML content directly (no Authorization needed for public content)
    const response = await fetch(url, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    })

    console.log('Response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error response:', errorText)
      return NextResponse.json(
        { success: false, error: `Failed to fetch file: ${response.statusText}`, details: errorText },
        { status: response.status }
      )
    }

    const content = await response.text()

    console.log('Content length:', content.length)

    return NextResponse.json({
      success: true,
      content: content
    })

  } catch (error: any) {
    console.error('Error fetching agent file:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch agent file' },
      { status: 500 }
    )
  }
}
