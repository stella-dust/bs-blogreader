// Shared types for stores

export interface ContentData {
  title: string
  url: string
  content: string
  htmlContent?: string
  author?: string
  publishDate?: string
  description?: string
  images?: Array<{
    src: string
    alt: string
    title: string
  }>
  siteName?: string
}

export interface ProcessedData {
  translation?: string
  interpretation?: string
}

export interface HistoryItem {
  id: string
  title: string
  url: string
  timestamp: Date
  translation?: string
  interpretation?: string
  original?: string
}

export interface LLMConfig {
  type: 'deepseek' | 'openai' | 'ollama' | 'lmstudio' | 'claude'
  apiKey: string
  baseURL?: string
  model?: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface ProcessingMetrics {
  startTime?: Date
  endTime?: Date
  duration?: number
  inputTokens?: number
  outputTokens?: number
  totalTokens?: number
  inputCharCount?: number
  outputCharCount?: number
  estimatedTimeRemaining?: number
  progress?: number // 0-100
}

export interface UIState {
  showApiDialog: boolean
  showHistoryDropdown: boolean
  inputMethod: 'url' | 'file'
  activeTab: 'original' | 'translation' | 'interpretation' | 'chat'
  collapsedPanels: Record<string, boolean>
  isMobile: boolean
}