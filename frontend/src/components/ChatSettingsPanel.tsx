import React from 'react'
import { Settings, Search, Link, Layers, Eye, RotateCcw, Zap, Rocket, Book } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { useChatSettingsStore } from '@/stores/chatSettingsStore'

interface ChatSettingsPanelProps {
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ChatSettingsPanel({ trigger, open, onOpenChange }: ChatSettingsPanelProps) {
  const {
    settings,
    updateSettings,
    resetSettings,
    toggleWebSearch,
    toggleAutoUrlFetch,
    setSearchDepth,
    setMaxSearchResults
  } = useChatSettingsStore()

  const defaultTrigger = (
    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
      <Settings className="h-4 w-4" />
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            智能对话设置
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {/* Web搜索开关 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <div>
                <h4 className="text-sm font-medium">网络搜索</h4>
                <p className="text-xs text-muted-foreground">结合最新网络信息回答问题</p>
              </div>
            </div>
            <Switch
              checked={settings.webSearchEnabled}
              onCheckedChange={toggleWebSearch}
            />
          </div>

          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              • URL链接会自动识别并抓取内容<br/>
              • 网络搜索可获取最新信息<br/>
              • 关闭后仅基于当前文章内容回答
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// 简化的切换组件，用于快速访问
export function QuickSettingsToggle() {
  const { settings, toggleWebSearch, toggleAutoUrlFetch } = useChatSettingsStore()

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={settings.webSearchEnabled ? "default" : "outline"}
        size="sm"
        onClick={toggleWebSearch}
        className="h-7 text-xs"
      >
        <Search className="h-3 w-3 mr-1" />
        搜索
      </Button>
      <Button
        variant={settings.autoUrlFetch ? "default" : "outline"}
        size="sm"
        onClick={toggleAutoUrlFetch}
        className="h-7 text-xs"
      >
        <Link className="h-3 w-3 mr-1" />
        URL
      </Button>
    </div>
  )
}