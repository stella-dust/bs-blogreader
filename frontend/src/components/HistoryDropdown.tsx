import React, { useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Clock, Download, FileText } from 'lucide-react'
import { useContentStore } from '@/stores'

interface HistoryItem {
  id: string
  title: string
  url: string
  timestamp: Date
  translation?: string
  interpretation?: string
  original?: string
}

interface HistoryDropdownProps {
  history: HistoryItem[]
  open: boolean
  onOpenChange: (open: boolean) => void
  trigger: React.ReactNode
}

export function HistoryDropdown({ history, open, onOpenChange, trigger }: HistoryDropdownProps) {
  const { setContentData } = useContentStore()
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onOpenChange(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open, onOpenChange])

  const handleLoadHistoryItem = (item: HistoryItem) => {
    // Restore the content data from history
    const contentData = {
      title: item.title,
      url: item.url,
      content: item.original || '',
      siteName: item.url.startsWith('file://') ? 'Local File' : 'Unknown Source'
    }
    setContentData(contentData)
    onOpenChange(false)
  }

  const handleDownloadItem = (item: HistoryItem) => {
    // Create downloadable content
    let content = `Title: ${item.title}\nURL: ${item.url}\nDate: ${item.timestamp.toLocaleString()}\n\n`

    if (item.original) {
      content += `Original Content:\n${item.original}\n\n`
    }

    if (item.translation) {
      content += `Translation:\n${item.translation}\n\n`
    }

    if (item.interpretation) {
      content += `Interpretation:\n${item.interpretation}\n\n`
    }

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${item.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={() => onOpenChange(!open)}>
        {trigger}
      </div>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="font-medium text-gray-900">历史记录</span>
              </div>

              {history.length === 0 ? (
                <div className="text-center text-sm text-gray-500 py-4">
                  暂无历史记录
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {history.slice(0, 10).map((item) => (
                    <div key={item.id} className="border border-gray-100 rounded-md hover:bg-gray-50 transition-colors">
                      <div className="p-3">
                        <div className="flex justify-between items-start gap-2">
                          <div
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => handleLoadHistoryItem(item)}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <FileText className="h-3 w-3 text-gray-400 flex-shrink-0" />
                              <h4 className="text-sm font-medium text-gray-900 truncate">{item.title}</h4>
                            </div>
                            <p className="text-xs text-gray-500 truncate mb-1">{item.url}</p>
                            <p className="text-xs text-gray-400">
                              {item.timestamp.toLocaleDateString()} {item.timestamp.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDownloadItem(item)
                            }}
                            className="flex-shrink-0 h-7 w-7 p-1 hover:bg-gray-100"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
        </div>
      )}
    </div>
  )
}