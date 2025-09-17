import React, { useState } from 'react'
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

// Custom sidebar icon component from provided SVG
function SidebarIcon({ isCollapsed }: { isCollapsed: boolean }) {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 1024 1024"
      fill="currentColor"
      style={{ transform: 'scale(1.1)' }}
    >
      <path d="M824.888889 170.666667H199.111111a56.888889 56.888889 0 0 0-56.888889 56.888889v568.888888a56.888889 56.888889 0 0 0 56.888889 56.888889h625.777778a56.888889 56.888889 0 0 0 56.888889-56.888889V227.555556a56.888889 56.888889 0 0 0-56.888889-56.888889z m0 597.333333a28.444444 28.444444 0 0 1-28.444445 28.444444H227.555556a28.444444 28.444444 0 0 1-28.444445-28.444444V256a28.444444 28.444444 0 0 1 28.444445-28.444444h568.888888a28.444444 28.444444 0 0 1 28.444445 28.444444z"></path>
      <path d="M512 256m28.444444 0l227.555556 0q28.444444 0 28.444444 28.444444l0 455.111112q0 28.444444-28.444444 28.444444l-227.555556 0q-28.444444 0-28.444444-28.444444l0-455.111112q0-28.444444 28.444444-28.444444Z"></path>
    </svg>
  )
}

interface CollapsibleCardProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  defaultCollapsed?: boolean
  collapsible?: boolean
  direction?: 'vertical' | 'horizontal'
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
  direction = 'vertical',
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

  const isHorizontal = direction === 'horizontal'

  if (isHorizontal) {
    return (
      <div
        className={cn(
          "rounded-xl bg-white transition-all duration-300 flex h-full",
          isCollapsed ? "w-12" : "w-full",
          className
        )}
      >
        {/* Vertical Header for Horizontal Layout - NotebookLM Style */}
        <div
          className={cn(
            "flex flex-col items-center justify-between p-2 cursor-pointer select-none border-r border-gray-100 min-w-12 bg-gray-50 rounded-l-xl",
            collapsible && "hover:bg-gray-100",
            headerClassName
          )}
          onClick={handleToggle}
        >
          <div className="flex flex-col items-center">
            {collapsible && (
              <div className="text-gray-400 hover:text-gray-600 transition-colors mb-2">
                <SidebarIcon isCollapsed={isCollapsed} />
              </div>
            )}

            {icon && (
              <div className="flex-shrink-0 text-gray-600 mb-2">
                {icon}
              </div>
            )}
          </div>

          <div className="flex flex-col items-center text-center flex-1 justify-center">
            <h3 className="font-medium text-gray-800 text-xs transform -rotate-90 whitespace-nowrap">
              {title}
            </h3>
            {badge && !isCollapsed && (
              <div className="mt-2 transform -rotate-90">
                {badge}
              </div>
            )}
          </div>

          {actions && !isCollapsed && (
            <div
              className="flex flex-col items-center gap-1 mt-2"
              onClick={(e) => e.stopPropagation()}
            >
              {actions}
            </div>
          )}
        </div>

        {/* Content for Horizontal Layout */}
        {!isCollapsed && (
          <div
            className={cn(
              "flex-1 p-4 min-w-0 overflow-hidden",
              contentClassName
            )}
          >
            {children}
          </div>
        )}
      </div>
    )
  }

  // Vertical layout (NotebookLM style)
  return (
    <div
      className={cn(
        "rounded-xl bg-white flex flex-col h-full",
        className
      )}
    >
      {/* Header - NotebookLM Style */}
      <div
        className={cn(
          "flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100 flex-shrink-0",
          isCollapsed ? "rounded-xl" : "rounded-t-xl",
          collapsible && "hover:bg-gray-100 cursor-pointer",
          headerClassName
        )}
        onClick={collapsible ? handleToggle : undefined}
      >
        {isCollapsed ? (
          // Collapsed state: only show icon
          <div className="flex items-center justify-center w-full">
            {icon && (
              <div className="flex-shrink-0 text-gray-600">
                {icon}
              </div>
            )}
          </div>
        ) : (
          // Expanded state: show full header
          <>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {icon && (
                <div className="flex-shrink-0 text-gray-600">
                  {icon}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-gray-800 text-sm truncate">
                    {title}
                  </h3>
                  {badge && badge}
                </div>
                {subtitle && (
                  <p className="text-xs text-gray-500 truncate mt-1">
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
                <div className="text-gray-400 hover:text-gray-600 transition-colors ml-2">
                  <SidebarIcon isCollapsed={isCollapsed} />
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div
          className={contentClassName || "flex-1 min-h-0 p-4"}
        >
          {children}
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