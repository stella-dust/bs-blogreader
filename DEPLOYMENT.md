# 🚀 在线演示部署指南

本文档介绍如何将 BlogReader 部署到 Cloudflare Pages（前端）和 Railway（后端）以创建在线演示。

## 🌐 部署架构

```
用户浏览器 → Cloudflare Pages (前端) → Railway (后端) → AI API 服务商
```

## 📋 前期准备

1. **GitHub 仓库**: 确保代码已推送到 GitHub
2. **Cloudflare 账户**: [注册](https://dash.cloudflare.com/sign-up)
3. **Railway 账户**: [注册](https://railway.app/)
4. **AI API 密钥**: 用户自行提供

## 🚀 部署步骤

### 步骤 1: 部署后端到 Railway

1. 访问 [Railway](https://railway.app/) 并登录
2. 点击 "New Project" → "Deploy from GitHub repo"
3. 选择 `bs-blogreader` 仓库
4. Railway 会自动识别 `railway.toml` 配置
5. 部署完成后，记录后端 URL（如：`https://your-app.railway.app`）

#### Railway 环境变量配置

在 Railway 项目设置中添加以下环境变量：

```env
PORT=8001
PYTHONPATH=/app/backend
```

### 步骤 2: 部署前端到 Cloudflare Pages

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 "Workers & Pages" → "Pages"
3. 点击 "Create application" → "Connect to Git"
4. 选择 `bs-blogreader` 仓库
5. 配置构建设置：
   - **Framework preset**: `Other`
   - **Build command**: `cd frontend && npm install && npm run build`
   - **Build output directory**: `frontend/dist`
   - **Root directory**: `/`

#### Cloudflare Pages 环境变量

在 Pages 设置中添加：

```env
VITE_API_URL=https://your-railway-backend-url
```

### 步骤 3: 域名配置（可选）

如果要使用自定义域名：

1. 在 Cloudflare Pages 中添加自定义域名
2. 更新 Railway 后端的 CORS 配置以允许新域名

## 🔧 配置详情

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

### railway.toml
```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "cd backend && python llm_main.py"
healthcheckPath = "/health"
healthcheckTimeout = 100
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

## 🛡️ 安全特性

- **API 密钥隐私**: 密钥仅存储在用户浏览器本地
- **直连 AI 服务**: 后端代理 API 调用，不存储密钥
- **CORS 保护**: 限制跨域访问
- **HTTPS 强制**: 所有连接均使用 HTTPS

## 🧪 测试部署

1. 访问部署的前端 URL
2. 点击右上角密钥图标配置 AI API
3. 输入测试 URL 验证功能

## 📊 监控与维护

### Railway 监控
- 查看应用日志：Railway Dashboard → Your App → Logs
- 监控资源使用：Dashboard → Metrics

### Cloudflare Pages 监控
- 访问统计：Cloudflare Dashboard → Analytics
- 构建历史：Pages → Your Site → Deployments

## 🚨 故障排除

### 常见问题

1. **前端无法连接后端**
   - 检查 `VITE_API_URL` 环境变量
   - 确认后端服务正常运行

2. **AI API 调用失败**
   - 验证用户提供的 API 密钥有效性
   - 检查后端日志中的错误信息

3. **构建失败**
   - 检查 Node.js 版本兼容性
   - 确认所有依赖项正确安装

### 日志查看

**Railway 后端日志:**
```bash
# 在 Railway Dashboard 中查看实时日志
```

**浏览器调试:**
```javascript
// 在浏览器控制台检查网络请求
console.log('API Base URL:', window.__API_URL__);
```

## 💡 优化建议

1. **CDN 配置**: 利用 Cloudflare 的全球 CDN
2. **缓存策略**: 为静态资源配置合适的缓存头
3. **压缩优化**: 启用 Gzip/Brotli 压缩
4. **监控告警**: 设置服务异常告警

## 🔄 更新部署

### 自动部署
- 推送到 main 分支自动触发重新部署
- Railway 和 Cloudflare Pages 都支持自动部署

### 手动部署
```bash
# 手动触发 Cloudflare Pages 部署
git push origin main

# Railway 会自动检测变更并重新部署
```

## 📞 技术支持

如遇到部署问题，请：

1. 检查 [GitHub Issues](https://github.com/stella-dust/bs-blogreader/issues)
2. 查看本项目的 [部署文档](./DEPLOYMENT.md)
3. 提交新的 Issue 描述问题

---

*🎯 部署完成后，您的 BlogReader 在线演示就可以供全球用户访问了！*