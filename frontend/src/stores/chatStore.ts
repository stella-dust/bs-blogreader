import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ChatMessage, EnhancedChatMessage } from './types'

interface ChatStore {
  // Chat data
  messages: EnhancedChatMessage[]
  currentSessionId: string | null
  isLoading: boolean

  // Actions
  addMessage: (message: Omit<EnhancedChatMessage, 'id' | 'timestamp'>) => EnhancedChatMessage
  clearMessages: () => void
  setLoading: (loading: boolean) => void
  startNewSession: () => void
  loadSession: (sessionId: string) => void
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      // Initial state
      messages: [],
      currentSessionId: null,
      isLoading: false,

      // Actions
      addMessage: (message) => {
        const newMessage: EnhancedChatMessage = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          ...message,
        }

        set((state) => ({
          messages: [...state.messages, newMessage]
        }))

        return newMessage
      },

      clearMessages: () => set({
        messages: [],
        currentSessionId: null
      }),

      setLoading: (loading) => set({ isLoading: loading }),

      startNewSession: () => {
        const sessionId = `session_${Date.now()}`
        set({
          messages: [],
          currentSessionId: sessionId
        })
      },

      loadSession: (sessionId) => {
        // In future versions, we could load messages from a specific session
        // For now, just set the session ID
        set({ currentSessionId: sessionId })
      },
    }),
    {
      name: 'chat-storage',
      // For now, don't persist chat messages for privacy
      // In future versions with user accounts, we could persist them
      partialize: () => ({}),
    }
  )
)