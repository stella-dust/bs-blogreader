import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from '@/components/ui/button'
import { Copy, Download } from 'lucide-react'
import { LoadingSpinner } from './LoadingSpinner'

interface ContentPanelProps {
  title?: string
  content: string
  isEmpty?: boolean
  isMarkdown?: boolean
  showActions?: boolean
  isLoading?: boolean
  loadingMessage?: string
  onCopy?: () => void
  onDownload?: () => void
}

export const ContentPanel: React.FC<ContentPanelProps> = ({
  title,
  content,
  isEmpty = false,
  isMarkdown = false,
  showActions = false,
  isLoading = false,
  loadingMessage = "加载中...",
  onCopy,
  onDownload
}) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(content)
    onCopy?.()
  }

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `content.${isMarkdown ? 'md' : 'txt'}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    onDownload?.()
  }
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {title && (
        <div className="border-b border-border p-4 flex-shrink-0">
          <h3 className="font-semibold">{title}</h3>
        </div>
      )}

      {showActions && !isEmpty && !isLoading && (
        <div className="border-b border-border p-2 flex justify-end space-x-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-7 px-2 text-xs"
          >
            <Copy className="h-3 w-3 mr-1" />
            复制
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="h-7 px-2 text-xs"
          >
            <Download className="h-3 w-3 mr-1" />
            下载
          </Button>
        </div>
      )}

      <div className="flex-1 overflow-hidden min-h-0">
        {isLoading ? (
          <LoadingSpinner message={loadingMessage} />
        ) : isEmpty ? (
          <div className="flex items-center justify-center h-full text-muted-foreground p-4">
            <div className="text-center">
              <p className="text-sm">暂无内容</p>
            </div>
          </div>
        ) : (
          <div className="w-full h-full overflow-auto p-4">
            {isMarkdown ? (
              <div className="prose prose-sm max-w-none dark:prose-invert break-words overflow-wrap-anywhere">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="w-full h-full text-sm font-mono leading-relaxed whitespace-pre-wrap break-all">
                {content}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}