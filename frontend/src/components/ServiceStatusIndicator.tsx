import React, { useState, useEffect } from 'react'
import { Wifi, WifiOff, AlertTriangle, Check } from 'lucide-react'

interface ServiceStatusIndicatorProps {
  apiBaseUrl: string
  className?: string
  onStatusChange?: (status: ServiceStatus) => void
}

export type ServiceStatus = 'checking' | 'online' | 'offline' | 'error'

export function ServiceStatusIndicator({ apiBaseUrl, className, onStatusChange }: ServiceStatusIndicatorProps) {
  const [status, setStatus] = useState<ServiceStatus>('checking')
  const [lastCheck, setLastCheck] = useState<Date | null>(null)

  const checkServiceHealth = async () => {
    try {
      const newStatus = 'checking'
      setStatus(newStatus)
      onStatusChange?.(newStatus)

      // Simple health check - try to fetch the health endpoint
      const response = await fetch(`${apiBaseUrl}/functions/v1/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'fallback-key'}`
        },
        signal: AbortSignal.timeout(3000) // 3 second timeout
      })

      if (response.ok) {
        setStatus('online')
        onStatusChange?.('online')
      } else {
        setStatus('error')
        onStatusChange?.('error')
      }
    } catch (error) {
      // Network error or timeout
      setStatus('offline')
      onStatusChange?.('offline')
    } finally {
      setLastCheck(new Date())
    }
  }

  useEffect(() => {
    checkServiceHealth()

    // Check every 30 seconds
    const interval = setInterval(checkServiceHealth, 30000)

    return () => clearInterval(interval)
  }, [apiBaseUrl])

  const getStatusConfig = () => {
    switch (status) {
      case 'checking':
        return {
          icon: <Wifi className="h-3 w-3 animate-pulse" />,
          text: '检查中...',
          color: 'text-gray-500 bg-gray-50 border-gray-200'
        }
      case 'online':
        return {
          icon: <Check className="h-3 w-3" />,
          text: '服务正常',
          color: 'text-green-700 bg-green-50 border-green-200'
        }
      case 'offline':
        return {
          icon: <WifiOff className="h-3 w-3" />,
          text: '服务离线',
          color: 'text-red-700 bg-red-50 border-red-200'
        }
      case 'error':
        return {
          icon: <AlertTriangle className="h-3 w-3" />,
          text: '服务异常',
          color: 'text-yellow-700 bg-yellow-50 border-yellow-200'
        }
    }
  }

  const config = getStatusConfig()

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-1 border rounded-full text-xs font-medium ${config.color} ${className}`}
      title={lastCheck ? `最后检查: ${lastCheck.toLocaleTimeString()}` : '正在检查服务状态...'}
    >
      {config.icon}
      <span>{config.text}</span>
    </div>
  )
}

interface OfflineModeNoticeProps {
  className?: string
}

export function OfflineModeNotice({ className }: OfflineModeNoticeProps) {
  return (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-3 ${className}`}>
      <div className="flex items-center gap-2">
        <WifiOff className="h-4 w-4 text-yellow-600 flex-shrink-0" />
        <div className="flex-1">
          <span className="text-sm text-yellow-800">
            后端服务离线，部分功能可能受限
          </span>
        </div>
      </div>
    </div>
  )
}