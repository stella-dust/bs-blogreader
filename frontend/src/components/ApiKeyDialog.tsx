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
  { value: 'deepseek' as const, label: 'DeepSeek', placeholder: '请输入您的 DeepSeek API Key', defaultBaseURL: 'https://api.deepseek.com' },
  { value: 'openai' as const, label: 'OpenAI', placeholder: '请输入您的 OpenAI API Key', defaultBaseURL: 'https://api.openai.com/v1' },
  { value: 'claude' as const, label: 'Claude', placeholder: '请输入您的 Anthropic API Key', defaultBaseURL: 'https://api.anthropic.com' },
  { value: 'ollama' as const, label: 'Ollama (本地)', placeholder: '无需 API Key', defaultBaseURL: 'http://localhost:11434' },
  { value: 'lmstudio' as const, label: 'LM Studio (本地)', placeholder: '无需 API Key', defaultBaseURL: 'http://localhost:1234/v1' },
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
    const llmType = LLM_TYPES.find(t => t.value === type)!
    setTempConfig({
      ...tempConfig,
      type,
      baseURL: llmType.defaultBaseURL,
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
      const response = await fetch('/api/test-llm-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
              placeholder="例如: gpt-4, deepseek-chat, llama2"
              value={tempConfig.model || ''}
              onChange={(e) => {
                setTempConfig({...tempConfig, model: e.target.value})
                resetTestStatus()
              }}
              className="mt-2"
            />
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