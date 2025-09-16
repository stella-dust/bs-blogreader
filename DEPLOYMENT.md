# 🚀 在线演示部署指南

本文档介绍如何将 BlogReader 部署到 Cloudflare Pages（前端）和 Supabase（后端）以创建在线演示。

## 🌐 部署架构

```
用户浏览器 → Cloudflare Pages (前端) → Supabase Edge Functions (后端) → AI API 服务商
```

## 🆓 免费方案对比

| 服务商 | 免费额度 | 限制 | 推荐指数 |
|--------|----------|------|----------|
| **Supabase** | 永久免费 | 500MB 数据库 + 2GB 带宽/月 | ⭐⭐⭐⭐⭐ |
| **Cloudflare Pages** | 永久免费 | 500次构建/月，无限制流量 | ⭐⭐⭐⭐⭐ |

## 📋 前期准备

1. **GitHub 仓库**: 确保代码已推送到 GitHub
2. **Supabase 账户**: [注册](https://app.supabase.com/)
3. **Cloudflare 账户**: [注册](https://dash.cloudflare.com/sign-up)
4. **AI API 密钥**: 用户自行提供
5. **Supabase CLI**: 本地开发需要

## 🚀 部署步骤

### 步骤 1: 部署后端到 Supabase

#### 1.1 创建 Supabase 项目

1. 访问 [Supabase Dashboard](https://app.supabase.com/)
2. 点击 "New Project"
3. 填写项目信息：
   - **Name**: `bs-blogreader`
   - **Organization**: 选择组织
   - **Region**: 选择就近区域
4. 等待项目创建完成

#### 1.2 安装和配置 Supabase CLI

```bash
# 安装 Supabase CLI
npm install -g @supabase/cli

# 登录 Supabase
supabase login

# 进入项目目录
cd bs-blogreader

# 连接到远程项目
supabase link --project-ref your-project-id
```

> 💡 **获取 project-id**: 在 Supabase Dashboard → Settings → General → Reference ID

#### 1.3 部署 Edge Functions

```bash
# 部署所有 Edge Functions
supabase functions deploy fetch-content
supabase functions deploy process
supabase functions deploy test-llm-config
supabase functions deploy health

# 或者一次性部署所有
supabase functions deploy
```

#### 1.4 记录后端信息

部署完成后，记录以下信息：
- **项目 URL**: `https://your-project-id.supabase.co`
- **Anonymous Key**: 在 Dashboard → Settings → API 中找到

### 步骤 2: 部署前端到 Cloudflare Pages

#### 2.1 创建 Pages 项目

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 "Workers & Pages" → "Pages"
3. 点击 "Create application" → "Connect to Git"
4. 选择 `bs-blogreader` 仓库

#### 2.2 配置构建设置

- **Framework preset**: `Other`
- **Build command**: `cd frontend && npm install && npm run build`
- **Build output directory**: `frontend/dist`
- **Root directory**: `/`

#### 2.3 设置环境变量

在 Cloudflare Pages 设置中添加：

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 步骤 3: 验证部署

1. **测试后端**: 访问 `https://your-project-id.supabase.co/functions/v1/health`
2. **测试前端**: 访问 Cloudflare Pages 提供的 URL
3. **功能测试**: 输入测试 URL 验证完整流程

## 🔧 配置详情

### supabase/config.toml

```toml
project_id = "bs-blogreader"

[api]
enabled = true
port = 54321

[db]
enabled = true
port = 54322

[studio]
enabled = true
port = 54323

[edge_runtime]
enabled = true
port = 54325
```

### frontend/wrangler.toml

```toml
name = "bs-blogreader"
compatibility_date = "2023-10-30"

[build]
command = "npm run build"
cwd = "."

[[pages_build_output_dir]]
dir = "dist"
```

## 🛡️ 安全特性

- **API 密钥隐私**: 用户密钥仅存储在本地浏览器
- **Edge Functions**: 服务器端代理 API 调用，不存储敏感信息
- **CORS 保护**: 内置跨域请求保护
- **HTTPS 强制**: 所有连接使用 HTTPS

## 🧪 本地开发

### 启动 Supabase 本地环境

```bash
# 启动本地 Supabase
supabase start

# 查看本地服务状态
supabase status
```

本地服务地址：
- **API URL**: `http://localhost:54321`
- **Studio URL**: `http://localhost:54323`
- **Edge Functions**: `http://localhost:54321/functions/v1/`

### 启动前端开发服务器

```bash
cd frontend
npm install
npm run dev
```

前端将在 `http://localhost:3000` 启动，自动代理到本地 Supabase。

## 📊 监控与维护

### Supabase 监控

- **Dashboard**: 查看函数调用统计
- **Logs**: 实时查看 Edge Function 日志
- **Metrics**: 监控资源使用情况

### Cloudflare Pages 监控

- **Analytics**: 访问统计和性能指标
- **Deployments**: 构建历史和状态
- **Functions**: 页面函数执行统计

## 🚨 故障排除

### 常见问题

#### 1. Edge Function 部署失败

```bash
# 检查函数语法
supabase functions verify fetch-content

# 查看详细错误
supabase functions deploy fetch-content --debug
```

#### 2. 前端无法连接后端

- 检查 `VITE_SUPABASE_URL` 环境变量
- 确认 Supabase 项目状态正常
- 验证 CORS 配置

#### 3. AI API 调用失败

- 在浏览器开发者工具检查网络请求
- 验证用户提供的 API 密钥
- 检查 Edge Function 日志

### 日志查看

#### Supabase 日志

```bash
# 查看特定函数日志
supabase functions logs fetch-content

# 实时监控日志
supabase functions logs --follow
```

#### 浏览器调试

```javascript
// 在控制台检查配置
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Environment:', import.meta.env.MODE);
```

## 💡 优化建议

### 性能优化

1. **函数缓存**: 考虑为重复请求添加缓存
2. **图片优化**: 使用 Cloudflare 图片优化
3. **CDN 配置**: 充分利用全球 CDN 网络

### 成本控制

1. **请求限制**: 设置合理的请求频率限制
2. **资源监控**: 定期检查用量避免超出免费额度
3. **日志管理**: 及时清理旧日志文件

## 🔄 更新部署

### 自动部署

- **前端**: 推送到 main 分支自动触发 Cloudflare Pages 重新构建
- **后端**: 使用 `supabase functions deploy` 更新 Edge Functions

### 版本管理

```bash
# 为新版本创建 tag
git tag v0.2.0
git push origin v0.2.0

# 部署特定版本的函数
supabase functions deploy --ref v0.2.0
```

## 📞 技术支持

遇到部署问题请：

1. 查看 [Supabase 文档](https://supabase.com/docs)
2. 检查 [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
3. 提交 [GitHub Issues](https://github.com/stella-dust/bs-blogreader/issues)

---

*🎯 部署完成后，您的 BlogReader 在线演示将运行在完全免费的 Supabase + Cloudflare 架构上！*