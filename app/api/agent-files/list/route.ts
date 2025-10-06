import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Use canvas-specific agent name for file listing
    const agentName = process.env.REMOTEAGENT_CANVAS_AGENT_NAME || process.env.REMOTEAGENT_AGENT_NAME
    const token = process.env.REMOTEAGENT_TOKEN
    const baseUrl = process.env.REMOTEAGENT_BASE_URL

    if (!agentName || !token || !baseUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing required environment variables' },
        { status: 500 }
      )
    }

    // Get optional path from query params
    const searchParams = request.nextUrl.searchParams
    const path = searchParams.get('path') || ''

    const url = path
      ? `${baseUrl}/agents/${agentName}/files/list/${path}`
      : `${baseUrl}/agents/${agentName}/files/list`

    console.log('Listing files from:', url)

    // Fetch the file list from the agent files API
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    console.log('Response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error response:', errorText)
      return NextResponse.json(
        { success: false, error: `Failed to list files: ${response.statusText}`, details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      ...data
    })

  } catch (error: any) {
    console.error('Error listing agent files:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to list agent files' },
      { status: 500 }
    )
  }
}
