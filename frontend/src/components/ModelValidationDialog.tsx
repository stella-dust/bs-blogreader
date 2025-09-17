import React from 'react'
import { AlertTriangle, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ModelValidationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpenApiKeyDialog: () => void
  message: string
}

export function ModelValidationDialog({
  open,
  onOpenChange,
  onOpenApiKeyDialog,
  message
}: ModelValidationDialogProps) {
  if (!open) return null

  const handleConfigureModel = () => {
    onOpenChange(false)
    onOpenApiKeyDialog()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-semibold text-gray-900">模型配置问题</h2>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-gray-700 mb-4">{message}</p>
          <p className="text-sm text-gray-500">
            请先配置有效的LLM模型和API密钥后再进行操作。
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button
            size="sm"
            onClick={handleConfigureModel}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            配置模型
          </Button>
        </div>
      </div>
    </div>
  )
}

// Model validation utility
export function validateLLMConfig(llmConfig: any): { isValid: boolean; message: string } {
  if (!llmConfig) {
    return {
      isValid: false,
      message: '未找到LLM配置，请先配置模型。'
    }
  }

  if (!llmConfig.type) {
    return {
      isValid: false,
      message: '未选择LLM类型，请先选择一个模型类型。'
    }
  }

  const requiresApiKey = !['ollama', 'lmstudio'].includes(llmConfig.type)

  if (requiresApiKey && (!llmConfig.apiKey || !llmConfig.apiKey.trim())) {
    return {
      isValid: false,
      message: `${llmConfig.type === 'deepseek' ? 'DeepSeek' :
                 llmConfig.type === 'openai' ? 'OpenAI' :
                 llmConfig.type === 'claude' ? 'Claude' :
                 llmConfig.type} 需要API密钥，请先配置API Key。`
    }
  }

  if (!llmConfig.baseURL) {
    return {
      isValid: false,
      message: '缺少API地址配置，请检查模型配置。'
    }
  }

  if (!llmConfig.model) {
    return {
      isValid: false,
      message: '未指定具体模型，请检查模型配置。'
    }
  }

  return {
    isValid: true,
    message: '配置有效'
  }
}