import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, MessageCircle, Trash2, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TabEmptyState } from '@/components/ui/tab-card'
import { useChatStore, useContentStore } from '@/stores'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { CompactProcessingMonitor } from '@/components/monitoring/ProcessingMonitor'

interface ChatInterfaceProps {
  className?: string
}

interface MessageBubbleProps {
  message: {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
  }
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const timeString = message.timestamp.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  })

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
        <div className={`inline-block px-4 py-3 rounded-lg ${
          isUser
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 text-gray-900'
        }`}>
          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          ) : (
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Customize markdown rendering for chat
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
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        <div className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : ''}`}>
          {timeString}
        </div>
      </div>
    </div>
  )
}

interface ChatInputProps {
  onSendMessage: (message: string) => void
  disabled?: boolean
  placeholder?: string
}

function ChatInput({ onSendMessage, disabled, placeholder }: ChatInputProps) {
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!message.trim() || disabled) return

    onSendMessage(message.trim())
    setMessage('')

    // Reset textarea height
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

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [message])

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-end">
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "Ask questions about the content..."}
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
  )
}

export function ChatInterface({ className }: ChatInterfaceProps) {
  const { messages, isLoading, addMessage, clearMessages, startNewSession } = useChatStore()
  const { contentData, llmConfig } = useContentStore()
  const [hasContent, setHasContent] = useState(false)

  // Check if we have content to chat about
  useEffect(() => {
    setHasContent(!!contentData?.content)
  }, [contentData])

  const handleSendMessage = async (messageContent: string) => {
    if (!hasContent) {
      // Add user message first
      addMessage({
        role: 'user',
        content: messageContent
      })

      // Add a helpful response about needing content
      addMessage({
        role: 'assistant',
        content: 'I\'d be happy to help you! However, I notice you haven\'t fetched any content yet. Please use the input box above to fetch an article or upload a file, then I can help you analyze and discuss it.'
      })
      return
    }

    if (!llmConfig.apiKey && !['ollama', 'lmstudio'].includes(llmConfig.type)) {
      alert('Please configure your LLM API key first.')
      return
    }

    // Add user message
    addMessage({
      role: 'user',
      content: messageContent
    })

    // Start loading
    useChatStore.getState().setLoading(true)

    try {
      // Use Supabase for both local development and production
      const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321'

      const response = await fetch(`${API_BASE_URL}/functions/v1/chat-with-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'}`,
        },
        body: JSON.stringify({
          message: messageContent,
          context: contentData?.content || '',
          messages: messages, // Send conversation history
          llm_config: llmConfig,
        }),
      })

      if (!response.ok) {
        throw new Error(`Chat failed: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.details || 'Chat request failed')
      }

      // Add assistant response
      addMessage({
        role: 'assistant',
        content: result.response
      })

    } catch (error) {
      console.error('Chat error:', error)

      // Add error message
      addMessage({
        role: 'assistant',
        content: `Sorry, I encountered an error while processing your message: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`
      })
    } finally {
      useChatStore.getState().setLoading(false)
    }
  }

  const handleClearChat = () => {
    if (confirm('Are you sure you want to clear all messages?')) {
      clearMessages()
    }
  }

  const handleNewSession = () => {
    startNewSession()
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          // Welcome state
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Start a conversation</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-sm">
              {hasContent
                ? "Ask questions about the content you've fetched. The AI will help you understand and analyze it."
                : "Ask me anything! I can help you with general questions, or fetch some content first for specific analysis."
              }
            </p>

            {hasContent && (
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="text-sm text-gray-500 mb-2">
                  <strong>Try asking:</strong>
                </div>
                <div className="bg-gray-50 p-2 rounded text-left">
                  "What are the main points of this article?"
                </div>
                <div className="bg-gray-50 p-2 rounded text-left">
                  "Can you explain this concept in simpler terms?"
                </div>
                <div className="bg-gray-50 p-2 rounded text-left">
                  "What are the practical applications mentioned?"
                </div>
              </div>
            )}
          </div>
        ) : (
          // Messages
          <div className="space-y-6">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>

                <div className="flex-1">
                  <div className="inline-block px-4 py-3 bg-gray-100 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Area - Always at bottom */}
      <div className="p-4 bg-white">
        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={isLoading}
          placeholder={hasContent ? "Ask about the content..." : "Ask me anything..."}
        />
      </div>
    </div>
  )
}