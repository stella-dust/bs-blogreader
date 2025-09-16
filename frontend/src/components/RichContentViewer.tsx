import React, { useState } from 'react'
import { ExternalLink, Calendar, User, Globe } from 'lucide-react'
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
    ? DOMPurify.sanitize(contentData.htmlContent, {
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
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <p className="text-sm">暂无内容</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* 文章元信息头部 */}
      <div className="border-b border-border p-4 flex-shrink-0 bg-gray-50/50">
        <div className="space-y-2">
          <h2 className="font-semibold text-lg leading-tight line-clamp-2">
            {contentData.title}
          </h2>

          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            {contentData.siteName && (
              <div className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                <span>{contentData.siteName}</span>
              </div>
            )}

            {contentData.author && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{contentData.author}</span>
              </div>
            )}

            {contentData.publishDate && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(contentData.publishDate)}</span>
              </div>
            )}
          </div>

          {contentData.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {contentData.description}
            </p>
          )}

          <div className="flex items-center gap-2">
            <a
              href={contentData.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
            >
              <ExternalLink className="h-3 w-3" />
              查看原文
            </a>
          </div>
        </div>
      </div>

      {/* 视图切换 */}
      <div className="border-b border-border p-2 flex-shrink-0">
        <div className="flex gap-1">
          <button
            onClick={() => setViewMode('rich')}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              viewMode === 'rich'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            富文本
          </button>
          <button
            onClick={() => setViewMode('text')}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              viewMode === 'text'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            纯文本
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-auto p-4 min-h-0">
        {viewMode === 'rich' && sanitizedHtml ? (
          <div
            className="prose prose-sm max-w-none dark:prose-invert break-words prose-img:max-w-full prose-img:h-auto prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline"
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
            style={{
              // 自定义样式，确保图片正确显示
              '--tw-prose-body': 'rgb(55 65 81)',
              '--tw-prose-links': 'rgb(37 99 235)',
            } as React.CSSProperties}
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