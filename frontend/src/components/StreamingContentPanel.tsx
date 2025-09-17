import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Settings, Play, FileText, Code, Square } from 'lucide-react'
import { ContentPanel } from './ContentPanel'
import { PromptEditDialog } from './PromptEditDialog'

interface StreamingContentPanelProps {
  title: string
  content: string
  type: 'translation' | 'interpretation'
  prompt: string
  defaultPrompt: string
  isEmpty?: boolean
  isLoading?: boolean
  isProcessing?: boolean
  streamingContent?: string // 流式内容
  onPromptSave: (prompt: string) => void
  onStart: () => void
  onStop?: () => void // 停止流式处理
}

export function StreamingContentPanel({
  title,
  content,
  type,
  prompt,
  defaultPrompt,
  isEmpty = false,
  isLoading = false,
  isProcessing = false,
  streamingContent = '',
  onPromptSave,
  onStart,
  onStop
}: StreamingContentPanelProps) {
  const [showPromptDialog, setShowPromptDialog] = useState(false)
  const [viewMode, setViewMode] = useState<'markdown' | 'source'>('markdown')

  const buttonText = type === 'translation' ? '开始翻译' : '开始导读'
  const currentContent = isProcessing ? streamingContent : content

  return (
    <div className="h-full flex flex-col">
      {/* Subtitle bar */}
      <div className="border-b border-gray-200 p-3 flex-shrink-0 bg-gray-50/50">
        <div className="flex items-center justify-between">
          {/* Left side - Action buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPromptDialog(true)}
              className="h-8 px-3 text-xs"
            >
              <Settings className="h-3.5 w-3.5 mr-1" />
              提示设计
            </Button>
            {!isProcessing ? (
              <Button
                size="sm"
                onClick={onStart}
                disabled={isLoading}
                className="h-8 px-3 text-xs"
              >
                <Play className="h-3.5 w-3.5 mr-1" />
                {buttonText}
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={onStop}
                className="h-8 px-3 text-xs border-red-300 text-red-600 hover:bg-red-50"
              >
                <Square className="h-3.5 w-3.5 mr-1" />
                停止
              </Button>
            )}
          </div>

          {/* Right side - View mode toggle */}
          {(currentContent || isProcessing) && !isEmpty && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode(viewMode === 'markdown' ? 'source' : 'markdown')}
              className="h-8 w-8 p-0 text-gray-500 hover:bg-gray-100"
              title={viewMode === 'markdown' ? '切换到源码模式' : '切换到Markdown预览'}
            >
              {viewMode === 'markdown' ? (
                <Code className="h-3.5 w-3.5" />
              ) : (
                <FileText className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 min-h-0">
        <ContentPanel
          content={currentContent}
          isEmpty={isEmpty && !isProcessing && !streamingContent}
          isMarkdown={viewMode === 'markdown'}
          isLoading={isLoading}
          loadingMessage={
            type === 'translation'
              ? "正在翻译文章内容..."
              : "正在总结博客导读..."
          }
          showActions={false}
        />

        {/* Streaming indicator */}
        {isProcessing && (
          <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            正在生成中...
          </div>
        )}
      </div>

      {/* Prompt Edit Dialog */}
      <PromptEditDialog
        open={showPromptDialog}
        onOpenChange={setShowPromptDialog}
        title={`${title}提示词设计`}
        prompt={prompt}
        defaultPrompt={defaultPrompt}
        onSave={onPromptSave}
      />
    </div>
  )
}