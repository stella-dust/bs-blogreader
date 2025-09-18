import { useState, useCallback, useRef } from 'react'
import { useChatSettingsStore } from '@/stores/chatSettingsStore'
import { useMetricsStore } from '@/stores'
import { SmartChatProcessor, createSmartChatProcessor } from '@/utils/smartChatProcessor'
import type { EnhancedChatMessage, LLMConfig, ProcessMode } from '@/stores/types'

interface UseSmartChatStreamingOptions {
  apiBaseUrl: string
  llmConfig: LLMConfig
  blogId?: string
  blogContent?: string
  onMessageStart?: (mode: ProcessMode['type']) => void
  onMessageChunk?: (chunk: string, mode: ProcessMode['type']) => void
  onMessageComplete?: (message: EnhancedChatMessage) => void
  onError?: (error: Error, mode: ProcessMode['type']) => void
}

export function useSmartChatStreaming({
  apiBaseUrl,
  llmConfig,
  blogId,
  blogContent,
  onMessageStart,
  onMessageChunk,
  onMessageComplete,
  onError
}: UseSmartChatStreamingOptions) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentMode, setCurrentMode] = useState<ProcessMode['type'] | null>(null)
  const [streamingContent, setStreamingContent] = useState('')
  const [error, setError] = useState<Error | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)
  const processorRef = useRef<SmartChatProcessor | null>(null)
  const { settings } = useChatSettingsStore()
  const { startProcess, endProcess } = useMetricsStore()

  // 初始化处理器
  const initializeProcessor = useCallback(() => {
    if (!processorRef.current ||
        processorRef.current['apiBaseUrl'] !== apiBaseUrl ||
        processorRef.current['llmConfig'] !== llmConfig) {
      processorRef.current = createSmartChatProcessor(apiBaseUrl, llmConfig)
    }
    return processorRef.current
  }, [apiBaseUrl, llmConfig])

  /**
   * 流式处理聊天消息
   */
  const processMessage = useCallback(async (input: string) => {
    try {
      setIsProcessing(true)
      setStreamingContent('')
      setError(null)

      const processor = initializeProcessor()
      abortControllerRef.current = new AbortController()

      // 预测处理模式
      const prediction = SmartChatProcessor.predictMode(input, settings)
      setCurrentMode(prediction.mode.type)
      onMessageStart?.(prediction.mode.type)

      console.log(`🤖 智能处理模式: ${prediction.mode.type}`, prediction)

      // 开始处理计量
      startProcess('chat')

      // 根据模式选择流式处理方法
      switch (prediction.mode.type) {
        case 'url_fetch':
          await processUrlFetchStreaming(input, processor, prediction.mode.type)
          break
        case 'web_search':
          await processWebSearchStreaming(input, processor, prediction.mode.type)
          break
        case 'rag_only':
          await processRAGStreaming(input, processor, prediction.mode.type)
          break
        default:
          throw new Error(`Unknown processing mode: ${prediction.mode.type}`)
      }

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      console.error('Smart chat streaming error:', error)

      if (error.name !== 'AbortError') {
        setError(error)
        onError?.(error, currentMode || 'rag_only')
        endProcess('chat', { progress: 0 })
      }
    } finally {
      setIsProcessing(false)
      setCurrentMode(null)
      abortControllerRef.current = null
    }
  }, [settings, initializeProcessor, onMessageStart, onError, startProcess, endProcess, currentMode])

  /**
   * URL抓取模式流式处理
   */
  const processUrlFetchStreaming = useCallback(async (
    input: string,
    processor: SmartChatProcessor,
    mode: ProcessMode['type']
  ) => {
    // URL抓取暂时非流式，但可以分步骤显示进度
    setStreamingContent('🔗 正在抓取网页内容...')
    onMessageChunk?.('🔗 正在抓取网页内容...', mode)

    const result = await processor.process(input, blogId || '', settings, blogContent)

    if (result.success && result.message) {
      // 模拟流式输出效果
      const content = result.message.content
      await simulateStreamingOutput(content, mode)

      endProcess('chat')
      onMessageComplete?.(result.message)
    } else {
      throw new Error(result.error || 'URL抓取失败')
    }
  }, [blogId, blogContent, settings, onMessageChunk, onMessageComplete, endProcess])

  /**
   * Web搜索模式流式处理
   */
  const processWebSearchStreaming = useCallback(async (
    input: string,
    processor: SmartChatProcessor,
    mode: ProcessMode['type']
  ) => {
    // 分阶段显示搜索进度
    const stages = [
      '🔍 正在搜索相关信息...',
      '🌐 正在抓取网页内容...',
      '🧠 正在分析和整合信息...',
      '✍️ 正在生成综合回答...'
    ]

    for (let i = 0; i < stages.length; i++) {
      if (abortControllerRef.current?.signal.aborted) return

      const stageText = `${stages[i]}\n\n${'▓'.repeat(i + 1)}${'░'.repeat(stages.length - i - 1)} ${Math.round((i + 1) / stages.length * 100)}%`
      setStreamingContent(stageText)
      onMessageChunk?.(stageText, mode)

      await new Promise(resolve => setTimeout(resolve, 800)) // 模拟处理时间
    }

    // 实际处理
    const result = await processor.process(input, blogId || '', settings, blogContent)

    if (result.success && result.message) {
      // 清空进度，开始真正的内容流式输出
      await simulateStreamingOutput(result.message.content, mode)

      endProcess('chat')
      onMessageComplete?.(result.message)
    } else {
      throw new Error(result.error || 'Web搜索失败')
    }
  }, [blogId, blogContent, settings, onMessageChunk, onMessageComplete, endProcess])

  /**
   * RAG模式流式处理
   */
  const processRAGStreaming = useCallback(async (
    input: string,
    processor: SmartChatProcessor,
    mode: ProcessMode['type']
  ) => {
    // RAG模式显示检索进度
    setStreamingContent('📚 正在检索相关内容...')
    onMessageChunk?.('📚 正在检索相关内容...', mode)

    await new Promise(resolve => setTimeout(resolve, 500))

    setStreamingContent('📚 正在检索相关内容...\n🧠 正在理解和分析...')
    onMessageChunk?.('📚 正在检索相关内容...\n🧠 正在理解和分析...', mode)

    const result = await processor.process(input, blogId || '', settings, blogContent)

    if (result.success && result.message) {
      await simulateStreamingOutput(result.message.content, mode)

      endProcess('chat')
      onMessageComplete?.(result.message)
    } else {
      throw new Error(result.error || 'RAG处理失败')
    }
  }, [blogId, blogContent, settings, onMessageChunk, onMessageComplete, endProcess])

  /**
   * 模拟流式输出效果
   */
  const simulateStreamingOutput = useCallback(async (content: string, mode: ProcessMode['type']) => {
    const words = content.split('')
    let accumulated = ''

    for (let i = 0; i < words.length; i++) {
      if (abortControllerRef.current?.signal.aborted) return

      accumulated += words[i]
      setStreamingContent(accumulated)
      onMessageChunk?.(accumulated, mode)

      // 动态延迟：标点符号后稍微停顿，其他字符快速输出
      const char = words[i]
      const delay = /[。！？\n]/.test(char) ? 100 :
                   /[，、；：]/.test(char) ? 50 :
                   /\s/.test(char) ? 30 : 15

      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }, [onMessageChunk])

  /**
   * 停止处理
   */
  const stopProcessing = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setIsProcessing(false)
    setCurrentMode(null)
  }, [])

  /**
   * 重置状态
   */
  const reset = useCallback(() => {
    setStreamingContent('')
    setError(null)
    setIsProcessing(false)
    setCurrentMode(null)
  }, [])

  /**
   * 更新LLM配置
   */
  const updateLLMConfig = useCallback((newConfig: LLMConfig) => {
    if (processorRef.current) {
      processorRef.current.updateLLMConfig(newConfig)
    }
  }, [])

  return {
    // 状态
    isProcessing,
    currentMode,
    streamingContent,
    error,

    // 方法
    processMessage,
    stopProcessing,
    reset,
    updateLLMConfig,

    // 工具方法
    predictMode: useCallback((input: string) =>
      SmartChatProcessor.predictMode(input, settings), [settings])
  }
}