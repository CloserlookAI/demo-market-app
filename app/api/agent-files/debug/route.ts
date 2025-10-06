import { NextRequest, NextResponse } from 'next/server'

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const canvasAgentName = process.env.REMOTEAGENT_CANVAS_AGENT_NAME
    const chatAgentName = process.env.REMOTEAGENT_AGENT_NAME
    const token = process.env.REMOTEAGENT_TOKEN
    const baseUrl = process.env.REMOTEAGENT_BASE_URL

    const results: any = {
      config: {
        canvasAgentName,
        chatAgentName,
        baseUrl,
        hasToken: !!token
      },
      tests: {}
    }

    if (!canvasAgentName || !baseUrl) {
      return NextResponse.json({
        success: false,
        error: 'Missing environment variables',
        results
      })
    }

    // Extract the base domain from baseUrl (remove /api/v0)
    const baseDomain = baseUrl.replace('/api/v0', '')

    // Test: Read stock_report.html from public content path
    try {
      const fileUrl = `${baseDomain}/content/${canvasAgentName}/stock_report.html`
      const fileResponse = await fetch(fileUrl)
      const content = await fileResponse.text()
      results.tests.stockReport = {
        url: fileUrl,
        status: fileResponse.status,
        contentLength: content.length,
        contentPreview: content.substring(0, 300)
      }
    } catch (error: any) {
      results.tests.stockReport = { error: error.message }
    }

    return NextResponse.json({
      success: true,
      results
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    })
  }
}
