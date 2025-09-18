import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const defaultAgentName = process.env.REMOTEAGENT_AGENT_NAME
    const baseUrl = process.env.REMOTEAGENT_BASE_URL
    const hasToken = !!process.env.REMOTEAGENT_TOKEN

    return Response.json({
      success: true,
      defaultAgentName: defaultAgentName || null,
      isConfigured: !!(baseUrl && hasToken),
      baseUrl: baseUrl || null
    })
  } catch (error) {
    console.error('RemoteAgent config error:', error)
    return Response.json(
      { error: 'Failed to get configuration' },
      { status: 500 }
    )
  }
}