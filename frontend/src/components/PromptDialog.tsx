import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

interface PromptDialogProps {
  title: string
  prompt: string
  onSave: (newPrompt: string) => void
  trigger: React.ReactNode
}

export const PromptDialog: React.FC<PromptDialogProps> = ({
  title,
  prompt,
  onSave,
  trigger,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState(prompt)

  const handleSave = () => {
    onSave(editingPrompt)
    setIsOpen(false)
  }

  const handleReset = () => {
    setEditingPrompt(prompt)
  }

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setEditingPrompt(prompt)
    }
    setIsOpen(open)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            在这里查看、修改或重置提示词设置
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Textarea
            value={editingPrompt}
            onChange={(e) => setEditingPrompt(e.target.value)}
            className="min-h-[300px] font-mono text-sm"
            placeholder="输入提示词..."
          />
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={handleReset}>
            重置
          </Button>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave}>
              保存
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}