# 🚀 Supabase部署指南

## 📋 部署步骤

### 1. 创建Supabase云端项目
1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 点击 "New Project"
3. 填写项目名称和密码
4. 选择区域（推荐离你最近的）
5. 等待项目创建完成（约2分钟）

### 2. 获取项目配置信息
在项目Dashboard > Settings > API中获取：
- **Project URL**: `https://your-project-id.supabase.co`
- **anon/public key**: `eyJhbGc...`
- **service_role/secret key**: `eyJhbGc...`

### 3. 配置本地环境连接云端

#### 方法A: 使用链接命令
```bash
# 在项目根目录执行
npx supabase link --project-ref YOUR_PROJECT_ID

# 推送本地函数到云端
npx supabase functions deploy

# 推送数据库结构（如果有）
npx supabase db push
```

#### 方法B: 手动配置
```bash
# 更新 frontend/.env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. 部署Edge Functions
```bash
# 部署所有函数
npx supabase functions deploy

# 或单独部署每个函数
npx supabase functions deploy health
npx supabase functions deploy fetch-content
npx supabase functions deploy batch-fetch-content
npx supabase functions deploy comprehensive-search
npx supabase functions deploy chat-with-content
npx supabase functions deploy process
npx supabase functions deploy test-llm-config
```

### 5. 配置环境变量（在Supabase Dashboard）
在 Project Settings > Edge Functions > Environment Variables 中添加：
```
LLM_API_KEYS=your-api-keys-here
SEARXNG_URL=http://your-searxng-instance.com
```

### 6. 更新前端配置
```bash
# 更新 frontend/.env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 7. 部署前端
#### 选项A: Vercel
```bash
npm install -g vercel
cd frontend
vercel --prod
```

#### 选项B: Netlify
```bash
npm install -g netlify-cli
cd frontend
npm run build
netlify deploy --prod --dir=dist
```

#### 选项C: Cloudflare Pages
```bash
# 在项目根目录已配置wrangler.toml
npm run build
npx wrangler pages publish frontend/dist
```

### 8. 测试部署
1. 访问前端URL
2. 检查服务状态指示器
3. 测试所有功能：
   - URL抓取
   - Web搜索
   - 原文分析
   - 引用系统

## 🔧 故障排除

### 常见问题
1. **CORS错误**: 确保Edge Functions包含正确的CORS头
2. **404错误**: 检查函数是否正确部署
3. **认证错误**: 验证API密钥是否正确
4. **超时**: 调整函数超时设置

### 调试命令
```bash
# 查看函数日志
npx supabase functions logs --function-name health

# 本地测试函数
npx supabase functions serve --debug

# 检查项目状态
npx supabase status
```

## 📊 成本估算
- **Supabase**: 免费层包含500MB数据库 + 2GB带宽
- **边缘函数**: 免费层500,000次调用/月
- **Vercel**: 免费层包含100GB带宽
- **总计**: 对于个人项目完全免费

## 🎯 生产环境优化
1. 启用数据库备份
2. 配置自定义域名
3. 启用分析监控
4. 设置告警通知
5. 优化函数性能

## 🔐 安全配置
1. 配置RLS（行级安全）
2. 限制API密钥权限
3. 启用日志审计
4. 设置速率限制