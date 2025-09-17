import React, { useState, useRef } from 'react'
import { Search, Upload, Loader2, X, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useContentStore } from '@/stores'

interface InputModuleProps {
  onUrlSubmit: (url: string) => void
  onFileSubmit: (file: File) => void
  isProcessing?: boolean
}

export function InputModule({
  onUrlSubmit,
  onFileSubmit,
  isProcessing = false
}: InputModuleProps) {
  const { isFetching } = useContentStore()

  const [url, setUrl] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isLoading = isFetching || isProcessing

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // If file is selected, submit file instead
    if (selectedFile) {
      onFileSubmit(selectedFile)
      return
    }

    if (!url.trim()) return

    // Basic URL validation
    try {
      const urlObj = new URL(url)
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        alert('URL must start with http:// or https://')
        return
      }
    } catch {
      alert('Please enter a valid URL')
      return
    }

    onUrlSubmit(url)
  }

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]

    // Basic file validation
    const allowedExtensions = ['.txt', '.md', '.json', '.html', '.htm']
    const hasValidExtension = allowedExtensions.some(ext =>
      file.name.toLowerCase().endsWith(ext)
    )

    if (!hasValidExtension) {
      alert('Please select a text file (.txt, .md, .json, .html)')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    // Set selected file and show filename in input
    setSelectedFile(file)
    setUrl('') // Clear URL
  }

  const handleUrlChange = (value: string) => {
    setUrl(value)
    // Clear selected file when user types URL
    if (selectedFile) {
      setSelectedFile(null)
    }
  }

  const clearFile = () => {
    setSelectedFile(null)
    setUrl('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="flex justify-center">
      <div className="flex items-center gap-3 max-w-5xl w-full">
        <form onSubmit={handleUrlSubmit} className="flex-1 flex items-center gap-2">
          <div className="flex-1 relative">
            {selectedFile ? (
              // File display mode
              <div className="flex items-center gap-2 px-3 py-2 border border-input rounded-md bg-background">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm truncate flex-1">{selectedFile.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearFile}
                  className="h-auto p-1 hover:bg-destructive/10"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              // URL input mode
              <Input
                type="url"
                placeholder="输入文章链接或选择文件"
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                disabled={isLoading}
                className="w-full"
              />
            )}
          </div>

          <Button
            type="submit"
            size="sm"
            disabled={isLoading || (!url.trim() && !selectedFile)}
            className="px-4"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                处理中
              </>
            ) : selectedFile ? (
              <>
                <FileText className="h-4 w-4 mr-2" />
                处理文件
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                开始爬取
              </>
            )}
          </Button>
        </form>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="px-4"
        >
          <Upload className="h-4 w-4 mr-2" />
          上传文件
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.md,.json,.html,.htm,text/*"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          disabled={isLoading}
        />
      </div>
    </div>
  )
}