import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Settings, Play, FileText, Code } from 'lucide-react'
import { ContentPanel } from './ContentPanel'
import { PromptEditDialog } from './PromptEditDialog'

interface EnhancedContentPanelProps {
  title: string
  content: string
  type: 'translation' | 'interpretation'
  prompt: string
  defaultPrompt: string
  isEmpty?: boolean
  isLoading?: boolean
  isProcessing?: boolean
  onPromptSave: (prompt: string) => void
  onStart: () => void
}

export function EnhancedContentPanel({
  title,
  content,
  type,
  prompt,
  defaultPrompt,
  isEmpty = false,
  isLoading = false,
  isProcessing = false,
  onPromptSave,
  onStart
}: EnhancedContentPanelProps) {
  const [showPromptDialog, setShowPromptDialog] = useState(false)
  const [viewMode, setViewMode] = useState<'markdown' | 'source'>('markdown')

  const buttonText = type === 'translation' ? '开始翻译' : '开始导读'

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
            <Button
              size="sm"
              onClick={onStart}
              disabled={isProcessing}
              className="h-8 px-3 text-xs"
            >
              <Play className="h-3.5 w-3.5 mr-1" />
              {buttonText}
            </Button>
          </div>

          {/* Right side - View mode toggle (only show when content exists) */}
          {content && !isEmpty && (
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
          content={content}
          isEmpty={isEmpty && !isProcessing}
          isMarkdown={viewMode === 'markdown'}
          isLoading={isLoading || isProcessing}
          loadingMessage={
            type === 'translation'
              ? "正在翻译文章内容..."
              : "正在总结博客导读..."
          }
          showActions={false} // We'll handle actions in the subtitle bar
        />
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