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

    // Get optional file path from query params, default to report.html
    const filePath = searchParams.get('path') || 'report.html'

    // The actual file is served directly from the content endpoint
    // Format: https://ra-hyp-1.raworc.com/content/{agent-name}/report.html
    const pathsToTry = [
      `${baseUrl.replace('/api/v0', '')}/content/${agentName}/${filePath}`,
      `${baseUrl}/agents/${agentName}/files/read/${filePath}`,
      `${baseUrl}/agents/${agentName}/files/read/content/${filePath}`,
    ]

    console.log('Attempting to fetch file from multiple paths...')

    let content = ''
    let lastError = ''

    for (const url of pathsToTry) {
      try {
        console.log('Trying path:', url)

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          }
        })

        console.log('Response status:', response.status)

        if (response.ok) {
          const responseText = await response.text()
          console.log('Response content length:', responseText.length)

          if (responseText && responseText.trim().length > 0) {
            content = responseText
            console.log('Successfully loaded content from:', url)
            break
          } else {
            console.log('Empty content from:', url)
            lastError = 'File exists but is empty'
          }
        } else {
          const errorText = await response.text()
          console.log('Error response:', errorText)
          lastError = `${response.status}: ${response.statusText}`
        }
      } catch (error: any) {
        console.error('Error fetching from', url, ':', error.message)
        lastError = error.message
      }
    }

    if (!content || content.trim().length === 0) {
      console.error('Failed to fetch file from all attempted paths. Last error:', lastError)
      return NextResponse.json(
        {
          success: false,
          error: 'File not found or empty',
          details: lastError,
          agentName,
          filePath,
          pathsAttempted: pathsToTry
        },
        { status: 404 }
      )
    }

    console.log('Final content length:', content.length)

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
