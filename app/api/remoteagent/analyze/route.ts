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
    // Create response with blocking=false to wait for completion
    const response = await client.createResponse(agentName, {
      input: { text: prompt },
      background: false // Wait for completion
    })

    console.log('✅ Stock Analysis response received:', {
      id: response.id,
      status: response.status,
      hasText: !!response.output?.text
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