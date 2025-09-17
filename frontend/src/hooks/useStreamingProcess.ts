import { useState, useCallback, useRef } from 'react'
import { useMetricsStore, estimateTokens } from '@/stores'

interface UseStreamingProcessOptions {
  apiUrl: string
  processType: 'translation' | 'interpretation'
  onComplete?: (content: string) => void
  onError?: (error: Error) => void
}

export function useStreamingProcess({
  apiUrl,
  processType,
  onComplete,
  onError
}: UseStreamingProcessOptions) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [error, setError] = useState<Error | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)
  const { startProcess, endProcess, setTokenCount, setCharCount } = useMetricsStore()

  const startStreaming = useCallback(async (
    content: string,
    prompt: string,
    llmConfig: any
  ) => {
    try {
      setIsProcessing(true)
      setStreamingContent('')
      setError(null)

      // 创建新的 AbortController
      abortControllerRef.current = new AbortController()

      // 开始计量
      startProcess(processType)
      const inputTokens = estimateTokens(content)
      setTokenCount(processType, { input: inputTokens })
      setCharCount(processType, { input: content.length })

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'}`,
        },
        body: JSON.stringify({
          content,
          prompt,
          llm_config: llmConfig,
          stream: true // 告诉后端我们要流式响应
        }),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        throw new Error(`Process failed: ${response.status}`)
      }

      // 检查是否支持流式响应
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Streaming not supported')
      }

      const decoder = new TextDecoder()
      let accumulatedContent = ''

      try {
        while (true) {
          const { done, value } = await reader.read()

          if (done) break

          const chunk = decoder.decode(value, { stream: true })

          // 解析 Server-Sent Events 格式
          const lines = chunk.split('\n')
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))
                if (data.content) {
                  accumulatedContent += data.content
                  setStreamingContent(accumulatedContent)
                }
                if (data.done) {
                  // 流结束
                  const outputTokens = estimateTokens(accumulatedContent)
                  setTokenCount(processType, { output: outputTokens })
                  setCharCount(processType, { output: accumulatedContent.length })

                  endProcess(processType)
                  onComplete?.(accumulatedContent)
                  return
                }
              } catch (e) {
                // 忽略解析错误，继续处理下一行
                console.warn('Failed to parse streaming data:', e)
              }
            }
          }
        }
      } finally {
        reader.releaseLock()
      }

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')

      if (error.name !== 'AbortError') {
        setError(error)
        onError?.(error)
        endProcess(processType, { progress: 0 })
      }
    } finally {
      setIsProcessing(false)
      abortControllerRef.current = null
    }
  }, [apiUrl, processType, startProcess, endProcess, setTokenCount, setCharCount, onComplete, onError])

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }, [])

  const reset = useCallback(() => {
    setStreamingContent('')
    setError(null)
    setIsProcessing(false)
  }, [])

  return {
    isProcessing,
    streamingContent,
    error,
    startStreaming,
    stopStreaming,
    reset
  }
}