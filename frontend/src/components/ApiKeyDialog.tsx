import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Key, Eye, EyeOff, Check, X, Loader2 } from 'lucide-react'

interface LLMConfig {
  type: 'deepseek' | 'openai' | 'ollama' | 'lmstudio' | 'claude'
  apiKey: string
  baseURL?: string
  model?: string
}

interface ApiKeyDialogProps {
  llmConfig: LLMConfig
  onSave: (config: LLMConfig) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

const LLM_TYPES = [
  { value: 'deepseek' as const, label: 'DeepSeek (推荐-快速)', placeholder: '请输入您的 DeepSeek API Key', defaultBaseURL: 'https://api.deepseek.com', defaultModel: 'deepseek-chat' },
  { value: 'openai' as const, label: 'OpenAI', placeholder: '请输入您的 OpenAI API Key', defaultBaseURL: 'https://api.openai.com/v1', defaultModel: 'gpt-3.5-turbo' },
  { value: 'claude' as const, label: 'Claude (较慢)', placeholder: '请输入您的 Anthropic API Key', defaultBaseURL: 'https://api.anthropic.com', defaultModel: 'claude-3-haiku-20240307' },
  { value: 'ollama' as const, label: 'Ollama (本地)', placeholder: '无需 API Key', defaultBaseURL: 'http://localhost:11434', defaultModel: 'llama3.1:8b' },
  { value: 'lmstudio' as const, label: 'LM Studio (本地)', placeholder: '无需 API Key', defaultBaseURL: 'http://localhost:1234/v1', defaultModel: 'local-model' },
]

export function ApiKeyDialog({ llmConfig, onSave, open, onOpenChange }: ApiKeyDialogProps) {
  const [tempConfig, setTempConfig] = useState<LLMConfig>(llmConfig)
  const [showPassword, setShowPassword] = useState(false)
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [testMessage, setTestMessage] = useState('')

  const currentLLMType = LLM_TYPES.find(t => t.value === tempConfig.type) || LLM_TYPES[0]
  const requiresApiKey = !['ollama', 'lmstudio'].includes(tempConfig.type)

  const handleSave = () => {
    onSave(tempConfig)
    onOpenChange(false)
  }

  const handleTypeChange = (type: LLMConfig['type']) => {
    const llmType = LLM_TYPES.find(t => t.value === type)! as any
    setTempConfig({
      ...tempConfig,
      type,
      baseURL: llmType.defaultBaseURL,
      model: llmType.defaultModel,
      apiKey: requiresApiKey ? tempConfig.apiKey : ''
    })
    resetTestStatus()
  }

  const handleTest = async () => {
    if (requiresApiKey && !tempConfig.apiKey.trim()) {
      setTestStatus('error')
      setTestMessage('请输入API Key')
      return
    }

    setTestStatus('testing')
    setTestMessage('正在测试连接...')

    try {
      // Use Supabase for both local development and production
      const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://oqicgfaczdmrdoglkqzi.supabase.co'

      const response = await fetch(`${API_BASE_URL}/functions/v1/test-llm-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'}`,
        },
        body: JSON.stringify({ llm_config: tempConfig }),
      })

      const result = await response.json()

      if (result.valid) {
        setTestStatus('success')
        setTestMessage(result.message)
      } else {
        setTestStatus('error')
        setTestMessage(result.message)
      }
    } catch (error) {
      setTestStatus('error')
      setTestMessage('连接测试失败')
    }
  }

  const resetTestStatus = () => {
    setTestStatus('idle')
    setTestMessage('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            LLM 配置
          </DialogTitle>
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="text-sm text-blue-800">
              <strong>🔒 隐私保护说明：</strong>
              <ul className="mt-1 ml-4 list-disc">
                <li>此演示版本仅为功能展示</li>
                <li>您的API密钥仅储存在本地浏览器中</li>
                <li>所有API调用直接连接到相应的AI服务商</li>
                <li>我们不会收集或存储您的密钥信息</li>
              </ul>
            </div>
          </div>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">LLM 类型</label>
            <select
              className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md"
              value={tempConfig.type}
              onChange={(e) => handleTypeChange(e.target.value as LLMConfig['type'])}
            >
              {LLM_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          {requiresApiKey && (
            <div>
              <label className="text-sm font-medium">API Key</label>
              <div className="relative mt-2">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={currentLLMType.placeholder}
                  value={tempConfig.apiKey}
                  onChange={(e) => {
                    setTempConfig({...tempConfig, apiKey: e.target.value})
                    resetTestStatus()
                  }}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium">API 端点</label>
            <Input
              placeholder="API 基础URL"
              value={tempConfig.baseURL || ''}
              onChange={(e) => {
                setTempConfig({...tempConfig, baseURL: e.target.value})
                resetTestStatus()
              }}
              className="mt-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium">模型 (可选)</label>
            <Input
              placeholder="例如: deepseek-chat (快), gpt-3.5-turbo (快), claude-3-haiku (快)"
              value={tempConfig.model || ''}
              onChange={(e) => {
                setTempConfig({...tempConfig, model: e.target.value})
                resetTestStatus()
              }}
              className="mt-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              💡 推荐使用较快的模型以避免超时：deepseek-chat, gpt-3.5-turbo, claude-3-haiku
            </p>
          </div>

          {/* 测试按钮和状态 */}
          <div className="space-y-2">
            <Button
              variant="outline"
              onClick={handleTest}
              disabled={testStatus === 'testing' || (requiresApiKey && !tempConfig.apiKey.trim())}
              className="w-full"
            >
              {testStatus === 'testing' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  测试中...
                </>
              ) : (
                '测试连接'
              )}
            </Button>

            {testMessage && (
              <div className={`flex items-center text-sm p-2 rounded-md ${
                testStatus === 'success' ? 'text-green-700 bg-green-50' :
                testStatus === 'error' ? 'text-red-700 bg-red-50' :
                'text-gray-700 bg-gray-50'
              }`}>
                {testStatus === 'success' && <Check className="h-4 w-4 mr-2" />}
                {testStatus === 'error' && <X className="h-4 w-4 mr-2" />}
                {testMessage}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={testStatus === 'testing'}>
              保存
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}