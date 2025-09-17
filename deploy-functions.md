# 手动部署 Edge Functions 到 Supabase

由于访问令牌权限限制，需要手动部署函数。

## 方法1：通过 Supabase Dashboard 手动创建

1. 访问你的项目：https://supabase.com/dashboard/project/oqicgfaczdmrdogikqzi
2. 点击左侧 **Edge Functions**
3. 点击 **Create a new function**

### 创建 fetch-content 函数：
- Function name: `fetch-content`
- 复制 `supabase/functions/fetch-content/index.ts` 的完整内容

### 创建 process 函数：
- Function name: `process`
- 复制 `supabase/functions/process/index.ts` 的完整内容

### 创建 test-llm-config 函数：
- Function name: `test-llm-config`
- 复制 `supabase/functions/test-llm-config/index.ts` 的完整内容

## 方法2：检查组织权限

可能你的访问令牌是在个人账户下创建的，但项目在组织下。请：

1. 检查项目是否在组织账户下
2. 如果是，需要在组织设置中创建具有 Edge Functions 权限的访问令牌
3. 或者确保你的个人账户在组织中有足够权限

## 方法3：升级计划

免费计划可能对 Edge Functions 部署有限制，可以尝试升级到 Pro 计划。

## 当前状态

✅ 前端已配置连接到云端项目
❌ Edge Functions 需要手动部署
✅ 所有函数代码已准备好，在 `supabase/functions/` 目录下