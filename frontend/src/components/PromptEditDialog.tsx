import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, RotateCcw, Save } from 'lucide-react'

interface PromptEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  prompt: string
  defaultPrompt: string
  onSave: (prompt: string) => void
}

export function PromptEditDialog({
  open,
  onOpenChange,
  title,
  prompt,
  defaultPrompt,
  onSave
}: PromptEditDialogProps) {
  const [editedPrompt, setEditedPrompt] = useState(prompt)

  useEffect(() => {
    setEditedPrompt(prompt)
  }, [prompt])

  const handleSave = () => {
    onSave(editedPrompt)
    onOpenChange(false)
  }

  const handleReset = () => {
    setEditedPrompt(defaultPrompt)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 min-h-0 overflow-hidden">
          <textarea
            value={editedPrompt}
            onChange={(e) => setEditedPrompt(e.target.value)}
            className="w-full h-full resize-none border border-gray-300 rounded-lg p-4 text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[400px]"
            placeholder="请输入提示词..."
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            重置为默认
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              保存
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}