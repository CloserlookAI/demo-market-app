import { NextRequest } from 'next/server'

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic'

const BASE_URL = (process.env.REMOTEAGENT_BASE_URL || 'https://ra-hyp-1.raworc.com').replace(/\/api\/v0$/, '')
const TOKEN = process.env.REMOTEAGENT_TOKEN

interface ChatRequestBody {
  agentName: string
  message: string
}

export async function POST(req: NextRequest) {
  try {
    if (!TOKEN) {
      return Response.json(
        { success: false, error: 'REMOTEAGENT_TOKEN not configured' },
        { status: 500 }
      )
    }

    const body: ChatRequestBody = await req.json()
    const { agentName, message } = body

    if (!agentName || !message) {
      return Response.json(
        { success: false, error: 'Agent name and message are required' },
        { status: 400 }
      )
    }

    console.log(`Sending message to agent: ${agentName}`)

    // Send message to agent using the responses API with blocking mode
    const url = `${BASE_URL}/api/v0/agents/${agentName}/responses`

    // Keep retrying indefinitely until we get a successful response - NO TIMEOUTS
    let response
    let retryCount = 0

    while (true) {
      try {
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            input: {
              content: [
                {
                  type: 'text',
                  content: message
                }
              ]
            },
            background: false // Block until response is complete
          })
          // NO timeout signal - wait forever
        })

        // If successful, break out of retry loop
        if (response.ok) {
          console.log(`Agent responded successfully after ${retryCount} retries`)
          break
        }

        // For any error status (504, 503, 409, etc.), just retry after a delay
        console.log(`Attempt ${retryCount + 1}: Agent still processing (status ${response.status}), retrying in 10 seconds...`)
        await new Promise(resolve => setTimeout(resolve, 10000)) // Wait 10 seconds before retry
        retryCount++

      } catch (fetchError: any) {
        // Handle network errors - just retry
        console.log(`Attempt ${retryCount + 1}: Fetch error (${fetchError.message}), retrying in 10 seconds...`)
        await new Promise(resolve => setTimeout(resolve, 10000)) // Wait 10 seconds before retry
        retryCount++
      }
    }

    const responseData = await response.json()
    console.log('Agent response received:', responseData.status)

    // Extract the text from output_content or segments
    let responseText = ''

    if (responseData.output_content && responseData.output_content.length > 0) {
      // Try to get text from output_content
      const textContent = responseData.output_content.find((item: any) => item.type === 'text')
      if (textContent) {
        responseText = textContent.content
      }
    }

    // Fallback to segments if no output_content
    if (!responseText && responseData.segments && responseData.segments.length > 0) {
      // Get the final segment or last text segment
      const finalSegment = responseData.segments
        .filter((seg: any) => seg.type === 'final' || seg.text)
        .pop()

      if (finalSegment && finalSegment.text) {
        responseText = finalSegment.text
      }
    }

    // If still no text, check if there's an error
    if (!responseText && responseData.status === 'failed') {
      responseText = 'The agent encountered an error processing your request.'
    }

    return Response.json({
      success: true,
      response: {
        id: responseData.id,
        status: responseData.status,
        text: responseText,
        output_content: responseData.output_content,
        segments: responseData.segments,
        created_at: responseData.created_at,
        updated_at: responseData.updated_at
      }
    })

  } catch (error: any) {
    console.error('Chat API error:', error)
    return Response.json(
      {
        success: false,
        error: error.message || 'Failed to send message to agent',
        details: error.stack
      },
      { status: 500 }
    )
  }
}
