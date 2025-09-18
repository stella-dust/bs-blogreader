# 🔍 SearxNG 搜索服务配置指南

## 概述

本项目集成了 SearxNG 元搜索引擎，为博客阅读助手提供强大的网络搜索功能。SearxNG 聚合了多个搜索引擎（Google、Bing、DuckDuckGo等）的结果。

## 快速启动

### 方法1: 使用 Docker Compose (推荐)

```bash
# 启动所有服务（包括SearxNG）
docker-compose up -d

# 仅启动搜索相关服务
docker-compose up -d searxng redis

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs searxng
```

### 方法2: 单独启动搜索服务

```bash
# 启动Redis
docker run -d --name blogreader-redis \
  -p 6379:6379 \
  redis:7-alpine

# 启动SearxNG
docker run -d --name blogreader-searxng \
  -p 8080:8080 \
  -v ./searxng:/etc/searxng:ro \
  --link blogreader-redis:redis \
  searxng/searxng:latest
```

## 服务地址

- **SearxNG 搜索界面**: http://localhost:8080
- **API 端点**: http://localhost:8080/search
- **健康检查**: http://localhost:8080/healthz
- **Redis 缓存**: localhost:6379

## API 使用示例

### 基础搜索

```bash
# JSON 格式搜索
curl -X POST "http://localhost:8080/search" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "q=react hooks&format=json&categories=general"

# 带语言限制的搜索
curl -X POST "http://localhost:8080/search" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "q=机器学习&format=json&lang=zh-CN"
```

### JavaScript 调用示例

```javascript
// 搜索函数
async function searchWithSearxNG(query, language = 'zh-CN') {
  const response = await fetch('http://localhost:8080/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      q: query,
      format: 'json',
      categories: 'general',
      lang: language,
      safesearch: '0'
    })
  })

  const results = await response.json()
  return results.results
}

// 使用示例
const results = await searchWithSearxNG('人工智能最新发展')
console.log(results)
```

## 配置说明

### 支持的搜索引擎

- ✅ Google (主要)
- ✅ Bing
- ✅ DuckDuckGo
- ✅ Startpage
- ✅ Wikipedia (中文)
- ✅ GitHub
- ✅ Stack Overflow
- ❌ YouTube (已禁用)
- ❌ Twitter (已禁用)
- ❌ Reddit (已禁用)

### 限流设置

- 每IP每小时最多 200 次请求
- 本地IP白名单自动通过
- 支持自定义User-Agent

### 缓存设置

- Redis 内存限制: 512MB
- 缓存策略: LRU (最近最少使用)
- 持久化: AOF (Append Only File)

## 故障排除

### 1. 服务无法启动

```bash
# 检查端口占用
netstat -tlnp | grep 8080
netstat -tlnp | grep 6379

# 查看容器日志
docker logs blogreader-searxng
docker logs blogreader-redis
```

### 2. 搜索结果为空

```bash
# 测试搜索引擎连通性
curl -I "http://localhost:8080/search?q=test&format=json"

# 检查配置文件
cat searxng/settings.yml | grep -A 5 engines
```

### 3. 性能问题

```bash
# 监控Redis内存使用
docker exec blogreader-redis redis-cli info memory

# 检查SearxNG响应时间
curl -w "@%{time_total}s" "http://localhost:8080/search?q=test&format=json"
```

## 自定义配置

### 修改搜索引擎

编辑 `searxng/settings.yml` 文件：

```yaml
engines:
  # 添加新的搜索引擎
  - name: baidu
    engine: baidu
    shortcut: bd
    categories: [general]
    language_support: true

  # 禁用特定引擎
  - name: google
    disabled: true
```

### 调整限流策略

编辑 `searxng/limiter.toml` 文件：

```toml
[botdetection.ip_limit]
window = 3600  # 时间窗口
limit = 500    # 增加到500次/小时
```

## 监控和维护

### 健康检查

```bash
# 自动健康检查脚本
#!/bin/bash
SEARXNG_URL="http://localhost:8080/healthz"
REDIS_CMD="docker exec blogreader-redis redis-cli ping"

if curl -f $SEARXNG_URL >/dev/null 2>&1; then
    echo "✅ SearxNG is healthy"
else
    echo "❌ SearxNG is down"
fi

if $REDIS_CMD | grep -q "PONG"; then
    echo "✅ Redis is healthy"
else
    echo "❌ Redis is down"
fi
```

### 清理缓存

```bash
# 清理Redis缓存
docker exec blogreader-redis redis-cli FLUSHALL

# 重启SearxNG
docker restart blogreader-searxng
```

## 安全建议

1. **生产环境部署**：
   - 修改默认密钥 `secret_key`
   - 配置反向代理 (Nginx)
   - 启用HTTPS
   - 限制访问IP范围

2. **性能优化**：
   - 增加Redis内存限制
   - 配置CDN缓存
   - 调整超时设置

3. **监控告警**：
   - 配置服务健康检查
   - 监控搜索响应时间
   - 设置错误率告警

## 参考链接

- [SearxNG 官方文档](https://docs.searxng.org/)
- [SearxNG GitHub](https://github.com/searxng/searxng)
- [Redis 官方文档](https://redis.io/documentation)