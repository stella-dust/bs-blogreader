import React from 'react'
import { cn } from '@/lib/utils'

interface ModularLayoutProps {
  children: React.ReactNode
  className?: string
}

interface LayoutSectionProps {
  children: React.ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

interface LayoutGridProps {
  children: React.ReactNode
  className?: string
  cols?: 1 | 2 | 3 | 4
  gap?: 'sm' | 'md' | 'lg'
}

// Main layout container
export function ModularLayout({ children, className }: ModularLayoutProps) {
  return (
    <div className={cn(
      "min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8",
      className
    )}>
      <div className="mx-auto max-w-7xl space-y-6">
        {children}
      </div>
    </div>
  )
}

// Layout section for grouping related cards
export function LayoutSection({
  children,
  className,
  maxWidth = 'full'
}: LayoutSectionProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full'
  }

  return (
    <section className={cn(
      "space-y-4",
      maxWidthClasses[maxWidth],
      className
    )}>
      {children}
    </section>
  )
}

// Grid layout for arranging cards
export function LayoutGrid({
  children,
  className,
  cols = 1,
  gap = 'md'
}: LayoutGridProps) {
  const colClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 lg:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  }

  const gapClasses = {
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6'
  }

  return (
    <div className={cn(
      "grid",
      colClasses[cols],
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  )
}

// Sidebar layout for two-column design
interface SidebarLayoutProps {
  sidebar: React.ReactNode
  main: React.ReactNode
  sidebarPosition?: 'left' | 'right'
  sidebarWidth?: 'sm' | 'md' | 'lg'
  className?: string
}

export function SidebarLayout({
  sidebar,
  main,
  sidebarPosition = 'right',
  sidebarWidth = 'md',
  className
}: SidebarLayoutProps) {
  const widthClasses = {
    sm: 'lg:w-64',
    md: 'lg:w-80',
    lg: 'lg:w-96'
  }

  return (
    <div className={cn(
      "flex flex-col lg:flex-row gap-6",
      sidebarPosition === 'left' && "lg:flex-row-reverse",
      className
    )}>
      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-6">
        {main}
      </div>

      {/* Sidebar */}
      <div className={cn(
        "flex-shrink-0 space-y-4",
        widthClasses[sidebarWidth]
      )}>
        {sidebar}
      </div>
    </div>
  )
}

// Stack layout for vertical arrangement
interface StackLayoutProps {
  children: React.ReactNode
  spacing?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function StackLayout({
  children,
  spacing = 'md',
  className
}: StackLayoutProps) {
  const spacingClasses = {
    sm: 'space-y-2',
    md: 'space-y-4',
    lg: 'space-y-6',
    xl: 'space-y-8'
  }

  return (
    <div className={cn(
      spacingClasses[spacing],
      className
    )}>
      {children}
    </div>
  )
}

// Responsive container
interface ResponsiveContainerProps {
  children: React.ReactNode
  className?: string
  breakpoint?: 'sm' | 'md' | 'lg' | 'xl'
}

export function ResponsiveContainer({
  children,
  className,
  breakpoint = 'lg'
}: ResponsiveContainerProps) {
  const breakpointClasses = {
    sm: 'block sm:hidden',
    md: 'block md:hidden',
    lg: 'block lg:hidden',
    xl: 'block xl:hidden'
  }

  return (
    <>
      {/* Mobile/Tablet view */}
      <div className={cn(breakpointClasses[breakpoint], className)}>
        {children}
      </div>

      {/* Desktop view */}
      <div className={cn(`hidden ${breakpoint}:block`, className)}>
        {children}
      </div>
    </>
  )
}