"use client"

import { useState } from 'react'

export default function TestApiPage() {
  const [message, setMessage] = useState('')
  const [agentName, setAgentName] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)

  const testDirectApi = async () => {
    setLoading(true)
    setResponse('')

    console.log('🧪 Testing Direct API Call:', {
      message,
      agentName,
      messageLength: message.length,
      agentNameLength: agentName.length
    })

    try {
      const payload = {
        message: message.trim(),
        agentName: agentName.trim()
      }

      console.log('🧪 Request payload:', payload)
      console.log('🧪 Payload JSON:', JSON.stringify(payload))

      const res = await fetch('/api/remoteagent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      console.log('🧪 Response status:', res.status)
      console.log('🧪 Response headers:', Object.fromEntries(res.headers.entries()))

      const data = await res.json()
      console.log('🧪 Response data:', data)

      setResponse(JSON.stringify(data, null, 2))
    } catch (error) {
      console.error('🧪 API Test Error:', error)
      setResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const testConfig = async () => {
    console.log('🧪 Testing Config API...')
    try {
      const res = await fetch('/api/remoteagent/config')
      const data = await res.json()
      console.log('🧪 Config response:', data)
      alert(`Config: ${JSON.stringify(data, null, 2)}`)
    } catch (error) {
      console.error('🧪 Config Error:', error)
      alert(`Config Error: ${error}`)
    }
  }

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">RemoteAgent API Test</h1>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Message:</label>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your message (e.g., 'hi')"
            className="w-full p-3 border rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Agent Name:</label>
          <input
            type="text"
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            placeholder="Enter agent name"
            className="w-full p-3 border rounded-lg"
          />
        </div>

        <div className="flex gap-4">
          <button
            onClick={testDirectApi}
            disabled={loading || !message.trim() || !agentName.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test API Direct'}
          </button>

          <button
            onClick={testConfig}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Test Config
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Response:</label>
          <textarea
            value={response}
            readOnly
            rows={15}
            className="w-full p-3 border rounded-lg bg-gray-50 font-mono text-sm"
            placeholder="Response will appear here..."
          />
        </div>
      </div>

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-bold text-yellow-800 mb-2">Debug Instructions:</h3>
        <ol className="list-decimal list-inside text-sm text-yellow-700 space-y-1">
          <li>Open browser console (F12)</li>
          <li>Click "Test Config" to check your environment setup</li>
          <li>Enter a message like "hi" and agent name</li>
          <li>Click "Test API Direct" and check console logs</li>
          <li>Look for detailed request/response debugging</li>
        </ol>
      </div>
    </div>
  )
}