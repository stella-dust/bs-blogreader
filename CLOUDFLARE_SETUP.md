# Cloudflare Pages 部署配置指南

## 避免自动部署开发版本的配置方法

### 1. 分支部署配置（推荐）

在 Cloudflare Pages 项目设置中：

1. 进入 **Settings** → **Builds & deployments**
2. 找到 **Branch deployments** 部分
3. 设置以下配置：

```
Production branch: main
Branch deployment control: Custom branches
Include: main, release/*
Exclude: dev, dev-*, feature/*, hotfix/*
```

这样只有 `main` 分支和 `release/*` 分支会触发部署。

### 2. 构建跳过配置

如果需要跳过特定提交的部署，在 commit message 中添加：
```
[skip ci] 或 [ci skip]
```

### 3. 环境变量配置

生产环境变量在 Cloudflare Pages 设置中配置：
- `VITE_SUPABASE_URL`: 你的 Supabase 项目 URL
- `VITE_SUPABASE_ANON_KEY`: 你的 Supabase anon key

### 4. 文件忽略配置

项目根目录的 `.cfpagesignore` 文件可以忽略不必要的文件，减少部署触发。

## 版本发布工作流建议

### 开发流程
1. 在 `dev` 分支或 `feature/*` 分支开发
2. 开发完成后合并到 `main` 分支
3. 只有 `main` 分支会触发自动部署

### 发布流程
1. 从 `main` 分支创建 `release/v0.x.x` 分支
2. 在 release 分支进行最终测试和版本号更新
3. 合并 release 分支到 `main`
4. 打 git tag: `git tag v0.x.x && git push origin v0.x.x`

这样可以确保只有稳定版本才会部署到生产环境。

## 立即生效

配置完成后，当前的 v0.3.1 提交将不会触发新的部署，因为它在 `main` 分支上，但你可以通过设置分支规则来控制未来的部署。