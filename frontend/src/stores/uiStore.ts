import React from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UIState } from './types'

interface UIStore extends UIState {
  // Actions
  setShowApiDialog: (show: boolean) => void
  setShowHistoryDropdown: (show: boolean) => void
  setInputMethod: (method: 'url' | 'file') => void
  setActiveTab: (tab: 'original' | 'translation' | 'interpretation' | 'chat') => void
  togglePanelCollapse: (panelId: string) => void
  setPanelCollapsed: (panelId: string, collapsed: boolean) => void
  setIsMobile: (isMobile: boolean) => void
  resetUI: () => void
}

const initialState: UIState = {
  showApiDialog: false,
  showHistoryDropdown: false,
  inputMethod: 'url',
  activeTab: 'original',
  collapsedPanels: {},
  isMobile: false,
}

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      // Initial state
      ...initialState,

      // Actions
      setShowApiDialog: (show) => set({ showApiDialog: show }),

      setShowHistoryDropdown: (show) => set({ showHistoryDropdown: show }),

      setInputMethod: (method) => set({ inputMethod: method }),

      setActiveTab: (tab) => set({ activeTab: tab }),

      togglePanelCollapse: (panelId) =>
        set((state) => ({
          collapsedPanels: {
            ...state.collapsedPanels,
            [panelId]: !state.collapsedPanels[panelId]
          }
        })),

      setPanelCollapsed: (panelId, collapsed) =>
        set((state) => ({
          collapsedPanels: {
            ...state.collapsedPanels,
            [panelId]: collapsed
          }
        })),

      setIsMobile: (isMobile) => set({ isMobile }),

      resetUI: () => set(initialState),
    }),
    {
      name: 'ui-storage',
      // Persist UI preferences
      partialize: (state) => ({
        inputMethod: state.inputMethod,
        activeTab: state.activeTab,
        collapsedPanels: state.collapsedPanels,
      }),
    }
  )
)

// Hook for responsive design detection
export const useResponsive = () => {
  const { isMobile, setIsMobile } = useUIStore()

  React.useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)

    return () => {
      window.removeEventListener('resize', checkIsMobile)
    }
  }, [setIsMobile])

  return {
    isMobile,
    isTablet: !isMobile && window.innerWidth < 1024,
    isDesktop: window.innerWidth >= 1024,
  }
}

