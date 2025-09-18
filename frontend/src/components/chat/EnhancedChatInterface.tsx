import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, MessageCircle, Trash2, RotateCcw, Settings, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useChatStore, useContentStore, useChatSettingsStore } from '@/stores'
import { useSmartChatStreaming } from '@/hooks/useSmartChatStreaming'
import { inputAnalyzer } from '@/utils/inputAnalyzer'
import { SmartChatProcessor } from '@/utils/smartChatProcessor'
import { ChatSettingsPanel, QuickSettingsToggle } from '@/components/ChatSettingsPanel'
import { SmartInputIndicator, ProcessingModeDisplay } from '@/components/SmartInputIndicator'
import { EnhancedMessageWithCitations } from '@/components/CitationSystem'
import { ServiceStatusIndicator, OfflineModeNotice, type ServiceStatus } from '@/components/ServiceStatusIndicator'
import { SmartHelpButton, FeatureHighlight } from '@/components/SmartTooltips'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { EnhancedChatMessage, ProcessMode } from '@/stores/types'

interface EnhancedChatInterfaceProps {
  className?: string
}

interface ModeIndicatorProps {
  mode: ProcessMode['type'] | null
  confidence?: number
  isProcessing?: boolean
}

function ModeIndicator({ mode, confidence, isProcessing }: ModeIndicatorProps) {
  if (!mode) return null

  const modeConfig = {
    url_fetch: { icon: '🔗', label: 'URL抓取', color: 'bg-green-100 text-green-700' },
    web_search: { icon: '🔍', label: 'Web搜索', color: 'bg-blue-100 text-blue-700' },
    rag_only: { icon: '📚', label: '原文检索', color: 'bg-purple-100 text-purple-700' }
  }

  const config = modeConfig[mode]

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${config.color}`}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
      {confidence && <span className="opacity-75">({Math.round(confidence * 100)}%)</span>}
      {isProcessing && <Loader2 className="h-3 w-3 animate-spin ml-1" />}
    </div>
  )
}

interface EnhancedMessageBubbleProps {
  message: EnhancedChatMessage
  isStreaming?: boolean
  streamingContent?: string
}

function EnhancedMessageBubble({ message, isStreaming, streamingContent }: EnhancedMessageBubbleProps) {
  const isUser = message.role === 'user'
  const timeString = message.timestamp.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  })

  const displayContent = isStreaming ? streamingContent : message.content

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser ? 'bg-blue-500' : 'bg-gray-500'
      }`}>
        {isUser ? (
          <User className="h-4 w-4 text-white" />
        ) : (
          <Bot className="h-4 w-4 text-white" />
        )}
      </div>

      {/* Message Content */}
      <div className={`flex-1 max-w-[80%] ${isUser ? 'text-right' : ''}`}>
        {/* Mode indicator for assistant messages */}
        {!isUser && message.mode && (
          <div className={`mb-2 ${isUser ? 'text-right' : ''}`}>
            <ModeIndicator mode={message.mode} isProcessing={isStreaming} />
          </div>
        )}

        <div className={`inline-block px-4 py-3 rounded-lg ${
          isUser
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 text-gray-900'
        }`}>
          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{displayContent}</p>
          ) : (
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="mb-2 pl-4">{children}</ul>,
                  ol: ({ children }) => <ol className="mb-2 pl-4">{children}</ol>,
                  li: ({ children }) => <li className="mb-1">{children}</li>,
                  code: ({ children, className }) => {
                    const isInline = !className
                    return isInline ? (
                      <code className="bg-gray-200 px-1 py-0.5 rounded text-xs font-mono">
                        {children}
                      </code>
                    ) : (
                      <pre className="bg-gray-200 p-2 rounded text-xs overflow-x-auto">
                        <code>{children}</code>
                      </pre>
                    )
                  }
                }}
              >
                {displayContent || ''}
              </ReactMarkdown>

              {/* 流式输出时的光标 */}
              {isStreaming && (
                <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-1" />
              )}
            </div>
          )}
        </div>

        {/* Sources */}
        {!isUser && message.sources && message.sources.length > 0 && !isStreaming && (
          <div className="mt-2 text-xs">
            <details className="text-gray-500">
              <summary className="cursor-pointer hover:text-gray-700">
                📎 来源 ({message.sources.length})
              </summary>
              <div className="mt-1 space-y-1 pl-2 border-l-2 border-gray-200">
                {message.sources.map((source, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-gray-400">
                      {source.type === 'original' ? '📄' : source.type === 'url' ? '🔗' : '🌐'}
                    </span>
                    <div className="flex-1">
                      <div className="font-medium">{source.title}</div>
                      {source.url && (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline break-all"
                        >
                          {source.url}
                        </a>
                      )}
                      {source.content && (
                        <div className="text-gray-600 mt-1">
                          {source.content.slice(0, 100)}...
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}

        <div className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : ''}`}>
          {timeString}
        </div>
      </div>
    </div>
  )
}

interface SmartChatInputProps {
  onSendMessage: (message: string) => void
  disabled?: boolean
  placeholder?: string
  predictedMode?: ProcessMode['type']
  confidence?: number
}

function SmartChatInput({ onSendMessage, disabled, placeholder, predictedMode, confidence }: SmartChatInputProps) {
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { settings } = useChatSettingsStore()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || disabled) return

    onSendMessage(message.trim())
    setMessage('')

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  // 自动调整高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [message])

  return (
    <div className="space-y-3">
      {/* 智能输入指示器 */}
      <SmartInputIndicator
        input={message}
        showDetails={message.trim().length > 3}
      />

      <form onSubmit={handleSubmit} className="flex gap-2 items-end">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || "询问关于这篇文章的任何问题，或粘贴链接让我帮你分析..."}
            disabled={disabled}
            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg resize-none min-h-[44px] max-h-32 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
            rows={1}
          />

          <div className="absolute right-2 bottom-2">
            <Button
              type="submit"
              size="sm"
              disabled={!message.trim() || disabled}
              className="h-8 w-8 p-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </form>

      {/* 简化提示 */}
      <div className="text-center text-xs text-gray-500 mt-2">
        <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">Enter</kbd> 发送 •
        <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs ml-1">Shift+Enter</kbd> 换行
      </div>
    </div>
  )
}

export function EnhancedChatInterface({ className }: EnhancedChatInterfaceProps) {
  const { messages, addMessage, clearMessages } = useChatStore()
  const { contentData, llmConfig } = useContentStore()
  const { settings } = useChatSettingsStore()
  const [hasContent, setHasContent] = useState(false)
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showFeatureHighlight, setShowFeatureHighlight] = useState(false)
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>('checking')

  const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://oqicgfaczdmrdoglkqzi.supabase.co'

  const {
    isProcessing,
    currentMode,
    streamingContent,
    processMessage,
    stopProcessing,
    predictMode
  } = useSmartChatStreaming({
    apiBaseUrl: API_BASE_URL,
    llmConfig,
    blogId: contentData?.url || undefined,
    blogContent: contentData?.content,
    onMessageStart: (mode) => {
      console.log('Message processing started:', mode)
    },
    onMessageChunk: (chunk, mode) => {
      // 实时更新正在流式输出的消息
    },
    onMessageComplete: (message) => {
      addMessage(message)
      setStreamingMessageId(null)
    },
    onError: (error, mode) => {
      console.error('Chat error:', error)

      // Provide more helpful error messages based on error type
      let errorMessage = '❌ 处理失败'
      let suggestions = ''

      if (error.message.includes('fetch')) {
        errorMessage = '🔌 网络连接失败'
        suggestions = '\n\n可能的解决方案：\n• 检查网络连接\n• 确认后端服务是否运行\n• 稍后重试'
      } else if (error.message.includes('timeout')) {
        errorMessage = '⏱️ 请求超时'
        suggestions = '\n\n建议：\n• 检查网络速度\n• 尝试简化问题\n• 稍后重试'
      } else if (error.message.includes('CORS')) {
        errorMessage = '🔒 跨域访问被阻止'
        suggestions = '\n\n这通常表示：\n• 后端服务未正确配置\n• 需要启动本地开发服务器'
      } else {
        errorMessage = `❌ ${error.message}`
        suggestions = '\n\n请稍后重试，或联系技术支持。'
      }

      addMessage({
        role: 'assistant',
        content: `${errorMessage}\n\n模式: ${mode}${suggestions}`,
        mode: mode
      })
      setStreamingMessageId(null)
    }
  })

  useEffect(() => {
    setHasContent(!!contentData?.content)
  }, [contentData])

  // Show feature highlight for first-time users only when service is online
  useEffect(() => {
    const hasSeenHighlight = localStorage.getItem('chat-feature-highlight-seen')
    if (!hasSeenHighlight && messages.length === 0 && serviceStatus === 'online') {
      // Delay showing to avoid information overload
      const timer = setTimeout(() => setShowFeatureHighlight(true), 2000)
      return () => clearTimeout(timer)
    }
  }, [messages.length, serviceStatus])

  const handleSendMessage = async (messageContent: string) => {
    // 添加用户消息
    const userMessage = addMessage({
      role: 'user',
      content: messageContent,
      mode: undefined
    })

    // 创建临时的助手消息用于流式显示
    const assistantMessageId = `streaming_${Date.now()}`
    setStreamingMessageId(assistantMessageId)

    try {
      await processMessage(messageContent)
    } catch (error) {
      console.error('Failed to process message:', error)
      setStreamingMessageId(null)
    }
  }

  const handleClearChat = () => {
    if (confirm('确定要清空所有对话吗？')) {
      clearMessages()
      setStreamingMessageId(null)
    }
  }

  const predictedAnalysis = predictMode(streamingContent || '')

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-medium text-gray-900">智能对话</h3>
          {hasContent && (
            <span className="text-sm text-gray-500">• 基于当前文章</span>
          )}
          <ServiceStatusIndicator
            apiBaseUrl={API_BASE_URL}
            onStatusChange={setServiceStatus}
          />
        </div>

        <div className="flex items-center gap-2">
          {/* 快速设置切换 */}
          <QuickSettingsToggle />

          {/* 帮助按钮 */}
          <SmartHelpButton
            helpContent={
              <div className="space-y-2">
                <p><strong>智能对话功能：</strong></p>
                <ul className="space-y-1 text-xs">
                  <li>• 🔗 粘贴URL自动抓取内容分析</li>
                  <li>• 🔍 检测搜索需求结合网络信息</li>
                  <li>• 📚 基于原文进行深度问答</li>
                  <li>• 📎 提供详细的引用来源</li>
                </ul>
                <p className="text-xs mt-2">
                  智能模式会自动选择最佳处理方式。
                </p>
              </div>
            }
          />

          {/* 设置按钮 */}
          <ChatSettingsPanel
            trigger={
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            }
          />

          {/* 清空按钮 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearChat}
            disabled={messages.length === 0 && !isProcessing}
          >
            <Trash2 className="h-4 w-4" />
          </Button>

          {/* 停止按钮 */}
          {isProcessing && (
            <Button
              variant="outline"
              size="sm"
              onClick={stopProcessing}
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              <Square className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 && !isProcessing ? (
          // Welcome state
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">开始智能对话</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-sm">
              {hasContent
                ? "问我关于这篇文章的任何问题，我会智能选择最佳方式为你解答。"
                : "你可以问我任何问题，也可以粘贴链接让我帮你分析内容。"
              }
            </p>

            {hasContent && (
              <div className="text-sm text-gray-500 mb-4">
                <strong>试试问：</strong> "核心观点是什么？" 或 "有什么实际应用？"
              </div>
            )}

            {/* 服务状态通知 */}
            {serviceStatus === 'offline' && (
              <OfflineModeNotice className="max-w-lg mb-4" />
            )}

            {/* 功能亮点介绍 - 仅在服务正常时显示 */}
            {showFeatureHighlight && serviceStatus === 'online' && (
              <FeatureHighlight
                features={[]}
                onClose={() => {
                  setShowFeatureHighlight(false)
                  localStorage.setItem('chat-feature-highlight-seen', 'true')
                }}
                className="max-w-lg mb-4"
              />
            )}

            {/* 简化功能说明 */}
            <div className="bg-gray-50 p-3 rounded-lg text-center max-w-lg">
              <div className="text-sm text-gray-600 mb-2">
                🔗 智能URL抓取 • 🔍 Web搜索增强 • 📚 原文分析
              </div>
              <div className="text-xs text-gray-500">
                自动选择最佳处理方式，提供准确引用
              </div>
            </div>
          </div>
        ) : (
          // Messages
          <div className="space-y-6">
            {messages.map((message) => (
              message.role === 'user' ? (
                <EnhancedMessageBubble
                  key={message.id}
                  message={message}
                  isStreaming={false}
                />
              ) : (
                <EnhancedMessageWithCitations
                  key={message.id}
                  message={message}
                  originalContent={contentData?.content}
                />
              )
            ))}

            {/* 处理模式显示 */}
            {isProcessing && currentMode && (
              <ProcessingModeDisplay
                mode={currentMode}
                isProcessing={true}
                progress="正在智能处理您的问题..."
              />
            )}

            {/* 流式输出的消息 */}
            {isProcessing && streamingMessageId && streamingContent && (
              <EnhancedMessageBubble
                message={{
                  id: streamingMessageId,
                  role: 'assistant',
                  content: streamingContent,
                  timestamp: new Date(),
                  mode: currentMode || 'rag_only'
                }}
                isStreaming={true}
                streamingContent={streamingContent}
              />
            )}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-200">
        <SmartChatInput
          onSendMessage={handleSendMessage}
          disabled={isProcessing}
          predictedMode={predictedAnalysis.mode.type}
          confidence={predictedAnalysis.confidence}
        />
      </div>
    </div>
  )
}