import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ChatRequest {
  message: string
  context: string // The blog content to chat about
  messages: ChatMessage[] // Previous conversation history
  llm_config: {
    type: 'deepseek' | 'openai' | 'claude' | 'ollama' | 'lmstudio'
    apiKey: string
    baseURL?: string
    model?: string
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Access-Control-Max-Age': '86400',
}

async function chatWithDeepSeek(
  message: string,
  context: string,
  messages: ChatMessage[],
  apiKey: string,
  model: string = 'deepseek-chat'
) {
  const systemPrompt = `You are an AI assistant helping users understand and analyze blog content. Here is the content you should help with:

===BLOG CONTENT START===
${context}
===BLOG CONTENT END===

Please help users understand, analyze, and discuss this content. Answer questions about it, explain concepts, provide insights, and engage in meaningful discussion. Always stay focused on the provided content and be helpful and informative.`

  const conversationMessages = [
    { role: 'system' as const, content: systemPrompt },
    ...messages,
    { role: 'user' as const, content: message }
  ]

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: conversationMessages,
      max_tokens: 2000,
      temperature: 0.7,
      stream: false
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`DeepSeek API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}

async function chatWithOpenAI(
  message: string,
  context: string,
  messages: ChatMessage[],
  apiKey: string,
  baseURL: string = 'https://api.openai.com/v1',
  model: string = 'gpt-3.5-turbo'
) {
  const systemPrompt = `You are an AI assistant helping users understand and analyze blog content. Here is the content you should help with:

===BLOG CONTENT START===
${context}
===BLOG CONTENT END===

Please help users understand, analyze, and discuss this content. Answer questions about it, explain concepts, provide insights, and engage in meaningful discussion. Always stay focused on the provided content and be helpful and informative.`

  const conversationMessages = [
    { role: 'system' as const, content: systemPrompt },
    ...messages,
    { role: 'user' as const, content: message }
  ]

  const response = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: conversationMessages,
      max_tokens: 2000,
      temperature: 0.7,
      stream: false
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}

async function chatWithClaude(
  message: string,
  context: string,
  messages: ChatMessage[],
  apiKey: string,
  model: string = 'claude-3-haiku-20240307'
) {
  const systemPrompt = `You are an AI assistant helping users understand and analyze blog content. Here is the content you should help with:

===BLOG CONTENT START===
${context}
===BLOG CONTENT END===

Please help users understand, analyze, and discuss this content. Answer questions about it, explain concepts, provide insights, and engage in meaningful discussion. Always stay focused on the provided content and be helpful and informative.`

  // Convert conversation to Claude format
  let conversationText = ""
  for (const msg of messages) {
    if (msg.role === 'user') {
      conversationText += `\n\nHuman: ${msg.content}`
    } else {
      conversationText += `\n\nAssistant: ${msg.content}`
    }
  }
  conversationText += `\n\nHuman: ${message}\n\nAssistant:`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 2000,
      system: systemPrompt,
      messages: [
        ...messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        { role: 'user', content: message }
      ]
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Claude API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  return data.content[0].text
}

async function chatWithLocalLLM(
  message: string,
  context: string,
  messages: ChatMessage[],
  baseURL: string,
  model?: string
) {
  const systemPrompt = `You are an AI assistant helping users understand and analyze blog content. Here is the content you should help with:

===BLOG CONTENT START===
${context}
===BLOG CONTENT END===

Please help users understand, analyze, and discuss this content. Answer questions about it, explain concepts, provide insights, and engage in meaningful discussion. Always stay focused on the provided content and be helpful and informative.`

  const endpoint = baseURL.includes('11434') ? '/api/chat' : '/v1/chat/completions'

  let requestBody: any

  if (endpoint === '/api/chat') {
    // Ollama format
    const conversationMessages = [
      { role: 'system', content: systemPrompt },
      ...messages,
      { role: 'user', content: message }
    ]

    requestBody = {
      model: model || 'llama3.1:8b',
      messages: conversationMessages,
      stream: false,
      options: {
        temperature: 0.7,
        num_predict: 2000
      }
    }
  } else {
    // LM Studio format
    const conversationMessages = [
      { role: 'system', content: systemPrompt },
      ...messages,
      { role: 'user', content: message }
    ]

    requestBody = {
      model: model || 'local-model',
      messages: conversationMessages,
      max_tokens: 2000,
      temperature: 0.7,
      stream: false
    }
  }

  const response = await fetch(`${baseURL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Local LLM error: ${response.status} - ${error}`)
  }

  const data = await response.json()

  if (endpoint === '/api/chat') {
    // Ollama response format
    return data.message.content
  } else {
    // LM Studio response format
    return data.choices[0].message.content
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
    const { message, context, messages = [], llm_config }: ChatRequest = await req.json()

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!context) {
      return new Response(JSON.stringify({ error: 'Context is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!llm_config) {
      return new Response(JSON.stringify({ error: 'LLM config is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    let responseContent: string

    switch (llm_config.type) {
      case 'deepseek':
        if (!llm_config.apiKey) {
          return new Response(JSON.stringify({ error: 'DeepSeek API key is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        responseContent = await chatWithDeepSeek(
          message,
          context,
          messages,
          llm_config.apiKey,
          llm_config.model
        )
        break

      case 'openai':
        if (!llm_config.apiKey) {
          return new Response(JSON.stringify({ error: 'OpenAI API key is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        responseContent = await chatWithOpenAI(
          message,
          context,
          messages,
          llm_config.apiKey,
          llm_config.baseURL,
          llm_config.model
        )
        break

      case 'claude':
        if (!llm_config.apiKey) {
          return new Response(JSON.stringify({ error: 'Claude API key is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        responseContent = await chatWithClaude(
          message,
          context,
          messages,
          llm_config.apiKey,
          llm_config.model
        )
        break

      case 'ollama':
      case 'lmstudio':
        if (!llm_config.baseURL) {
          return new Response(JSON.stringify({ error: 'Base URL is required for local LLM' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        responseContent = await chatWithLocalLLM(
          message,
          context,
          messages,
          llm_config.baseURL,
          llm_config.model
        )
        break

      default:
        return new Response(JSON.stringify({ error: `Unsupported LLM type: ${llm_config.type}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }

    return new Response(JSON.stringify({
      response: responseContent,
      success: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Chat error:', error)
    return new Response(JSON.stringify({
      error: 'Chat failed',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})