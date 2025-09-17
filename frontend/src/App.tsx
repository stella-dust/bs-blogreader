import React, { useCallback, useState } from 'react'
import { Github, Key, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SmartFourColumnLayout } from '@/components/layout/SmartFourColumnLayout'
import { InputModule } from '@/components/input/InputModule'
import { ApiKeyDialog } from '@/components/ApiKeyDialog'
import { HistoryDropdown } from '@/components/HistoryDropdown'
import { LiveModularMonitor } from '@/components/monitoring/ModularMonitor'
import { ModelValidationDialog, validateLLMConfig } from '@/components/ModelValidationDialog'
import { useContentStore, useUIStore, useMetricsStore, estimateTokens } from '@/stores'
import './index.css'

function App() {
  const {
    contentData,
    processedData,
    llmConfig,
    history,
    isFetching,
    isTranslating,
    isInterpreting,
    setContentData,
    setProcessedData,
    setLlmConfig,
    addToHistory,
    setFetching,
    setTranslating,
    setInterpreting
  } = useContentStore()

  const {
    showApiDialog,
    showHistoryDropdown,
    setShowApiDialog,
    setShowHistoryDropdown
  } = useUIStore()

  // Local state for model validation dialog
  const [showModelValidationDialog, setShowModelValidationDialog] = useState(false)
  const [modelValidationMessage, setModelValidationMessage] = useState('')

  const {
    startProcess,
    endProcess,
    setTokenCount,
    setCharCount
  } = useMetricsStore()

  // Use Supabase for both local development and production
  const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321'

  const API_ENDPOINTS = {
    fetchContent: '/functions/v1/fetch-content',
    process: '/functions/v1/process',
    testLlmConfig: '/functions/v1/test-llm-config'
  }

  // Handle URL content fetching
  const handleUrlSubmit = useCallback(async (url: string) => {
    console.log('Fetching URL:', url)
    setFetching(true)
    startProcess('fetch')

    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.fetchContent}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'}`,
        },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Fetch failed:', response.status, errorText)
        throw new Error(`Failed to fetch: ${response.status}`)
      }

      const data = await response.json()
      console.log('Fetched data:', data)
      setContentData(data)

      // Update metrics
      setCharCount('fetch', { input: url.length, output: data.content?.length || 0 })

      // Add to history
      const historyItem = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: data.title || 'Untitled',
        url: data.url || url,
        timestamp: new Date(),
        original: data.content
      }
      addToHistory(historyItem)

      endProcess('fetch')
    } catch (error) {
      console.error('Error fetching content:', error)
      alert('Failed to fetch content. Please check the URL and try again.')
      endProcess('fetch', { progress: 0 })
    } finally {
      setFetching(false)
    }
  }, [API_BASE_URL, setContentData, addToHistory, setFetching, startProcess, endProcess, setCharCount])

  // Handle file content processing
  const handleFileSubmit = useCallback(async (file: File) => {
    console.log('Processing file:', file.name)
    setFetching(true)
    startProcess('fetch')

    try {
      const content = await file.text()
      const data = {
        title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
        url: `file://${file.name}`,
        content: content,
        siteName: 'Local File'
      }

      console.log('File data:', data)
      setContentData(data)

      // Update metrics
      setCharCount('fetch', { input: file.size, output: content.length })

      // Add to history
      const historyItem = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: data.title,
        url: data.url,
        timestamp: new Date(),
        original: content
      }
      addToHistory(historyItem)

      endProcess('fetch')
    } catch (error) {
      console.error('Error processing file:', error)
      alert('Failed to process file. Please try again.')
      endProcess('fetch', { progress: 0 })
    } finally {
      setFetching(false)
    }
  }, [setContentData, addToHistory, setFetching, startProcess, endProcess, setCharCount])

  // Handle translation
  const handleTranslate = useCallback(async () => {
    if (!contentData?.content) return

    // Validate LLM configuration first
    const validation = validateLLMConfig(llmConfig)
    if (!validation.isValid) {
      setModelValidationMessage(validation.message)
      setShowModelValidationDialog(true)
      return
    }

    setTranslating(true)
    startProcess('translation')

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        controller.abort()
      }, 600000) // 10 minutes timeout

      // Set input tokens only at the start
      const inputTokens = estimateTokens(contentData.content)
      setTokenCount('translation', { input: inputTokens })
      setCharCount('translation', { input: contentData.content.length })

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.process}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'}`,
        },
        body: JSON.stringify({
          content: contentData.content,
          prompt: useContentStore.getState().translationPrompt,
          llm_config: llmConfig,
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Translation failed: ${response.status}`)
      }

      const result = await response.json()
      const content = result.result || result.processed_content || ''
      setProcessedData({ translation: content })

      // Update metrics
      const outputTokens = estimateTokens(content)
      setTokenCount('translation', { output: outputTokens })
      setCharCount('translation', { output: content?.length || 0 })

      endProcess('translation')
    } catch (error: unknown) {
      console.error('Translation error:', error)

      if (error instanceof Error && error.name === 'AbortError') {
        alert('Translation timed out. Please try with shorter content or check your network connection.')
      } else {
        alert('Translation failed. Please check your LLM configuration and try again.')
      }

      endProcess('translation', { progress: 0 })
    } finally {
      setTranslating(false)
    }
  }, [contentData, llmConfig, setTranslating, setProcessedData, startProcess, endProcess, setTokenCount, setCharCount, API_BASE_URL])

  // Handle interpretation
  const handleInterpret = useCallback(async () => {
    if (!contentData?.content) return

    // Validate LLM configuration first
    const validation = validateLLMConfig(llmConfig)
    if (!validation.isValid) {
      setModelValidationMessage(validation.message)
      setShowModelValidationDialog(true)
      return
    }

    setInterpreting(true)
    startProcess('interpretation')

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        controller.abort()
      }, 600000) // 10 minutes timeout

      // Set input tokens only at the start
      const inputTokens = estimateTokens(contentData.content)
      setTokenCount('interpretation', { input: inputTokens })
      setCharCount('interpretation', { input: contentData.content.length })

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.process}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'}`,
        },
        body: JSON.stringify({
          content: contentData.content,
          prompt: useContentStore.getState().interpretationPrompt,
          llm_config: llmConfig,
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Interpretation failed: ${response.status}`)
      }

      const result = await response.json()
      const content = result.result || result.processed_content || ''
      setProcessedData({ interpretation: content })

      // Update metrics
      const outputTokens = estimateTokens(content)
      setTokenCount('interpretation', { output: outputTokens })
      setCharCount('interpretation', { output: content?.length || 0 })

      endProcess('interpretation')
    } catch (error: unknown) {
      console.error('Interpretation error:', error)

      if (error instanceof Error && error.name === 'AbortError') {
        alert('Interpretation timed out. Please try with shorter content or check your network connection.')
      } else {
        alert('Interpretation failed. Please check your LLM configuration and try again.')
      }

      endProcess('interpretation', { progress: 0 })
    } finally {
      setInterpreting(false)
    }
  }, [contentData, llmConfig, setInterpreting, setProcessedData, startProcess, endProcess, setTokenCount, setCharCount, API_BASE_URL])

  return (
    <div className="h-screen bg-purple-50 flex flex-col overflow-hidden">
      {/* Header Navigation - Fixed Height */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex-shrink-0">
        <div className="flex justify-between items-center">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="BuilderStream Logo" className="w-8 h-8 rounded-full object-cover" />
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                BuilderStream | BlogReader
              </h1>
            </div>
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center gap-2">
            {/* History Dropdown */}
            <HistoryDropdown
              history={history}
              open={showHistoryDropdown}
              onOpenChange={setShowHistoryDropdown}
              trigger={
                <Button variant="ghost" size="icon">
                  <History className="h-4 w-4" />
                </Button>
              }
            />

            {/* API Key Dialog */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowApiDialog(true)}
            >
              <Key className="h-4 w-4" />
            </Button>

            {/* GitHub Link */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.open('https://github.com/stella-dust/bs-blogreader', '_blank')}
            >
              <Github className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Container - Flexible Height */}
      <div className="flex-1 p-6 flex flex-col gap-6 min-h-0">
        {/* Input Module Card - Fixed Height */}
        <div className="bg-white rounded-xl p-6 flex-shrink-0 min-h-[120px] flex flex-col justify-center">
          <InputModule
            onUrlSubmit={handleUrlSubmit}
            onFileSubmit={handleFileSubmit}
            isProcessing={isFetching}
          />

          {/* Modular Processing Monitor */}
          <div className="mt-4">
            <LiveModularMonitor onModelClick={() => setShowApiDialog(true)} />
          </div>
        </div>

        {/* Four Column Smart Layout - Flexible Height */}
        <div className="flex-1 min-h-0 bg-purple-50 rounded-xl -m-6 p-6">
          <SmartFourColumnLayout
            contentData={contentData}
            processedData={processedData}
            isFetching={isFetching}
            isTranslating={isTranslating}
            isInterpreting={isInterpreting}
            onTranslate={handleTranslate}
            onInterpret={handleInterpret}
          />
        </div>
      </div>

      {/* Dialogs */}
      <ApiKeyDialog
        llmConfig={llmConfig}
        onSave={setLlmConfig}
        open={showApiDialog}
        onOpenChange={setShowApiDialog}
      />

      <ModelValidationDialog
        open={showModelValidationDialog}
        onOpenChange={setShowModelValidationDialog}
        onOpenApiKeyDialog={() => setShowApiDialog(true)}
        message={modelValidationMessage}
      />
    </div>
  )
}

export default App