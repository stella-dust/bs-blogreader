import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ContentData, ProcessedData, HistoryItem, LLMConfig } from './types'

interface ContentStore {
  // Content data
  contentData: ContentData | null
  processedData: ProcessedData
  history: HistoryItem[]

  // LLM configuration
  llmConfig: LLMConfig

  // Prompts
  translationPrompt: string
  interpretationPrompt: string

  // Loading states
  isFetching: boolean
  isTranslating: boolean
  isInterpreting: boolean

  // Actions
  setContentData: (data: ContentData | null) => void
  setProcessedData: (data: Partial<ProcessedData>) => void
  setLlmConfig: (config: LLMConfig) => void
  setTranslationPrompt: (prompt: string) => void
  setInterpretationPrompt: (prompt: string) => void
  addToHistory: (item: HistoryItem) => void
  removeFromHistory: (id: string) => void
  clearHistory: () => void
  setFetching: (loading: boolean) => void
  setTranslating: (loading: boolean) => void
  setInterpreting: (loading: boolean) => void
  reset: () => void
}

const defaultLlmConfig: LLMConfig = {
  type: 'deepseek',
  apiKey: '',
  baseURL: 'https://api.deepseek.com',
  model: 'deepseek-chat'
}

export const defaultTranslationPrompt = `你是一位专业的技术翻译专家。请将用户提供的英文技术博客完整准确地翻译成中文。

翻译要求：
1. 完整直译，保持原文的结构和格式
2. 保留所有代码块、链接、图片引用
3. 专业术语准确翻译，保持技术的准确性
4. 语言自然流畅，符合中文表达习惯
5. 保留原文的标题层级结构
6. 不要添加任何额外的解释或注释

请直接输出翻译内容，保持原文格式。`

export const defaultInterpretationPrompt = `你是一位专业的AI技术博客解读专家。请根据用户提供的英文技术博客内容，生成一篇500字以内的中文解读。

解读要求：
1. 忠于原文，不添加个人观点或推测
2. 概括文章的核心技术要点和价值
3. 提出3-4个引导性问题，帮助读者思考
4. 指出文章的阅读重点和关键收获
5. 语言简洁明了，适合技术从业者阅读

请直接输出解读内容，不需要额外的格式或前缀。`

export const useContentStore = create<ContentStore>()(
  persist(
    (set, get) => ({
      // Initial state
      contentData: null,
      processedData: {},
      history: [],
      llmConfig: defaultLlmConfig,
      translationPrompt: defaultTranslationPrompt,
      interpretationPrompt: defaultInterpretationPrompt,
      isFetching: false,
      isTranslating: false,
      isInterpreting: false,

      // Actions
      setContentData: (data) => set({ contentData: data }),

      setProcessedData: (data) =>
        set((state) => ({
          processedData: { ...state.processedData, ...data }
        })),

      setLlmConfig: (config) => set({ llmConfig: config }),

      setTranslationPrompt: (prompt) => set({ translationPrompt: prompt }),

      setInterpretationPrompt: (prompt) => set({ interpretationPrompt: prompt }),

      addToHistory: (item) =>
        set((state) => ({
          history: [item, ...state.history]
        })),

      removeFromHistory: (id) =>
        set((state) => ({
          history: state.history.filter(item => item.id !== id)
        })),

      clearHistory: () => set({ history: [] }),

      setFetching: (loading) => set({ isFetching: loading }),

      setTranslating: (loading) => set({ isTranslating: loading }),

      setInterpreting: (loading) => set({ isInterpreting: loading }),

      reset: () => set({
        contentData: null,
        processedData: {},
        isFetching: false,
        isTranslating: false,
        isInterpreting: false,
      }),
    }),
    {
      name: 'content-storage',
      // Only persist necessary data
      partialize: (state) => ({
        llmConfig: state.llmConfig,
        translationPrompt: state.translationPrompt,
        interpretationPrompt: state.interpretationPrompt,
        history: state.history,
      }),
    }
  )
)