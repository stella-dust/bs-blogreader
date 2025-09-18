import React, { useState } from 'react'
import { ExternalLink, Calendar, User, Globe, FileText, Code } from 'lucide-react'
import DOMPurify from 'dompurify'

interface ContentData {
  title: string
  url: string
  content: string
  htmlContent?: string
  author?: string
  publishDate?: string
  description?: string
  images?: Array<{
    src: string
    alt: string
    title: string
  }>
  siteName?: string
}

interface RichContentViewerProps {
  contentData: ContentData | null
  isLoading: boolean
}

export const RichContentViewer: React.FC<RichContentViewerProps> = ({
  contentData,
  isLoading
}) => {
  const [viewMode, setViewMode] = useState<'rich' | 'text'>('rich')
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())

  const handleImageError = (src: string) => {
    setImageErrors(prev => new Set([...prev, src]))
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const sanitizedHtml = contentData?.htmlContent
    ? (() => {
        // Fix relative image URLs in HTML content
        let processedHtml = contentData.htmlContent
        if (contentData.url) {
          try {
            const baseUrl = new URL(contentData.url).origin
            processedHtml = processedHtml.replace(
              /<img([^>]*?)src=["'](?!https?:\/\/)([^"']+)["']/gi,
              (match, attrs, src) => {
                try {
                  const absoluteUrl = new URL(src, contentData.url).href
                  return `<img${attrs}src="${absoluteUrl}"`
                } catch {
                  return match // Keep original if URL construction fails
                }
              }
            )
          } catch {
            // If base URL is invalid, keep original HTML
          }
        }

        return DOMPurify.sanitize(processedHtml, {
          ALLOWED_TAGS: [
            'p', 'div', 'span', 'br', 'strong', 'b', 'em', 'i', 'u',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'ul', 'ol', 'li',
            'a', 'img',
            'blockquote', 'pre', 'code',
            'table', 'thead', 'tbody', 'tr', 'td', 'th'
          ],
          ALLOWED_ATTR: [
            'href', 'src', 'alt', 'title', 'target', 'rel',
            'class', 'id'
          ],
          ALLOW_DATA_ATTR: false
        })
      })()
    : ''

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mb-2"></div>
          <p className="text-base text-center">抓取中...</p>
        </div>
      </div>
    )
  }

  if (!contentData) {
    return (
      <div className="text-center py-12 text-gray-500 h-full flex flex-col justify-center">
        <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p className="text-base font-medium">No content available</p>
        <p className="text-sm mt-1">Please fetch some content using the input above</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* 简化的文章信息和视图切换 */}
      <div className="border-b border-gray-200 p-3 flex-shrink-0 bg-gray-50/30">
        <div className="flex items-center justify-between">
          {/* 文章标题 */}
          <div className="flex-1 min-w-0 mr-3">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {contentData.title}
            </h3>
          </div>

          {/* 视图切换图标 */}
          <button
            onClick={() => setViewMode(viewMode === 'rich' ? 'text' : 'rich')}
            className="p-1.5 rounded transition-colors text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            title={viewMode === 'rich' ? '切换到纯文本视图' : '切换到富文本视图'}
          >
            {viewMode === 'rich' ? (
              <Code className="h-3.5 w-3.5" />
            ) : (
              <FileText className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        {viewMode === 'rich' && sanitizedHtml ? (
          <div
            className="prose prose-sm max-w-none dark:prose-invert break-words prose-img:max-w-full prose-img:h-auto prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline"
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
            style={{
              // 自定义样式，确保图片正确显示
              '--tw-prose-body': 'rgb(55 65 81)',
              '--tw-prose-links': 'rgb(37 99 235)',
            } as React.CSSProperties}
            onError={(e) => {
              // Handle image loading errors
              const target = e.target as HTMLImageElement
              if (target.tagName === 'IMG' && !target.dataset.errorHandled) {
                target.dataset.errorHandled = 'true'
                target.style.display = 'none'

                // Create placeholder
                const placeholder = document.createElement('div')
                placeholder.className = 'bg-gray-100 border border-gray-200 rounded p-2 text-sm text-gray-500 text-center'
                placeholder.innerHTML = `<div>📷 图片加载失败</div><div class="text-xs mt-1">${target.alt || 'Image'}</div>`
                target.parentNode?.insertBefore(placeholder, target)
              }
            }}
          />
        ) : (
          <div className="whitespace-pre-wrap text-sm font-mono leading-relaxed break-all">
            {contentData.content}
          </div>
        )}
      </div>
    </div>
  )
}