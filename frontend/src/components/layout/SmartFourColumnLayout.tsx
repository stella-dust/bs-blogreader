import React, { useState } from 'react'
import { FileText, MessageCircle, Languages, Brain, RotateCcw, Settings, Square, Search, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ContentCard, CollapsibleCard } from '@/components/ui/collapsible-card'
import { RichContentViewer } from '@/components/RichContentViewer'
import { EnhancedChatInterface } from '@/components/chat/EnhancedChatInterface'
import { ServiceStatusIndicator } from '@/components/ServiceStatusIndicator'
import { ChatSettingsPanel } from '@/components/ChatSettingsPanel'
import { ContentPanel } from '@/components/ContentPanel'
import { EnhancedContentPanel } from '@/components/EnhancedContentPanel'
import { CompactProcessingMonitor } from '@/components/monitoring/ProcessingMonitor'
import { useChatStore, useContentStore, defaultTranslationPrompt, defaultInterpretationPrompt } from '@/stores'
import { useChatSettingsStore } from '@/stores/chatSettingsStore'
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
  const { messages, startNewSession, clearMessages } = useChatStore()
  const { settings, toggleWebSearch } = useChatSettingsStore()
  const [serviceStatus, setServiceStatus] = useState<'checking' | 'online' | 'offline' | 'error'>('checking')

  const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://oqicgfaczdmrdoglkqzi.supabase.co'
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
              <p className="text-base font-medium">No content available</p>
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
          badge={
            <ServiceStatusIndicator
              apiBaseUrl={API_BASE_URL}
              onStatusChange={setServiceStatus}
              className="ml-1"
            />
          }
          actions={
            <div className="flex items-center gap-1">
              {/* 刷新按钮 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearMessages}
                disabled={messages.length === 0}
                className="h-6 w-6 p-0 hover:bg-gray-200"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>

              {/* 网络搜索开关 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleWebSearch}
                className={`h-6 w-6 p-0 hover:bg-gray-200 ${
                  settings.webSearchEnabled
                    ? 'text-blue-600'
                    : 'text-gray-400'
                }`}
                title="网络搜索开关"
              >
                <Globe className="h-3.5 w-3.5" />
              </Button>
            </div>
          }
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