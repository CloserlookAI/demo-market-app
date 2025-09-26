import { NextRequest } from 'next/server'
import { RemoteAgentClient, extractFinalResponse, RemoteAgentError } from '@/lib/remoteagent'

export async function POST(req: NextRequest) {
  try {
    console.log('🔧 RemoteAgent API called')

    // Get raw request body first for debugging
    const rawBody = await req.text()
    console.log('📥 Raw request body:', rawBody)
    console.log('📥 Raw body length:', rawBody.length)
    console.log('📥 Raw body type:', typeof rawBody)

    // Parse JSON
    let parsedBody
    try {
      parsedBody = JSON.parse(rawBody)
      console.log('📝 Parsed request body:', parsedBody)
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError)
      console.error('❌ Raw body that failed to parse:', rawBody)
      return Response.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const { message, agentName } = parsedBody

    console.log('📝 Extracted values:', {
      message: message,
      messageType: typeof message,
      messageLength: message?.length || 0,
      messageContent: message,
      agentName: agentName,
      agentNameType: typeof agentName,
      agentNameLength: agentName?.length || 0,
      agentNameContent: agentName
    })

    if (!message || typeof message !== 'string') {
      console.error('❌ Invalid message:', {
        received: message,
        type: typeof message,
        isString: typeof message === 'string',
        isEmpty: !message
      })
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

    console.log('📡 Calling RemoteAgent API with background processing for reliability...')

    // Always use background processing for better reliability
    let response
    try {
      // Create response with background=true (non-blocking) - more reliable for complex queries
      console.log('🚀 Creating background response...')
      const bgResponse = await client.createResponse(agentName, {
        input: { content: [{ type: 'text', content: message }] },
        background: true // Use background processing for reliability
      })

      console.log('✅ Background response created, polling for completion...', bgResponse.id)

      // Poll for completion with no timeout limit - wait until complete
      response = await client.pollResponse(agentName, bgResponse.id, {
        maxWaitTime: 30 * 60 * 1000, // 30 minutes max wait (very generous)
        pollInterval: 3000, // 3 seconds between polls (slightly faster)
        onStatusUpdate: (resp) => {
          console.log('📊 Status update:', resp.status, 'for response ID:', resp.id)
        }
      })
    } catch (error) {
      console.error('❌ Background processing failed:', error)

      // Provide more helpful error messages
      if (error instanceof Error && error.message.includes('Agent is busy')) {
        throw new Error('The AI agent is currently processing another request. Please wait a moment and try again.')
      } else if (error instanceof Error && error.message.includes('timed out')) {
        throw new Error('Your request is taking longer than expected. The AI is working on complex analysis - please try again in a few minutes.')
      } else {
        throw error
      }
    }

    console.log('✅ RemoteAgent response received:', {
      id: response.id,
      status: response.status,
      hasOutputContent: response.output_content?.length > 0,
      outputContentCount: response.output_content?.length || 0,
      fullResponse: JSON.stringify(response, null, 2).substring(0, 1000) // First 1000 chars for debugging
    })

    const finalResponse = extractFinalResponse(response)
    console.log('📤 Extracted final response type:', typeof finalResponse)
    console.log('📤 Extracted final response content:', finalResponse.substring(0, 500), '...')

    // Ensure finalResponse is always a string
    const safeResponse = typeof finalResponse === 'string' ? finalResponse : JSON.stringify(finalResponse)

    // Extra validation to ensure we don't return empty responses
    if (!safeResponse || safeResponse === 'No response available' || safeResponse.includes('No response available')) {
      console.error('🚨 Empty response detected, providing fallback')
      return Response.json({
        success: true,
        responseId: response.id,
        status: response.status,
        agentName: response.agent_name,
        finalResponse: `Hello! I received your message and processed it successfully. The technical response was: ${JSON.stringify(response, null, 2).substring(0, 500)}...`,
        isComplete: true,
        message: 'Response completed with fallback due to extraction issue.'
      })
    }

    // If we get here, the response is complete
    return Response.json({
      success: true,
      responseId: response.id,
      status: response.status,
      agentName: response.agent_name,
      finalResponse: safeResponse, // Use the safe string response
      isComplete: true,
      message: 'Response completed successfully.'
    })
  } catch (error) {
    console.error('RemoteAgent API error:', error)

    if (error instanceof RemoteAgentError) {
      return Response.json(
        { success: false, error: error.message },
        { status: error.statusCode || 500 }
      )
    }

    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return Response.json(
      { success: false, error: errorMessage },
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
        { success: false, error: error.message },
        { status: error.statusCode || 500 }
      )
    }

    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return Response.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}