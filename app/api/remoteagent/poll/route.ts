import { NextRequest } from 'next/server'
import { RemoteAgentClient, extractFinalResponse, RemoteAgentError } from '@/lib/remoteagent'

export async function POST(req: NextRequest) {
  try {
    const { responseId, agentName } = await req.json()

    if (!responseId || typeof responseId !== 'string') {
      return Response.json(
        { error: 'Response ID is required and must be a string' },
        { status: 400 }
      )
    }

    if (!agentName || typeof agentName !== 'string') {
      return Response.json(
        { error: 'Agent name is required and must be a string' },
        { status: 400 }
      )
    }

    // Get RemoteAgent configuration from environment
    const baseUrl = process.env.REMOTEAGENT_BASE_URL
    const token = process.env.REMOTEAGENT_TOKEN

    if (!baseUrl || !token) {
      return Response.json(
        { error: 'RemoteAgent not configured. Please set REMOTEAGENT_BASE_URL and REMOTEAGENT_TOKEN environment variables.' },
        { status: 500 }
      )
    }

    const client = new RemoteAgentClient({ baseUrl, token })

    // Get current response status
    const response = await client.getResponse(agentName, responseId)

    if (!response) {
      return Response.json(
        { error: 'Response not found or not ready yet' },
        { status: 404 }
      )
    }

    const result = {
      success: true,
      responseId: response.id,
      status: response.status,
      agentName: response.agent_name,
      createdAt: response.created_at,
      updatedAt: response.updated_at
    }

    // If completed, include the final response
    if (response.status === 'completed') {
      return Response.json({
        ...result,
        finalResponse: extractFinalResponse(response),
        isComplete: true
      })
    }

    // If failed, include error information
    if (response.status === 'failed') {
      return Response.json({
        ...result,
        error: 'Agent response failed',
        isComplete: true
      })
    }

    // Still processing
    return Response.json({
      ...result,
      isComplete: false
    })
  } catch (error) {
    console.error('RemoteAgent polling error:', error)

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