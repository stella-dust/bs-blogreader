import React, { useState } from 'react'
import { Search, FileText, History, Settings, Key, Clock, Github } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PromptDialog } from '@/components/PromptDialog'
import { ContentPanel } from '@/components/ContentPanel'
import { ApiKeyDialog } from '@/components/ApiKeyDialog'
import { HistoryDropdown } from '@/components/HistoryDropdown'
import { RichContentViewer } from '@/components/RichContentViewer'
import './index.css'

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

interface ProcessedData {
  translation?: string
  interpretation?: string
}

interface HistoryItem {
  id: string
  title: string
  url: string
  timestamp: Date
  translation?: string
  interpretation?: string
  original?: string
}

interface LLMConfig {
  type: 'deepseek' | 'openai' | 'ollama' | 'lmstudio' | 'claude'
  apiKey: string
  baseURL?: string
  model?: string
}

function App() {
  const [url, setUrl] = useState('')
  const [llmConfig, setLlmConfig] = useState<LLMConfig>({
    type: 'deepseek',
    apiKey: '',
    baseURL: 'https://api.deepseek.com',
    model: 'deepseek-chat'
  })
  const [contentData, setContentData] = useState<ContentData | null>(null)
  const [processedData, setProcessedData] = useState<ProcessedData>({})
  const [isFetching, setIsFetching] = useState(false)
  const [isTranslating, setIsTranslating] = useState(false)
  const [isInterpreting, setIsInterpreting] = useState(false)
  const [inputMethod, setInputMethod] = useState<'url' | 'file'>('url')
  const [showApiDialog, setShowApiDialog] = useState(false)
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])

  // Prompt states
  const [translationPrompt, setTranslationPrompt] = useState(
    `你是一位专业的技术翻译专家。请将用户提供的英文技术博客完整准确地翻译成中文。

翻译要求：
1. 完整直译，保持原文的结构和格式
2. 保留所有代码块、链接、图片引用
3. 专业术语准确翻译，保持技术的准确性
4. 语言自然流畅，符合中文表达习惯
5. 保留原文的标题层级结构
6. 不要添加任何额外的解释或注释

请直接输出翻译内容，保持原文格式。`
  )

  const [interpretationPrompt, setInterpretationPrompt] = useState(
    `你是一位专业的AI技术博客解读专家。请根据用户提供的英文技术博客内容，生成一篇500字以内的中文解读。

解读要求：
1. 忠于原文，不添加个人观点或推测
2. 概括文章的核心技术要点和价值
3. 提出3-4个引导性问题，帮助读者思考
4. 指出文章的阅读重点和关键收获
5. 语言简洁明了，适合技术从业者阅读

请直接输出解读内容，不需要额外的格式或前缀。`
  )

  // Use Supabase for both local development and production
  const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL
    ? import.meta.env.VITE_SUPABASE_URL
    : 'http://localhost:54321'

  const API_ENDPOINTS = {
    fetchContent: '/functions/v1/fetch-content',
    process: '/functions/v1/process',
    testConfig: '/functions/v1/test-llm-config'
  }

  const handleFetchContent = async () => {
    if (!url.trim()) return

    setIsFetching(true)
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.fetchContent}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'}`,
        },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error('Fetch failed:', response.status, errorData)
        throw new Error(`Failed to fetch content: ${response.status} - ${errorData}`)
      }

      const data = await response.json()
      setContentData(data)
    } catch (error) {
      console.error('Failed to fetch content:', error)
    } finally {
      setIsFetching(false)
    }
  }

  const handleTranslate = async () => {
    const requiresApiKey = !['ollama', 'lmstudio'].includes(llmConfig.type)
    if (!contentData || (requiresApiKey && !llmConfig.apiKey)) return

    setIsTranslating(true)
    try {
      // 创建超时控制器 - 5分钟超时
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        controller.abort()
      }, 300000) // 300秒(5分钟)

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.process}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'}`,
        },
        body: JSON.stringify({
          content: contentData.content,
          prompt: translationPrompt,
          llm_config: llmConfig
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error('Translation failed')
      }

      const data = await response.json()
      setProcessedData(prev => ({
        ...prev,
        translation: data.result
      }))
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('Translation timeout - content may be too long')
      } else {
        console.error('Translation failed:', error)
      }
    } finally {
      setIsTranslating(false)
    }
  }

  const handleInterpret = async () => {
    const requiresApiKey = !['ollama', 'lmstudio'].includes(llmConfig.type)
    if (!contentData || (requiresApiKey && !llmConfig.apiKey)) return

    setIsInterpreting(true)
    try {
      // 创建超时控制器 - 5分钟超时
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        controller.abort()
      }, 300000) // 300秒(5分钟)

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.process}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'}`,
        },
        body: JSON.stringify({
          content: contentData.content,
          prompt: interpretationPrompt,
          llm_config: llmConfig
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error('Interpretation failed')
      }

      const data = await response.json()
      setProcessedData(prev => ({
        ...prev,
        interpretation: data.result
      }))
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('Interpretation timeout - content may be too long')
      } else {
        console.error('Interpretation failed:', error)
      }
    } finally {
      setIsInterpreting(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setContentData({
        title: file.name,
        url: '',
        content: content,
        author: ''
      })
    }
    reader.readAsText(file)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src="/logo.svg" alt="Logo" className="h-8 w-8 rounded-full" />
            <h1 className="text-xl font-semibold">BuilderStream | BlogReader</h1>
          </div>

          <div className="flex items-center space-x-2 relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistoryDropdown(!showHistoryDropdown)}
              className="relative"
            >
              <Clock className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowApiDialog(true)}
            >
              <Key className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              asChild
            >
              <a
                href="https://github.com/stella-dust/bs-blogreader"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="h-4 w-4" />
              </a>
            </Button>

            <HistoryDropdown
              isOpen={showHistoryDropdown}
              onClose={() => setShowHistoryDropdown(false)}
              history={history}
              onDownload={(item) => {
                const markdown = `# ${item.title}

**原文链接:** ${item.url}

---

## 原文内容

${item.original || ''}

---

## 中文翻译

${item.translation || ''}

---

## 核心解读

${item.interpretation || ''}

---

*Generated by BuilderStream AI BlogReader*
`
                const blob = new Blob([markdown], { type: 'text/markdown' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `${item.title.replace(/[^\w\s-]/g, '')}.md`
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)
                setShowHistoryDropdown(false)
              }}
            />
          </div>
        </div>
      </header>

      {/* Input Section */}
      <div className="px-6 py-8 border-b border-border">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Input
                placeholder="输入URL，例如：https://www.anthropic.com/engineering/writing-tools-for-agents （演示版本，请先配置您的AI API密钥）"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="text-base"
              />
            </div>

            <Button
              onClick={handleFetchContent}
              disabled={!url.trim() || isFetching}
            >
              {isFetching ? '爬取中...' : '开始爬取'}
            </Button>
            <span className="text-muted-foreground">/</span>
            <Button
              variant="outline"
              onClick={() => document.getElementById('fileInput')?.click()}
            >
              上传文件
            </Button>
            <input
              id="fileInput"
              type="file"
              accept=".md,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Main Content - Three Column Layout */}
      <div className="px-6 py-8">
        <div className="grid grid-cols-3 gap-8">
          {/* Column 1: Original Content Preview */}
          <div className="flex flex-col">
            <h3 className="font-semibold mb-4">原文预览：</h3>
            <div className="h-[600px] border border-border rounded-lg overflow-hidden">
              <RichContentViewer
                contentData={contentData}
                isLoading={isFetching}
              />
            </div>
          </div>

          {/* Column 2: Translation */}
          <div className="flex flex-col">
            <div className="mb-4">
              <h3 className="font-semibold">原文直译</h3>
            </div>

            <div className="h-[600px] border border-border rounded-lg flex flex-col">
              <Tabs defaultValue="preview" className="h-full flex flex-col">
                <div className="border-b border-border p-3 flex-shrink-0 flex items-center justify-between">
                  <TabsList>
                    <TabsTrigger value="markdown">源码模式</TabsTrigger>
                    <TabsTrigger value="preview">预览模式</TabsTrigger>
                  </TabsList>
                  <div className="flex space-x-2">
                    <PromptDialog
                      title="翻译提示词设置"
                      prompt={translationPrompt}
                      onSave={setTranslationPrompt}
                      trigger={
                        <Button variant="outline" size="sm">
                          提示设计
                        </Button>
                      }
                    />
                    <Button
                      size="sm"
                      onClick={handleTranslate}
                      disabled={!contentData || (!['ollama', 'lmstudio'].includes(llmConfig.type) && !llmConfig.apiKey) || isTranslating}
                    >
                      {isTranslating ? '翻译中...' : '开始翻译'}
                    </Button>
                  </div>
                </div>
                <TabsContent value="markdown" className="flex-1 min-h-0 p-0 m-0">
                  <ContentPanel
                    content={processedData.translation || ""}
                    isEmpty={!processedData.translation && !isTranslating}
                    isMarkdown={false}
                    showActions={!!processedData.translation}
                    isLoading={isTranslating}
                    loadingMessage="翻译中..."
                  />
                </TabsContent>
                <TabsContent value="preview" className="flex-1 min-h-0 p-0 m-0">
                  <ContentPanel
                    content={processedData.translation || ""}
                    isEmpty={!processedData.translation && !isTranslating}
                    isMarkdown={true}
                    showActions={!!processedData.translation}
                    isLoading={isTranslating}
                    loadingMessage="翻译中..."
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Column 3: Interpretation */}
          <div className="flex flex-col">
            <div className="mb-4">
              <h3 className="font-semibold">核心解读</h3>
            </div>

            <div className="h-[600px] border border-border rounded-lg flex flex-col">
              <Tabs defaultValue="preview" className="h-full flex flex-col">
                <div className="border-b border-border p-3 flex-shrink-0 flex items-center justify-between">
                  <TabsList>
                    <TabsTrigger value="markdown">源码模式</TabsTrigger>
                    <TabsTrigger value="preview">预览模式</TabsTrigger>
                  </TabsList>
                  <div className="flex space-x-2">
                    <PromptDialog
                      title="解读提示词设置"
                      prompt={interpretationPrompt}
                      onSave={setInterpretationPrompt}
                      trigger={
                        <Button variant="outline" size="sm">
                          提示设计
                        </Button>
                      }
                    />
                    <Button
                      size="sm"
                      onClick={handleInterpret}
                      disabled={!contentData || (!['ollama', 'lmstudio'].includes(llmConfig.type) && !llmConfig.apiKey) || isInterpreting}
                    >
                      {isInterpreting ? '解读中...' : '开始解读'}
                    </Button>
                  </div>
                </div>
                <TabsContent value="markdown" className="flex-1 min-h-0 p-0 m-0">
                  <ContentPanel
                    content={processedData.interpretation || ""}
                    isEmpty={!processedData.interpretation && !isInterpreting}
                    isMarkdown={false}
                    showActions={!!processedData.interpretation}
                    isLoading={isInterpreting}
                    loadingMessage="解读中..."
                  />
                </TabsContent>
                <TabsContent value="preview" className="flex-1 min-h-0 p-0 m-0">
                  <ContentPanel
                    content={processedData.interpretation || ""}
                    isEmpty={!processedData.interpretation && !isInterpreting}
                    isMarkdown={true}
                    showActions={!!processedData.interpretation}
                    isLoading={isInterpreting}
                    loadingMessage="解读中..."
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>

      <ApiKeyDialog
        llmConfig={llmConfig}
        onSave={setLlmConfig}
        open={showApiDialog}
        onOpenChange={setShowApiDialog}
      />
    </div>
  )
}

export default App