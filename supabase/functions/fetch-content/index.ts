import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts"

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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function extractMetadata(doc: Document): Partial<ContentData> {
  const metadata: Partial<ContentData> = {}

  // Extract title
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

  // Extract images
  const images: Array<{src: string, alt: string, title: string}> = []
  const imgElements = doc.querySelectorAll('img')
  imgElements.forEach((img) => {
    const src = img.getAttribute('src')
    if (src && !src.startsWith('data:')) {
      try {
        const imageSrc = src.startsWith('http') ? src : new URL(src, metadata.url || '').href
        images.push({
          src: imageSrc,
          alt: img.getAttribute('alt') || '',
          title: img.getAttribute('title') || ''
        })
      } catch (error) {
        // Skip invalid image URLs
        console.warn('Invalid image URL:', src)
      }
    }
  })
  if (images.length > 0) metadata.images = images.slice(0, 10) // Limit to 10 images

  return metadata
}

function extractMainContent(doc: Document): { content: string, htmlContent: string } {
  // Try to find main content selectors
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
    // Fallback to body
    mainElement = doc.querySelector('body')
  }

  if (!mainElement) {
    return { content: '', htmlContent: '' }
  }

  // Remove unwanted elements
  const unwantedSelectors = [
    'script', 'style', 'nav', 'header', 'footer',
    '.sidebar', '.navigation', '.menu', '.ads',
    '.advertisement', '.social-share', '.comments'
  ]

  unwantedSelectors.forEach(selector => {
    const elements = mainElement!.querySelectorAll(selector)
    elements.forEach(el => el.remove())
  })

  const htmlContent = mainElement.innerHTML
  const textContent = mainElement.textContent || ''

  return {
    content: textContent.replace(/\s+/g, ' ').trim(),
    htmlContent: htmlContent.trim()
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

  try {
    const { url }: { url: string } = await req.json()

    if (!url) {
      return new Response(JSON.stringify({ error: 'URL is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Fetch the webpage
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BlogReader/1.0; +https://github.com/stella-dust/bs-blogreader)'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`)
    }

    const html = await response.text()
    const doc = new DOMParser().parseFromString(html, 'text/html')

    if (!doc) {
      throw new Error('Failed to parse HTML')
    }

    // Extract metadata
    const metadata = extractMetadata(doc)

    // Extract main content
    const { content, htmlContent } = extractMainContent(doc)

    const result: ContentData = {
      title: metadata.title || 'Untitled',
      url: url,
      content: content,
      htmlContent: htmlContent,
      author: metadata.author,
      publishDate: metadata.publishDate,
      description: metadata.description,
      images: metadata.images,
      siteName: metadata.siteName
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error fetching content:', error)
    return new Response(JSON.stringify({
      error: 'Failed to fetch content',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})