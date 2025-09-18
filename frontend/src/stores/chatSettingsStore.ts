import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ChatSettings } from './types'

interface ChatSettingsStore {
  // Settings state
  settings: ChatSettings

  // Actions
  updateSettings: (updates: Partial<ChatSettings>) => void
  resetSettings: () => void
  toggleWebSearch: () => void
  toggleAutoUrlFetch: () => void
  setSearchDepth: (depth: ChatSettings['searchDepth']) => void
  setMaxSearchResults: (count: number) => void
}

// Default settings
const defaultSettings: ChatSettings = {
  webSearchEnabled: false,       // 默认关闭Web搜索（用户可控）
  autoUrlFetch: true,           // URL自动抓取始终开启
  searchDepth: 'basic',         // 默认基础搜索
  maxSearchResults: 3,          // 默认最多3个搜索结果
  showModeIndicator: true       // 默认显示模式指示器
}

export const useChatSettingsStore = create<ChatSettingsStore>()(
  persist(
    (set, get) => ({
      // Initial state
      settings: defaultSettings,

      // Actions
      updateSettings: (updates) => {
        set((state) => ({
          settings: { ...state.settings, ...updates }
        }))
      },

      resetSettings: () => {
        set({ settings: defaultSettings })
      },

      toggleWebSearch: () => {
        set((state) => ({
          settings: {
            ...state.settings,
            webSearchEnabled: !state.settings.webSearchEnabled
          }
        }))
      },

      toggleAutoUrlFetch: () => {
        set((state) => ({
          settings: {
            ...state.settings,
            autoUrlFetch: !state.settings.autoUrlFetch
          }
        }))
      },

      setSearchDepth: (depth) => {
        set((state) => ({
          settings: {
            ...state.settings,
            searchDepth: depth
          }
        }))
      },

      setMaxSearchResults: (count) => {
        // 限制在1-5之间
        const clampedCount = Math.max(1, Math.min(5, count))
        set((state) => ({
          settings: {
            ...state.settings,
            maxSearchResults: clampedCount
          }
        }))
      }
    }),
    {
      name: 'chat-settings-storage',
      // 持久化所有设置
      partialize: (state) => ({ settings: state.settings }),
    }
  )
)