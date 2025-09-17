# BS-BlogReader 本地开发与部署指南

## 架构说明

本项目采用以下技术栈：
- **前端**: React + Vite + TypeScript (部署到 Cloudflare Pages)
- **后端**: Supabase Edge Functions (Deno)
- **数据库**: Supabase PostgreSQL

## 本地开发环境设置

### 1. 安装依赖

首先确保安装了以下工具：
- Node.js (推荐 v18+)
- Supabase CLI
- Git

### 2. 安装 Supabase CLI

```bash
# Windows (使用 scoop)
scoop install supabase

# macOS (使用 Homebrew)
brew install supabase/tap/supabase

# 或者使用 npm 全局安装
npm install -g supabase
```

### 3. 启动 Supabase 本地开发环境

在项目根目录执行：

```bash
# 启动 Supabase 本地服务
supabase start

# 等待服务启动完成，会显示如下信息：
# API URL: http://localhost:54321
# DB URL: postgresql://postgres:postgres@localhost:54322/postgres
# Studio URL: http://localhost:54323
# anon key: eyJ...（匿名密钥）
# service_role key: eyJ...（服务角色密钥）
```

### 4. 配置前端环境变量

前端环境变量已经预配置在 `frontend/.env.local` 文件中：

```bash
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
```

### 5. 启动前端开发服务器

```bash
cd frontend
npm install
npm run dev
```

前端将在 http://localhost:5173 启动。

### 6. 验证本地部署

1. 打开浏览器访问 http://localhost:5173
2. 输入一个博客URL，例如：https://www.anthropic.com/engineering/writing-tools-for-agents
3. 点击"开始爬取"按钮，应该能成功获取内容
4. 配置API密钥后，测试翻译和解读功能

## 生产环境部署

### 1. Supabase 云端项目设置

1. 访问 https://supabase.com 创建新项目
2. 等待项目初始化完成
3. 在项目设置中获取：
   - Project URL: `https://your-project-ref.supabase.co`
   - API Key (anon/public): `eyJ...`

### 2. 部署 Edge Functions

```bash
# 登录 Supabase（如果还没有登录）
supabase login

# 关联本地项目到云端项目
supabase link --project-ref your-project-ref

# 部署所有 Edge Functions
supabase functions deploy

# 或单独部署特定函数
supabase functions deploy fetch-content
supabase functions deploy process
```

### 3. Cloudflare Pages 部署

1. **连接 GitHub 仓库**
   - 登录 Cloudflare Dashboard
   - 进入 Pages 选项
   - 选择 "Connect to Git"
   - 授权并选择你的仓库

2. **配置构建设置**
   - Framework preset: `Vite`
   - Build command: `cd frontend && npm run build`
   - Build output directory: `frontend/dist`
   - Root directory: `/` (项目根目录)

3. **配置环境变量**
   在 Cloudflare Pages 项目设置的 Environment variables 中添加：
   - `VITE_SUPABASE_URL`: `https://your-project-ref.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `your_anon_key_here`

4. **触发部署**
   - 推送代码到 GitHub 主分支
   - Cloudflare Pages 会自动触发构建和部署

## 常用命令

### Supabase 相关

```bash
# 查看本地服务状态
supabase status

# 停止本地服务
supabase stop

# 重置本地数据库
supabase db reset

# 查看函数日志
supabase functions logs fetch-content

# 本地测试函数
supabase functions serve

# 生成数据库类型定义
supabase gen types typescript --local > types/supabase.ts
```

### 前端开发

```bash
# 安装依赖
cd frontend && npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview

# 代码检查
npm run lint
```

## 故障排除

### 1. Supabase 服务启动失败

```bash
# 清理并重新启动
supabase stop
supabase start
```

### 2. 端口冲突

如果默认端口被占用，可以修改 `supabase/config.toml` 中的端口设置。

### 3. 前端连接后端失败

1. 确认 Supabase 本地服务正常运行
2. 检查 `frontend/.env.local` 中的 URL 配置
3. 查看浏览器控制台错误信息

### 4. Edge Functions 部署失败

1. 确认已正确登录 Supabase CLI
2. 检查项目是否正确关联云端项目
3. 查看函数代码是否有语法错误

## 项目结构

```
bs-blogreader/
├── frontend/                 # React 前端应用
│   ├── src/
│   ├── package.json
│   ├── .env.local           # 本地开发环境变量
│   └── .env.example         # 环境变量模板
├── supabase/                # Supabase 配置和函数
│   ├── functions/           # Edge Functions
│   ├── migrations/          # 数据库迁移
│   └── config.toml          # Supabase 配置
├── wrangler.toml            # Cloudflare Pages 配置
├── .env.example             # 根目录环境变量模板
└── SETUP.md                 # 本文档
```

## 开发工作流

1. **本地开发**：使用 `supabase start` 启动本地服务，`npm run dev` 启动前端
2. **测试功能**：在本地环境测试所有功能
3. **部署后端**：使用 `supabase functions deploy` 部署云端函数
4. **部署前端**：推送代码到 GitHub，Cloudflare Pages 自动部署

按照以上步骤，你应该能够成功设置本地开发环境并部署到生产环境。