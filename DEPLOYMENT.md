# 部署指南 - Cloudflare Pages + Supabase

## 概述
本项目采用现代化架构：
- **前端**: React + Vite → Cloudflare Pages
- **后端**: Supabase Edge Functions (Deno)
- **域名**: blogreader.builderstream.info

## 部署步骤

### 1. 部署 Supabase Edge Functions

#### 方法 A: 通过 Supabase Dashboard (推荐)
1. 访问：https://supabase.com/dashboard/project/oqicgfaczdmrdoglkqzi
2. 进入 **Edge Functions**
3. 创建以下三个函数：

**fetch-content 函数**：
- Function name: `fetch-content`
- 复制 `supabase/functions/fetch-content/index.ts` 完整内容

**process 函数**：
- Function name: `process`
- 复制 `supabase/functions/process/index.ts` 完整内容

**test-llm-config 函数**：
- Function name: `test-llm-config`
- 复制 `supabase/functions/test-llm-config/index.ts` 完整内容

#### 方法 B: 使用 Supabase CLI (需要访问令牌权限)
```bash
supabase functions deploy fetch-content
supabase functions deploy process
supabase functions deploy test-llm-config
```

### 2. 部署 Cloudflare Pages

#### 准备工作
1. 确保代码已推送到 GitHub
2. 登录 Cloudflare Dashboard

#### 创建 Pages 项目
1. 进入 **Pages** → **Create a project**
2. 选择 **Connect to Git**
3. 授权并选择 `bs-blogreader` 仓库
4. 配置构建设置：
   ```
   Framework preset: Vite
   Build command: cd frontend && npm run build
   Build output directory: frontend/dist
   Root directory: /
   ```

#### 环境变量配置
在 Cloudflare Pages 设置中添加：
```
VITE_SUPABASE_URL=https://oqicgfaczdmrdoglkqzi.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xaWNnZmFjemRtcmRvZ2xrcXppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMzAyMzUsImV4cCI6MjA3MzYwNjIzNX0.mXWZ-YA2oiQ2LX8o_lePm3gkXdl5VdhmZEi262jn6Ss
```

### 3. 配置自定义域名

#### 在 Cloudflare Pages 中：
1. 进入项目 → **Custom domains**
2. 点击 **Set up a custom domain**
3. 输入：`blogreader.builderstream.info`
4. Cloudflare 会自动配置 DNS（如果域名在 Cloudflare 管理）

#### 如果域名不在 Cloudflare：
添加 CNAME 记录：
```
Name: blogreader
Target: [cloudflare-pages-url].pages.dev
```

### 4. 配置生产环境文件

创建 `frontend/.env.production`：
```bash
# 生产环境配置
VITE_SUPABASE_URL=https://oqicgfaczdmrdoglkqzi.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xaWNnZmFjemRtcmRvZ2xrcXppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMzAyMzUsImV4cCI6MjA3MzYwNjIzNX0.mXWZ-YA2oiQ2LX8o_lePm3gkXdl5VdhmZEi262jn6Ss
```

### 5. 验证部署

部署完成后访问：`https://blogreader.builderstream.info`

测试功能：
- [ ] 博客URL抓取
- [ ] DeepSeek API连接测试
- [ ] 内容翻译功能
- [ ] 内容解读功能

## 故障排除

### Supabase Functions 部署失败
- 检查访问令牌权限
- 使用 Dashboard 手动创建
- 验证函数代码语法

### Cloudflare Pages 构建失败
- 检查 `package.json` 路径
- 验证构建命令：`cd frontend && npm run build`
- 检查环境变量配置

### CORS 错误
- 确保 Supabase Functions 包含正确的 CORS headers
- 验证环境变量中的 Supabase URL 和 API Key

### 自定义域名问题
- DNS 传播可能需要 24-48 小时
- 检查 SSL 证书自动颁发状态
- 验证 CNAME 记录配置

## 本地开发

继续使用本地 Supabase：
```bash
# 启动本地 Supabase
supabase start

# 启动前端开发服务器
cd frontend && npm run dev
```

使用 `.env.local` 配置本地环境，`.env.proxy` 用于云端测试。