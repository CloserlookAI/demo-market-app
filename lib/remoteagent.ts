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

class RemoteAgentError extends Error {
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

    return response.json()
  }

  async listPublishedAgents(): Promise<any[]> {
    return this.request<any[]>('/api/v0/published/agents')
  }

  async getPublishedAgent(name: string): Promise<any> {
    return this.request<any>(`/api/v0/published/agents/${name}`)
  }

  async createResponse(agentName: string, data: CreateResponseRequest): Promise<AgentResponse> {
    return this.request<AgentResponse>(`/api/v0/agents/${agentName}/responses`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getResponse(agentName: string, responseId: string): Promise<AgentResponse> {
    const responses = await this.request<AgentResponse[]>(`/api/v0/agents/${agentName}/responses?limit=1000`)
    const response = responses.find(r => r.id === responseId)

    if (!response) {
      throw new RemoteAgentError(`Response ${responseId} not found for agent ${agentName}`)
    }

    return response
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

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const response = await this.getResponse(agentName, responseId)

        if (onStatusUpdate) {
          onStatusUpdate(response)
        }

        if (response.status === 'completed' || response.status === 'failed') {
          return response
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollInterval))
      } catch (error) {
        if (error instanceof RemoteAgentError && error.statusCode === 404) {
          // Response not found yet, continue polling
          await new Promise(resolve => setTimeout(resolve, pollInterval))
          continue
        }
        throw error
      }
    }

    throw new RemoteAgentError('Response polling timed out')
  }
}

// Utility function to extract final response text
export function extractFinalResponse(response: AgentResponse): string {
  // First try to get the final text from output.text
  if (response.output?.text) {
    return response.output.text
  }

  // If not available, look for final item in items array
  const finalItem = response.output?.items?.find(item => item.type === 'final')
  if (finalItem?.text) {
    return finalItem.text
  }

  // If still no final response, concatenate all text content
  const textItems = response.output?.items?.filter(item => item.text) || []
  if (textItems.length > 0) {
    return textItems.map(item => item.text).join('\n')
  }

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