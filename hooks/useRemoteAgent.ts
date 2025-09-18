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

    console.log('🚀 RemoteAgent Request:', { message, agentName })

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
        body: JSON.stringify({ message, agentName }),
        signal: abortControllerRef.current.signal
      })

      console.log('📡 Response status:', response.status)
      const data: RemoteAgentResponse = await response.json()
      console.log('📡 Response data:', data)

      if (!response.ok) {
        console.error('❌ API Error:', data.error)
        throw new Error(data.error || `HTTP ${response.status}: Failed to send message`)
      }

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
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)
      if (onError) {
        onError(errorMessage)
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