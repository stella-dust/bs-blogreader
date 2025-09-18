# AI Blog Reader

An intelligent blog reading assistant powered by AI that can automatically crawl web content, provide high-quality translations, and generate smart analysis.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)

## ✨ Features

- 🔍 **Smart Web Scraping**: Automatically extract main content from web pages
- 🤖 **Multi-LLM Support**: DeepSeek, OpenAI, Claude, Ollama, LM Studio
- 🌐 **AI Translation**: High-quality Chinese-English translation
- 📖 **Intelligent Analysis**: AI-powered content summarization and insights
- 📁 **File Upload**: Support for Markdown and text file import
- 💾 **Content Export**: Copy content or download as files
- 🔄 **Smart Chat**: Interactive Q&A with imported content
- 🔍 **Web Search**: Comprehensive search with multiple sources

## 🚀 Quick Start

### Docker (Recommended)
```bash
git clone https://github.com/your-username/bs-blogreader.git
cd bs-blogreader
docker-compose up -d
```

### Local Development
```bash
# Frontend
cd frontend && npm install && npm run dev

# Backend (if using local FastAPI)
cd backend && pip install -r requirements.txt && python llm_main.py
```

## 🔧 Configuration

1. Click the key icon to configure your LLM API settings
2. Choose from cloud APIs (DeepSeek/OpenAI/Claude) or local models (Ollama/LM Studio)
3. Test connectivity to ensure proper setup

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Supabase Edge Functions, FastAPI
- **AI**: Multiple LLM providers
- **Deploy**: Cloudflare Pages, Docker

## 📖 Usage

1. Enter a URL or upload a file
2. Click "Start Crawling" to extract content
3. Use "Translate" and "Analyze" for AI processing
4. Export or interact with the results

## 🤝 Contributing

Issues and Pull Requests are welcome!

## 📄 License

MIT License