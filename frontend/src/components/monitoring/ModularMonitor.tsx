import React from 'react'
import { FileText, MessageCircle, Languages, Brain } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMetricsStore, formatDuration, formatTokens } from '@/stores/metricsStore'
import { useContentStore } from '@/stores'

interface ModularMonitorProps {
  className?: string
  onModelClick?: () => void
}

interface ModuleStatusProps {
  icon: React.ReactNode
  status: 'ready' | 'processing' | 'done'
  details: Array<{
    label: string
    value: string | number
    color: string
  }>
}

function ModuleStatus({ icon, status, details }: ModuleStatusProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'ready': return 'text-gray-600'
      case 'processing': return 'text-blue-600'
      case 'done': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="flex items-center gap-1 text-sm">
      <div className="text-gray-600">
        {icon}
      </div>
      <span className="text-gray-500">status:</span>
      <span className={cn("font-medium", getStatusColor())}>
        {status}
      </span>
      {details.map((detail, index) => (
        <React.Fragment key={index}>
          <span className="text-gray-500">{detail.label}</span>
          <span className={cn("font-medium", detail.color)}>
            {detail.value}
          </span>
        </React.Fragment>
      ))}
    </div>
  )
}

export function ModularMonitor({ className, onModelClick }: ModularMonitorProps) {
  const {
    fetchMetrics,
    translationMetrics,
    interpretationMetrics,
    chatMetrics
  } = useMetricsStore()

  const { contentData, processedData, llmConfig } = useContentStore()

  // Calculate module statuses
  const getModuleStatus = (
    metrics: any,
    hasContent: boolean,
    isActive?: boolean
  ): 'ready' | 'processing' | 'done' => {
    if (isActive || (metrics.startTime && !metrics.endTime)) {
      return 'processing'
    }
    if (hasContent || (metrics.endTime && metrics.startTime)) {
      return 'done'
    }
    return 'ready'
  }

  // Module statuses
  const originalStatus = getModuleStatus(fetchMetrics, !!contentData)
  const chatStatus = getModuleStatus(chatMetrics, (chatMetrics.totalTokens || 0) > 0)
  const translationStatus = getModuleStatus(translationMetrics, !!processedData.translation)
  const interpretationStatus = getModuleStatus(interpretationMetrics, !!processedData.interpretation)

  // Module details - processing shows time+tokens, done shows only tokens
  const getOriginalDetails = () => {
    const chars = (fetchMetrics.inputCharCount || 0) + (fetchMetrics.outputCharCount || 0)

    if (originalStatus === 'processing') {
      const time = formatDuration(Date.now() - (fetchMetrics.startTime?.getTime() || Date.now()))
      return [
        { label: 'time:', value: time, color: 'text-orange-600' }
      ]
    }
    return [{ label: 'chars:', value: chars, color: 'text-orange-600' }]
  }

  const getChatDetails = () => {
    const details = []

    if (chatStatus === 'processing') {
      const time = formatDuration(Date.now() - (chatMetrics.startTime?.getTime() || Date.now()))
      details.push({ label: 'time:', value: time, color: 'text-blue-600' })
      if ((chatMetrics.totalTokens || 0) > 0) {
        details.push({ label: 'tokens:', value: formatTokens(chatMetrics.totalTokens || 0), color: 'text-blue-600' })
      }
    } else {
      details.push({ label: 'tokens:', value: formatTokens(chatMetrics.totalTokens || 0), color: 'text-blue-600' })
    }

    return details
  }

  const getTranslationDetails = () => {
    const details = []

    if (translationStatus === 'processing') {
      const time = formatDuration(Date.now() - (translationMetrics.startTime?.getTime() || Date.now()))
      details.push({ label: 'time:', value: time, color: 'text-green-600' })
      if ((translationMetrics.totalTokens || 0) > 0) {
        details.push({ label: 'tokens:', value: formatTokens(translationMetrics.totalTokens || 0), color: 'text-green-600' })
      }
    } else if (translationStatus === 'done') {
      details.push({ label: 'tokens:', value: formatTokens(translationMetrics.totalTokens || 0), color: 'text-green-600' })
      const outputChars = translationMetrics.outputCharCount || 0
      if (outputChars > 0) {
        details.push({ label: 'chars:', value: outputChars, color: 'text-green-600' })
      }
    } else {
      details.push({ label: 'tokens:', value: formatTokens(translationMetrics.totalTokens || 0), color: 'text-green-600' })
    }

    return details
  }

  const getInterpretationDetails = () => {
    const details = []

    if (interpretationStatus === 'processing') {
      const time = formatDuration(Date.now() - (interpretationMetrics.startTime?.getTime() || Date.now()))
      details.push({ label: 'time:', value: time, color: 'text-purple-600' })
      if ((interpretationMetrics.totalTokens || 0) > 0) {
        details.push({ label: 'tokens:', value: formatTokens(interpretationMetrics.totalTokens || 0), color: 'text-purple-600' })
      }
    } else if (interpretationStatus === 'done') {
      details.push({ label: 'tokens:', value: formatTokens(interpretationMetrics.totalTokens || 0), color: 'text-purple-600' })
      const outputChars = interpretationMetrics.outputCharCount || 0
      if (outputChars > 0) {
        details.push({ label: 'chars:', value: outputChars, color: 'text-purple-600' })
      }
    } else {
      details.push({ label: 'tokens:', value: formatTokens(interpretationMetrics.totalTokens || 0), color: 'text-purple-600' })
    }

    return details
  }

  return (
    <div className={cn(
      "flex items-center justify-center gap-4 text-sm",
      className
    )}>
      {/* Model info */}
      <div
        className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
        onClick={onModelClick}
        title="点击配置模型"
      >
        <span className="text-gray-500">model:</span>
        <span className={cn(
          "font-medium",
          (() => {
            // 检查模型配置是否有效
            if (!llmConfig.model) return "text-red-500"

            // 对于本地模型，不需要API密钥
            const isLocalModel = ['ollama', 'lmstudio'].includes(llmConfig.type)
            if (isLocalModel) return "text-purple-600"

            // 对于云端模型，需要API密钥
            return llmConfig.apiKey ? "text-purple-600" : "text-red-500"
          })()
        )}>
          {(() => {
            // 检查模型配置是否有效
            if (!llmConfig.model) return 'null'

            // 对于本地模型，不需要API密钥
            const isLocalModel = ['ollama', 'lmstudio'].includes(llmConfig.type)
            if (isLocalModel) return llmConfig.model

            // 对于云端模型，需要API密钥
            return llmConfig.apiKey ? llmConfig.model : 'null'
          })()}
        </span>
      </div>

      <span className="text-gray-300">|</span>

      {/* Module statuses */}
      <ModuleStatus
        icon={<FileText className="h-4 w-4" />}
        status={originalStatus}
        details={getOriginalDetails()}
      />

      <span className="text-gray-300">|</span>

      <ModuleStatus
        icon={<MessageCircle className="h-4 w-4" />}
        status={chatStatus}
        details={getChatDetails()}
      />

      <span className="text-gray-300">|</span>

      <ModuleStatus
        icon={<Languages className="h-4 w-4" />}
        status={translationStatus}
        details={getTranslationDetails()}
      />

      <span className="text-gray-300">|</span>

      <ModuleStatus
        icon={<Brain className="h-4 w-4" />}
        status={interpretationStatus}
        details={getInterpretationDetails()}
      />
    </div>
  )
}

// Live updating version
export function LiveModularMonitor({ className, onModelClick }: ModularMonitorProps) {
  const [, forceUpdate] = React.useReducer(x => x + 1, 0)

  const {
    fetchMetrics,
    translationMetrics,
    interpretationMetrics,
    chatMetrics
  } = useMetricsStore()

  const isProcessing = !!(
    (fetchMetrics.startTime && !fetchMetrics.endTime) ||
    (translationMetrics.startTime && !translationMetrics.endTime) ||
    (interpretationMetrics.startTime && !interpretationMetrics.endTime) ||
    (chatMetrics.startTime && !chatMetrics.endTime)
  )

  // Update every second when processing
  React.useEffect(() => {
    if (!isProcessing) return

    const interval = setInterval(() => {
      forceUpdate()
    }, 1000)

    return () => clearInterval(interval)
  }, [isProcessing])

  return <ModularMonitor className={className} onModelClick={onModelClick} />
}