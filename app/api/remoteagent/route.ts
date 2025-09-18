import { NextRequest } from 'next/server'
import { RemoteAgentClient, extractFinalResponse, RemoteAgentError } from '@/lib/remoteagent'

export async function POST(req: NextRequest) {
  try {
    console.log('🔧 RemoteAgent API called')

    const { message, agentName } = await req.json()
    console.log('📝 Request payload:', { message, agentName })

    if (!message || typeof message !== 'string') {
      console.error('❌ Invalid message:', message)
      return Response.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      )
    }

    if (!agentName || typeof agentName !== 'string') {
      console.error('❌ Invalid agent name:', agentName)
      return Response.json(
        { error: 'Agent name is required and must be a string' },
        { status: 400 }
      )
    }

    // Get RemoteAgent configuration from environment
    const baseUrl = process.env.REMOTEAGENT_BASE_URL
    const token = process.env.REMOTEAGENT_TOKEN

    console.log('🔧 Environment check:', {
      hasBaseUrl: !!baseUrl,
      baseUrl,
      hasToken: !!token,
      tokenLength: token?.length || 0
    })

    if (!baseUrl || !token) {
      console.error('❌ Missing environment variables:', { baseUrl, hasToken: !!token })
      return Response.json(
        { error: 'RemoteAgent not configured. Please set REMOTEAGENT_BASE_URL and REMOTEAGENT_TOKEN environment variables.' },
        { status: 500 }
      )
    }

    console.log('🚀 Creating RemoteAgent client...')
    const client = new RemoteAgentClient({ baseUrl, token })

    console.log('📡 Calling RemoteAgent API with background=false...')
    // Create response with blocking=false to wait for completion
    const response = await client.createResponse(agentName, {
      input: { text: message },
      background: false // Wait for completion (blocks up to 15 minutes)
    })

    console.log('✅ RemoteAgent response received:', {
      id: response.id,
      status: response.status,
      hasText: !!response.output?.text,
      itemsCount: response.output?.items?.length || 0
    })

    const finalResponse = extractFinalResponse(response)
    console.log('📤 Extracted final response:', finalResponse)

    // If we get here, the response is complete
    return Response.json({
      success: true,
      responseId: response.id,
      status: response.status,
      agentName: response.agent_name,
      finalResponse,
      isComplete: true,
      message: 'Response completed successfully.'
    })
  } catch (error) {
    console.error('RemoteAgent API error:', error)

    if (error instanceof RemoteAgentError) {
      return Response.json(
        { error: error.message },
        { status: error.statusCode || 500 }
      )
    }

    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const baseUrl = process.env.REMOTEAGENT_BASE_URL
    const token = process.env.REMOTEAGENT_TOKEN

    if (!baseUrl || !token) {
      return Response.json(
        { error: 'RemoteAgent not configured. Please set REMOTEAGENT_BASE_URL and REMOTEAGENT_TOKEN environment variables.' },
        { status: 500 }
      )
    }

    const client = new RemoteAgentClient({ baseUrl, token })

    // List all published agents
    const agents = await client.listPublishedAgents()

    return Response.json({
      success: true,
      agents: agents.map(agent => ({
        name: agent.name,
        description: agent.description,
        state: agent.state,
        createdBy: agent.created_by,
        tags: agent.tags || []
      }))
    })
  } catch (error) {
    console.error('RemoteAgent API error:', error)

    if (error instanceof RemoteAgentError) {
      return Response.json(
        { error: error.message },
        { status: error.statusCode || 500 }
      )
    }

    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}