/**
 * API 客户端封装
 */

import { ReadableStream } from 'stream/web';
import https from 'https';

// 创建忽略 SSL 证书的 agent
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

class APIClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  async request(method, path, data = null, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
      ...options.headers
    };

    const config = {
      method,
      headers,
      ...(data && method !== 'GET' && { body: JSON.stringify(data) }),
      agent: this.baseURL.startsWith('https') ? httpsAgent : undefined
    };

    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.baseURL}${path}`, config);
      const duration = Date.now() - startTime;
      
      let result;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
      } else {
        result = await response.text();
      }

      return {
        status: response.status,
        ok: response.ok,
        data: result,
        duration,
        headers: Object.fromEntries(response.headers.entries())
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[API Client] Request failed: ${method} ${path}`);
      console.error(`[API Client] Error: ${error.message}`);
      if (error.cause) {
        console.error(`[API Client] Cause:`, error.cause);
      }
      return {
        status: 0,
        ok: false,
        error: error.message,
        errorDetails: error.toString(),
        duration
      };
    }
  }

  async get(path, options = {}) {
    return this.request('GET', path, null, options);
  }

  async post(path, data, options = {}) {
    return this.request('POST', path, data, options);
  }

  async put(path, data, options = {}) {
    return this.request('PUT', path, data, options);
  }

  async delete(path, options = {}) {
    return this.request('DELETE', path, null, options);
  }

  async upload(path, fileBuffer, filename) {
    const { Blob } = await import('buffer');
    
    // 创建 Blob 对象
    const blob = new Blob([fileBuffer], { type: 'text/plain' });
    
    // 使用原生 FormData (Node 18+)
    const formData = new FormData();
    formData.append('file', blob, filename);

    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.baseURL}${path}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`
          // 不设置 Content-Type，让浏览器自动设置
        },
        body: formData,
        agent: this.baseURL.startsWith('https') ? httpsAgent : undefined
      });

      const duration = Date.now() - startTime;
      const result = await response.json();

      return {
        status: response.status,
        ok: response.ok,
        data: result,
        duration
      };
    } catch (error) {
      return {
        status: 0,
        ok: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }

  async stream(path, data) {
    const startTime = Date.now();
    let ttfb = null;
    let fullResponse = '';
    let chunkCount = 0;

    try {
      const response = await fetch(`${this.baseURL}${path}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
        agent: this.baseURL.startsWith('https') ? httpsAgent : undefined
      });

      if (!response.ok) {
        return {
          ok: false,
          status: response.status,
          error: await response.text()
        };
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        if (!ttfb) {
          ttfb = Date.now() - startTime;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.content) {
                fullResponse += data.content;
                chunkCount++;
              }
              
              if (data.done) {
                return {
                  ok: true,
                  status: 200,
                  content: fullResponse,
                  ttfb,
                  totalTime: Date.now() - startTime,
                  chunkCount,
                  contentLength: fullResponse.length
                };
              }

              if (data.error) {
                return {
                  ok: false,
                  status: 200,
                  error: data.error
                };
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }

      return {
        ok: true,
        status: 200,
        content: fullResponse,
        ttfb,
        totalTime: Date.now() - startTime,
        chunkCount
      };
    } catch (error) {
      return {
        ok: false,
        status: 0,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }
}

export default APIClient;
