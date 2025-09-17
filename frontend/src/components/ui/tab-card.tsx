import React from 'react'
import { cn } from '@/lib/utils'
import { CollapsibleCard } from './collapsible-card'

interface TabItem {
  id: string
  label: string
  content: React.ReactNode
  badge?: React.ReactNode
  disabled?: boolean
  icon?: React.ReactNode
}

interface TabCardProps {
  title: string
  subtitle?: string
  tabs: TabItem[]
  activeTab: string
  onTabChange: (tabId: string) => void
  defaultCollapsed?: boolean
  className?: string
  tabsClassName?: string
  contentClassName?: string
  icon?: React.ReactNode
  actions?: React.ReactNode
  emptyState?: React.ReactNode
}

export function TabCard({
  title,
  subtitle,
  tabs,
  activeTab,
  onTabChange,
  defaultCollapsed = false,
  className,
  tabsClassName,
  contentClassName,
  icon,
  actions,
  emptyState
}: TabCardProps) {
  const activeTabData = tabs.find(tab => tab.id === activeTab)
  const hasContent = activeTabData?.content || emptyState

  return (
    <CollapsibleCard
      title={title}
      subtitle={subtitle}
      defaultCollapsed={defaultCollapsed}
      className={className}
      icon={icon}
      actions={actions}
      contentClassName="p-0"
    >
      <div className="space-y-0">
        {/* Tab Navigation */}
        <div className={cn(
          "flex items-center border-b border-gray-200 px-4",
          tabsClassName
        )}>
          <div className="flex space-x-0 overflow-x-auto">
            {tabs.map((tab) => {
              const isActive = tab.id === activeTab
              const isDisabled = tab.disabled

              return (
                <button
                  key={tab.id}
                  onClick={() => !isDisabled && onTabChange(tab.id)}
                  disabled={isDisabled}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors",
                    isActive
                      ? "border-blue-500 text-blue-600 bg-blue-50/50"
                      : isDisabled
                      ? "border-transparent text-gray-400 cursor-not-allowed"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  )}
                >
                  {tab.icon && (
                    <span className={cn(
                      "flex-shrink-0",
                      isActive ? "text-blue-600" : "text-gray-400"
                    )}>
                      {tab.icon}
                    </span>
                  )}

                  <span>{tab.label}</span>

                  {tab.badge && (
                    <span className="flex-shrink-0">
                      {tab.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className={cn(
          "p-4",
          contentClassName
        )}>
          {hasContent ? (
            <div className="space-y-4">
              {activeTabData?.content || emptyState}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No content available</p>
            </div>
          )}
        </div>
      </div>
    </CollapsibleCard>
  )
}

// Badge component for tabs
interface TabBadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  className?: string
}

export function TabBadge({
  children,
  variant = 'default',
  className
}: TabBadgeProps) {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-600',
    success: 'bg-green-100 text-green-600',
    warning: 'bg-amber-100 text-amber-600',
    error: 'bg-red-100 text-red-600',
    info: 'bg-blue-100 text-blue-600'
  }

  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
      variantClasses[variant],
      className
    )}>
      {children}
    </span>
  )
}

// Loading skeleton for tab content
export function TabContentSkeleton() {
  return (
    <div className="space-y-4">
      <div className="animate-pulse space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    </div>
  )
}

// Empty state component
interface TabEmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export function TabEmptyState({
  icon,
  title,
  description,
  action
}: TabEmptyStateProps) {
  return (
    <div className="text-center py-12">
      {icon && (
        <div className="flex justify-center mb-4 text-gray-400">
          {icon}
        </div>
      )}

      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {title}
      </h3>

      {description && (
        <p className="text-gray-500 mb-6 max-w-sm mx-auto">
          {description}
        </p>
      )}

      {action && action}
    </div>
  )
}