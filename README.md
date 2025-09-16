# AI 博客解读助手 (BuilderStream AI BlogReader)

一个基于 AI 的博客解读工具，可以自动爬取网页内容，进行中文翻译和智能解读。

![项目截图](./frontend/public/logo.svg)

## 🌐 在线演示

**🎯 [在线体验地址](https://bs-blogreader.pages.dev)** *(演示环境，请自行配置 API 密钥)*

> **隐私保护说明**: 在线演示版本中，您的 API 密钥仅存储在本地浏览器中，不会上传到任何服务器。所有 AI API 调用直接连接到相应的服务商。

## 🚀 功能特性

- **智能爬取**: 自动提取网页正文内容，支持多种网站格式
- **多 LLM 支持**: 支持 DeepSeek、OpenAI、Claude、Ollama、LM Studio 等多种 AI 模型
- **本地 LLM**: 支持 Ollama 和 LM Studio 本地部署，无需 API Key
- **AI 翻译**: 高质量的中英文翻译，可自定义翻译提示词
- **智能解读**: AI 分析文章核心要点，生成解读报告
- **多种格式**: 支持源码模式和预览模式查看结果
- **文件导入**: 支持上传本地 Markdown/文本文件
- **内容导出**: 支持复制内容和下载为文件
- **历史记录**: 保存处理历史，支持批量下载
- **连接测试**: 内置 LLM 连通性测试功能

## 🏗️ 项目架构

```
bs-blogreader/
├── frontend/                 # React + TypeScript 前端
│   ├── src/
│   │   ├── components/      # UI 组件
│   │   │   ├── ui/         # 基础 UI 组件 (shadcn/ui)
│   │   │   ├── ApiKeyDialog.tsx     # API Key 设置弹窗
│   │   │   ├── ContentPanel.tsx     # 内容显示面板
│   │   │   ├── HistoryDropdown.tsx  # 历史记录下拉菜单
│   │   │   ├── LoadingSpinner.tsx   # 加载动画组件
│   │   │   └── PromptDialog.tsx     # 提示词设置弹窗
│   │   ├── lib/            # 工具函数
│   │   ├── services/       # API 服务
│   │   ├── App.tsx         # 主应用组件
│   │   ├── main.tsx        # 应用入口
│   │   └── index.css       # 全局样式
│   ├── public/             # 静态资源
│   ├── package.json        # 前端依赖配置
│   ├── tailwind.config.js  # Tailwind CSS 配置
│   └── vite.config.ts      # Vite 构建配置
├── backend/                 # FastAPI Python 后端
│   ├── main.py             # 后端主文件
│   └── requirements.txt    # Python 依赖
└── README.md               # 项目文档
```

## 🛠️ 技术栈

### 前端
- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **UI 库**: Tailwind CSS + shadcn/ui
- **图标**: Lucide React
- **Markdown**: react-markdown + remark-gfm

### 后端
- **框架**: FastAPI
- **AI 服务**: 多 LLM 支持 (DeepSeek、OpenAI、Claude、Ollama、LM Studio)
- **网页解析**: BeautifulSoup4 + requests
- **跨域**: CORS 中间件

## 📦 安装部署

### 环境要求
- Node.js 16+
- Python 3.8+
- API Key (DeepSeek/OpenAI/Claude) 或本地 LLM (Ollama/LM Studio)

### 1. 克隆项目
```bash
git clone <repository-url>
cd bs-blogreader
```

### 2. 安装前端依赖
```bash
cd frontend
npm install
```

### 3. 安装后端依赖
```bash
cd ../backend
pip install -r requirements.txt
```

### 4. 启动服务

**启动后端 (端口 8001)**:
```bash
cd backend
python llm_main.py
```

**启动前端 (端口 3001)**:
```bash
cd frontend
npm run dev
```

### 5. 访问应用
打开浏览器访问: `http://localhost:3001`

## 🌐 在线部署

### Cloudflare Pages + Railway 部署

项目支持分离式部署：前端部署到 Cloudflare Pages，后端部署到 Railway。

**详细部署指南**: 查看 [DEPLOYMENT.md](./DEPLOYMENT.md)

#### 快速部署步骤

1. **后端部署 (Railway)**:
   - Fork 本项目到您的 GitHub
   - 在 [Railway](https://railway.app/) 连接 GitHub 仓库
   - 自动识别 `railway.toml` 配置并部署

2. **前端部署 (Cloudflare Pages)**:
   - 在 [Cloudflare Pages](https://pages.cloudflare.com/) 连接同一仓库
   - 设置构建命令: `cd frontend && npm install && npm run build`
   - 设置输出目录: `frontend/dist`
   - 配置环境变量 `VITE_API_URL` 指向 Railway 后端地址

3. **访问演示**: 部署完成后即可访问在线版本

## 🐳 Docker 部署

### 使用 Docker Compose (推荐)
```bash
# 克隆项目
git clone <repository-url>
cd bs-blogreader

# 一键启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

访问: `http://localhost`

### 单独构建
**构建后端**:
```bash
cd backend
docker build -t blogreader-backend .
docker run -p 8001:8001 blogreader-backend
```

**构建前端**:
```bash
cd frontend
docker build -t blogreader-frontend .
docker run -p 80:80 blogreader-frontend
```

## 🔧 配置说明

### LLM 配置
1. 点击右上角的钥匙图标打开 LLM 配置面板
2. 选择 LLM 类型：
   - **DeepSeek**: 需要 DeepSeek API Key
   - **OpenAI**: 需要 OpenAI API Key
   - **Claude**: 需要 Anthropic API Key
   - **Ollama**: 本地部署，需要启动 Ollama 服务
   - **LM Studio**: 本地部署，需要启动 LM Studio
3. 根据选择的类型填入相应配置
4. 点击"测试连接"验证连通性
5. 保存设置

### 本地 LLM 部署
**Ollama 部署**:
```bash
# 安装 Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# 下载模型 (例如 llama2)
ollama pull llama2

# 启动服务 (默认端口 11434)
ollama serve
```

**LM Studio 部署**:
1. 下载并安装 [LM Studio](https://lmstudio.ai/)
2. 在 LM Studio 中下载模型
3. 启动本地服务器 (默认端口 1234)

### 代理配置
前端通过 Vite 代理转发 API 请求到后端:
```typescript
// vite.config.ts
server: {
  proxy: {
    '/api': 'http://localhost:8001'
  }
}
```

## 📖 使用指南

### 基本工作流程
1. **设置 API Key**: 点击右上角钥匙图标，输入并测试 DeepSeek API Key
2. **获取内容**:
   - 输入网页 URL，点击"开始爬取"
   - 或点击"上传文件"导入本地文档
3. **AI 处理**:
   - 点击"开始翻译"进行中文翻译
   - 点击"开始解读"获取 AI 分析
4. **查看结果**: 切换"源码模式"和"预览模式"查看处理结果
5. **导出内容**: 使用复制/下载功能保存结果

### 功能详解

#### 🕷️ 网页爬取
- 支持大部分主流网站
- 自动提取文章标题、正文、作者信息
- 智能过滤广告和无关内容

#### 🤖 AI 翻译
- 基于 DeepSeek 大语言模型
- 保持原文格式和结构
- 支持技术术语准确翻译

#### 🧠 智能解读
- 提取文章核心要点
- 生成引导性思考问题
- 提供阅读重点建议

#### 📁 历史记录
- 自动保存处理历史
- 支持历史记录下载
- 一键导出完整报告

## 🔌 API 接口

### 后端 API 端点

| 端点 | 方法 | 描述 |
|------|------|------|
| `/` | GET | 健康检查 |
| `/api/health` | GET | 服务状态 |
| `/api/fetch-content` | POST | 爬取网页内容 |
| `/api/process` | POST | AI 内容处理 |
| `/api/test-llm-config` | POST | LLM 配置测试 |

### 请求示例

**爬取内容**:
```json
POST /api/fetch-content
{
  "url": "https://example.com/article"
}
```

**AI 处理**:
```json
POST /api/process
{
  "content": "文章内容...",
  "prompt": "翻译提示词...",
  "llm_config": {
    "type": "deepseek",
    "apiKey": "sk-xxx",
    "baseURL": "https://api.deepseek.com",
    "model": "deepseek-chat"
  }
}
```

**LLM 配置测试**:
```json
POST /api/test-llm-config
{
  "llm_config": {
    "type": "ollama",
    "apiKey": "",
    "baseURL": "http://localhost:11434",
    "model": "llama2"
  }
}
```

## 🎨 UI 组件说明

### 核心组件

- **`App.tsx`**: 主应用，管理全局状态和布局
- **`ContentPanel.tsx`**: 通用内容显示面板，支持 Markdown 渲染
- **`ApiKeyDialog.tsx`**: API Key 设置弹窗，包含测试功能
- **`HistoryDropdown.tsx`**: 历史记录下拉菜单
- **`LoadingSpinner.tsx`**: 统一的加载动画组件
- **`PromptDialog.tsx`**: 提示词编辑弹窗

### UI 库组件 (`components/ui/`)
基于 shadcn/ui 的预制组件:
- `Button`, `Input`, `Dialog`, `Tabs` 等

## 🔍 开发指南

### 本地开发
```bash
# 同时启动前后端 (需要两个终端)
npm run dev  # 前端
python main.py  # 后端
```

### 构建生产版本
```bash
cd frontend
npm run build
```

### 代码规范
- 使用 TypeScript 严格模式
- 遵循 React Hooks 最佳实践
- 使用 Tailwind CSS 进行样式设计
- 组件采用函数式声明

## 🚨 注意事项

1. **API Key 安全**: API Key 仅在前端临时存储，请勿在公开仓库中暴露
2. **网络访问**: 爬取功能需要稳定的网络连接
3. **跨域限制**: 某些网站可能有反爬虫机制
4. **API 限制**: 注意各 LLM 服务的调用频率和配额限制
5. **本地 LLM**: 使用本地 LLM 时确保模型已正确下载和启动
6. **开源使用**: 本项目为开源项目，用户需要使用自己的 API Key 或本地 LLM

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 如何贡献
1. Fork 本项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 开发建议
- 遵循现有代码风格
- 添加适当的注释
- 测试新功能
- 更新相关文档

## 📧 联系方式

如有问题请通过 GitHub Issues 联系。