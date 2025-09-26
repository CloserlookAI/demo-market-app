import { NextRequest, NextResponse } from 'next/server'
import { RemoteAgentClient, extractFinalResponse, RemoteAgentError } from '@/lib/remoteagent'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Stock Analysis API called')

    const body = await request.json()
    const { prompt, symbol, data } = body

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    // Get RemoteAgent configuration from environment
    const baseUrl = process.env.REMOTEAGENT_BASE_URL
    const token = process.env.REMOTEAGENT_TOKEN
    const agentName = process.env.REMOTEAGENT_AGENT_NAME

    console.log('🔧 Environment check:', {
      hasBaseUrl: !!baseUrl,
      hasToken: !!token,
      hasAgentName: !!agentName
    })

    if (!baseUrl || !token) {
      console.error('❌ Missing environment variables')
      return NextResponse.json({
        error: 'RemoteAgent not configured. Please set REMOTEAGENT_BASE_URL and REMOTEAGENT_TOKEN environment variables.',
        success: false
      }, { status: 500 })
    }

    if (!agentName) {
      console.error('❌ Missing agent name')
      return NextResponse.json({
        error: 'No default agent configured. Please set REMOTEAGENT_AGENT_NAME environment variable.',
        success: false
      }, { status: 500 })
    }

    console.log('🚀 Creating RemoteAgent client for stock analysis...')
    const client = new RemoteAgentClient({ baseUrl, token })

    console.log('📡 Calling RemoteAgent API for stock analysis...')

    // Use background processing for better reliability
    let response
    try {
      // Create response with background=true (non-blocking) - more reliable
      console.log('🚀 Creating background response for stock analysis...')
      const bgResponse = await client.createResponse(agentName, {
        input: { content: [{ type: 'text', content: prompt }] },
        background: true // Use background processing for reliability
      })

      console.log('✅ Background response created, polling for completion...', bgResponse.id)

      // Poll for completion with no timeout limit - wait until complete
      response = await client.pollResponse(agentName, bgResponse.id, {
        maxWaitTime: 30 * 60 * 1000, // 30 minutes max wait
        pollInterval: 5000, // 5 seconds between polls
        onStatusUpdate: (resp) => {
          console.log('📊 Analysis status update:', resp.status)
        }
      })
    } catch (error) {
      console.error('❌ Background processing failed:', error)

      // Provide more helpful error messages
      if (error instanceof Error && error.message.includes('Agent is busy')) {
        throw new Error('The AI agent is currently processing another request. Please wait a moment and try again.')
      } else if (error instanceof Error && error.message.includes('timed out')) {
        throw new Error('Stock analysis is taking longer than expected. The AI is working on complex analysis - please try again in a few minutes.')
      } else {
        throw error
      }
    }

    console.log('✅ Stock Analysis response received:', {
      id: response.id,
      status: response.status,
      hasOutputContent: response.output_content?.length > 0
    })

    const finalResponse = extractFinalResponse(response)
    console.log('📤 Extracted final analysis:', finalResponse?.substring(0, 200) + '...')

    return NextResponse.json({
      success: true,
      analysis: finalResponse,
      responseId: response.id,
      symbol: symbol,
      timestamp: new Date().toISOString(),
      isComplete: true
    })

  } catch (error) {
    console.error('Stock Analysis API error:', error)

    if (error instanceof RemoteAgentError) {
      return NextResponse.json({
        error: error.message,
        success: false
      }, { status: error.statusCode || 500 })
    }

    return NextResponse.json({
      error: 'Failed to analyze stock data',
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }, { status: 500 })
  }
}