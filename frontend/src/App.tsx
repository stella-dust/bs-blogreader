import React, { useCallback, useEffect } from 'react'
import { Github, Key, History, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TabCard, TabBadge, TabEmptyState } from '@/components/ui/tab-card'
import { ModularLayout, SidebarLayout, StackLayout } from '@/components/layout/ModularLayout'
import { InputModule } from '@/components/input/InputModule'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { ProcessingMonitor } from '@/components/monitoring/ProcessingMonitor'
import { ApiKeyDialog } from '@/components/ApiKeyDialog'
import { HistoryDropdown } from '@/components/HistoryDropdown'
import { RichContentViewer } from '@/components/RichContentViewer'
import { ContentPanel } from '@/components/ContentPanel'
import { useContentStore, useUIStore, useMetricsStore } from '@/stores'
import { estimateTokens } from '@/stores/metricsStore'
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
    activeTab,
    setShowApiDialog,
    setShowHistoryDropdown,
    setActiveTab
  } = useUIStore()

  const {
    startProcess,
    endProcess,
    updateProgress,
    setTokenCount,
    setCharCount,
    estimateTimeRemaining
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
        throw new Error(`Failed to fetch: ${response.status}`)
      }

      const data = await response.json()
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

      // Switch to original tab to show content
      setActiveTab('original')

      endProcess('fetch')
    } catch (error) {
      console.error('Error fetching content:', error)
      alert('Failed to fetch content. Please check the URL and try again.')
      endProcess('fetch', { progress: 0 })
    } finally {
      setFetching(false)
    }
  }, [API_BASE_URL, setContentData, addToHistory, setFetching, startProcess, endProcess, setCharCount, setActiveTab])

  // Handle file content processing
  const handleFileSubmit = useCallback(async (file: File) => {
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

      // Switch to original tab
      setActiveTab('original')

      endProcess('fetch')
    } catch (error) {
      console.error('Error processing file:', error)
      alert('Failed to process file. Please try again.')
      endProcess('fetch', { progress: 0 })
    } finally {
      setFetching(false)
    }
  }, [setContentData, addToHistory, setFetching, startProcess, endProcess, setCharCount, setActiveTab])

  // Handle translation
  const handleTranslate = useCallback(async () => {
    if (!contentData?.content) return

    setTranslating(true)
    startProcess('translation')

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        controller.abort()
      }, 300000) // 5 minutes timeout

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
      setProcessedData({ translation: result.processed_content })

      // Update metrics
      const outputTokens = estimateTokens(result.processed_content)
      setTokenCount('translation', { output: outputTokens })
      setCharCount('translation', { output: result.processed_content.length })

      // Switch to translation tab
      setActiveTab('translation')

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
  }, [contentData, llmConfig, setTranslating, setProcessedData, startProcess, endProcess, setTokenCount, setCharCount, setActiveTab, API_BASE_URL])

  // Handle interpretation
  const handleInterpret = useCallback(async () => {
    if (!contentData?.content) return

    setInterpreting(true)
    startProcess('interpretation')

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        controller.abort()
      }, 300000) // 5 minutes timeout

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
      setProcessedData({ interpretation: result.processed_content })

      // Update metrics
      const outputTokens = estimateTokens(result.processed_content)
      setTokenCount('interpretation', { output: outputTokens })
      setCharCount('interpretation', { output: result.processed_content.length })

      // Switch to interpretation tab
      setActiveTab('interpretation')

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
  }, [contentData, llmConfig, setInterpreting, setProcessedData, startProcess, endProcess, setTokenCount, setCharCount, setActiveTab, API_BASE_URL])

  // Tab configuration
  const tabs = [
    {
      id: 'original' as const,
      label: 'Original',
      icon: <div className="w-2 h-2 bg-blue-500 rounded-full" />,
      content: contentData ? (
        <RichContentViewer
          content={contentData}
          showSourceMode={true}
        />
      ) : (
        <TabEmptyState
          title="No content loaded"
          description="Please fetch some content first"
        />
      ),
      badge: contentData ? <TabBadge variant="success">Ready</TabBadge> : undefined
    },
    {
      id: 'translation' as const,
      label: 'Translation',
      icon: <div className="w-2 h-2 bg-green-500 rounded-full" />,
      content: processedData.translation ? (
        <ContentPanel
          title="Translation"
          content={processedData.translation}
          showSourceMode={true}
        />
      ) : (
        <TabEmptyState
          title="No translation available"
          description="Click the translate button to generate translation"
          action={
            <Button
              onClick={handleTranslate}
              disabled={!contentData?.content || isTranslating}
            >
              Start Translation
            </Button>
          }
        />
      ),
      badge: processedData.translation ? (
        <TabBadge variant="success">Done</TabBadge>
      ) : isTranslating ? (
        <TabBadge variant="warning">Processing</TabBadge>
      ) : undefined,
      disabled: !contentData?.content
    },
    {
      id: 'interpretation' as const,
      label: 'Interpretation',
      icon: <div className="w-2 h-2 bg-amber-500 rounded-full" />,
      content: processedData.interpretation ? (
        <ContentPanel
          title="Interpretation"
          content={processedData.interpretation}
          showSourceMode={true}
        />
      ) : (
        <TabEmptyState
          title="No interpretation available"
          description="Click the interpret button to generate interpretation"
          action={
            <Button
              onClick={handleInterpret}
              disabled={!contentData?.content || isInterpreting}
            >
              Start Interpretation
            </Button>
          }
        />
      ),
      badge: processedData.interpretation ? (
        <TabBadge variant="success">Done</TabBadge>
      ) : isInterpreting ? (
        <TabBadge variant="warning">Processing</TabBadge>
      ) : undefined,
      disabled: !contentData?.content
    },
    {
      id: 'chat' as const,
      label: 'Chat',
      icon: <div className="w-2 h-2 bg-purple-500 rounded-full" />,
      content: <ChatInterface className="h-96" />,
      disabled: !contentData?.content
    }
  ]

  return (
    <ModularLayout>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            AI Blog Reader
          </h1>
          <p className="text-gray-600 mt-1">
            Intelligent content analysis and translation
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* GitHub Link */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('https://github.com/stella-dust/bs-blogreader', '_blank')}
          >
            <Github className="h-4 w-4 mr-1" />
            GitHub
          </Button>

          {/* History Dropdown */}
          <HistoryDropdown
            history={history}
            open={showHistoryDropdown}
            onOpenChange={setShowHistoryDropdown}
            trigger={
              <Button variant="outline" size="sm">
                <History className="h-4 w-4 mr-1" />
                History
              </Button>
            }
          />

          {/* API Key Dialog */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowApiDialog(true)}
          >
            <Key className="h-4 w-4 mr-1" />
            LLM Config
          </Button>
        </div>
      </div>

      <SidebarLayout
        sidebarPosition="right"
        sidebarWidth="md"
        main={
          <StackLayout spacing="lg">
            {/* Input Module */}
            <InputModule
              onUrlSubmit={handleUrlSubmit}
              onFileSubmit={handleFileSubmit}
              isProcessing={isFetching}
            />

            {/* Content Display with Tabs */}
            <TabCard
              title="Content Analysis"
              subtitle={contentData?.title || "No content loaded"}
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              actions={
                <div className="flex items-center gap-2">
                  {contentData && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleTranslate}
                        disabled={isTranslating}
                      >
                        Translate
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleInterpret}
                        disabled={isInterpreting}
                      >
                        Interpret
                      </Button>
                    </>
                  )}
                </div>
              }
            />
          </StackLayout>
        }
        sidebar={
          <StackLayout spacing="md">
            {/* Processing Monitor */}
            <ProcessingMonitor processType="fetch" />
            <ProcessingMonitor processType="translation" />
            <ProcessingMonitor processType="interpretation" />
            <ProcessingMonitor processType="chat" />
          </StackLayout>
        }
      />

      {/* Dialogs */}
      <ApiKeyDialog
        llmConfig={llmConfig}
        onSave={setLlmConfig}
        open={showApiDialog}
        onOpenChange={setShowApiDialog}
      />
    </ModularLayout>
  )
}

export default App