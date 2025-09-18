import React, { useState, useEffect } from 'react'
import { Lightbulb, X, HelpCircle } from 'lucide-react'

interface SmartTooltipProps {
  id: string
  trigger: React.ReactNode
  content: React.ReactNode
  placement?: 'top' | 'bottom' | 'left' | 'right'
  autoShow?: boolean
  delay?: number
}

export function SmartTooltip({
  id,
  trigger,
  content,
  placement = 'bottom',
  autoShow = false,
  delay = 0
}: SmartTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [hasBeenShown, setHasBeenShown] = useState(false)

  useEffect(() => {
    // Check if this tooltip has been dismissed before
    const dismissed = localStorage.getItem(`tooltip-dismissed-${id}`)
    if (dismissed) {
      setHasBeenShown(true)
      return
    }

    if (autoShow && !hasBeenShown) {
      const timer = setTimeout(() => {
        setIsVisible(true)
        setHasBeenShown(true)
      }, delay)

      return () => clearTimeout(timer)
    }
  }, [id, autoShow, delay, hasBeenShown])

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem(`tooltip-dismissed-${id}`, 'true')
  }

  const placementClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2'
  }

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {trigger}
      </div>

      {isVisible && (
        <div className={`absolute z-50 ${placementClasses[placement]}`}>
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-sm">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 text-sm text-gray-700">
                {content}
              </div>
              <button
                onClick={handleDismiss}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface FeatureHighlightProps {
  features: Array<{
    id: string
    title: string
    description: string
    icon?: React.ReactNode
  }>
  onClose?: () => void
  className?: string
}

export function FeatureHighlight({ features, onClose, className }: FeatureHighlightProps) {
  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-3 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-blue-600" />
          <h4 className="text-sm font-medium text-blue-900">
            智能功能
          </h4>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-blue-400 hover:text-blue-600"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      <div className="text-sm text-blue-700">
        🔗 智能URL抓取 • 🔍 Web搜索增强 • 📚 原文分析 • 📎 智能引用
      </div>
    </div>
  )
}

interface SmartHelpButtonProps {
  helpContent: React.ReactNode
  className?: string
}

export function SmartHelpButton({ helpContent, className }: SmartHelpButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-400 hover:text-gray-600 transition-colors"
        title="获取帮助"
      >
        <HelpCircle className="h-4 w-4" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Help content */}
          <div className="absolute right-0 top-8 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm">
            <div className="flex items-start justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-900">帮助信息</h4>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <div className="text-sm text-gray-700">
              {helpContent}
            </div>
          </div>
        </>
      )}
    </div>
  )
}