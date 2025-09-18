import React, { useState, useEffect } from 'react'
import { Link, Search, FileText, Lightbulb, AlertCircle } from 'lucide-react'
import { useChatSettingsStore } from '@/stores/chatSettingsStore'
import { inputAnalyzer } from '@/utils/inputAnalyzer'
import { SmartChatProcessor } from '@/utils/smartChatProcessor'
import type { InputAnalysis, ProcessMode } from '@/stores/types'

interface SmartInputIndicatorProps {
  input: string
  className?: string
  showDetails?: boolean
}

export function SmartInputIndicator({ input, className, showDetails = true }: SmartInputIndicatorProps) {
  const [analysis, setAnalysis] = useState<InputAnalysis | null>(null)
  const { settings } = useChatSettingsStore()

  useEffect(() => {
    if (input.trim().length > 3) {
      const result = inputAnalyzer.analyze(input, settings)
      setAnalysis(result)
    } else {
      setAnalysis(null)
    }
  }, [input, settings])

  if (!analysis || !showDetails) return null

  const getModeConfig = (mode: ProcessMode['type']) => {
    switch (mode) {
      case 'url_fetch':
        return {
          icon: <Link className="h-4 w-4" />,
          label: '链接抓取',
          color: 'bg-green-50 border-green-200 text-green-700',
          description: '将自动抓取链接内容进行分析'
        }
      case 'web_search':
        return {
          icon: <Search className="h-4 w-4" />,
          label: 'Web搜索',
          color: 'bg-blue-50 border-blue-200 text-blue-700',
          description: '将结合网络搜索和原文信息回答'
        }
      case 'rag_only':
        return {
          icon: <FileText className="h-4 w-4" />,
          label: '原文检索',
          color: 'bg-purple-50 border-purple-200 text-purple-700',
          description: '基于当前文章内容回答'
        }
      default:
        return {
          icon: <FileText className="h-4 w-4" />,
          label: '未知模式',
          color: 'bg-gray-50 border-gray-200 text-gray-700',
          description: '默认处理模式'
        }
    }
  }

  const config = getModeConfig(analysis.mode.type)
  const confidenceLevel = analysis.confidence
  const isHighConfidence = confidenceLevel >= 0.8
  const isMediumConfidence = confidenceLevel >= 0.5

  return (
    <div className={`border rounded-lg p-3 ${config.color} ${className}`}>
      <div className="flex items-start gap-3">
        {/* 模式图标 */}
        <div className="flex-shrink-0 mt-0.5">
          {config.icon}
        </div>

        <div className="flex-1 min-w-0">
          {/* 模式标题和置信度 */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{config.label}</span>
            <div className="flex items-center gap-1">
              {isHighConfidence ? (
                <Lightbulb className="h-3 w-3 text-green-600" />
              ) : isMediumConfidence ? (
                <AlertCircle className="h-3 w-3 text-yellow-600" />
              ) : (
                <AlertCircle className="h-3 w-3 text-red-600" />
              )}
              <span className="text-xs opacity-75">
                {Math.round(confidenceLevel * 100)}%
              </span>
            </div>
          </div>

          {/* 模式描述 */}
          <p className="text-xs opacity-90 mb-2">
            {config.description}
          </p>

          {/* 详细信息 */}
          <div className="space-y-1 text-xs">
            {/* URL检测 */}
            {analysis.urls.length > 0 && (
              <div className="flex items-center gap-1">
                <Link className="h-3 w-3" />
                <span>检测到 {analysis.urls.length} 个链接</span>
              </div>
            )}

            {/* 搜索关键词 */}
            {analysis.searchKeywords && analysis.searchKeywords.length > 0 && (
              <div className="flex items-center gap-1">
                <Search className="h-3 w-3" />
                <span>搜索关键词: {analysis.searchKeywords.join(', ')}</span>
              </div>
            )}

            {/* 处理原因 */}
            {analysis.mode.reason && (
              <div className="flex items-start gap-1">
                <Lightbulb className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span className="opacity-75">{analysis.mode.reason}</span>
              </div>
            )}
          </div>

          {/* 功能状态提示 */}
          <div className="mt-2 flex flex-wrap gap-1 text-xs">
            {!settings.webSearchEnabled && analysis.mode.type === 'web_search' && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                ⚠️ 搜索功能已关闭
              </span>
            )}
            {!settings.autoUrlFetch && analysis.mode.type === 'url_fetch' && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                ⚠️ URL抓取已关闭
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface ProcessingModeDisplayProps {
  mode: ProcessMode['type'] | null
  isProcessing?: boolean
  progress?: string
  className?: string
}

export function ProcessingModeDisplay({
  mode,
  isProcessing = false,
  progress,
  className
}: ProcessingModeDisplayProps) {
  if (!mode) return null

  const getModeConfig = (mode: ProcessMode['type']) => {
    switch (mode) {
      case 'url_fetch':
        return {
          icon: <Link className="h-4 w-4" />,
          label: '正在抓取链接内容',
          color: 'bg-green-50 border-green-200 text-green-700'
        }
      case 'web_search':
        return {
          icon: <Search className="h-4 w-4" />,
          label: '正在搜索网络信息',
          color: 'bg-blue-50 border-blue-200 text-blue-700'
        }
      case 'rag_only':
        return {
          icon: <FileText className="h-4 w-4" />,
          label: '正在检索原文内容',
          color: 'bg-purple-50 border-purple-200 text-purple-700'
        }
      default:
        return {
          icon: <FileText className="h-4 w-4" />,
          label: '正在处理',
          color: 'bg-gray-50 border-gray-200 text-gray-700'
        }
    }
  }

  const config = getModeConfig(mode)

  return (
    <div className={`border rounded-lg p-3 ${config.color} ${className}`}>
      <div className="flex items-center gap-2">
        <div className={`${isProcessing ? 'animate-pulse' : ''}`}>
          {config.icon}
        </div>
        <span className="font-medium text-sm">{config.label}</span>
        {isProcessing && (
          <div className="flex-1">
            <div className="w-full bg-white bg-opacity-50 rounded-full h-2">
              <div className="bg-current h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
          </div>
        )}
      </div>
      {progress && (
        <div className="mt-2 text-xs opacity-75">
          {progress}
        </div>
      )}
    </div>
  )
}

interface QuickModeToggleProps {
  currentMode?: ProcessMode['type']
  onModeChange?: (mode: ProcessMode['type']) => void
  disabled?: boolean
  className?: string
}

export function QuickModeToggle({
  currentMode,
  onModeChange,
  disabled = false,
  className
}: QuickModeToggleProps) {
  const { settings, updateSettings } = useChatSettingsStore()

  const modes = [
    {
      type: 'rag_only' as const,
      icon: <FileText className="h-3 w-3" />,
      label: '原文',
      description: '仅基于文章内容'
    },
    {
      type: 'web_search' as const,
      icon: <Search className="h-3 w-3" />,
      label: '搜索',
      description: '结合网络信息',
      disabled: !settings.webSearchEnabled
    },
    {
      type: 'url_fetch' as const,
      icon: <Link className="h-3 w-3" />,
      label: '抓取',
      description: '分析链接内容',
      disabled: !settings.autoUrlFetch
    }
  ]

  return (
    <div className={`flex gap-1 ${className}`}>
      {modes.map((mode) => {
        const isActive = currentMode === mode.type
        const isDisabled = disabled || mode.disabled

        return (
          <button
            key={mode.type}
            onClick={() => onModeChange?.(mode.type)}
            disabled={isDisabled}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
              isActive
                ? 'bg-blue-500 text-white'
                : isDisabled
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={mode.description}
          >
            {mode.icon}
            <span>{mode.label}</span>
          </button>
        )
      })}
    </div>
  )
}