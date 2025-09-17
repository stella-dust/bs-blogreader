import React, { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CollapsibleCardProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  defaultCollapsed?: boolean
  collapsible?: boolean
  className?: string
  headerClassName?: string
  contentClassName?: string
  icon?: React.ReactNode
  badge?: React.ReactNode
  actions?: React.ReactNode
  onCollapsedChange?: (collapsed: boolean) => void
}

export function CollapsibleCard({
  title,
  subtitle,
  children,
  defaultCollapsed = false,
  collapsible = true,
  className,
  headerClassName,
  contentClassName,
  icon,
  badge,
  actions,
  onCollapsedChange,
}: CollapsibleCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)

  const handleToggle = () => {
    if (!collapsible) return

    const newCollapsed = !isCollapsed
    setIsCollapsed(newCollapsed)
    onCollapsedChange?.(newCollapsed)
  }

  return (
    <div
      className={cn(
        "border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow duration-200",
        className
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center justify-between p-4 cursor-pointer select-none",
          collapsible && "hover:bg-gray-50",
          headerClassName
        )}
        onClick={handleToggle}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {icon && (
            <div className="flex-shrink-0 text-gray-500">
              {icon}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 truncate">
                {title}
              </h3>
              {badge && badge}
            </div>
            {subtitle && (
              <p className="text-sm text-gray-500 truncate mt-1">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {actions && (
            <div
              className="flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              {actions}
            </div>
          )}

          {collapsible && (
            <div className="text-gray-400 hover:text-gray-600 transition-colors">
              {isCollapsed ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div
          className={cn(
            "border-t border-gray-100 p-4 pt-0",
            contentClassName
          )}
        >
          <div className="pt-4">
            {children}
          </div>
        </div>
      )}
    </div>
  )
}

// Preset variants for common use cases
export function InputCard(props: Omit<CollapsibleCardProps, 'icon'>) {
  return (
    <CollapsibleCard
      icon={<div className="w-2 h-2 bg-blue-500 rounded-full" />}
      {...props}
    />
  )
}

export function ContentCard(props: Omit<CollapsibleCardProps, 'icon'>) {
  return (
    <CollapsibleCard
      icon={<div className="w-2 h-2 bg-green-500 rounded-full" />}
      {...props}
    />
  )
}

export function ProcessingCard(props: Omit<CollapsibleCardProps, 'icon'>) {
  return (
    <CollapsibleCard
      icon={<div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />}
      {...props}
    />
  )
}

export function ChatCard(props: Omit<CollapsibleCardProps, 'icon'>) {
  return (
    <CollapsibleCard
      icon={<div className="w-2 h-2 bg-purple-500 rounded-full" />}
      {...props}
    />
  )
}