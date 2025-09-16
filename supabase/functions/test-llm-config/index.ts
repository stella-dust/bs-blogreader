import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

interface LLMConfig {
  type: 'deepseek' | 'openai' | 'claude' | 'ollama' | 'lmstudio'
  apiKey: string
  baseURL?: string
  model?: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

async function testDeepSeek(apiKey: string, model: string = 'deepseek-chat') {
  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10
      })
    })

    if (!response.ok) {
      const error = await response.text()
      return { valid: false, message: `DeepSeek API 错误: ${response.status} - ${error}` }
    }

    return { valid: true, message: 'DeepSeek API 连接成功' }
  } catch (error) {
    return { valid: false, message: `DeepSeek 连接失败: ${error.message}` }
  }
}

async function testOpenAI(apiKey: string, baseURL: string = 'https://api.openai.com/v1', model: string = 'gpt-3.5-turbo') {
  try {
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10
      })
    })

    if (!response.ok) {
      const error = await response.text()
      return { valid: false, message: `OpenAI API 错误: ${response.status} - ${error}` }
    }

    return { valid: true, message: 'OpenAI API 连接成功' }
  } catch (error) {
    return { valid: false, message: `OpenAI 连接失败: ${error.message}` }
  }
}

async function testClaude(apiKey: string, model: string = 'claude-3-sonnet-20240229') {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hello' }]
      })
    })

    if (!response.ok) {
      const error = await response.text()
      return { valid: false, message: `Claude API 错误: ${response.status} - ${error}` }
    }

    return { valid: true, message: 'Claude API 连接成功' }
  } catch (error) {
    return { valid: false, message: `Claude 连接失败: ${error.message}` }
  }
}

async function testLocalLLM(baseURL: string, model?: string) {
  try {
    const endpoint = baseURL.includes('11434') ? '/api/generate' : '/v1/chat/completions'

    let requestBody: any
    if (endpoint === '/api/generate') {
      // Ollama format
      requestBody = {
        model: model || 'llama2',
        prompt: 'Hello',
        stream: false
      }
    } else {
      // LM Studio format
      requestBody = {
        model: model || 'local-model',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10
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
      return { valid: false, message: `本地 LLM 错误: ${response.status} - ${error}` }
    }

    const llmType = baseURL.includes('11434') ? 'Ollama' : 'LM Studio'
    return { valid: true, message: `${llmType} 连接成功` }
  } catch (error) {
    return { valid: false, message: `本地 LLM 连接失败: ${error.message}` }
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
    const { llm_config }: { llm_config: LLMConfig } = await req.json()

    if (!llm_config) {
      return new Response(JSON.stringify({ error: 'LLM config is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    let result: { valid: boolean; message: string }

    switch (llm_config.type) {
      case 'deepseek':
        if (!llm_config.apiKey) {
          result = { valid: false, message: '请输入 DeepSeek API Key' }
        } else {
          result = await testDeepSeek(llm_config.apiKey, llm_config.model)
        }
        break

      case 'openai':
        if (!llm_config.apiKey) {
          result = { valid: false, message: '请输入 OpenAI API Key' }
        } else {
          result = await testOpenAI(llm_config.apiKey, llm_config.baseURL, llm_config.model)
        }
        break

      case 'claude':
        if (!llm_config.apiKey) {
          result = { valid: false, message: '请输入 Claude API Key' }
        } else {
          result = await testClaude(llm_config.apiKey, llm_config.model)
        }
        break

      case 'ollama':
      case 'lmstudio':
        if (!llm_config.baseURL) {
          result = { valid: false, message: '请输入本地 LLM 的 Base URL' }
        } else {
          result = await testLocalLLM(llm_config.baseURL, llm_config.model)
        }
        break

      default:
        result = { valid: false, message: `不支持的 LLM 类型: ${llm_config.type}` }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error testing LLM config:', error)
    return new Response(JSON.stringify({
      valid: false,
      message: `测试失败: ${error.message}`
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})