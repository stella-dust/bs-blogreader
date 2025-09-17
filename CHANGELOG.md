# Changelog

## [v0.3.1] - 2025-09-18

### 🔧 Minor Updates
- 版本号更新至 v0.3.1

## [v0.3.0] - 2025-09-17

### 🚀 重大 UI 升级：NotebookLM 风格模块化设计

**界面架构重构**：
- 🎨 **NotebookLM 风格布局**: 采用四列可折叠卡片设计
- 📱 **智能自适应**: 支持列折叠，动态宽度分配
- 🎛️ **模块化监控**: 实时显示各模块状态和 tokens 消耗
- 🔄 **增强交互**: 提示词设计对话框，Markdown/源码切换

**新增核心组件**：
- 🏗️ `SmartFourColumnLayout`: 智能四列布局组件
- 📊 `ModularMonitor`: 模块化状态监控器
- ✏️ `EnhancedContentPanel`: 增强内容面板
- 💬 `PromptEditDialog`: 提示词编辑对话框
- 📁 `InputModule`: 支持文件上传的输入模块

**用户体验优化**：
- 📂 **文件上传功能**: 支持 .txt/.md/.json/.html 文件直接处理
- 🎯 **实时状态跟踪**: Processing(时间+tokens) → Done(tokens+chars)
- 🎨 **状态颜色区分**: Ready(灰色) / Processing(蓝色) / Done(绿色)
- 🖼️ **图标优化**: 使用透明背景 PNG，修复 favicon 显示

**技术改进**：
- 🐛 **错误修复**: 解决 estimateTokens 报错和 CORS 问题
- ⏱️ **超时优化**: 延长处理超时至 10 分钟
- 📊 **Metrics 重构**: 完善 token 计数和字符统计
- 🔄 **数据结构优化**: 兼容后端 result 字段格式

**开发者友好**：
- 🛠️ **流式输出支持**: 预留 StreamingContentPanel 组件
- 📝 **TypeScript 优化**: 完善类型定义和错误处理
- 🎛️ **环境配置**: 支持本地/生产环境 API 切换

## [v0.2.0] - 2025-01-16

### 🚀 重大架构升级：Supabase Edge Functions

**后端重构**：
- 🔄 **迁移到 Supabase**: 从 Railway/FastAPI 迁移到 Supabase Edge Functions
- ⚡ **无服务器架构**: 基于 Deno + TypeScript 的 Edge Functions
- 🆓 **永久免费**: Supabase 免费套餐永久可用
- 🌍 **全球部署**: 边缘计算，全球低延迟

**新增 Edge Functions**：
- 📄 `fetch-content`: 网页内容抓取和解析
- 🤖 `process`: AI 内容翻译和解读处理
- 🔍 `test-llm-config`: LLM 配置连通性测试
- ❤️ `health`: 服务健康状态检查

**技术改进**：
- 🗂️ **完整项目结构**: 添加 `supabase/` 目录和配置文件
- ⚙️ **环境配置**: 支持本地开发和生产部署
- 📝 **完整文档**: 全新的部署指南和开发文档
- 🔧 **开发体验**: 本地 Supabase 开发环境支持

**部署优化**：
- 🌐 **Cloudflare + Supabase**: 最佳免费部署组合
- 📋 **详细指南**: 完整的部署文档和故障排除
- 🔄 **向后兼容**: 保留 Docker 部署选项

## [v0.1.1] - 2025-01-16

### Online Demo Features
- 🌐 **在线演示部署**: 支持 Cloudflare Pages + Railway 在线部署
- 🔗 **GitHub 链接**: 导航栏添加项目 GitHub 仓库链接
- 🔒 **隐私保护**: 强化用户 API 密钥隐私保护说明
- 📋 **部署文档**: 完整的在线部署指南和配置说明
- 🎯 **演示优化**: 针对在线演示优化用户体验和安全提示

### Technical Improvements
- ⚙️ **动态 API**: 支持根据部署环境自动配置 API 端点
- 🚀 **部署配置**: 添加 `wrangler.toml` 和 `railway.toml` 配置
- 📝 **文档完善**: 新增 `DEPLOYMENT.md` 详细部署指南

## [v0.1.0] - 2025-01-16

### Features
- 🚀 **多 LLM 支持**: 支持 DeepSeek、OpenAI、Claude、Ollama、LM Studio 等多种 AI 模型
- 🧠 **本地 LLM**: 支持 Ollama 和 LM Studio 本地部署，无需 API Key
- 🔍 **智能爬取**: 自动提取网页正文内容，支持多种网站格式
- 🖼️ **富文本预览**: 保留原文格式、图片、链接等内容
- 📝 **AI 翻译**: 高质量的中英文翻译，可自定义翻译提示词
- 🧐 **智能解读**: AI 分析文章核心要点，生成解读报告
- 📊 **双模式显示**: 支持源码模式和预览模式查看结果
- 📁 **文件导入**: 支持上传本地 Markdown/文本文件
- 📤 **内容导出**: 支持复制内容和下载为文件
- 🕐 **历史记录**: 保存处理历史，支持批量下载
- 🔧 **连接测试**: 内置 LLM 连通性测试功能
- 🐳 **Docker 支持**: 提供完整的 Docker 部署方案

### Technical Stack
- **前端**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **后端**: FastAPI + Python 3.9 + BeautifulSoup4
- **AI 服务**: 多 LLM 支持 (DeepSeek、OpenAI、Claude、Ollama、LM Studio)
- **安全**: DOMPurify 防止 XSS 攻击
- **部署**: Docker + docker-compose

### Architecture
```
bs-blogreader/
├── frontend/          # React + TypeScript 前端
├── backend/           # FastAPI Python 后端
├── docker-compose.yml # Docker 部署配置
└── README.md          # 项目文档
```

### Installation
```bash
# 使用 Docker (推荐)
docker-compose up -d

# 或者本地开发
cd backend && python llm_main.py
cd frontend && npm run dev
```