# 🔄 更新现有部署指南

## 📋 使用现有Supabase项目的步骤

### 1. 获取现有项目信息
在你的Supabase Dashboard中：
- 访问 Settings > API
- 复制 Project URL 和 anon key

### 2. 链接本地项目到现有云端项目
```bash
# 链接到现有项目 (替换YOUR_PROJECT_ID)
npx supabase link --project-ref YOUR_PROJECT_ID
```

### 3. 部署新的Edge Functions
```bash
# 部署所有新增的智能对话功能
npx supabase functions deploy batch-fetch-content
npx supabase functions deploy comprehensive-search
```

### 4. 更新Cloudflare Pages环境变量
在Cloudflare Dashboard > Pages > 你的项目 > Settings > Environment Variables中确保：
```
VITE_SUPABASE_URL = https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY = your_anon_key_here
```

### 5. 重新部署
```bash
# 方法A: 推送到Git自动触发部署
git add .
git commit -m "🚀 Add smart chat features"
git push

# 方法B: 手动部署
npx wrangler pages publish frontend/dist
```

## ✅ 验证部署
1. 访问你的Cloudflare Pages URL
2. 检查服务状态指示器
3. 测试新的智能对话功能

## 🎯 你不需要：
- ❌ 创建新的Supabase项目
- ❌ 重新配置Cloudflare Pages
- ❌ 更改域名或DNS设置

## 🎉 你只需要：
- ✅ 部署新的Edge Functions
- ✅ 确认环境变量正确
- ✅ 重新部署前端代码