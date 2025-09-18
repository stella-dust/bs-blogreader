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

// 聊天设置
export interface ChatSettings {
  webSearchEnabled: boolean        // Web搜索总开关
  autoUrlFetch: boolean           // 自动检测URL开关
  searchDepth: 'basic' | 'deep'   // 搜索深度
  maxSearchResults: number        // 最大搜索结果数
  showModeIndicator: boolean      // 是否显示模式指示器
}

// 处理模式
export interface ProcessMode {
  type: 'url_fetch' | 'web_search' | 'rag_only'
  urls?: string[]
  query?: string
  priority: 'high' | 'medium' | 'low'
  reason?: string
}

// 输入分析结果
export interface InputAnalysis {
  mode: ProcessMode
  urls: string[]
  cleanQuestion: string
  searchKeywords?: string[]
  confidence: number
}

// 扩展聊天消息，支持来源信息
export interface EnhancedChatMessage extends ChatMessage {
  mode?: ProcessMode['type']
  sources?: Array<{
    type: 'original' | 'web' | 'url'
    title: string
    url?: string
    content?: string
    chunkId?: string
  }>
  isStreaming?: boolean
}