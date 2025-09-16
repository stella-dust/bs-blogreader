import React from 'react'
import { Button } from '@/components/ui/button'
import { Clock, Download } from 'lucide-react'

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
  isOpen: boolean
  onClose: () => void
  history: HistoryItem[]
  onDownload: (item: HistoryItem) => void
}

export function HistoryDropdown({ isOpen, onClose, history, onDownload }: HistoryDropdownProps) {
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-10"
        onClick={onClose}
      />

      {/* Dropdown */}
      <div className="absolute right-0 top-full mt-2 w-80 bg-background border border-border rounded-md shadow-lg z-20">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4" />
            <span className="font-medium">历史记录</span>
          </div>

          {history.length === 0 ? (
            <p className="text-muted-foreground text-sm">暂无历史记录</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="p-3 border border-border rounded-md hover:bg-muted/50"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium truncate">{item.title}</h4>
                      <p className="text-xs text-muted-foreground truncate">{item.url}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.timestamp.toLocaleDateString()} {item.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDownload(item)}
                      className="flex-shrink-0"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}