import React, { useState } from 'react'
import { FileText, MessageCircle, Languages, Brain, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ContentCard, CollapsibleCard } from '@/components/ui/collapsible-card'
import { RichContentViewer } from '@/components/RichContentViewer'
import { EnhancedChatInterface } from '@/components/chat/EnhancedChatInterface'
import { ContentPanel } from '@/components/ContentPanel'
import { EnhancedContentPanel } from '@/components/EnhancedContentPanel'
import { CompactProcessingMonitor } from '@/components/monitoring/ProcessingMonitor'
import { useChatStore, useContentStore, defaultTranslationPrompt, defaultInterpretationPrompt } from '@/stores'
import type { ContentData, ProcessedData } from '@/stores/types'

interface SmartFourColumnLayoutProps {
  contentData: ContentData | null
  processedData: ProcessedData
  isFetching: boolean
  isTranslating: boolean
  isInterpreting: boolean
  onTranslate: () => void
  onInterpret: () => void
}

export function SmartFourColumnLayout({
  contentData,
  processedData,
  isFetching,
  isTranslating,
  isInterpreting,
  onTranslate,
  onInterpret,
}: SmartFourColumnLayoutProps) {
  const { messages, startNewSession } = useChatStore()
  const {
    translationPrompt,
    interpretationPrompt,
    setTranslationPrompt,
    setInterpretationPrompt
  } = useContentStore()
  const [collapsedColumns, setCollapsedColumns] = useState({
    original: false,
    chat: false,
    translation: false,
    interpretation: false
  })

  const handleColumnToggle = (column: keyof typeof collapsedColumns) => {
    setCollapsedColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }))
  }

  // Calculate dynamic widths based on collapsed state
  const getColumnClass = (column: keyof typeof collapsedColumns) => {
    const isCollapsed = collapsedColumns[column]
    const collapsedCount = Object.values(collapsedColumns).filter(Boolean).length
    const expandedCount = 4 - collapsedCount

    if (isCollapsed) {
      return "w-12 min-w-12 max-w-12"
    }

    // Calculate width for expanded columns
    const baseWidth = `${100 / expandedCount}%`
    return `flex-1 min-w-0`
  }

  return (
    <div className="flex gap-6 h-full overflow-hidden">
      {/* Original Content Column */}
      <div className={`transition-all duration-300 ${getColumnClass('original')}`}>
        <CollapsibleCard
          title="原文"
          icon={<FileText className="h-4 w-4" />}
          badge={(() => {
            if (isFetching) {
              return (
                <div className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs font-medium">
                  Processing
                </div>
              )
            }
            if (contentData) {
              return (
                <div className="bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs font-medium">
                  Done
                </div>
              )
            }
            return null
          })()}
          defaultCollapsed={collapsedColumns.original}
          onCollapsedChange={(collapsed) => handleColumnToggle('original')}
          direction="vertical"
          className="h-full"
          contentClassName="flex-1 min-h-0 p-0"
        >
          {contentData ? (
            <RichContentViewer
              contentData={contentData}
              isLoading={isFetching}
            />
          ) : (
            <div className="text-center py-12 text-gray-500 h-full flex flex-col justify-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No content available</p>
              <p className="text-sm mt-1">Please fetch some content using the input above</p>
            </div>
          )}
        </CollapsibleCard>
      </div>

      {/* Chat Column */}
      <div className={`transition-all duration-300 ${getColumnClass('chat')}`}>
        <CollapsibleCard
          title="对话"
          icon={<MessageCircle className="h-4 w-4" />}
          actions={messages.length > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={startNewSession}
              className="h-8 w-8 p-0"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          ) : null}
          collapsible={false}
          direction="vertical"
          className="h-full"
        >
          <div className="h-full">
            <EnhancedChatInterface />
          </div>
        </CollapsibleCard>
      </div>

      {/* Translation Column */}
      <div className={`transition-all duration-300 ${getColumnClass('translation')}`}>
        <CollapsibleCard
          title="译文"
          icon={<Languages className="h-4 w-4" />}
          badge={processedData.translation ? (
            <div className="bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs font-medium">
              Done
            </div>
          ) : isTranslating ? (
            <div className="bg-amber-100 text-amber-600 px-2 py-1 rounded-full text-xs font-medium">
              Processing
            </div>
          ) : null}
          defaultCollapsed={collapsedColumns.translation}
          onCollapsedChange={(collapsed) => handleColumnToggle('translation')}
          direction="vertical"
          className="h-full"
          contentClassName="flex-1 min-h-0 p-0"
        >
          <EnhancedContentPanel
            title="翻译"
            content={processedData.translation || ''}
            type="translation"
            prompt={translationPrompt}
            defaultPrompt={defaultTranslationPrompt}
            isEmpty={!processedData.translation || processedData.translation.trim() === ''}
            isLoading={false}
            isProcessing={isTranslating}
            onPromptSave={setTranslationPrompt}
            onStart={onTranslate}
          />
        </CollapsibleCard>
      </div>

      {/* Interpretation Column */}
      <div className={`transition-all duration-300 ${getColumnClass('interpretation')}`}>
        <CollapsibleCard
          title="导读"
          icon={<Brain className="h-4 w-4" />}
          badge={processedData.interpretation ? (
            <div className="bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs font-medium">
              Done
            </div>
          ) : isInterpreting ? (
            <div className="bg-amber-100 text-amber-600 px-2 py-1 rounded-full text-xs font-medium">
              Processing
            </div>
          ) : null}
          defaultCollapsed={collapsedColumns.interpretation}
          onCollapsedChange={(collapsed) => handleColumnToggle('interpretation')}
          direction="vertical"
          className="h-full"
          contentClassName="flex-1 min-h-0 p-0"
        >
          <EnhancedContentPanel
            title="导读"
            content={processedData.interpretation || ''}
            type="interpretation"
            prompt={interpretationPrompt}
            defaultPrompt={defaultInterpretationPrompt}
            isEmpty={!processedData.interpretation || processedData.interpretation.trim() === ''}
            isLoading={false}
            isProcessing={isInterpreting}
            onPromptSave={setInterpretationPrompt}
            onStart={onInterpret}
          />
        </CollapsibleCard>
      </div>
    </div>
  )
}