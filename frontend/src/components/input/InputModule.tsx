import React, { useState, useRef } from 'react'
import { Search, Upload, Link, FileText, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InputCard } from '@/components/ui/collapsible-card'
import { useContentStore, useUIStore } from '@/stores'

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
  const { inputMethod, setInputMethod } = useUIStore()
  const { isFetching } = useContentStore()

  const [url, setUrl] = useState('')
  const [urlError, setUrlError] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isLoading = isFetching || isProcessing

  // URL validation
  const validateUrl = (url: string): string => {
    if (!url.trim()) return 'Please enter a URL'

    try {
      const urlObj = new URL(url)
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return 'URL must start with http:// or https://'
      }
      return ''
    } catch {
      return 'Please enter a valid URL'
    }
  }

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const error = validateUrl(url)
    if (error) {
      setUrlError(error)
      return
    }

    setUrlError('')
    onUrlSubmit(url)
  }

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]

    // Validate file type
    const allowedTypes = [
      'text/plain',
      'text/markdown',
      'application/json',
      'text/html'
    ]

    const allowedExtensions = ['.txt', '.md', '.json', '.html', '.htm']
    const hasValidExtension = allowedExtensions.some(ext =>
      file.name.toLowerCase().endsWith(ext)
    )

    if (!allowedTypes.includes(file.type) && !hasValidExtension) {
      alert('Please select a text file (.txt, .md, .json, .html)')
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    onFileSubmit(file)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    handleFileSelect(e.dataTransfer.files)
  }

  const InputMethodTabs = () => (
    <div className="flex space-x-1 p-1 bg-gray-100 rounded-lg">
      <button
        onClick={() => setInputMethod('url')}
        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          inputMethod === 'url'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <Link className="h-4 w-4" />
        URL
      </button>
      <button
        onClick={() => setInputMethod('file')}
        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          inputMethod === 'file'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <Upload className="h-4 w-4" />
        File
      </button>
    </div>
  )

  const urlContent = (
    <form onSubmit={handleUrlSubmit} className="space-y-4">
      <div className="space-y-2">
        <div className="flex space-x-2">
          <Input
            type="url"
            placeholder="Enter article URL (e.g., https://example.com/article)"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value)
              setUrlError('')
            }}
            className={urlError ? 'border-red-300 focus:border-red-500' : ''}
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="px-6"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Fetching...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Fetch
              </>
            )}
          </Button>
        </div>

        {urlError && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            {urlError}
          </div>
        )}
      </div>

      <div className="text-xs text-gray-500">
        <p>Supports most blog sites, news articles, and documentation pages.</p>
      </div>
    </form>
  )

  const fileContent = (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />

        <div className="space-y-2">
          <p className="text-lg font-medium text-gray-900">
            Drop your file here
          </p>
          <p className="text-sm text-gray-500">
            or click to browse
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="mt-4"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Choose File
            </>
          )}
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

      <div className="text-xs text-gray-500">
        <p>Supported formats: .txt, .md, .json, .html (max 5MB)</p>
      </div>
    </div>
  )

  return (
    <InputCard
      title="Content Input"
      subtitle="Start by entering a URL or uploading a file"
      actions={<InputMethodTabs />}
      defaultCollapsed={false}
      className="w-full"
    >
      {inputMethod === 'url' ? urlContent : fileContent}
    </InputCard>
  )
}