import React from 'react'
import { Clock, Hash, FileText, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMetricsStore, formatDuration, formatTokens } from '@/stores/metricsStore'

interface SimpleMonitorProps {
  className?: string
}

export function SimpleMonitor({ className }: SimpleMonitorProps) {
  const {
    fetchMetrics,
    translationMetrics,
    interpretationMetrics,
    chatMetrics
  } = useMetricsStore()

  // Calculate totals
  const totalCharacters = (fetchMetrics.inputCharCount || 0) + (fetchMetrics.outputCharCount || 0)
  const totalTokens = (translationMetrics.totalTokens || 0) + (interpretationMetrics.totalTokens || 0) + (chatMetrics.totalTokens || 0)

  const isProcessing = !!(
    (fetchMetrics.startTime && !fetchMetrics.endTime) ||
    (translationMetrics.startTime && !translationMetrics.endTime) ||
    (interpretationMetrics.startTime && !interpretationMetrics.endTime) ||
    (chatMetrics.startTime && !chatMetrics.endTime)
  )

  const getCurrentProcess = () => {
    if (fetchMetrics.startTime && !fetchMetrics.endTime) return 'fetching'
    if (translationMetrics.startTime && !translationMetrics.endTime) return 'translating'
    if (interpretationMetrics.startTime && !interpretationMetrics.endTime) return 'interpreting'
    if (chatMetrics.startTime && !chatMetrics.endTime) return 'chatting'
    return 'ready'
  }

  const getProcessingTime = () => {
    const now = Date.now()
    if (fetchMetrics.startTime && !fetchMetrics.endTime) {
      return formatDuration(now - fetchMetrics.startTime.getTime())
    }
    if (translationMetrics.startTime && !translationMetrics.endTime) {
      return formatDuration(now - translationMetrics.startTime.getTime())
    }
    if (interpretationMetrics.startTime && !interpretationMetrics.endTime) {
      return formatDuration(now - interpretationMetrics.startTime.getTime())
    }
    if (chatMetrics.startTime && !chatMetrics.endTime) {
      return formatDuration(now - chatMetrics.startTime.getTime())
    }
    return '0s'
  }

  return (
    <div className={cn(
      "text-center text-sm flex items-center justify-center gap-4",
      className
    )}>
      {/* Status */}
      <span>
        <span className="text-gray-500">status:</span>
        <span className={cn(
          "ml-1 font-medium",
          isProcessing ? "text-blue-600" : "text-green-600"
        )}>
          {getCurrentProcess()}
        </span>
      </span>

      <span className="text-gray-400">|</span>

      {/* Time */}
      <span>
        <span className="text-gray-500">time:</span>
        <span className="ml-1 text-gray-700">
          {isProcessing ? getProcessingTime() : '0s'}
        </span>
      </span>

      <span className="text-gray-400">|</span>

      {/* Characters */}
      <span>
        <span className="text-gray-500">chars:</span>
        <span className="ml-1 text-orange-600">
          {totalCharacters > 0 ? totalCharacters.toLocaleString() : '0'}
        </span>
      </span>

      <span className="text-gray-400">|</span>

      {/* Model */}
      <span>
        <span className="text-gray-500">model:</span>
        <span className="ml-1 text-purple-600">
          DeepSeek-chat
        </span>
      </span>

      <span className="text-gray-400">|</span>

      {/* Tokens */}
      <span>
        <span className="text-gray-500">tokens:</span>
        <span className="ml-1 text-indigo-600">
          {totalTokens > 0 ? formatTokens(totalTokens) : '0'}
        </span>
      </span>
    </div>
  )
}

// Real-time updating version that re-renders every second during processing
export function LiveSimpleMonitor({ className }: SimpleMonitorProps) {
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

  return <SimpleMonitor className={className} />
}