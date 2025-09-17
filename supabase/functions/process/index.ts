import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

interface LLMConfig {
  type: 'deepseek' | 'openai' | 'claude' | 'ollama' | 'lmstudio'
  apiKey: string
  baseURL?: string
  model?: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Access-Control-Max-Age': '86400',
}

async function callDeepSeek(content: string, prompt: string, apiKey: string, model: string = 'deepseek-chat') {
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'user', content: `${prompt}\n\n以下是需要处理的内容：\n${content}` }
      ],
      temperature: 0.3
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`DeepSeek API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}

async function callOpenAI(content: string, prompt: string, apiKey: string, baseURL: string = 'https://api.openai.com/v1', model: string = 'gpt-3.5-turbo') {
  const response = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'user', content: `${prompt}\n\n以下是需要处理的内容：\n${content}` }
      ],
      temperature: 0.3
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}

async function callClaude(content: string, prompt: string, apiKey: string, model: string = 'claude-3-sonnet-20240229') {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 4000,
      messages: [
        { role: 'user', content: `${prompt}\n\n以下是需要处理的内容：\n${content}` }
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

async function callLocalLLM(content: string, prompt: string, baseURL: string, model?: string) {
  const endpoint = baseURL.includes('11434') ? '/api/generate' : '/v1/chat/completions'

  let requestBody: any
  if (endpoint === '/api/generate') {
    // Ollama format
    requestBody = {
      model: model || 'llama2',
      prompt: `${prompt}\n\n以下是需要处理的内容：\n${content}`,
      stream: false
    }
  } else {
    // LM Studio format (OpenAI compatible)
    requestBody = {
      model: model || 'local-model',
      messages: [
        { role: 'user', content: `${prompt}\n\n以下是需要处理的内容：\n${content}` }
      ],
      temperature: 0.3
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
    throw new Error(`Local LLM API error: ${response.status} - ${error}`)
  }

  const data = await response.json()

  if (endpoint === '/api/generate') {
    return data.response
  } else {
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
    const { content, prompt, llm_config }: {
      content: string
      prompt: string
      llm_config: LLMConfig
    } = await req.json()

    if (!content || !prompt || !llm_config) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    let result: string

    switch (llm_config.type) {
      case 'deepseek':
        if (!llm_config.apiKey) {
          throw new Error('API Key is required for DeepSeek')
        }
        result = await callDeepSeek(content, prompt, llm_config.apiKey, llm_config.model)
        break

      case 'openai':
        if (!llm_config.apiKey) {
          throw new Error('API Key is required for OpenAI')
        }
        result = await callOpenAI(content, prompt, llm_config.apiKey, llm_config.baseURL, llm_config.model)
        break

      case 'claude':
        if (!llm_config.apiKey) {
          throw new Error('API Key is required for Claude')
        }
        result = await callClaude(content, prompt, llm_config.apiKey, llm_config.model)
        break

      case 'ollama':
      case 'lmstudio':
        if (!llm_config.baseURL) {
          throw new Error('Base URL is required for local LLM')
        }
        result = await callLocalLLM(content, prompt, llm_config.baseURL, llm_config.model)
        break

      default:
        throw new Error(`Unsupported LLM type: ${llm_config.type}`)
    }

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error processing content:', error)
    return new Response(JSON.stringify({
      error: 'Failed to process content',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})