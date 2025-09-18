#!/bin/bash

# 🚀 BlogReader智能助手部署脚本
# 使用方法: ./deploy.sh [project-id] [anon-key]

set -e

PROJECT_ID=$1
ANON_KEY=$2

if [ -z "$PROJECT_ID" ] || [ -z "$ANON_KEY" ]; then
    echo "❌ 用法: ./deploy.sh <project-id> <anon-key>"
    echo "💡 从 Supabase Dashboard > Settings > API 获取这些信息"
    exit 1
fi

PROJECT_URL="https://${PROJECT_ID}.supabase.co"

echo "🚀 开始部署BlogReader到Supabase..."
echo "📍 项目URL: $PROJECT_URL"

# 1. 链接项目
echo "🔗 链接到Supabase项目..."
npx supabase link --project-ref $PROJECT_ID

# 2. 部署Edge Functions
echo "⚡ 部署Edge Functions..."
npx supabase functions deploy health
npx supabase functions deploy fetch-content
npx supabase functions deploy batch-fetch-content
npx supabase functions deploy comprehensive-search
npx supabase functions deploy chat-with-content
npx supabase functions deploy process
npx supabase functions deploy test-llm-config

# 3. 更新前端环境变量
echo "⚙️ 更新前端配置..."
cat > frontend/.env.production << EOF
VITE_SUPABASE_URL=${PROJECT_URL}
VITE_SUPABASE_ANON_KEY=${ANON_KEY}
EOF

# 4. 构建前端
echo "🏗️ 构建前端..."
cd frontend
npm run build
cd ..

echo "✅ 部署完成！"
echo ""
echo "📋 下一步操作："
echo "1. 在Supabase Dashboard配置环境变量（LLM API密钥等）"
echo "2. 部署前端到Vercel/Netlify/Cloudflare Pages"
echo "3. 测试所有功能"
echo ""
echo "🌐 项目访问地址:"
echo "• Supabase Dashboard: https://supabase.com/dashboard/project/$PROJECT_ID"
echo "• API Base URL: $PROJECT_URL"
echo "• Functions: $PROJECT_URL/functions/v1/"