import React from 'react'
import { Settings, Search, Link, Layers, Eye, RotateCcw } from 'lucide-react'
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

        <div className="space-y-6 py-4">
          {/* Web搜索设置 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-blue-500" />
                <div>
                  <h4 className="text-sm font-medium">Web搜索增强</h4>
                  <p className="text-xs text-gray-500">结合最新网络信息回答问题</p>
                </div>
              </div>
              <Switch
                checked={settings.webSearchEnabled}
                onCheckedChange={toggleWebSearch}
              />
            </div>

            {/* 搜索深度设置 */}
            {settings.webSearchEnabled && (
              <div className="ml-6 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">搜索深度</label>
                  <Select value={settings.searchDepth} onValueChange={(value) => setSearchDepth(value as 'basic' | 'deep')}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">
                        <div className="flex items-center gap-2">
                          <Layers className="h-3 w-3" />
                          基础 (1-2结果)
                        </div>
                      </SelectItem>
                      <SelectItem value="deep">
                        <div className="flex items-center gap-2">
                          <Layers className="h-3 w-3" />
                          深度 (3-5结果)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 搜索结果数量 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">最大搜索结果数</label>
                    <span className="text-sm text-gray-500">{settings.maxSearchResults}</span>
                  </div>
                  <Slider
                    value={[settings.maxSearchResults]}
                    onValueChange={([value]) => setMaxSearchResults(value)}
                    max={5}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>1</span>
                    <span>5</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* URL自动抓取设置 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link className="h-4 w-4 text-green-500" />
                <div>
                  <h4 className="text-sm font-medium">URL自动抓取</h4>
                  <p className="text-xs text-gray-500">自动检测并抓取对话中的网页链接</p>
                </div>
              </div>
              <Switch
                checked={settings.autoUrlFetch}
                onCheckedChange={toggleAutoUrlFetch}
              />
            </div>
          </div>

          {/* 界面设置 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-purple-500" />
                <div>
                  <h4 className="text-sm font-medium">模式指示器</h4>
                  <p className="text-xs text-gray-500">显示当前处理模式的提示</p>
                </div>
              </div>
              <Switch
                checked={settings.showModeIndicator}
                onCheckedChange={(checked) => updateSettings({ showModeIndicator: checked })}
              />
            </div>
          </div>

          {/* 预设方案 */}
          <div className="space-y-3 pt-4 border-t">
            <h4 className="text-sm font-medium text-gray-700">快速预设</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateSettings({
                  webSearchEnabled: true,
                  autoUrlFetch: true,
                  searchDepth: 'deep',
                  maxSearchResults: 4,
                  showModeIndicator: true
                })}
                className="justify-start"
              >
                🚀 全功能模式
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateSettings({
                  webSearchEnabled: true,
                  autoUrlFetch: true,
                  searchDepth: 'basic',
                  maxSearchResults: 2,
                  showModeIndicator: true
                })}
                className="justify-start"
              >
                ⚡ 快速模式
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateSettings({
                  webSearchEnabled: false,
                  autoUrlFetch: true,
                  searchDepth: 'basic',
                  maxSearchResults: 1,
                  showModeIndicator: false
                })}
                className="justify-start"
              >
                📚 专注模式
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={resetSettings}
                className="justify-start"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                重置设置
              </Button>
            </div>
          </div>

          {/* 当前设置摘要 */}
          <div className="bg-gray-50 p-3 rounded-lg text-xs space-y-1">
            <h5 className="font-medium text-gray-700">当前配置摘要</h5>
            <div className="space-y-0.5 text-gray-600">
              <div>🔍 Web搜索: {settings.webSearchEnabled ? '开启' : '关闭'}</div>
              <div>🔗 URL抓取: {settings.autoUrlFetch ? '开启' : '关闭'}</div>
              {settings.webSearchEnabled && (
                <div>📊 搜索深度: {settings.searchDepth === 'basic' ? '基础' : '深度'} ({settings.maxSearchResults}个结果)</div>
              )}
              <div>👁️ 模式提示: {settings.showModeIndicator ? '显示' : '隐藏'}</div>
            </div>
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