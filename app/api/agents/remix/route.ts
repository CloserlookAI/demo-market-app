import { NextRequest } from 'next/server'

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic'

const PARENT_AGENT = 'stock-performance-overview'
// Remove /api/v0 suffix if present since we'll add it
const BASE_URL = (process.env.REMOTEAGENT_BASE_URL || 'https://ra-hyp-1.raworc.com').replace(/\/api\/v0$/, '')
const TOKEN = process.env.REMOTEAGENT_TOKEN

interface RemixRequestBody {
  sessionId?: string
}

interface Agent {
  name: string
  created_by: string
  state: string
  description: string | null
  parent_agent_name: string | null
  created_at: string
  last_activity_at: string | null
  metadata: Record<string, any>
  tags: string[]
  is_published: boolean
}

async function getNextSequentialName(): Promise<string> {
  try {
    const url = `${BASE_URL}/api/v0/agents?q=stock-performance-overview&limit=100`
    console.log('Listing agents from:', url)

    // List all agents that match our naming pattern
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Failed to list agents. Status:', response.status, 'Response:', errorText)
      // Fall back to sequential numbering starting from 1
      return `stock-performance-overview-1`
    }

    const data = await response.json()
    const agents: Agent[] = data.items || []
    console.log(`Found ${agents.length} agents matching pattern`)

    // Extract numbers from existing agent names
    const numbers = agents
      .map(agent => {
        const match = agent.name.match(/^stock-performance-overview-(\d+)$/)
        return match ? parseInt(match[1], 10) : 0
      })
      .filter(num => num > 0)

    console.log('Existing agent numbers:', numbers)

    // Get the next number in sequence
    const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1

    return `stock-performance-overview-${nextNumber}`
  } catch (error) {
    console.error('Error generating sequential name:', error)
    // Fall back to starting from 1
    return `stock-performance-overview-1`
  }
}

async function remixAgent(newAgentName: string): Promise<Agent> {
  const url = `${BASE_URL}/api/v0/agents/${PARENT_AGENT}/remix`
  console.log('Remixing agent from:', url)

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: newAgentName,
      code: true,
      env: true,
      content: true
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Remix failed. Status:', response.status, 'Response:', errorText)
    throw new Error(`Failed to remix agent (${response.status}): ${errorText}`)
  }

  return await response.json()
}

export async function POST(req: NextRequest) {
  try {
    console.log('BASE_URL:', BASE_URL)
    console.log('TOKEN exists:', !!TOKEN)
    console.log('PARENT_AGENT:', PARENT_AGENT)

    if (!TOKEN) {
      return Response.json(
        { success: false, error: 'REMOTEAGENT_TOKEN not configured' },
        { status: 500 }
      )
    }

    // Generate next sequential agent name
    const newAgentName = await getNextSequentialName()

    console.log(`Creating remixed agent: ${newAgentName}`)

    // Create the remixed agent
    const agent = await remixAgent(newAgentName)

    return Response.json({
      success: true,
      agent: {
        name: agent.name,
        state: agent.state,
        parent_agent_name: agent.parent_agent_name,
        created_at: agent.created_at
      }
    })
  } catch (error: any) {
    console.error('Remix agent error:', error)
    return Response.json(
      {
        success: false,
        error: error.message || 'Failed to remix agent',
        details: error.stack
      },
      { status: 500 }
    )
  }
}

// Get current session agent info
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const agentName = searchParams.get('name')

    if (!agentName) {
      return Response.json(
        { success: false, error: 'Agent name required' },
        { status: 400 }
      )
    }

    const response = await fetch(`${BASE_URL}/api/v0/agents/${agentName}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Agent not found')
    }

    const agent = await response.json()

    return Response.json({
      success: true,
      agent: {
        name: agent.name,
        state: agent.state,
        parent_agent_name: agent.parent_agent_name,
        created_at: agent.created_at,
        last_activity_at: agent.last_activity_at
      }
    })
  } catch (error: any) {
    console.error('Get agent error:', error)
    return Response.json(
      { success: false, error: error.message || 'Failed to get agent' },
      { status: 500 }
    )
  }
}
