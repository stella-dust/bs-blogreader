import type { InputAnalysis, ProcessMode, ChatSettings } from '@/stores/types'

/**
 * 智能输入分析器
 * 根据用户输入和设置，智能判断应该使用哪种处理模式
 */
export class InputAnalyzer {
  // URL检测正则表达式
  private urlRegex = /(https?:\/\/[^\s]+)/gi

  // 搜索需求关键词
  private searchIndicators = [
    '最新', '现在', '目前', '当前', '近期', '最近',
    '2024', '2025', '今年', '去年', '明年',
    '趋势', '发展', '进展', '状况', '情况',
    '案例', '例子', '实例', '应用', '使用',
    '比较', '对比', '区别', '差异', '优缺点',
    '如何', '怎么', '方法', '步骤', '教程',
    '工具', '软件', '库', '框架', '平台',
    '新闻', '消息', '报道', '事件',
    '价格', '成本', '费用', '收费'
  ]

  // 时间相关关键词（更强的搜索信号）
  private timeIndicators = [
    '最新', '现在', '目前', '当前', '近期', '最近',
    '2024', '2025', '今年', '去年', '明年',
    'latest', 'current', 'now', 'recent', 'new'
  ]

  /**
   * 分析用户输入
   */
  analyze(input: string, settings: ChatSettings): InputAnalysis {
    const urls = this.extractUrls(input)
    const cleanQuestion = this.removeUrls(input).trim()
    const searchKeywords = this.extractSearchKeywords(input)

    // 决定处理模式
    const mode = this.determineMode(input, urls, settings)

    // 计算置信度
    const confidence = this.calculateConfidence(mode, urls, searchKeywords, settings)

    return {
      mode,
      urls,
      cleanQuestion,
      searchKeywords,
      confidence
    }
  }

  /**
   * 提取URL
   */
  extractUrls(text: string): string[] {
    const matches = text.match(this.urlRegex)
    return matches ? [...new Set(matches)] : []
  }

  /**
   * 移除URL，获取纯问题文本
   */
  removeUrls(text: string): string {
    return text.replace(this.urlRegex, '').replace(/\s+/g, ' ').trim()
  }

  /**
   * 提取搜索关键词
   */
  extractSearchKeywords(text: string): string[] {
    const found = this.searchIndicators.filter(keyword =>
      text.includes(keyword)
    )
    return found
  }

  /**
   * 判断是否需要网络搜索
   */
  needsWebSearch(text: string, settings: ChatSettings): boolean {
    if (!settings.webSearchEnabled) return false

    // 时间相关关键词的权重更高
    const hasTimeIndicators = this.timeIndicators.some(indicator =>
      text.toLowerCase().includes(indicator.toLowerCase())
    )
    if (hasTimeIndicators) return true

    // 普通搜索关键词
    const searchCount = this.searchIndicators.filter(indicator =>
      text.toLowerCase().includes(indicator.toLowerCase())
    ).length

    // 如果包含2个或以上搜索关键词，则需要搜索
    return searchCount >= 2
  }

  /**
   * 判断处理模式
   */
  private determineMode(input: string, urls: string[], settings: ChatSettings): ProcessMode {
    // 优先级1: URL直接抓取
    if (urls.length > 0 && settings.autoUrlFetch) {
      return {
        type: 'url_fetch',
        urls,
        priority: 'high',
        reason: `检测到${urls.length}个URL，将直接抓取内容`
      }
    }

    // 优先级2: Web搜索
    if (this.needsWebSearch(input, settings)) {
      return {
        type: 'web_search',
        query: input,
        priority: 'medium',
        reason: '检测到搜索关键词，将结合网络信息'
      }
    }

    // 优先级3: 纯RAG
    return {
      type: 'rag_only',
      query: input,
      priority: 'low',
      reason: '基于原文内容回答'
    }
  }

  /**
   * 计算置信度
   */
  private calculateConfidence(
    mode: ProcessMode,
    urls: string[],
    searchKeywords: string[],
    settings: ChatSettings
  ): number {
    let confidence = 0.5 // 基础置信度

    switch (mode.type) {
      case 'url_fetch':
        confidence = 0.9 // URL检测置信度很高
        if (urls.length > 1) confidence = 0.95
        break

      case 'web_search':
        // 基于搜索关键词数量和类型调整置信度
        const timeKeywordCount = this.timeIndicators.filter(keyword =>
          mode.query?.toLowerCase().includes(keyword.toLowerCase())
        ).length

        confidence = 0.6 + (searchKeywords.length * 0.1) + (timeKeywordCount * 0.2)
        confidence = Math.min(confidence, 0.9)
        break

      case 'rag_only':
        confidence = 0.8 // 默认模式，置信度较高
        break
    }

    // 根据设置调整置信度
    if (!settings.webSearchEnabled && mode.type === 'web_search') {
      confidence = 0.1 // 搜索被禁用时，搜索模式置信度很低
    }

    if (!settings.autoUrlFetch && mode.type === 'url_fetch') {
      confidence = 0.2 // URL抓取被禁用时，URL模式置信度很低
    }

    return Math.round(confidence * 100) / 100
  }

  /**
   * 获取模式描述
   */
  getModeDescription(mode: ProcessMode): string {
    const icons = {
      url_fetch: '🔗',
      web_search: '🔍',
      rag_only: '📚'
    }

    const descriptions = {
      url_fetch: '将抓取网页内容',
      web_search: '将搜索最新信息',
      rag_only: '基于原文回答'
    }

    return `${icons[mode.type]} ${descriptions[mode.type]}`
  }

  /**
   * 生成搜索查询优化
   */
  generateSearchQuery(originalQuery: string, blogContext?: string): string {
    // 如果有博客上下文，提取关键概念
    if (blogContext) {
      // 简单的关键词提取（实际项目中可以使用更复杂的NLP）
      const contextKeywords = this.extractKeyWordsFromContext(blogContext)
      const topKeywords = contextKeywords.slice(0, 2).join(' ')

      if (topKeywords) {
        return `${originalQuery} ${topKeywords}`
      }
    }

    return originalQuery
  }

  /**
   * 从上下文中提取关键词（简化版）
   */
  private extractKeyWordsFromContext(context: string): string[] {
    // 这里实现一个简化的关键词提取
    // 实际项目中可以使用更复杂的NLP库
    const words = context
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)

    // 统计词频
    const wordCount: Record<string, number> = {}
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1
    })

    // 返回高频词汇
    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word)
  }
}

// 导出单例实例
export const inputAnalyzer = new InputAnalyzer()