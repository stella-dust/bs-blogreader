# Changelog

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