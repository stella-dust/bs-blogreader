from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
from bs4 import BeautifulSoup
import openai
import os
from typing import Optional

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class URLRequest(BaseModel):
    url: str

class ProcessRequest(BaseModel):
    content: str
    prompt: str
    api_key: str

class ApiKeyTestRequest(BaseModel):
    api_key: str

class ContentResponse(BaseModel):
    title: str
    url: str
    content: str
    author: Optional[str] = None

class ProcessResponse(BaseModel):
    result: str

class ApiKeyTestResponse(BaseModel):
    valid: bool
    message: str

@app.get("/")
async def root():
    return {"message": "AI Blog Reader Backend"}

@app.get("/api/health")
async def health():
    return {"status": "ok", "message": "Backend is running"}

@app.post("/api/test-api-key", response_model=ApiKeyTestResponse)
async def test_api_key(request: ApiKeyTestRequest):
    try:
        client = openai.OpenAI(
            api_key=request.api_key,
            base_url="https://api.deepseek.com"
        )

        # 发送一个简单的测试请求
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "user", "content": "Hello, respond with just 'API test successful'"}
            ],
            max_tokens=50,
            temperature=0.1
        )

        return ApiKeyTestResponse(valid=True, message="API Key 连接成功")

    except Exception as e:
        return ApiKeyTestResponse(valid=False, message=f"API Key 测试失败: {str(e)}")

@app.post("/api/fetch-content", response_model=ContentResponse)
async def fetch_content(request: URLRequest):
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }

        response = requests.get(request.url, headers=headers, timeout=10)
        response.raise_for_status()

        soup = BeautifulSoup(response.content, 'html.parser')

        # 提取标题
        title = "未知标题"
        title_tag = soup.find('title')
        if title_tag:
            title = title_tag.get_text(strip=True)

        # 提取正文内容
        # 删除script和style标签
        for script in soup(["script", "style"]):
            script.decompose()

        # 尝试找到文章主体
        content_selectors = [
            'article', '[role="main"]', '.content', '.post-content',
            '.entry-content', '.article-content', '#content', '.main'
        ]

        content = ""
        for selector in content_selectors:
            content_div = soup.select_one(selector)
            if content_div:
                content = content_div.get_text(strip=True, separator='\n')
                break

        if not content:
            content = soup.get_text(strip=True, separator='\n')

        # 尝试提取作者
        author = None
        author_selectors = [
            'meta[name="author"]', '.author', '.byline', '[rel="author"]'
        ]
        for selector in author_selectors:
            author_element = soup.select_one(selector)
            if author_element:
                author = author_element.get('content') or author_element.get_text(strip=True)
                break

        return ContentResponse(
            title=title,
            url=request.url,
            content=content,
            author=author
        )

    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=400, detail=f"无法获取内容: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"处理错误: {str(e)}")

@app.post("/api/process", response_model=ProcessResponse)
async def process_content(request: ProcessRequest):
    try:
        client = openai.OpenAI(
            api_key=request.api_key,
            base_url="https://api.deepseek.com"
        )

        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": request.prompt},
                {"role": "user", "content": request.content}
            ],
            max_tokens=4000,
            temperature=0.1
        )

        return ProcessResponse(result=response.choices[0].message.content)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI处理失败: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)