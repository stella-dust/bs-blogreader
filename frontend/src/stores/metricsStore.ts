import { create } from 'zustand'
import type { ProcessingMetrics } from './types'

interface MetricsStore {
  // Metrics for different processes
  fetchMetrics: ProcessingMetrics
  translationMetrics: ProcessingMetrics
  interpretationMetrics: ProcessingMetrics
  chatMetrics: ProcessingMetrics

  // Actions
  startProcess: (processType: 'fetch' | 'translation' | 'interpretation' | 'chat') => void
  endProcess: (processType: 'fetch' | 'translation' | 'interpretation' | 'chat', data?: Partial<ProcessingMetrics>) => void
  updateProgress: (processType: 'fetch' | 'translation' | 'interpretation' | 'chat', progress: number) => void
  setTokenCount: (processType: 'fetch' | 'translation' | 'interpretation' | 'chat', tokens: { input?: number, output?: number }) => void
  setCharCount: (processType: 'fetch' | 'translation' | 'interpretation' | 'chat', chars: { input?: number, output?: number }) => void
  estimateTimeRemaining: (processType: 'fetch' | 'translation' | 'interpretation' | 'chat', currentProgress: number) => void
  resetMetrics: (processType?: 'fetch' | 'translation' | 'interpretation' | 'chat') => void
}

const createEmptyMetrics = (): ProcessingMetrics => ({
  startTime: undefined,
  endTime: undefined,
  duration: undefined,
  inputTokens: undefined,
  outputTokens: undefined,
  totalTokens: undefined,
  inputCharCount: undefined,
  outputCharCount: undefined,
  estimatedTimeRemaining: undefined,
  progress: 0,
})

export const useMetricsStore = create<MetricsStore>((set, get) => ({
  // Initial state
  fetchMetrics: createEmptyMetrics(),
  translationMetrics: createEmptyMetrics(),
  interpretationMetrics: createEmptyMetrics(),
  chatMetrics: createEmptyMetrics(),

  // Actions
  startProcess: (processType) => {
    const startTime = new Date()
    set((state) => ({
      [`${processType}Metrics`]: {
        ...state[`${processType}Metrics` as keyof MetricsStore] as ProcessingMetrics,
        startTime,
        progress: 0,
        estimatedTimeRemaining: undefined,
        endTime: undefined,
        duration: undefined,
      }
    }))
  },

  endProcess: (processType, data = {}) => {
    const endTime = new Date()
    const currentMetrics = get()[`${processType}Metrics` as keyof MetricsStore] as ProcessingMetrics
    const duration = currentMetrics.startTime ? endTime.getTime() - currentMetrics.startTime.getTime() : undefined

    set((state) => ({
      [`${processType}Metrics`]: {
        ...state[`${processType}Metrics` as keyof MetricsStore] as ProcessingMetrics,
        endTime,
        duration,
        progress: 100,
        estimatedTimeRemaining: 0,
        ...data,
      }
    }))
  },

  updateProgress: (processType, progress) => {
    set((state) => {
      const currentMetrics = state[`${processType}Metrics` as keyof MetricsStore] as ProcessingMetrics

      return {
        [`${processType}Metrics`]: {
          ...currentMetrics,
          progress: Math.min(100, Math.max(0, progress)),
        }
      }
    })
  },

  setTokenCount: (processType, tokens) => {
    set((state) => {
      const currentMetrics = state[`${processType}Metrics` as keyof MetricsStore] as ProcessingMetrics
      const inputTokens = tokens.input ?? currentMetrics.inputTokens
      const outputTokens = tokens.output ?? currentMetrics.outputTokens

      return {
        [`${processType}Metrics`]: {
          ...currentMetrics,
          inputTokens,
          outputTokens,
          totalTokens: (inputTokens || 0) + (outputTokens || 0),
        }
      }
    })
  },

  setCharCount: (processType, chars) => {
    set((state) => {
      const currentMetrics = state[`${processType}Metrics` as keyof MetricsStore] as ProcessingMetrics

      return {
        [`${processType}Metrics`]: {
          ...currentMetrics,
          inputCharCount: chars.input ?? currentMetrics.inputCharCount,
          outputCharCount: chars.output ?? currentMetrics.outputCharCount,
        }
      }
    })
  },

  estimateTimeRemaining: (processType, currentProgress) => {
    const currentMetrics = get()[`${processType}Metrics` as keyof MetricsStore] as ProcessingMetrics

    if (!currentMetrics.startTime || currentProgress <= 0) {
      return
    }

    const elapsed = Date.now() - currentMetrics.startTime.getTime()
    const estimatedTotal = (elapsed / currentProgress) * 100
    const remaining = Math.max(0, estimatedTotal - elapsed)

    set((state) => ({
      [`${processType}Metrics`]: {
        ...state[`${processType}Metrics` as keyof MetricsStore] as ProcessingMetrics,
        estimatedTimeRemaining: remaining,
      }
    }))
  },

  resetMetrics: (processType) => {
    if (processType) {
      set((state) => ({
        [`${processType}Metrics`]: createEmptyMetrics()
      }))
    } else {
      // Reset all metrics
      set({
        fetchMetrics: createEmptyMetrics(),
        translationMetrics: createEmptyMetrics(),
        interpretationMetrics: createEmptyMetrics(),
        chatMetrics: createEmptyMetrics(),
      })
    }
  },
}))

// Utility functions for token estimation
export const estimateTokens = (text: string): number => {
  // Rough estimation: English text has about 4 characters per token on average
  // Chinese text has about 2.5 characters per token
  const hasChineseChars = /[\u4e00-\u9fff]/.test(text)
  const avgCharsPerToken = hasChineseChars ? 2.5 : 4
  return Math.ceil(text.length / avgCharsPerToken)
}

export const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${Math.round(ms)}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
}

export const formatTokens = (tokens: number): string => {
  if (tokens < 1000) return tokens.toString()
  if (tokens < 1000000) return `${(tokens / 1000).toFixed(1)}K`
  return `${(tokens / 1000000).toFixed(1)}M`
}