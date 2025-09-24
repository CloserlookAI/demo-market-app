"use client"

import { useState, useCallback, useRef, useEffect } from 'react'

interface RemoteAgentResponse {
  success: boolean
  responseId?: string
  status?: string
  agentName?: string
  finalResponse?: string
  isComplete?: boolean
  error?: string
  message?: string
}

interface UseRemoteAgentOptions {
  onStatusUpdate?: (status: string) => void
  onComplete?: (response: string) => void
  onError?: (error: string) => void
}

export function useRemoteAgent(options: UseRemoteAgentOptions = {}) {
  const {
    onStatusUpdate,
    onComplete,
    onError
  } = options

  const [isLoading, setIsLoading] = useState(false)
  const [currentStatus, setCurrentStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const abortControllerRef = useRef<AbortController>()

  // Clear any ongoing requests when component unmounts
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])


  const sendMessage = useCallback(async (message: string, agentName: string): Promise<string | null> => {
    setIsLoading(true)
    setError(null)
    setCurrentStatus('processing')

    // Validate inputs before sending
    console.log('🔍 Input validation:', {
      message: message,
      messageType: typeof message,
      messageLength: message?.length || 0,
      agentName: agentName,
      agentNameType: typeof agentName,
      agentNameLength: agentName?.length || 0
    })

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      console.error('❌ Invalid message input:', { message, type: typeof message })
      throw new Error('Message cannot be empty')
    }

    if (!agentName || typeof agentName !== 'string' || agentName.trim().length === 0) {
      console.error('❌ Invalid agent name:', { agentName, type: typeof agentName })
      throw new Error('Agent name cannot be empty')
    }

    const requestPayload = {
      message: message.trim(),
      agentName: agentName.trim()
    }

    console.log('🚀 RemoteAgent Request Details:', {
      url: '/api/remoteagent',
      method: 'POST',
      payload: requestPayload,
      payloadString: JSON.stringify(requestPayload)
    })

    // Create a new abort controller for this request
    abortControllerRef.current = new AbortController()

    try {
      // Create the response with blocking=false (waits for completion)
      console.log('📡 Sending request to /api/remoteagent...')
      const response = await fetch('/api/remoteagent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
        signal: abortControllerRef.current.signal
      })

      console.log('📡 Response status:', response.status)

      // Check if response is ok before parsing JSON
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API Error Response:', errorText)
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`

        try {
          const errorData = JSON.parse(errorText)
          if (errorData.error) {
            errorMessage = errorData.error
          }
        } catch {
          // If we can't parse error as JSON, use the raw text
          errorMessage = errorText || errorMessage
        }

        throw new Error(errorMessage)
      }

      let data: RemoteAgentResponse
      try {
        const responseText = await response.text()
        if (!responseText.trim()) {
          throw new Error('Empty response received from server')
        }
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error('❌ JSON parsing error:', parseError)
        throw new Error(`Failed to parse server response: ${parseError instanceof Error ? parseError.message : 'Invalid JSON'}`)
      }

      console.log('📡 Response data:', data)

      if (!data.success) {
        console.error('❌ Request failed:', data)
        throw new Error('Failed to create response')
      }

      // Response is already complete since we used background=false
      if (data.isComplete && data.finalResponse) {
        console.log('✅ Got final response:', data.finalResponse)
        setCurrentStatus('completed')
        if (onComplete) {
          onComplete(data.finalResponse)
        }
        return data.finalResponse
      } else {
        console.error('❌ No final response:', data)
        throw new Error('Response completed but no final response received')
      }
    } catch (err) {
      console.error('💥 RemoteAgent error:', err)

      // Only show errors that are actual failures, not polling-related issues
      if (err instanceof Error) {
        const errorMessage = err.message

        // Don't show "Response not found" errors - these are normal during polling
        if (!errorMessage.includes('not found') && !errorMessage.includes('404')) {
          setError(errorMessage)
          if (onError) {
            onError(errorMessage)
          }
        } else {
          // For polling-related errors, just log but don't show to user
          console.log('🔄 Polling in progress, response not ready yet...')
        }
      } else {
        const errorMessage = 'An unexpected error occurred'
        setError(errorMessage)
        if (onError) {
          onError(errorMessage)
        }
      }
      return null
    } finally {
      setIsLoading(false)
      setCurrentStatus(null)
    }
  }, [onComplete, onError])

  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setIsLoading(false)
    setCurrentStatus(null)
  }, [])

  return {
    sendMessage,
    cancelRequest,
    isLoading,
    currentStatus,
    error
  }
}