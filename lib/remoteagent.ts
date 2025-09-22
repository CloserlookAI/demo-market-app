interface RemoteAgentConfig {
  baseUrl: string
  token: string
}

interface AgentResponse {
  id: string
  agent_name: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  input: { text: string }
  output: {
    text: string
    items: Array<{
      type: 'commentary' | 'tool_call' | 'tool_result' | 'final'
      channel?: string
      text?: string
      tool?: string
      args?: any
      output?: any
    }>
  }
  created_at: string
  updated_at: string
}

interface CreateResponseRequest {
  input: { text: string }
  background?: boolean
}

export class RemoteAgentError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message)
    this.name = 'RemoteAgentError'
  }
}

export class RemoteAgentClient {
  private config: RemoteAgentConfig

  constructor(config: RemoteAgentConfig) {
    this.config = config
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.token}`,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`

      try {
        const errorData = JSON.parse(errorText)
        if (errorData.message) {
          errorMessage = errorData.message
        }
      } catch {
        // Use default error message if JSON parsing fails
      }

      throw new RemoteAgentError(errorMessage, response.status)
    }

    // Check if response has content
    const responseText = await response.text()
    if (!responseText.trim()) {
      throw new RemoteAgentError('Empty response received from server')
    }

    try {
      return JSON.parse(responseText)
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError)
      console.error('Response text:', responseText.substring(0, 500) + '...')
      throw new RemoteAgentError(`Failed to parse JSON response: ${jsonError instanceof Error ? jsonError.message : 'Invalid JSON'}`)
    }
  }

  async listPublishedAgents(): Promise<any[]> {
    return this.request<any[]>('/api/v0/published/agents')
  }

  async getPublishedAgent(name: string): Promise<any> {
    return this.request<any>(`/api/v0/published/agents/${name}`)
  }

  async createResponse(agentName: string, data: CreateResponseRequest, signal?: AbortSignal): Promise<AgentResponse> {
    return this.request<AgentResponse>(`/api/v0/agents/${agentName}/responses`, {
      method: 'POST',
      body: JSON.stringify(data),
      signal,
    })
  }

  async getResponse(agentName: string, responseId: string): Promise<AgentResponse | null> {
    try {
      const responses = await this.request<AgentResponse[]>(`/api/v0/agents/${agentName}/responses?limit=1000`)
      const response = responses.find(r => r.id === responseId)

      if (!response) {
        return null // Return null instead of throwing error - let polling handle it
      }

      return response
    } catch (error) {
      // If the request fails, return null to continue polling
      console.log('🔄 Polling... response not ready yet')
      return null
    }
  }

  async pollResponse(
    agentName: string,
    responseId: string,
    options: {
      maxWaitTime?: number
      pollInterval?: number
      onStatusUpdate?: (response: AgentResponse) => void
    } = {}
  ): Promise<AgentResponse> {
    const {
      maxWaitTime = 15 * 60 * 1000, // 15 minutes
      pollInterval = 2000, // 2 seconds
      onStatusUpdate
    } = options

    const startTime = Date.now()
    let lastStatus = ''

    console.log(`🔄 Starting to poll response ${responseId} for agent ${agentName}`)

    while (Date.now() - startTime < maxWaitTime) {
      const response = await this.getResponse(agentName, responseId)

      if (response) {
        // Update status only if it changed
        if (response.status !== lastStatus) {
          lastStatus = response.status
          console.log(`📊 Response status: ${response.status}`)

          if (onStatusUpdate) {
            onStatusUpdate(response)
          }
        }

        // Check if response is complete
        if (response.status === 'completed' || response.status === 'failed') {
          console.log(`✅ Response ${response.status}: ${responseId}`)
          return response
        }
      } else {
        // Response not found yet or error occurred, just wait and continue
        console.log(`🔄 Response not ready, waiting ${pollInterval}ms...`)
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval))
    }

    throw new RemoteAgentError('Response polling timed out after waiting for completion')
  }
}

// Utility function to extract final response text
export function extractFinalResponse(response: any): string {
  console.log('🔍 Extracting response from:', JSON.stringify(response, null, 2))

  // Handle the new response structure with output_content
  if (response.output_content && Array.isArray(response.output_content)) {
    console.log('✅ Found output_content array')

    // Get all content from output_content array
    const contents = response.output_content
      .filter((item: any) => item.content)
      .map((item: any) => item.content)

    if (contents.length > 0) {
      const combinedContent = contents.join('\n\n')
      console.log('✅ Extracted content from output_content:', combinedContent)
      return combinedContent
    }
  }

  // Fallback: try to get the final text from output.text (old structure)
  if (response.output?.text) {
    console.log('✅ Found output.text:', response.output.text)
    return response.output.text
  }

  // If not available, look for final item in items array (old structure)
  const finalItem = response.output?.items?.find((item: any) => item.type === 'final')
  if (finalItem?.text) {
    console.log('✅ Found final item:', finalItem.text)
    return finalItem.text
  }

  // If still no final response, concatenate all text content (old structure)
  const textItems = response.output?.items?.filter((item: any) => item.text) || []
  if (textItems.length > 0) {
    const combinedText = textItems.map((item: any) => item.text).join('\n')
    console.log('✅ Found text items:', combinedText)
    return combinedText
  }

  // Try to extract from segments if available
  if (response.segments && Array.isArray(response.segments)) {
    const textSegments = response.segments
      .filter((segment: any) => segment.text && segment.type !== 'tool_call' && segment.type !== 'tool_result')
      .map((segment: any) => segment.text)

    if (textSegments.length > 0) {
      const combinedSegments = textSegments.join('\n')
      console.log('✅ Found text in segments:', combinedSegments)
      return combinedSegments
    }
  }

  // Try to get any text content from the response itself
  if (response.input?.text && response.status === 'completed') {
    console.log('⚠️ Using input text as fallback (this might indicate a response structure issue)')
    return `Response completed for: "${response.input.text}". The AI agent processed your request successfully but the response format may need adjustment.`
  }

  // Look for any text content in the entire response object
  const allText = JSON.stringify(response, null, 2)
  if (allText && allText.length > 100) {
    console.log('⚠️ Response structure might be different. Full response:', allText.substring(0, 500))

    // If response is completed but we can't find the text, give a helpful message
    if (response.status === 'completed') {
      return `Your request was processed successfully by the AI agent, but the response format needs to be adjusted. Status: ${response.status}. Please check the logs for the full response structure.`
    }
  }

  console.log('❌ No response content found')
  return 'No response available'
}

// Environment variable helpers
export function createRemoteAgentFromEnv(): RemoteAgentClient | null {
  const baseUrl = process.env.REMOTEAGENT_BASE_URL
  const token = process.env.REMOTEAGENT_TOKEN

  if (!baseUrl || !token) {
    return null
  }

  return new RemoteAgentClient({ baseUrl, token })
}