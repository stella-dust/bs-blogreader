from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
from bs4 import BeautifulSoup
import openai
import os
from typing import Optional, Literal
import json
from urllib.parse import urljoin

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LLMConfig(BaseModel):
    type: Literal['deepseek', 'openai', 'ollama', 'lmstudio', 'claude']
    apiKey: str
    baseURL: Optional[str] = None
    model: Optional[str] = None

class URLRequest(BaseModel):
    url: str

class ProcessRequest(BaseModel):
    content: str
    prompt: str
    llm_config: LLMConfig

class LLMTestRequest(BaseModel):
    llm_config: LLMConfig

class ContentResponse(BaseModel):
    title: str
    url: str
    content: str
    htmlContent: Optional[str] = None
    author: Optional[str] = None
    publishDate: Optional[str] = None
    description: Optional[str] = None
    images: Optional[list] = []
    siteName: Optional[str] = None

class ProcessResponse(BaseModel):
    result: str

class LLMTestResponse(BaseModel):
    valid: bool
    message: str

def get_llm_client(config: LLMConfig):
    """根据配置创建对应的LLM客户端"""
    if config.type == 'deepseek':
        return openai.OpenAI(
            api_key=config.apiKey,
            base_url=config.baseURL or "https://api.deepseek.com"
        )
    elif config.type == 'openai':
        return openai.OpenAI(
            api_key=config.apiKey,
            base_url=config.baseURL or "https://api.openai.com/v1"
        )
    elif config.type == 'claude':
        # 对于Claude，我们需要使用不同的客户端
        # 这里暂时使用OpenAI兼容的方式
        return openai.OpenAI(
            api_key=config.apiKey,
            base_url=config.baseURL or "https://api.anthropic.com"
        )
    elif config.type in ['ollama', 'lmstudio']:
        # 本地LLM，使用OpenAI兼容的API
        return openai.OpenAI(
            api_key="local",  # 本地API通常不需要真实的key
            base_url=config.baseURL or ("http://localhost:11434" if config.type == 'ollama' else "http://localhost:1234/v1")
        )
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported LLM type: {config.type}")

def get_default_model(config: LLMConfig) -> str:
    """获取默认模型名称"""
    if config.model:
        return config.model

    defaults = {
        'deepseek': 'deepseek-chat',
        'openai': 'gpt-3.5-turbo',
        'claude': 'claude-3-sonnet-20240229',
        'ollama': 'llama2',
        'lmstudio': 'local-model'
    }
    return defaults.get(config.type, 'default')

async def call_llm(config: LLMConfig, prompt: str, content: str) -> str:
    """调用LLM进行处理"""
    try:
        client = get_llm_client(config)
        model = get_default_model(config)

        messages = [
            {"role": "system", "content": prompt},
            {"role": "user", "content": content}
        ]

        if config.type == 'claude':
            # Claude API 可能需要特殊处理
            # 这里先使用OpenAI兼容的方式
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                max_tokens=4000,
                temperature=0.3
            )
        else:
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                max_tokens=4000,
                temperature=0.3
            )

        return response.choices[0].message.content

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM call failed: {str(e)}")

@app.get("/")
async def root():
    return {"message": "AI Blog Reader Backend with Multi-LLM Support"}

@app.get("/api/health")
async def health():
    return {"status": "ok", "message": "Backend is running"}

def extract_metadata(soup):
    """提取页面元信息"""
    metadata = {}

    # 提取标题 (优先级: og:title > title tag)
    og_title = soup.find('meta', property='og:title')
    if og_title:
        metadata['title'] = og_title.get('content', '').strip()
    else:
        title_tag = soup.find('title')
        metadata['title'] = title_tag.get_text().strip() if title_tag else ''

    # 提取作者
    author_selectors = [
        'meta[name="author"]',
        'meta[property="article:author"]',
        '.author',
        '.byline',
        '[rel="author"]'
    ]
    author = ''
    for selector in author_selectors:
        element = soup.select_one(selector)
        if element:
            author = element.get('content') or element.get_text().strip()
            if author:
                break
    metadata['author'] = author

    # 提取发布日期
    date_selectors = [
        'meta[property="article:published_time"]',
        'meta[name="date"]',
        'time[datetime]',
        '.publish-date',
        '.date'
    ]
    publish_date = ''
    for selector in date_selectors:
        element = soup.select_one(selector)
        if element:
            publish_date = element.get('datetime') or element.get('content') or element.get_text().strip()
            if publish_date:
                break
    metadata['publishDate'] = publish_date

    # 提取描述
    description_selectors = [
        'meta[property="og:description"]',
        'meta[name="description"]'
    ]
    description = ''
    for selector in description_selectors:
        element = soup.select_one(selector)
        if element:
            description = element.get('content', '').strip()
            if description:
                break
    metadata['description'] = description

    # 提取站点名称
    site_name = ''
    og_site = soup.find('meta', property='og:site_name')
    if og_site:
        site_name = og_site.get('content', '').strip()
    metadata['siteName'] = site_name

    return metadata

def extract_images(soup, base_url):
    """提取文章中的图片"""
    images = []
    img_tags = soup.find_all('img')

    for img in img_tags:
        src = img.get('src')
        if src:
            # 处理相对路径
            if src.startswith('//'):
                src = 'https:' + src
            elif src.startswith('/'):
                src = urljoin(base_url, src)
            elif not src.startswith('http'):
                src = urljoin(base_url, src)

            images.append({
                'src': src,
                'alt': img.get('alt', ''),
                'title': img.get('title', '')
            })

    return images

def clean_html_content(element):
    """清理HTML内容，保留有用的标签"""
    if not element:
        return ''

    # 移除不需要的标签
    unwanted_tags = ['script', 'style', 'nav', 'header', 'footer', 'aside', 'ad', 'advertisement']
    for tag in unwanted_tags:
        for elem in element.find_all(tag):
            elem.decompose()

    # 移除不需要的class和id
    unwanted_patterns = ['ad', 'advertisement', 'social', 'share', 'comment', 'sidebar']
    for elem in element.find_all(True):
        classes = elem.get('class', [])
        elem_id = elem.get('id', '')

        # 检查是否包含不需要的模式
        should_remove = False
        for pattern in unwanted_patterns:
            if any(pattern in str(cls).lower() for cls in classes) or pattern in elem_id.lower():
                should_remove = True
                break

        if should_remove:
            elem.decompose()

    return str(element)

@app.post("/api/fetch-content", response_model=ContentResponse)
async def fetch_content(request: URLRequest):
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(request.url, headers=headers, timeout=10)
        response.raise_for_status()

        soup = BeautifulSoup(response.content, 'html.parser')

        # 提取元信息
        metadata = extract_metadata(soup)

        # 提取正文内容（HTML和纯文本）
        html_content = ""
        text_content = ""

        # 尝试多种常见的文章内容选择器
        content_selectors = [
            'article',
            '.post-content',
            '.entry-content',
            '.content',
            '.post-body',
            '[role="main"]',
            'main',
            '.article-content',
            '.story-body',
            '.article-body'
        ]

        content_element = None
        for selector in content_selectors:
            elements = soup.select(selector)
            if elements:
                content_element = elements[0]
                break

        # 如果没找到，尝试找包含最多p标签的容器
        if not content_element:
            containers = soup.find_all(['div', 'section'])
            best_container = None
            max_paragraphs = 0

            for container in containers:
                p_count = len(container.find_all('p'))
                if p_count > max_paragraphs:
                    max_paragraphs = p_count
                    best_container = container

            if best_container and max_paragraphs >= 3:
                content_element = best_container

        if content_element:
            # 清理并保留HTML内容
            html_content = clean_html_content(content_element)
            # 提取纯文本
            text_content = content_element.get_text().strip()
        else:
            # 回退到提取所有p标签
            paragraphs = soup.find_all('p')
            text_content = '\n'.join([p.get_text().strip() for p in paragraphs if p.get_text().strip()])
            html_content = '\n'.join([str(p) for p in paragraphs if p.get_text().strip()])

        # 清理文本内容
        text_content = '\n'.join([line.strip() for line in text_content.split('\n') if line.strip()])

        # 提取图片信息
        images = extract_images(soup, request.url)

        return ContentResponse(
            title=metadata['title'],
            url=request.url,
            content=text_content,
            htmlContent=html_content,
            author=metadata['author'],
            publishDate=metadata['publishDate'],
            description=metadata['description'],
            images=images,
            siteName=metadata['siteName']
        )

    except requests.RequestException as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch content: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing content: {str(e)}")

@app.post("/api/process", response_model=ProcessResponse)
async def process_content(request: ProcessRequest):
    try:
        result = await call_llm(request.llm_config, request.prompt, request.content)
        return ProcessResponse(result=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/test-llm-config", response_model=LLMTestResponse)
async def test_llm_config(request: LLMTestRequest):
    try:
        config = request.llm_config

        # 对于本地LLM，跳过API Key检查
        if config.type in ['ollama', 'lmstudio']:
            if not config.baseURL:
                return LLMTestResponse(
                    valid=False,
                    message="请配置本地LLM的API端点"
                )

            # 尝试连接本地API
            try:
                test_url = f"{config.baseURL.rstrip('/')}/v1/models" if config.type == 'lmstudio' else f"{config.baseURL.rstrip('/')}/api/tags"
                response = requests.get(test_url, timeout=5)
                if response.status_code == 200:
                    return LLMTestResponse(valid=True, message=f"{config.type.upper()} 连接成功")
                else:
                    return LLMTestResponse(valid=False, message=f"{config.type.upper()} 连接失败")
            except:
                return LLMTestResponse(valid=False, message=f"{config.type.upper()} 连接失败，请确保服务正在运行")

        # 对于API服务，测试API Key
        if not config.apiKey:
            return LLMTestResponse(valid=False, message="请输入API Key")

        client = get_llm_client(config)
        model = get_default_model(config)

        # 发送测试消息
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": "Hello"}],
            max_tokens=10
        )

        return LLMTestResponse(valid=True, message=f"{config.type.upper()} API 连接成功")

    except Exception as e:
        return LLMTestResponse(valid=False, message=f"连接测试失败: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)