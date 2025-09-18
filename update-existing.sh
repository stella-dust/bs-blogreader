#!/bin/bash

# 🔄 更新现有Supabase + Cloudflare部署
# 使用方法: ./update-existing.sh [project-id]

set -e

PROJECT_ID=$1

if [ -z "$PROJECT_ID" ]; then
    echo "❌ 用法: ./update-existing.sh <project-id>"
    echo "💡 在 Supabase Dashboard URL 中查看项目ID"
    echo "   例如: https://supabase.com/dashboard/project/abcdefgh"
    echo "   项目ID就是: abcdefgh"
    exit 1
fi

echo "🔄 更新现有BlogReader部署..."
echo "📍 项目ID: $PROJECT_ID"

# 1. 链接到现有项目
echo "🔗 链接到现有Supabase项目..."
npx supabase link --project-ref $PROJECT_ID

# 2. 部署新的Edge Functions
echo "⚡ 部署新增的智能对话功能..."
echo "   - batch-fetch-content (批量URL抓取)"
npx supabase functions deploy batch-fetch-content

echo "   - comprehensive-search (综合搜索)"
npx supabase functions deploy comprehensive-search

# 3. 更新health函数确保兼容性
echo "   - health (健康检查)"
npx supabase functions deploy health

# 4. 构建最新前端
echo "🏗️ 构建最新前端代码..."
cd frontend
npm run build
cd ..

echo "✅ 更新完成！"
echo ""
echo "📋 下一步操作："
echo "1. 检查Cloudflare Pages环境变量是否正确"
echo "2. 推送代码到Git触发自动部署，或手动部署"
echo "3. 测试新的智能对话功能"
echo ""
echo "🚀 部署命令："
echo "git add . && git commit -m '🚀 Add smart chat features' && git push"
echo ""
echo "或手动部署："
echo "npx wrangler pages publish frontend/dist"