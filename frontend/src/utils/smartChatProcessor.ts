import type {
  InputAnalysis,
  ProcessMode,
  ChatSettings,
  EnhancedChatMessage,
  LLMConfig
} from '@/stores/types'
import { inputAnalyzer } from './inputAnalyzer'

// 处理结果接口
export interface ProcessResult {
  success: boolean
  message?: EnhancedChatMessage
  error?: string
  mode: ProcessMode['type']
}

// 网页内容接口
export interface WebContent {
  url: string
  title: string
  content: string
  excerpt?: string
  error?: string
  success?: boolean
}

// 搜索结果接口
export interface SearchResult {
  query: string
  results: Array<{
    title: string
    url: string
    snippet: string
  }>
  webContents?: WebContent[]
}

/**
 * 智能聊天处理器
 * 根据输入分析结果，选择合适的处理模式
 */
export class SmartChatProcessor {
  private apiBaseUrl: string
  private llmConfig: LLMConfig

  constructor(apiBaseUrl: string, llmConfig: LLMConfig) {
    this.apiBaseUrl = apiBaseUrl
    this.llmConfig = llmConfig
  }

  /**
   * 统一处理入口
   */
  async process(
    input: string,
    blogId: string,
    settings: ChatSettings,
    blogContent?: string
  ): Promise<ProcessResult> {
    try {
      // 1. 分析输入
      const analysis = inputAnalyzer.analyze(input, settings)

      // 2. 根据模式选择处理方法
      switch (analysis.mode.type) {
        case 'url_fetch':
          return await this.handleUrlFetch(analysis, blogContent)

        case 'web_search':
          return await this.handleWebSearch(analysis, blogId, blogContent)

        case 'rag_only':
          return await this.handleRAGOnly(analysis, blogId, blogContent)

        default:
          throw new Error(`Unknown processing mode: ${analysis.mode.type}`)
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        mode: 'rag_only'
      }
    }
  }

  /**
   * 模式A: URL直接抓取
   * 直接抓取用户提供的URL内容并基于此回答
   */
  private async handleUrlFetch(
    analysis: InputAnalysis,
    blogContent?: string
  ): Promise<ProcessResult> {
    try {
      console.log('🔗 开始URL抓取模式', analysis.urls)

      // 1. 并行抓取所有URL
      const batchResponse = await fetch(`${this.apiBaseUrl}/functions/v1/batch-fetch-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'fallback-key'}`
        },
        body: JSON.stringify({
          urls: analysis.urls,
          timeout: 15000, // 15秒超时
          maxConcurrent: 3 // 最多并发3个
        })
      })

      if (!batchResponse.ok) {
        throw new Error(`批量抓取失败: ${batchResponse.status}`)
      }

      const batchResult = await batchResponse.json()
      const webContents: WebContent[] = batchResult.results

      // 2. 筛选成功的抓取结果
      const successfulContents = webContents.filter(content => content.success)
      const failedContents = webContents.filter(content => !content.success)

      if (successfulContents.length === 0) {
        throw new Error('所有URL抓取都失败了')
      }

      // 3. 构建基于抓取内容的prompt
      const fetchedContentContext = successfulContents.map((content, index) =>
        `[网页${index + 1}] ${content.title} (${content.url})\n${content.content}`
      ).join('\n\n')

      // 如果有原文内容，也包含进来
      const fullContext = blogContent
        ? `原文内容：\n${blogContent}\n\n网页内容：\n${fetchedContentContext}`
        : fetchedContentContext

      const prompt = `请基于以下内容回答问题：

${fullContext}

问题：${analysis.cleanQuestion}

请提供详细的回答，并在引用特定内容时标明来源。`

      // 4. 调用LLM生成回答
      const llmResponse = await this.callLLMForUrlContent(prompt)

      // 5. 构建响应消息
      const sources = [
        ...successfulContents.map((content, index) => ({
          type: 'url' as const,
          title: content.title,
          url: content.url,
          content: content.content.slice(0, 200) + '...'
        })),
        ...(blogContent ? [{
          type: 'original' as const,
          title: '原文内容',
          content: blogContent.slice(0, 200) + '...'
        }] : [])
      ]

      // 构建回答总结
      let responseContent = llmResponse

      // 添加抓取总结
      const summary = `\n\n---\n📊 **抓取总结**\n• 成功: ${successfulContents.length}个网页\n• 失败: ${failedContents.length}个网页\n• 总耗时: ${batchResult.summary.totalTime}ms`

      if (failedContents.length > 0) {
        const failedUrls = failedContents.map(content => `• ${content.url}: ${content.error}`).join('\n')
        responseContent += `${summary}\n\n❌ **抓取失败的链接**：\n${failedUrls}`
      } else {
        responseContent += summary
      }

      const message: EnhancedChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: responseContent,
        timestamp: new Date(),
        mode: 'url_fetch',
        sources
      }

      return {
        success: true,
        message,
        mode: 'url_fetch'
      }

    } catch (error) {
      console.error('URL抓取模式错误:', error)

      // 返回错误信息给用户
      const errorMessage: EnhancedChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: `🔗 URL抓取遇到问题：${error instanceof Error ? error.message : 'Unknown error'}\n\n检测到的链接：\n${analysis.urls.map(url => `• ${url}`).join('\n')}\n\n您可以尝试：\n1. 检查链接是否有效\n2. 稍后重试\n3. 直接粘贴文章内容进行讨论`,
        timestamp: new Date(),
        mode: 'url_fetch',
        sources: analysis.urls.map(url => ({
          type: 'url' as const,
          title: url,
          url,
          content: '抓取失败'
        }))
      }

      return {
        success: false,
        message: errorMessage,
        error: `URL抓取失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
        mode: 'url_fetch'
      }
    }
  }

  /**
   * 模式B: Web搜索增强
   * 结合原文RAG和网络搜索结果回答
   */
  private async handleWebSearch(
    analysis: InputAnalysis,
    blogId: string,
    blogContent?: string
  ): Promise<ProcessResult> {
    try {
      console.log('🔍 开始Web搜索模式', analysis.cleanQuestion)

      // 优化搜索查询
      const searchQuery = inputAnalyzer.generateSearchQuery(
        analysis.cleanQuestion,
        blogContent
      )

      // 调用综合搜索API
      const searchResponse = await fetch(`${this.apiBaseUrl}/functions/v1/comprehensive-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'fallback-key'}`
        },
        body: JSON.stringify({
          query: searchQuery,
          blogContent: blogContent,
          settings: {
            searchDepth: 'basic', // TODO: 从用户设置获取
            maxSearchResults: 5,   // TODO: 从用户设置获取
            language: 'zh-CN'
          },
          llm_config: this.llmConfig
        })
      })

      if (!searchResponse.ok) {
        throw new Error(`搜索API调用失败: ${searchResponse.status}`)
      }

      const searchResult = await searchResponse.json()

      // 构建回答内容
      let responseContent = searchResult.finalAnswer || '抱歉，无法获取搜索结果。'

      // 添加搜索摘要
      const summary = `\n\n---\n🔍 **搜索摘要**\n• 搜索查询: ${searchQuery}\n• 找到结果: ${searchResult.summary.totalSearchResults}个\n• 成功抓取: ${searchResult.summary.successfulFetches}/${searchResult.webContents?.length || 0}个网页\n• 总耗时: ${searchResult.summary.totalTime}ms`

      if (searchResult.summary.failedFetches > 0) {
        const failedUrls = searchResult.webContents
          ?.filter((content: any) => !content.success)
          .map((content: any) => `• ${content.url}: ${content.error}`)
          .join('\n') || ''

        responseContent += `${summary}\n\n⚠️ **部分网页抓取失败**：\n${failedUrls}`
      } else {
        responseContent += summary
      }

      // 构建来源信息
      const sources = [
        // 原文来源
        ...(blogContent ? [{
          type: 'original' as const,
          title: '原文内容',
          content: blogContent.slice(0, 200) + '...'
        }] : []),

        // 搜索结果来源
        ...(searchResult.searchResults || []).map((result: any, index: number) => ({
          type: 'web' as const,
          title: result.title,
          url: result.url,
          content: result.snippet || result.content || ''
        })),

        // 详细网页内容来源
        ...(searchResult.webContents || [])
          .filter((content: any) => content.success)
          .map((content: any, index: number) => ({
            type: 'web' as const,
            title: content.title,
            url: content.url,
            content: content.content.slice(0, 200) + '...'
          }))
      ]

      const message: EnhancedChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: responseContent,
        timestamp: new Date(),
        mode: 'web_search',
        sources: sources.slice(0, 10) // 限制来源数量
      }

      return {
        success: true,
        message,
        mode: 'web_search'
      }

    } catch (error) {
      console.error('Web搜索模式错误:', error)

      // 返回错误信息给用户
      const errorMessage: EnhancedChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: `🔍 Web搜索遇到问题：${error instanceof Error ? error.message : 'Unknown error'}\n\n搜索查询：${analysis.cleanQuestion}\n\n可能的原因：\n1. 搜索服务暂时不可用\n2. 网络连接问题\n3. 搜索关键词过于复杂\n\n建议：\n• 简化搜索关键词\n• 稍后重试\n• 尝试关闭搜索功能使用纯RAG模式`,
        timestamp: new Date(),
        mode: 'web_search',
        sources: [
          {
            type: 'original' as const,
            title: '原文内容',
            content: blogContent?.slice(0, 200) + '...' || '无原文内容'
          }
        ]
      }

      return {
        success: false,
        message: errorMessage,
        error: `Web搜索失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
        mode: 'web_search'
      }
    }
  }

  /**
   * 模式C: 纯RAG模式
   * 仅基于原文内容回答
   */
  private async handleRAGOnly(
    analysis: InputAnalysis,
    blogId: string,
    blogContent?: string
  ): Promise<ProcessResult> {
    try {
      console.log('📚 开始纯RAG模式', analysis.cleanQuestion)

      // TODO: Day 4 实现流式输出
      // 1. 基于原文进行向量检索
      // 2. 构建prompt
      // 3. 调用LLM生成回答
      // 4. 提供引用信息

      // 暂时使用现有的聊天API
      const response = await this.callCurrentChatAPI(analysis.cleanQuestion, blogId, blogContent)

      const message: EnhancedChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        mode: 'rag_only',
        sources: response.sources
      }

      return {
        success: true,
        message,
        mode: 'rag_only'
      }
    } catch (error) {
      return {
        success: false,
        error: `RAG处理失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
        mode: 'rag_only'
      }
    }
  }

  /**
   * 调用LLM处理URL内容
   */
  private async callLLMForUrlContent(prompt: string): Promise<string> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/functions/v1/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'fallback-key'}`
        },
        body: JSON.stringify({
          content: prompt,
          prompt: '请基于提供的内容回答问题，保持客观和准确。如果引用特定内容，请标明来源。',
          llm_config: this.llmConfig
        })
      })

      if (!response.ok) {
        throw new Error(`LLM API调用失败: ${response.status}`)
      }

      const result = await response.json()
      return result.result || '抱歉，我无法处理这个请求。'

    } catch (error) {
      console.error('LLM调用错误:', error)
      throw new Error(`LLM处理失败: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 调用现有的聊天API（临时方案）
   */
  private async callCurrentChatAPI(question: string, blogId: string, blogContent?: string) {
    // 这里暂时调用现有的聊天接口
    // 后续会被新的RAG系统替换
    const response = await fetch(`${this.apiBaseUrl}/functions/v1/chat-with-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'fallback-key'}`
      },
      body: JSON.stringify({
        message: question,
        context: blogContent || 'No blog content available',
        messages: [], // TODO: 传入对话历史
        llm_config: this.llmConfig
      })
    })

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`)
    }

    const result = await response.json()

    return {
      content: result.response || '抱歉，我无法回答这个问题。',
      sources: [
        {
          type: 'original' as const,
          title: '原文内容',
          content: '基于博客原文'
        }
      ]
    }
  }

  /**
   * 更新LLM配置
   */
  updateLLMConfig(config: LLMConfig) {
    this.llmConfig = config
  }

  /**
   * 获取处理模式的描述
   */
  static getModeDescription(mode: ProcessMode['type']): string {
    return inputAnalyzer.getModeDescription({ type: mode, priority: 'medium' })
  }

  /**
   * 预测处理模式（不执行实际处理）
   */
  static predictMode(input: string, settings: ChatSettings): InputAnalysis {
    return inputAnalyzer.analyze(input, settings)
  }
}

// 工厂函数
export function createSmartChatProcessor(apiBaseUrl: string, llmConfig: LLMConfig) {
  return new SmartChatProcessor(apiBaseUrl, llmConfig)
}