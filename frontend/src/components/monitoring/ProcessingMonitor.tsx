import React from 'react'
import { Clock, Hash, FileText, Zap, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMetricsStore, formatDuration, formatTokens } from '@/stores/metricsStore'

interface ProcessingMonitorProps {
  processType: 'fetch' | 'translation' | 'interpretation' | 'chat'
  className?: string
}

interface MetricItemProps {
  icon: React.ReactNode
  label: string
  value: string | number
  suffix?: string
  isLoading?: boolean
  variant?: 'default' | 'success' | 'warning' | 'info'
}

function MetricItem({
  icon,
  label,
  value,
  suffix,
  isLoading,
  variant = 'default'
}: MetricItemProps) {
  const variantClasses = {
    default: 'text-gray-600',
    success: 'text-green-600',
    warning: 'text-amber-600',
    info: 'text-blue-600'
  }

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span className={cn('flex-shrink-0', variantClasses[variant])}>
          {icon}
        </span>
        <span>{label}</span>
      </div>

      <div className="text-sm font-medium text-gray-900">
        {isLoading ? (
          <div className="w-12 h-4 bg-gray-200 rounded animate-pulse" />
        ) : (
          <span>
            {value}
            {suffix && <span className="text-gray-500 ml-1">{suffix}</span>}
          </span>
        )}
      </div>
    </div>
  )
}

interface ProgressBarProps {
  progress: number
  variant?: 'default' | 'success' | 'warning' | 'error'
  showPercentage?: boolean
  className?: string
}

function ProgressBar({
  progress,
  variant = 'default',
  showPercentage = true,
  className
}: ProgressBarProps) {
  const variantClasses = {
    default: 'bg-blue-500',
    success: 'bg-green-500',
    warning: 'bg-amber-500',
    error: 'bg-red-500'
  }

  const clampedProgress = Math.min(100, Math.max(0, progress))

  return (
    <div className={cn('space-y-2', className)}>
      {showPercentage && (
        <div className="flex justify-between text-xs text-gray-600">
          <span>Progress</span>
          <span>{Math.round(clampedProgress)}%</span>
        </div>
      )}

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={cn(
            'h-2 rounded-full transition-all duration-300 ease-out',
            variantClasses[variant]
          )}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  )
}

export function ProcessingMonitor({
  processType,
  className
}: ProcessingMonitorProps) {
  const metrics = useMetricsStore((state) => state[`${processType}Metrics`])

  const isActive = metrics.startTime && !metrics.endTime
  const isCompleted = metrics.endTime
  const progress = metrics.progress || 0

  // Calculate derived values
  const duration = metrics.duration
    ? formatDuration(metrics.duration)
    : metrics.startTime
    ? formatDuration(Date.now() - metrics.startTime.getTime())
    : '0s'

  const totalTokens = metrics.totalTokens
    ? formatTokens(metrics.totalTokens)
    : '0'

  const charactersProcessed = metrics.inputCharCount || 0
  const charactersGenerated = metrics.outputCharCount || 0

  const estimatedTimeRemaining = metrics.estimatedTimeRemaining
    ? formatDuration(metrics.estimatedTimeRemaining)
    : undefined

  // Determine status
  const getStatusInfo = () => {
    if (isCompleted) {
      return {
        variant: 'success' as const,
        status: 'Completed',
        color: 'text-green-600'
      }
    }

    if (isActive) {
      return {
        variant: 'info' as const,
        status: 'Processing...',
        color: 'text-blue-600'
      }
    }

    return {
      variant: 'default' as const,
      status: 'Ready',
      color: 'text-gray-600'
    }
  }

  const statusInfo = getStatusInfo()

  if (!isActive && !isCompleted) {
    return null // Don't show monitor when inactive
  }

  return (
    <div className={cn(
      'bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className={cn('h-4 w-4', statusInfo.color)} />
          <span className="font-medium text-gray-900">
            Processing Monitor
          </span>
        </div>

        <span className={cn('text-sm font-medium', statusInfo.color)}>
          {statusInfo.status}
        </span>
      </div>

      {/* Progress Bar */}
      {isActive && (
        <ProgressBar
          progress={progress}
          variant={statusInfo.variant}
          showPercentage={true}
        />
      )}

      {/* Metrics Grid */}
      <div className="space-y-1 border-t border-gray-200 pt-3">
        <MetricItem
          icon={<Clock className="h-4 w-4" />}
          label="Duration"
          value={duration}
          isLoading={isActive && !duration}
        />

        {metrics.inputCharCount !== undefined && (
          <MetricItem
            icon={<FileText className="h-4 w-4" />}
            label="Characters"
            value={charactersProcessed}
            suffix={charactersGenerated ? ` → ${charactersGenerated}` : undefined}
          />
        )}

        {metrics.totalTokens !== undefined && metrics.totalTokens > 0 && (
          <MetricItem
            icon={<Hash className="h-4 w-4" />}
            label="Tokens"
            value={totalTokens}
            variant="info"
          />
        )}

        {estimatedTimeRemaining && isActive && (
          <MetricItem
            icon={<Zap className="h-4 w-4" />}
            label="Est. remaining"
            value={estimatedTimeRemaining}
            variant="warning"
          />
        )}
      </div>

      {/* Token Breakdown (if available) */}
      {(metrics.inputTokens || metrics.outputTokens) && (
        <div className="border-t border-gray-200 pt-3">
          <div className="text-xs text-gray-500 mb-2">Token Breakdown</div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            {metrics.inputTokens !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-600">Input:</span>
                <span className="font-medium">{formatTokens(metrics.inputTokens)}</span>
              </div>
            )}

            {metrics.outputTokens !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-600">Output:</span>
                <span className="font-medium">{formatTokens(metrics.outputTokens)}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Compact version for inline display
interface CompactMonitorProps {
  processType: 'fetch' | 'translation' | 'interpretation' | 'chat'
  className?: string
}

export function CompactProcessingMonitor({
  processType,
  className
}: CompactMonitorProps) {
  const metrics = useMetricsStore((state) => state[`${processType}Metrics`])

  const isActive = metrics.startTime && !metrics.endTime
  const progress = metrics.progress || 0

  if (!isActive) return null

  const duration = metrics.startTime
    ? formatDuration(Date.now() - metrics.startTime.getTime())
    : '0s'

  return (
    <div className={cn(
      'flex items-center gap-3 text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded-full',
      className
    )}>
      <div className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        <span>{duration}</span>
      </div>

      {metrics.totalTokens && (
        <div className="flex items-center gap-1">
          <Hash className="h-3 w-3" />
          <span>{formatTokens(metrics.totalTokens)}</span>
        </div>
      )}

      <div className="w-12 bg-gray-200 rounded-full h-1">
        <div
          className="h-1 bg-blue-500 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>
    </div>
  )
}