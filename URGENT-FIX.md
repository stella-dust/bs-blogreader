# 🚨 紧急修复：生产环境配置

## 🔴 问题
生产环境无法使用智能对话功能，因为缺少正确的API配置。

## ✅ 解决步骤（5分钟修复）

### 步骤1: 获取真实API Key
1. 访问: https://supabase.com/dashboard/project/oqicgfaczdmrdoglkqzi
2. 点击: Settings > API
3. 复制: `anon` `public` key（长字符串）

### 步骤2: 在Cloudflare Pages配置环境变量
1. 访问: https://dash.cloudflare.com
2. 进入: Pages > bs-blogreader-frontend > Settings > Environment variables
3. 添加变量：
   ```
   名称: VITE_SUPABASE_URL
   值: https://oqicgfaczdmrdoglkqzi.supabase.co

   名称: VITE_SUPABASE_ANON_KEY
   值: [从步骤1复制的真实key]
   ```
4. 点击: Save

### 步骤3: 重新部署
方法A - 触发重新部署：
```bash
git commit --allow-empty -m "🔧 Fix: Trigger redeploy with correct env vars"
git push
```

方法B - 在Cloudflare Dashboard手动重新部署

### 步骤4: 验证修复
等待2-3分钟，然后访问:
https://blogreader.builderstream.info/

检查服务状态指示器是否显示"服务正常"

## 🎯 预期结果
- ✅ 服务状态指示器显示"服务正常"
- ✅ 智能对话功能可用
- ✅ 可以测试URL抓取、Web搜索等功能

## ❓ 如果仍有问题
请检查：
1. API key是否正确复制（无空格、完整）
2. Cloudflare环境变量是否正确保存
3. 部署是否完成（Cloudflare Pages > Deployments）