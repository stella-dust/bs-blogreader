import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts"

interface SearchRequest {
  query: string
  blogContent?: string // 原文内容用于RAG融合
  settings: {
    searchDepth: 'basic' | 'deep'
    maxSearchResults: number
    language?: string
  }
  llm_config: {
    type: 'deepseek' | 'openai' | 'claude' | 'ollama' | 'lmstudio'
    apiKey: string
    baseURL?: string
    model?: string
  }
}

interface SearchResult {
  title: string
  url: string
  content: string
  snippet: string
  engine: string
}

interface WebContent {
  url: string
  title: string
  content: string
  success: boolean
  error?: string
  fetchTime: number
}

interface ComprehensiveSearchResponse {
  query: string
  searchResults: SearchResult[]
  webContents: WebContent[]
  ragResults?: Array<{ content: string, source: string }>
  finalAnswer: string
  summary: {
    totalSearchResults: number
    successfulFetches: number
    failedFetches: number
    totalTime: number
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Access-Control-Max-Age': '86400',
}

const SEARXNG_URL = Deno.env.get('SEARXNG_URL') || 'http://searxng:8080'

/**
 * 调用SearxNG进行搜索
 */
async function searchWithSearxNG(query: string, language = 'zh-CN', maxResults = 5): Promise<SearchResult[]> {
  try {
    const searchParams = new URLSearchParams({
      q: query,
      format: 'json',
      categories: 'general',
      lang: language,
      safesearch: '0'
    })

    const response = await fetch(`${SEARXNG_URL}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'BlogReader/1.0'
      },
      body: searchParams
    })

    if (!response.ok) {
      throw new Error(`SearxNG search failed: ${response.status}`)
    }

    const data = await response.json()
    const results = data.results || []

    return results.slice(0, maxResults).map((result: any) => ({
      title: result.title || '无标题',
      url: result.url || '',
      content: result.content || result.snippet || '',
      snippet: result.snippet || result.content || '',
      engine: result.engine || 'unknown'
    }))

  } catch (error) {
    console.error('SearxNG search error:', error)

    // 降级到DuckDuckGo直接搜索
    return await fallbackToDuckDuckGo(query, maxResults)
  }
}

/**
 * 降级搜索方案：直接使用DuckDuckGo
 */
async function fallbackToDuckDuckGo(query: string, maxResults: number): Promise<SearchResult[]> {
  try {
    // 使用DuckDuckGo的Instant Answer API
    const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`)

    if (!response.ok) {
      throw new Error(`DuckDuckGo search failed: ${response.status}`)
    }

    const data = await response.json()
    const results: SearchResult[] = []

    // 处理相关主题
    if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
      data.RelatedTopics.slice(0, maxResults).forEach((topic: any) => {
        if (topic.FirstURL && topic.Text) {
          results.push({
            title: topic.Text.split(' - ')[0] || '相关主题',
            url: topic.FirstURL,
            content: topic.Text,
            snippet: topic.Text,
            engine: 'duckduckgo'
          })
        }
      })
    }

    // 如果没有相关主题，创建一个基础结果
    if (results.length === 0 && data.AbstractText) {
      results.push({
        title: `关于"${query}"的信息`,
        url: data.AbstractURL || `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
        content: data.AbstractText,
        snippet: data.AbstractText.slice(0, 200) + '...',
        engine: 'duckduckgo'
      })
    }

    return results

  } catch (error) {
    console.error('DuckDuckGo fallback failed:', error)
    return []
  }
}

/**
 * 提取网页内容
 */
async function extractWebContent(url: string, timeout = 10000): Promise<WebContent> {
  const startTime = Date.now()

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BlogReader/1.0; +https://github.com/stella-dust/bs-blogreader)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()
    const doc = new DOMParser().parseFromString(html, 'text/html')

    if (!doc) {
      throw new Error('Failed to parse HTML')
    }

    // 提取标题
    const titleElement = doc.querySelector('title')
    const title = titleElement?.textContent?.trim() || '无标题'

    // 提取主要内容
    const contentSelectors = [
      'article', '[role="main"]', '.main-content', '.post-content',
      '.entry-content', '.content', 'main', '#content'
    ]

    let mainElement: Element | null = null
    for (const selector of contentSelectors) {
      mainElement = doc.querySelector(selector)
      if (mainElement) break
    }

    if (!mainElement) {
      mainElement = doc.querySelector('body')
    }

    // 清理内容
    if (mainElement) {
      const unwantedSelectors = [
        'script', 'style', 'nav', 'header', 'footer',
        '.sidebar', '.navigation', '.ads', '.advertisement'
      ]

      unwantedSelectors.forEach(selector => {
        const elements = mainElement!.querySelectorAll(selector)
        elements.forEach(el => el.remove())
      })
    }

    const content = mainElement?.textContent?.replace(/\s+/g, ' ').trim() || ''

    return {
      url,
      title,
      content: content.slice(0, 2000), // 限制内容长度
      success: true,
      fetchTime: Date.now() - startTime
    }

  } catch (error) {
    return {
      url,
      title: '抓取失败',
      content: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      fetchTime: Date.now() - startTime
    }
  }
}

/**
 * 调用LLM生成综合答案
 */
async function generateComprehensiveAnswer(
  query: string,
  blogContent: string | undefined,
  searchResults: SearchResult[],
  webContents: WebContent[],
  llmConfig: any
): Promise<string> {
  try {
    // 构建上下文
    let context = ''

    // 原文内容
    if (blogContent) {
      context += `**原文内容**：\n${blogContent.slice(0, 1500)}\n\n`
    }

    // 搜索结果
    if (searchResults.length > 0) {
      context += `**网络搜索结果**：\n`
      searchResults.forEach((result, index) => {
        context += `[搜索${index + 1}] ${result.title}\n${result.snippet}\n来源: ${result.url}\n\n`
      })
    }

    // 网页内容
    const successfulContents = webContents.filter(content => content.success)
    if (successfulContents.length > 0) {
      context += `**详细网页内容**：\n`
      successfulContents.forEach((content, index) => {
        context += `[网页${index + 1}] ${content.title}\n${content.content.slice(0, 800)}\n来源: ${content.url}\n\n`
      })
    }

    const prompt = `请基于以下信息回答问题：

${context}

问题：${query}

请提供详细、准确的回答，并在引用特定信息时标明来源。如果原文内容和网络信息有冲突，请说明。`

    // 调用process函数来处理LLM请求
    const processResponse = await fetch('https://oqicgfaczdmrdoglkqzi.supabase.co/functions/v1/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: context,
        prompt: '请基于提供的内容回答问题，保持客观和准确。',
        llm_config: llmConfig
      })
    })

    if (!processResponse.ok) {
      throw new Error(`LLM processing failed: ${processResponse.status}`)
    }

    const result = await processResponse.json()
    return result.result || '抱歉，无法生成回答。'

  } catch (error) {
    console.error('LLM generation error:', error)
    return `基于搜索结果，我找到了以下相关信息：\n\n${searchResults.map((result, index) =>
      `${index + 1}. ${result.title}\n${result.snippet}\n`
    ).join('\n')}\n\n请注意：由于技术原因，无法提供完整的AI分析，以上是搜索到的原始信息。`
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const startTime = Date.now()

  try {
    const { query, blogContent, settings, llm_config }: SearchRequest = await req.json()

    if (!query || !settings || !llm_config) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 1. 执行搜索
    const maxResults = settings.searchDepth === 'deep' ? settings.maxSearchResults : Math.min(settings.maxSearchResults, 3)
    const searchResults = await searchWithSearxNG(query, settings.language, maxResults)

    // 2. 提取搜索结果中的网页内容
    const urlsToFetch = searchResults.map(result => result.url).slice(0, 3) // 最多抓取3个
    const webContentPromises = urlsToFetch.map(url => extractWebContent(url, 8000))
    const webContents = await Promise.all(webContentPromises)

    // 3. 生成综合答案
    const finalAnswer = await generateComprehensiveAnswer(
      query,
      blogContent,
      searchResults,
      webContents,
      llm_config
    )

    const totalTime = Date.now() - startTime
    const successfulFetches = webContents.filter(content => content.success).length
    const failedFetches = webContents.length - successfulFetches

    const response: ComprehensiveSearchResponse = {
      query,
      searchResults,
      webContents,
      finalAnswer,
      summary: {
        totalSearchResults: searchResults.length,
        successfulFetches,
        failedFetches,
        totalTime
      }
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Comprehensive search error:', error)
    return new Response(JSON.stringify({
      error: 'Search failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})