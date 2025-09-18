import React, { useState, useCallback, useRef, useEffect } from 'react'
import { ExternalLink, FileText, Globe, Quote, ChevronRight, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { EnhancedChatMessage } from '@/stores/types'

interface CitationProps {
  id: string
  index: number
  source: NonNullable<EnhancedChatMessage['sources']>[0]
  onHighlight?: (sourceId: string) => void
  isActive?: boolean
}

function Citation({ id, index, source, onHighlight, isActive }: CitationProps) {
  const getIcon = () => {
    switch (source.type) {
      case 'original': return <FileText className="h-3 w-3" />
      case 'url': return <ExternalLink className="h-3 w-3" />
      case 'web': return <Globe className="h-3 w-3" />
      default: return <Quote className="h-3 w-3" />
    }
  }

  const getColor = () => {
    switch (source.type) {
      case 'original': return 'text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100'
      case 'url': return 'text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100'
      case 'web': return 'text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100'
      default: return 'text-gray-600 hover:text-gray-800 bg-gray-50 hover:bg-gray-100'
    }
  }

  return (
    <button
      onClick={() => onHighlight?.(id)}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${getColor()} ${
        isActive ? 'ring-2 ring-offset-1 ring-current' : ''
      }`}
      title={`点击查看来源: ${source.title}`}
    >
      {getIcon()}
      <span>[{index}]</span>
    </button>
  )
}

interface CitationPopupProps {
  source: NonNullable<EnhancedChatMessage['sources']>[0]
  index: number
  position: { x: number; y: number }
  onClose: () => void
}

function CitationPopup({ source, index, position, onClose }: CitationPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  return (
    <div
      ref={popupRef}
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm"
      style={{
        left: Math.min(position.x, window.innerWidth - 350),
        top: Math.min(position.y, window.innerHeight - 200)
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Citation
            id={`popup-${index}`}
            index={index}
            source={source}
            isActive={true}
          />
          <span className="text-sm font-medium text-gray-900">{source.title}</span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-lg leading-none"
        >
          ×
        </button>
      </div>

      {source.url && (
        <div className="mb-2">
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline text-sm break-all"
          >
            {source.url}
          </a>
        </div>
      )}

      {source.content && (
        <div className="text-sm text-gray-700 leading-relaxed">
          "{source.content}"
        </div>
      )}

      {source.chunkId && (
        <div className="mt-2 text-xs text-gray-500">
          原文片段ID: {source.chunkId}
        </div>
      )}
    </div>
  )
}

interface CitationPanelProps {
  sources: EnhancedChatMessage['sources']
  activeSourceId?: string
  onSourceSelect?: (sourceId: string) => void
  className?: string
}

function CitationPanel({ sources, activeSourceId, onSourceSelect, className }: CitationPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!sources || sources.length === 0) return null

  const groupedSources = sources.reduce((acc, source, index) => {
    const key = source.type
    if (!acc[key]) acc[key] = []
    acc[key].push({ ...source, index: index + 1 })
    return acc
  }, {} as Record<string, Array<any>>)

  const typeLabels = {
    original: '📄 原文引用',
    url: '🔗 链接内容',
    web: '🌐 网络搜索'
  }

  return (
    <div className={`border border-gray-200 rounded-lg bg-gray-50 ${className}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 text-sm font-medium text-gray-700 hover:bg-gray-100"
      >
        <span>📎 引用来源 ({sources.length})</span>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>

      {isExpanded && (
        <div className="p-3 pt-0 space-y-3">
          {Object.entries(groupedSources).map(([type, typeSources]) => (
            <div key={type}>
              <h4 className="text-xs font-medium text-gray-600 mb-2">
                {typeLabels[type as keyof typeof typeLabels] || type}
              </h4>
              <div className="space-y-2">
                {typeSources.map((source, sourceIndex) => {
                  const sourceId = `${type}-${sourceIndex}`
                  const isActive = activeSourceId === sourceId

                  return (
                    <div
                      key={sourceId}
                      className={`p-2 rounded border transition-colors cursor-pointer ${
                        isActive
                          ? 'border-blue-300 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                      onClick={() => onSourceSelect?.(sourceId)}
                    >
                      <div className="flex items-start gap-2">
                        <Citation
                          id={sourceId}
                          index={source.index}
                          source={source}
                          isActive={isActive}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {source.title}
                          </div>
                          {source.url && (
                            <div className="text-xs text-blue-500 truncate">
                              {source.url}
                            </div>
                          )}
                          {source.content && (
                            <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {source.content}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface EnhancedMessageWithCitationsProps {
  message: EnhancedChatMessage
  originalContent?: string
  onOriginalHighlight?: (text: string) => void
}

export function EnhancedMessageWithCitations({
  message,
  originalContent,
  onOriginalHighlight
}: EnhancedMessageWithCitationsProps) {
  const [activeCitation, setActiveCitation] = useState<string | null>(null)
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null)
  const [hoveredSource, setHoveredSource] = useState<NonNullable<EnhancedChatMessage['sources']>[0] | null>(null)

  const handleCitationClick = useCallback((event: React.MouseEvent, source: NonNullable<EnhancedChatMessage['sources']>[0], index: number) => {
    event.preventDefault()
    event.stopPropagation()

    const rect = (event.target as HTMLElement).getBoundingClientRect()
    setPopupPosition({
      x: rect.left,
      y: rect.bottom + 5
    })
    setHoveredSource(source)
    setActiveCitation(`citation-${index}`)

    // 如果是原文引用，尝试高亮原文
    if (source.type === 'original' && source.content && onOriginalHighlight) {
      onOriginalHighlight(source.content)
    }
  }, [onOriginalHighlight])

  const closePopup = useCallback(() => {
    setPopupPosition(null)
    setHoveredSource(null)
    setActiveCitation(null)
  }, [])

  // 处理消息内容中的引用标记
  const renderContentWithCitations = useCallback((content: string) => {
    if (!message.sources || message.sources.length === 0) {
      return content
    }

    // 简单的引用检测和替换
    // 在实际实现中，这里应该有更复杂的解析逻辑
    let processedContent = content

    // 查找并替换引用模式 [1], [2] 等
    const citationRegex = /\[(\d+)\]/g
    const parts = []
    let lastIndex = 0
    let match

    while ((match = citationRegex.exec(content)) !== null) {
      const citationIndex = parseInt(match[1]) - 1
      const source = message.sources[citationIndex]

      if (source) {
        // 添加引用前的文本
        if (match.index > lastIndex) {
          parts.push(content.slice(lastIndex, match.index))
        }

        // 添加可点击的引用
        parts.push(
          <Citation
            key={`citation-${citationIndex}`}
            id={`citation-${citationIndex}`}
            index={citationIndex + 1}
            source={source}
            onHighlight={(id) => handleCitationClick(
              { preventDefault: () => {}, stopPropagation: () => {} } as any,
              source,
              citationIndex
            )}
            isActive={activeCitation === `citation-${citationIndex}`}
          />
        )

        lastIndex = match.index + match[0].length
      }
    }

    // 添加剩余的文本
    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex))
    }

    return parts.length > 0 ? parts : content
  }, [message.sources, activeCitation, handleCitationClick])

  return (
    <div className="space-y-3">
      {/* 消息内容 */}
      <div className="prose prose-sm max-w-none">
        {typeof message.content === 'string'
          ? renderContentWithCitations(message.content)
          : message.content
        }
      </div>

      {/* 引用面板 */}
      {message.sources && message.sources.length > 0 && (
        <CitationPanel
          sources={message.sources}
          activeSourceId={activeCitation || undefined}
          onSourceSelect={setActiveCitation}
        />
      )}

      {/* 弹出式引用详情 */}
      {popupPosition && hoveredSource && (
        <CitationPopup
          source={hoveredSource}
          index={message.sources?.findIndex(s => s === hoveredSource) || 0}
          position={popupPosition}
          onClose={closePopup}
        />
      )}
    </div>
  )
}

// 工具函数：从文本中提取引用
export function extractCitations(text: string): Array<{ index: number; text: string; position: number }> {
  const citations = []
  const citationRegex = /\[(\d+)\]/g
  let match

  while ((match = citationRegex.exec(text)) !== null) {
    citations.push({
      index: parseInt(match[1]),
      text: match[0],
      position: match.index
    })
  }

  return citations
}

// 工具函数：高亮原文中的引用片段
export function highlightTextInOriginal(originalText: string, searchText: string): string {
  if (!searchText || !originalText) return originalText

  const index = originalText.toLowerCase().indexOf(searchText.toLowerCase())
  if (index === -1) return originalText

  return (
    originalText.slice(0, index) +
    `<mark class="bg-yellow-200 px-1 rounded">${originalText.slice(index, index + searchText.length)}</mark>` +
    originalText.slice(index + searchText.length)
  )
}