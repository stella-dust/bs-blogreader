import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts"

interface WebContent {
  url: string
  title: string
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
  success: boolean
  error?: string
  fetchTime?: number
}

interface BatchFetchRequest {
  urls: string[]
  timeout?: number // 每个URL的超时时间（毫秒）
  maxConcurrent?: number // 最大并发数
}

interface BatchFetchResponse {
  results: WebContent[]
  summary: {
    total: number
    successful: number
    failed: number
    totalTime: number
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Access-Control-Max-Age': '86400',
}

function extractMetadata(doc: Document, baseUrl: string): Partial<WebContent> {
  const metadata: Partial<WebContent> = {}

  // Extract title (prioritize og:title)
  const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content')
  const title = ogTitle || doc.querySelector('title')?.textContent || ''
  metadata.title = title.trim()

  // Extract author
  const authorMeta = doc.querySelector('meta[name="author"]')?.getAttribute('content') ||
                    doc.querySelector('meta[property="article:author"]')?.getAttribute('content') ||
                    doc.querySelector('[rel="author"]')?.textContent
  if (authorMeta) metadata.author = authorMeta.trim()

  // Extract publish date
  const publishDate = doc.querySelector('meta[property="article:published_time"]')?.getAttribute('content') ||
                     doc.querySelector('meta[name="date"]')?.getAttribute('content') ||
                     doc.querySelector('time[datetime]')?.getAttribute('datetime')
  if (publishDate) metadata.publishDate = publishDate

  // Extract description
  const description = doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
                     doc.querySelector('meta[property="og:description"]')?.getAttribute('content')
  if (description) metadata.description = description.trim()

  // Extract site name
  const siteName = doc.querySelector('meta[property="og:site_name"]')?.getAttribute('content')
  if (siteName) metadata.siteName = siteName.trim()

  // Extract images (limit to first 5 for performance)
  const images: Array<{src: string, alt: string, title: string}> = []
  const imgElements = doc.querySelectorAll('img')
  let imageCount = 0
  imgElements.forEach((img) => {
    if (imageCount >= 5) return // Limit images for batch processing

    const src = img.getAttribute('src')
    if (src && !src.startsWith('data:')) {
      try {
        const imageSrc = src.startsWith('http') ? src : new URL(src, baseUrl).href
        images.push({
          src: imageSrc,
          alt: img.getAttribute('alt') || '',
          title: img.getAttribute('title') || ''
        })
        imageCount++
      } catch (error) {
        // Skip invalid image URLs
        console.warn('Invalid image URL:', src)
      }
    }
  })
  if (images.length > 0) metadata.images = images

  return metadata
}

function extractMainContent(doc: Document): { content: string, htmlContent: string } {
  const contentSelectors = [
    'article',
    '[role="main"]',
    '.main-content',
    '.post-content',
    '.entry-content',
    '.content',
    'main',
    '#content',
    '.post-body',
    '.article-body'
  ]

  let mainElement: Element | null = null

  for (const selector of contentSelectors) {
    mainElement = doc.querySelector(selector)
    if (mainElement) break
  }

  if (!mainElement) {
    mainElement = doc.querySelector('body')
  }

  if (!mainElement) {
    return { content: '', htmlContent: '' }
  }

  // Remove unwanted elements
  const unwantedSelectors = [
    'script', 'style', 'nav', 'header', 'footer',
    '.sidebar', '.navigation', '.menu', '.ads',
    '.advertisement', '.social-share', '.comments',
    '.related-posts', '.share-buttons'
  ]

  unwantedSelectors.forEach(selector => {
    const elements = mainElement!.querySelectorAll(selector)
    elements.forEach(el => el.remove())
  })

  const htmlContent = mainElement.innerHTML
  const textContent = mainElement.textContent || ''

  // Clean up text content
  const cleanContent = textContent
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim()

  return {
    content: cleanContent,
    htmlContent: htmlContent.trim()
  }
}

async function fetchSingleUrl(url: string, timeout: number = 10000): Promise<WebContent> {
  const startTime = Date.now()

  try {
    // Create abort controller for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    // Fetch the webpage with timeout
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BlogReader/1.0; +https://github.com/stella-dust/bs-blogreader)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const html = await response.text()
    const doc = new DOMParser().parseFromString(html, 'text/html')

    if (!doc) {
      throw new Error('Failed to parse HTML')
    }

    // Extract metadata and content
    const metadata = extractMetadata(doc, url)
    const { content, htmlContent } = extractMainContent(doc)

    const fetchTime = Date.now() - startTime

    return {
      url,
      title: metadata.title || 'Untitled',
      content,
      htmlContent,
      author: metadata.author,
      publishDate: metadata.publishDate,
      description: metadata.description,
      images: metadata.images,
      siteName: metadata.siteName,
      success: true,
      fetchTime
    }

  } catch (error) {
    const fetchTime = Date.now() - startTime

    let errorMessage = 'Unknown error'
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = `Timeout after ${timeout}ms`
      } else {
        errorMessage = error.message
      }
    }

    return {
      url,
      title: 'Failed to fetch',
      content: '',
      success: false,
      error: errorMessage,
      fetchTime
    }
  }
}

async function batchFetchUrls(
  urls: string[],
  timeout: number = 10000,
  maxConcurrent: number = 3
): Promise<WebContent[]> {
  const results: WebContent[] = []

  // Process URLs in batches to control concurrency
  for (let i = 0; i < urls.length; i += maxConcurrent) {
    const batch = urls.slice(i, i + maxConcurrent)
    const batchPromises = batch.map(url => fetchSingleUrl(url, timeout))

    try {
      const batchResults = await Promise.allSettled(batchPromises)

      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value)
        } else {
          // Handle rejected promises
          results.push({
            url: batch[index],
            title: 'Failed to fetch',
            content: '',
            success: false,
            error: result.reason?.message || 'Promise rejected',
            fetchTime: 0
          })
        }
      })
    } catch (error) {
      // Handle batch-level errors
      console.error('Batch processing error:', error)
      batch.forEach(url => {
        results.push({
          url,
          title: 'Failed to fetch',
          content: '',
          success: false,
          error: 'Batch processing failed',
          fetchTime: 0
        })
      })
    }
  }

  return results
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
    const { urls, timeout = 10000, maxConcurrent = 3 }: BatchFetchRequest = await req.json()

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return new Response(JSON.stringify({ error: 'URLs array is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Validate URLs
    const validUrls = urls.filter(url => {
      try {
        new URL(url)
        return true
      } catch {
        return false
      }
    })

    if (validUrls.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid URLs provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Limit URLs to prevent abuse
    const limitedUrls = validUrls.slice(0, 5) // Maximum 5 URLs

    // Process URLs
    const results = await batchFetchUrls(limitedUrls, timeout, maxConcurrent)

    const totalTime = Date.now() - startTime
    const successful = results.filter(r => r.success).length
    const failed = results.length - successful

    const response: BatchFetchResponse = {
      results,
      summary: {
        total: results.length,
        successful,
        failed,
        totalTime
      }
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in batch fetch:', error)
    return new Response(JSON.stringify({
      error: 'Failed to fetch content',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})