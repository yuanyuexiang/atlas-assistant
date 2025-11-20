# Echo 智能客服前端开发指导文档

## 📋 目录

- [系统概述](#系统概述)
- [核心概念](#核心概念)
- [API 认证](#api-认证)
- [API 接口文档](#api-接口文档)
- [数据模型](#数据模型)
- [开发流程](#开发流程)
- [错误处理](#错误处理)
- [最佳实践](#最佳实践)

---

## 系统概述

Echo 是一个基于 RAG（检索增强生成）的智能客服系统，采用**三层解耦架构**：

```
客服界面层（Conversation）
    ↓ 可动态切换
智能体能力层（Agent）
    ↓ 独立知识库
向量存储层（Milvus）
```

### 核心特性

- 🤖 多智能体管理
- 💬 客服与智能体解耦
- 📚 知识库独立管理
- 🔄 智能体动态切换
- 🔐 JWT 认证授权

### 技术栈

- **后端**: FastAPI + PostgreSQL + Milvus
- **API**: RESTful
- **认证**: JWT Bearer Token
- **文档**: Swagger UI (`/docs`) + ReDoc (`/redoc`)

---

## 核心概念

### 1. Agent（智能体）

**智能体是 AI 能力的抽象单元**，包含：
- 专属知识库（Milvus 向量存储）
- 系统提示词（System Prompt）
- 业务类型（general/legal/medical/financial）

**特点**：
- 一个智能体可被多个客服共享
- 每个智能体有独立的向量集合（collection）
- 支持不同领域的专业配置

**场景示例**：
```
智能体: "法律顾问" → 上传法律法规文档
智能体: "客服-白班" → 上传标准话术
智能体: "客服-夜班" → 上传简化话术
```

### 2. Conversation（客服）

**客服是面向用户的对话界面**，包含：
- 显示名称、头像、欢迎语
- 关联的智能体（可切换）
- 状态管理（online/offline/busy）
- 对话统计

**特点**：
- 客服与智能体是 N:1 关系
- 支持动态切换关联的智能体
- 可以多客服共享一个智能体

**场景示例**：
```
客服 "小张"（白班）→ 绑定智能体 "客服-白班"
       ↓ 下班后切换
客服 "小张"（夜班）→ 绑定智能体 "客服-夜班"
```

### 3. Knowledge Base（知识库）

**每个智能体有独立的知识库**：
- 支持上传 PDF、TXT、MD 文件
- 自动文本切分和向量化
- 存储在 Milvus 向量数据库

**工作流程**：
```
上传文档 → 解析文本 → 切分 chunk → 向量化 → 存入 Milvus
```

---

## API 认证

### 认证流程

1. **注册用户**（可选，也可由管理员创建）
2. **登录获取 Token**
3. **请求头携带 Token**

### 1. 用户注册

```http
POST https://atlas.matrix-net.tech/atlas/api/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123",
  "full_name": "测试用户"
}
```

**响应**：
```json
{
  "id": "user_uuid",
  "username": "testuser",
  "email": "test@example.com",
  "full_name": "测试用户",
  "is_active": true,
  "is_superuser": false,
  "created_at": "2025-01-19T08:00:00Z"
}
```

### 2. 用户登录

```http
POST https://atlas.matrix-net.tech/atlas/api/auth/login
Content-Type: application/json

{
  "username": "testuser",
  "password": "password123"
}
```

**响应**：
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

### 3. 使用 Token

所有需要认证的接口都要在请求头中携带 Token：

```http
GET https://atlas.matrix-net.tech/atlas/api/agents
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### 4. 获取当前用户信息

```http
GET https://atlas.matrix-net.tech/atlas/api/auth/me
Authorization: Bearer {token}
```

---

## API 接口文档

### 基础信息

- **生产环境 Base URL**: `https://atlas.matrix-net.tech/atlas/api`
- **本地开发 Base URL**: `http://localhost:8000/api`
- **文档地址**: 
  - Swagger UI: `https://atlas.matrix-net.tech/atlas/docs`
  - ReDoc: `https://atlas.matrix-net.tech/atlas/redoc`
  - 健康检查: `https://atlas.matrix-net.tech/atlas/health`

> 💡 **提示**: 本文档中的示例默认使用生产环境地址 `https://atlas.matrix-net.tech/atlas`

---

## 1. 认证接口 `/api/auth`

### 1.1 注册用户

```http
POST https://atlas.matrix-net.tech/atlas/api/auth/register
```

**请求体**：
```json
{
  "username": "string",      // 3-50字符，字母数字下划线
  "email": "user@example.com",
  "password": "string",      // 6-72字符
  "full_name": "string"      // 可选
}
```

### 1.2 用户登录

```http
POST https://atlas.matrix-net.tech/atlas/api/auth/login
```

**请求体**：
```json
{
  "username": "string",
  "password": "string"
}
```

**响应**：
```json
{
  "access_token": "string",
  "token_type": "bearer",
  "expires_in": 1800
}
```

### 1.3 获取当前用户

```http
GET https://atlas.matrix-net.tech/atlas/api/auth/me
Authorization: Bearer {token}
```

### 1.4 更新当前用户

```http
PUT https://atlas.matrix-net.tech/atlas/api/auth/me
Authorization: Bearer {token}
```

**请求体**：
```json
{
  "email": "new@example.com",  // 可选
  "full_name": "新名字",        // 可选
  "password": "newpassword"     // 可选
}
```

---

## 2. 智能体管理 `/api/agents`

### 2.1 创建智能体

```http
POST https://atlas.matrix-net.tech/atlas/api/agents
Authorization: Bearer {token}
```

**请求体**：
```json
{
  "name": "customer-service",           // 唯一标识
  "display_name": "智能客服",            // 显示名称
  "agent_type": "general",              // general/legal/medical/financial/custom
  "system_prompt": "你是一个专业的客服", // 可选，默认有提示词
  "description": "智能客服说明"          // 可选
}
```

**响应**：
```json
{
  "id": "agent_uuid",
  "name": "customer-service",
  "display_name": "智能客服",
  "agent_type": "general",
  "status": "active",
  "system_prompt": "你是一个专业的客服...",
  "description": "智能客服说明",
  "knowledge_base": {
    "collection_name": "kb_customer_service",
    "total_files": 0,
    "total_vectors": 0,
    "total_size_mb": 0.0,
    "files": []
  },
  "created_at": "2025-01-19T08:00:00Z",
  "updated_at": "2025-01-19T08:00:00Z",
  "conversations_using": []  // 使用该智能体的客服列表
}
```

### 2.2 获取智能体列表

```http
GET https://atlas.matrix-net.tech/atlas/api/agents?status=active&agent_type=general&skip=0&limit=100
Authorization: Bearer {token}
```

**查询参数**：
- `status`: 筛选状态（active/inactive/training/error）
- `agent_type`: 筛选类型（general/legal/medical/financial/custom）
- `skip`: 跳过记录数（分页）
- `limit`: 返回记录数（最大 1000）

### 2.3 获取智能体详情

```http
GET https://atlas.matrix-net.tech/atlas/api/agents/{agent_name}
Authorization: Bearer {token}
```

### 2.4 更新智能体

```http
PUT https://atlas.matrix-net.tech/atlas/api/agents/{agent_name}
Authorization: Bearer {token}
```

**请求体**：
```json
{
  "display_name": "新名称",       // 可选
  "system_prompt": "新提示词",    // 可选
  "status": "active",            // 可选：active/inactive
  "description": "新描述"         // 可选
}
```

### 2.5 删除智能体

```http
DELETE https://atlas.matrix-net.tech/atlas/api/agents/{agent_name}
Authorization: Bearer {token}
```

**注意**：删除智能体会同时删除其知识库（Milvus collection）。

---

## 3. 客服管理 `/api/conversations`

### 3.1 创建客服

```http
POST https://atlas.matrix-net.tech/atlas/api/conversations
Authorization: Bearer {token}
```

**请求体**：
```json
{
  "name": "xiaoli",                  // 唯一标识
  "display_name": "小李",             // 显示名称
  "agent_name": "customer-service",  // 关联的智能体名称
  "avatar": "👩‍💼",                   // 头像（emoji 或 URL）
  "welcome_message": "您好，我是小李",// 可选
  "description": "白班客服"           // 可选
}
```

**响应**：
```json
{
  "id": "conversation_uuid",
  "name": "xiaoli",
  "display_name": "小李",
  "avatar": "👩‍💼",
  "status": "online",
  "agent": {
    "id": "agent_uuid",
    "name": "customer-service",
    "display_name": "智能客服",
    "agent_type": "general"
  },
  "welcome_message": "您好，我是小李",
  "message_count": 0,
  "last_active_at": null,
  "created_at": "2025-01-19T08:00:00Z"
}
```

### 3.2 获取客服列表

```http
GET https://atlas.matrix-net.tech/atlas/api/conversations?status=online&skip=0&limit=100
Authorization: Bearer {token}
```

**查询参数**：
- `status`: 筛选状态（online/offline/busy）
- `skip`: 跳过记录数
- `limit`: 返回记录数

### 3.3 获取客服详情

```http
GET https://atlas.matrix-net.tech/atlas/api/conversations/{conversation_name}
Authorization: Bearer {token}
```

### 3.4 更新客服

```http
PUT https://atlas.matrix-net.tech/atlas/api/conversations/{conversation_name}
Authorization: Bearer {token}
```

**请求体**：
```json
{
  "display_name": "新名称",         // 可选
  "avatar": "🤖",                  // 可选
  "status": "online",              // 可选：online/offline/busy
  "welcome_message": "新欢迎语",    // 可选
  "description": "新描述"           // 可选
}
```

### 3.5 删除客服

```http
DELETE https://atlas.matrix-net.tech/atlas/api/conversations/{conversation_name}
Authorization: Bearer {token}
```

### 3.6 切换智能体

```http
POST https://atlas.matrix-net.tech/atlas/api/conversations/{conversation_name}/switch-agent
Authorization: Bearer {token}
```

**请求体**：
```json
{
  "new_agent_name": "customer-service-night",
  "reason": "切换到夜班智能体"  // 可选
}
```

**响应**：
```json
{
  "conversation_name": "xiaoli",
  "old_agent": "customer-service-day",
  "new_agent": "customer-service-night",
  "switched_at": "2025-01-19T18:00:00Z"
}
```

**应用场景**：
- 白班/夜班切换
- A/B 测试不同智能体
- 升级到新版本智能体

---

## 4. 知识库管理 `/api/knowledge-base`

### 4.1 上传文档

```http
POST https://atlas.matrix-net.tech/atlas/api/knowledge-base/{agent_name}/documents
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**请求体**（FormData）：
```javascript
const formData = new FormData();
formData.append('file', fileObject);  // PDF/TXT/MD 文件

fetch('https://atlas.matrix-net.tech/atlas/api/knowledge-base/customer-service/documents', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

**响应**：
```json
{
  "file_id": "doc_20250119_001",
  "filename": "product_manual.pdf",
  "chunks_count": 156,
  "upload_time": "2025-01-19T08:00:00Z"
}
```

**限制**：
- 最大文件大小：10MB
- 支持格式：PDF、TXT、MD

### 4.2 获取文档列表

```http
GET https://atlas.matrix-net.tech/atlas/api/knowledge-base/{agent_name}/documents
Authorization: Bearer {token}
```

**响应**：
```json
{
  "success": true,
  "data": [
    {
      "file_id": "doc_20250119_001",
      "filename": "product_manual.pdf",
      "chunks_count": 156,
      "upload_time": "2025-01-19T08:00:00Z"
    }
  ]
}
```

### 4.3 删除文档

```http
DELETE https://atlas.matrix-net.tech/atlas/api/knowledge-base/{agent_name}/documents/{file_id}
Authorization: Bearer {token}
```

**注意**：由于 Milvus Lite 的删除限制，建议使用"重建知识库"功能。

### 4.4 获取知识库统计

```http
GET https://atlas.matrix-net.tech/atlas/api/knowledge-base/{agent_name}/stats
Authorization: Bearer {token}
```

**响应**：
```json
{
  "success": true,
  "data": {
    "agent_name": "customer-service",
    "collection_name": "kb_customer_service",
    "total_files": 3,
    "total_vectors": 458,
    "total_size_mb": 2.5,
    "files": [
      {
        "file_id": "doc_20250119_001",
        "filename": "product_manual.pdf",
        "chunks_count": 156
      }
    ]
  }
}
```

### 4.5 清空知识库

```http
DELETE https://atlas.matrix-net.tech/atlas/api/knowledge-base/{agent_name}/clear
Authorization: Bearer {token}
```

### 4.6 重建知识库

```http
POST https://atlas.matrix-net.tech/atlas/api/knowledge-base/{agent_name}/rebuild
Authorization: Bearer {token}
```

**请求体**：
```json
{
  "file_ids": ["doc_20250119_001", "doc_20250119_003"]  // 保留的文件
}
```

**说明**：删除所有文档后重新上传指定文件，解决 Milvus 删除限制问题。

---

## 5. 对话接口 `/api/chat`

### 5.1 发送消息（同步响应）

```http
POST https://atlas.matrix-net.tech/atlas/api/chat/{conversation_name}/message
Authorization: Bearer {token}
```

**请求体**：
```json
{
  "content": "你们的产品有什么优势？",
  "session_id": "session_123"  // 可选，用于会话追踪
}
```

**响应**：
```json
{
  "role": "assistant",
  "content": "我们的产品主要有以下优势：\n1. 高性能...\n2. 易用性...",
  "timestamp": "2025-01-19T08:00:00.123Z",
  "agent_name": "customer-service",
  "knowledge_base_used": true
}
```

**工作流程**：
```
用户消息 → 获取客服关联的智能体 → 检索知识库 → LLM 生成回复 → 返回完整结果
```

**适用场景**：
- ✅ 短文本问答
- ✅ 简单的 Q&A 场景
- ❌ 不适合长文本生成

---

### 5.2 发送消息（流式响应）⚡ 推荐

```http
POST https://atlas.matrix-net.tech/atlas/api/chat/{conversation_name}/message/stream
Authorization: Bearer {token}
Content-Type: application/json
```

**请求体**：
```json
{
  "content": "请详细介绍一下你们的产品特点和优势",
  "session_id": "session_123"
}
```

**响应格式**：Server-Sent Events (SSE)
```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

data: {"content": "", "done": false, "agent_name": "customer-service"}

data: {"content": "我们的", "done": false, "agent_name": "customer-service"}

data: {"content": "产品", "done": false, "agent_name": "customer-service"}

data: {"content": "主要有", "done": false, "agent_name": "customer-service"}

data: {"content": "以下", "done": false, "agent_name": "customer-service"}

data: {"content": "特点", "done": false, "agent_name": "customer-service"}

...

data: {"content": "", "done": true, "agent_name": "customer-service"}
```

**数据字段说明**：
- `content`: 本次返回的文本片段（增量内容）
- `done`: 是否结束（`true` 表示生成完成）
- `agent_name`: 智能体名称
- `error`: 错误信息（仅在出错时存在）

**前端实现示例（原生 JavaScript）**：

```javascript
async function sendMessageStream(conversationName, message) {
  const response = await fetch(
    `https://atlas.matrix-net.tech/atlas/api/chat/${conversationName}/message/stream`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content: message })
    }
  );

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullResponse = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        
        if (data.error) {
          console.error('Error:', data.error);
          break;
        }

        if (data.content) {
          fullResponse += data.content;
          // 更新 UI，逐字显示
          updateChatUI(fullResponse);
        }

        if (data.done) {
          console.log('Stream completed');
          return fullResponse;
        }
      }
    }
  }
}
```

**前端实现示例（使用 EventSource）**：

```javascript
function sendMessageStreamSSE(conversationName, message) {
  // 注意：EventSource 不支持 POST，需要后端支持 GET + query params
  // 或使用 fetch API 的方式（推荐上面的方法）
  
  const url = new URL(`https://atlas.matrix-net.tech/atlas/api/chat/${conversationName}/message/stream`);
  const eventSource = new EventSource(url);
  let fullResponse = '';

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    if (data.content) {
      fullResponse += data.content;
      updateChatUI(fullResponse);
    }

    if (data.done) {
      eventSource.close();
    }
  };

  eventSource.onerror = (error) => {
    console.error('SSE Error:', error);
    eventSource.close();
  };
}
```

**Vue 3 组合式 API 示例**：

```vue
<script setup>
import { ref } from 'vue'

const message = ref('')
const response = ref('')
const isStreaming = ref(false)

async function sendMessage() {
  if (!message.value.trim()) return
  
  isStreaming.value = true
  response.value = ''
  
  try {
    const res = await fetch(
      `https://atlas.matrix-net.tech/atlas/api/chat/customer-service-01/message/stream`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: message.value })
      }
    )

    const reader = res.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6))
          
          if (data.content) {
            response.value += data.content
          }
          
          if (data.done) {
            isStreaming.value = false
          }
        }
      }
    }
  } catch (error) {
    console.error('Stream error:', error)
    isStreaming.value = false
  }
}
</script>

<template>
  <div>
    <input v-model="message" :disabled="isStreaming" />
    <button @click="sendMessage" :disabled="isStreaming">
      {{ isStreaming ? '生成中...' : '发送' }}
    </button>
    <div class="response">{{ response }}</div>
  </div>
</template>
```

**React 示例**：

```jsx
import { useState } from 'react';

function ChatComponent() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const sendMessage = async () => {
    if (!message.trim()) return;
    
    setIsStreaming(true);
    setResponse('');
    
    try {
      const res = await fetch(
        'https://atlas.matrix-net.tech/atlas/api/chat/customer-service-01/message/stream',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ content: message })
        }
      );

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            
            if (data.content) {
              setResponse(prev => prev + data.content);
            }
            
            if (data.done) {
              setIsStreaming(false);
            }
          }
        }
      }
    } catch (error) {
      console.error('Stream error:', error);
      setIsStreaming(false);
    }
  };

  return (
    <div>
      <input 
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={isStreaming}
      />
      <button onClick={sendMessage} disabled={isStreaming}>
        {isStreaming ? '生成中...' : '发送'}
      </button>
      <div className="response">{response}</div>
    </div>
  );
}
```

**流式响应的优势**：
- ✅ **用户体验极佳**: 类似 ChatGPT 的逐字显示效果
- ✅ **首字响应快**: 无需等待完整生成，立即开始显示
- ✅ **降低等待感知**: 用户看到进度，不会感到焦虑
- ✅ **适合长文本**: 长回答也能快速开始显示
- ✅ **实时反馈**: 生成过程中用户可以随时停止

**注意事项**：
- 流式请求使用 Server-Sent Events (SSE) 协议
- 需要保持连接直到 `done: true`
- 建议添加超时处理（如 60 秒）
- 错误时检查 `error` 字段

---

### 5.3 清空对话历史

```http
DELETE https://atlas.matrix-net.tech/atlas/api/chat/{conversation_name}/history
Authorization: Bearer {token}
```

**说明**：仅清空内存中的对话历史，不影响知识库。

---

## 6. 用户管理 `/api/users` (管理员)

### 6.1 获取用户列表

```http
GET https://atlas.matrix-net.tech/atlas/api/users?skip=0&limit=100
Authorization: Bearer {admin_token}
```

### 6.2 获取用户详情

```http
GET https://atlas.matrix-net.tech/atlas/api/users/{user_id}
Authorization: Bearer {admin_token}
```

### 6.3 创建用户

```http
POST https://atlas.matrix-net.tech/atlas/api/users
Authorization: Bearer {admin_token}
```

### 6.4 更新用户

```http
PUT https://atlas.matrix-net.tech/atlas/api/users/{user_id}
Authorization: Bearer {admin_token}
```

### 6.5 删除用户

```http
DELETE https://atlas.matrix-net.tech/atlas/api/users/{user_id}
Authorization: Bearer {admin_token}
```

---

## 数据模型

### Agent（智能体）

```typescript
interface Agent {
  id: string;
  name: string;              // 唯一标识
  display_name: string;      // 显示名称
  agent_type: 'general' | 'legal' | 'medical' | 'financial' | 'custom';
  status: 'active' | 'inactive' | 'training' | 'error';
  system_prompt: string;     // 系统提示词
  description?: string;
  knowledge_base: {
    collection_name: string;
    total_files: number;
    total_vectors: number;
    total_size_mb: number;
    files: Array<{
      file_id: string;
      filename: string;
      chunks_count: number;
    }>;
  };
  created_at: string;        // ISO 8601
  updated_at: string;
  conversations_using: string[];  // 使用该智能体的客服列表
}
```

### Conversation（客服）

```typescript
interface Conversation {
  id: string;
  name: string;              // 唯一标识
  display_name: string;      // 显示名称
  avatar: string;            // emoji 或 URL
  status: 'online' | 'offline' | 'busy';
  agent: {
    id: string;
    name: string;
    display_name: string;
    agent_type: string;
  };
  welcome_message?: string;
  message_count: number;
  last_active_at?: string;
  created_at: string;
}
```

### User（用户）

```typescript
interface User {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
}
```

---

## 开发流程

### 典型业务流程

#### 1. 创建智能客服系统

```javascript
// 配置 API 基础地址
const API_BASE_URL = 'https://atlas.matrix-net.tech/atlas/api';

// 1. 注册/登录获取 Token
const authResponse = await fetch(`${API_BASE_URL}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'admin',
    password: 'admin123'
  })
});
const { access_token } = await authResponse.json();

// 2. 创建智能体
const agentResponse = await fetch(`${API_BASE_URL}/agents`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${access_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'customer-service',
    display_name: '智能客服',
    agent_type: 'general',
    system_prompt: '你是一个专业的客服人员...'
  })
});

// 3. 上传知识库文档
const formData = new FormData();
formData.append('file', fileInput.files[0]);

await fetch(`${API_BASE_URL}/knowledge-base/customer-service/documents`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${access_token}` },
  body: formData
});

// 4. 创建客服
const conversationResponse = await fetch(`${API_BASE_URL}/conversations`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${access_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'xiaoli',
    display_name: '小李',
    agent_name: 'customer-service',
    avatar: '👩‍💼',
    welcome_message: '您好，我是小李，有什么可以帮您？'
  })
});

// 5. 发送消息
const chatResponse = await fetch(`${API_BASE_URL}/chat/xiaoli/message`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${access_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    content: '你们的产品有什么特点？'
  })
});
const answer = await chatResponse.json();
console.log(answer.content);
```

#### 2. 智能体切换（白班/夜班）

```javascript
// 创建白班智能体
await createAgent({
  name: 'service-day',
  display_name: '白班客服',
  system_prompt: '你是白班客服，回答要详细专业...'
});

// 创建夜班智能体
await createAgent({
  name: 'service-night',
  display_name: '夜班客服',
  system_prompt: '你是夜班客服，回答要简洁明了...'
});

// 白班时间绑定白班智能体
await createConversation({
  name: 'support',
  display_name: '在线客服',
  agent_name: 'service-day'
});

// 夜班时间切换到夜班智能体
await fetch('https://atlas.matrix-net.tech/atlas/api/conversations/support/switch-agent', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    new_agent_name: 'service-night',
    reason: '切换到夜班模式'
  })
});
```

#### 3. 多客服共享智能体

```javascript
// 创建一个通用智能体
await createAgent({
  name: 'general-support',
  display_name: '通用客服智能体'
});

// 上传知识库
await uploadDocument('general-support', 'knowledge.pdf');

// 多个客服共享这个智能体
await createConversation({
  name: 'xiaoli',
  display_name: '小李',
  agent_name: 'general-support'
});

await createConversation({
  name: 'xiaozhang',
  display_name: '小张',
  agent_name: 'general-support'
});

// 两个客服使用相同的知识库和 AI 能力
```

---

## 错误处理

### HTTP 状态码

- `200 OK`: 请求成功
- `201 Created`: 创建成功
- `204 No Content`: 删除成功
- `400 Bad Request`: 请求参数错误
- `401 Unauthorized`: 未认证或 Token 过期
- `403 Forbidden`: 权限不足
- `404 Not Found`: 资源不存在
- `500 Internal Server Error`: 服务器错误

### 错误响应格式

```json
{
  "detail": "错误描述信息"
}
```

### 常见错误

#### 1. Token 过期

```json
{
  "detail": "Token 已过期或无效"
}
```

**解决**：重新登录获取新 Token。

#### 2. 资源不存在

```json
{
  "detail": "智能体不存在: unknown-agent"
}
```

**解决**：检查资源名称是否正确。

#### 3. 文件过大

```json
{
  "detail": "文件过大: 12.5MB > 10MB"
}
```

**解决**：压缩文件或分割上传。

#### 4. 客服状态异常

```json
{
  "detail": "客服状态异常: offline"
}
```

**解决**：更新客服状态为 `online`。

---

## 最佳实践

### 1. Token 管理

```javascript
class ApiClient {
  constructor() {
    this.token = localStorage.getItem('access_token');
    this.tokenExpiry = localStorage.getItem('token_expiry');
  }

  async request(url, options = {}) {
    // 检查 Token 是否过期
    if (this.isTokenExpired()) {
      await this.refreshToken();
    }

    // 自动添加基础 URL
    const fullUrl = url.startsWith('http') ? url : `https://atlas.matrix-net.tech/atlas${url}`;

    return fetch(fullUrl, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${this.token}`
      }
    });
  }

  isTokenExpired() {
    return Date.now() > this.tokenExpiry;
  }

  async refreshToken() {
    // 重新登录
    const response = await fetch('https://atlas.matrix-net.tech/atlas/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: this.username,
        password: this.password
      })
    });
    const data = await response.json();
    this.setToken(data.access_token, data.expires_in);
  }

  setToken(token, expiresIn) {
    this.token = token;
    this.tokenExpiry = Date.now() + expiresIn * 1000;
    localStorage.setItem('access_token', token);
    localStorage.setItem('token_expiry', this.tokenExpiry);
  }
}
```

### 2. 错误处理

```javascript
async function safeApiCall(apiFunction) {
  try {
    const response = await apiFunction();
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '请求失败');
    }
    
    return await response.json();
  } catch (error) {
    console.error('API 调用失败:', error);
    
    // 根据错误类型处理
    if (error.message.includes('Token')) {
      // Token 过期，重新登录
      window.location.href = '/login';
    } else if (error.message.includes('不存在')) {
      // 资源不存在
      showNotification('资源不存在', 'error');
    } else {
      // 其他错误
      showNotification(error.message, 'error');
    }
    
    throw error;
  }
}
```

### 3. 文件上传进度

```javascript
async function uploadWithProgress(agentName, file, onProgress) {
  const formData = new FormData();
  formData.append('file', file);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percent = (e.loaded / e.total) * 100;
        onProgress(percent);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error('上传失败'));
      }
    });

    xhr.open('POST', `https://atlas.matrix-net.tech/atlas/api/knowledge-base/${agentName}/documents`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
  });
}

// 使用
uploadWithProgress('customer-service', file, (percent) => {
  console.log(`上传进度: ${percent}%`);
  updateProgressBar(percent);
});
```

### 4. 实时对话

```javascript
class ChatWidget {
  constructor(conversationName, token) {
    this.conversationName = conversationName;
    this.token = token;
    this.messages = [];
  }

  async sendMessage(content) {
    // 添加用户消息到界面
    this.addMessage('user', content);

    // 显示加载状态
    this.showTyping();

    try {
      const response = await fetch(
        `https://atlas.matrix-net.tech/atlas/api/chat/${this.conversationName}/message`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ content })
        }
      );

      const data = await response.json();

      // 添加 AI 回复到界面
      this.hideTyping();
      this.addMessage('assistant', data.content);

      return data;
    } catch (error) {
      this.hideTyping();
      this.showError('发送失败，请重试');
      throw error;
    }
  }

  addMessage(role, content) {
    this.messages.push({ role, content, timestamp: new Date() });
    this.renderMessages();
  }

  showTyping() {
    // 显示"正在输入..."动画
  }

  hideTyping() {
    // 隐藏加载状态
  }

  renderMessages() {
    // 渲染消息列表
  }
}
```

### 5. 智能体切换最佳实践

```javascript
class AgentSwitcher {
  constructor(conversationName, token) {
    this.conversationName = conversationName;
    this.token = token;
  }

  async switchByTime() {
    const hour = new Date().getHours();
    
    // 白班时间（8:00-20:00）
    if (hour >= 8 && hour < 20) {
      await this.switchAgent('service-day', '切换到白班智能体');
    } 
    // 夜班时间（20:00-8:00）
    else {
      await this.switchAgent('service-night', '切换到夜班智能体');
    }
  }

  async switchAgent(newAgentName, reason) {
    const response = await fetch(
      `https://atlas.matrix-net.tech/atlas/api/conversations/${this.conversationName}/switch-agent`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          new_agent_name: newAgentName,
          reason
        })
      }
    );

    const data = await response.json();
    console.log(`智能体切换: ${data.old_agent} → ${data.new_agent}`);
    
    return data;
  }
}

// 定时切换
setInterval(() => {
  switcher.switchByTime();
}, 60 * 60 * 1000);  // 每小时检查一次
```

### 6. 知识库管理最佳实践

```javascript
class KnowledgeBaseManager {
  constructor(agentName, token) {
    this.agentName = agentName;
    this.token = token;
  }

  async uploadMultipleFiles(files) {
    const results = [];
    
    for (const file of files) {
      try {
        const result = await this.uploadFile(file);
        results.push({ file: file.name, success: true, ...result });
      } catch (error) {
        results.push({ file: file.name, success: false, error: error.message });
      }
    }
    
    return results;
  }

  async uploadFile(file) {
    // 验证文件
    if (!this.isValidFile(file)) {
      throw new Error('不支持的文件类型');
    }
    
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('文件过大（最大 10MB）');
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(
      `https://atlas.matrix-net.tech/atlas/api/knowledge-base/${this.agentName}/documents`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.token}` },
        body: formData
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail);
    }

    return await response.json();
  }

  isValidFile(file) {
    const validExtensions = ['.pdf', '.txt', '.md'];
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    return validExtensions.includes(ext);
  }

  async getStats() {
    const response = await fetch(
      `https://atlas.matrix-net.tech/atlas/api/knowledge-base/${this.agentName}/stats`,
      {
        headers: { 'Authorization': `Bearer ${this.token}` }
      }
    );
    
    const result = await response.json();
    return result.data;
  }

  async rebuildWithFiles(fileIdsToKeep) {
    const response = await fetch(
      `https://atlas.matrix-net.tech/atlas/api/knowledge-base/${this.agentName}/rebuild`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ file_ids: fileIdsToKeep })
      }
    );

    return await response.json();
  }
}
```

---

## 测试示例

### 完整测试脚本

```javascript
// test-api.js

const BASE_URL = 'https://atlas.matrix-net.tech/atlas/api';
let token = '';

// 1. 登录
async function login() {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'admin',
      password: 'admin123'
    })
  });
  const data = await response.json();
  token = data.access_token;
  console.log('✅ 登录成功');
}

// 2. 创建智能体
async function createAgent() {
  const response = await fetch(`${BASE_URL}/agents`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'test-agent',
      display_name: '测试智能体',
      agent_type: 'general'
    })
  });
  const data = await response.json();
  console.log('✅ 创建智能体:', data.name);
}

// 3. 创建客服
async function createConversation() {
  const response = await fetch(`${BASE_URL}/conversations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'test-chat',
      display_name: '测试客服',
      agent_name: 'test-agent',
      avatar: '🤖'
    })
  });
  const data = await response.json();
  console.log('✅ 创建客服:', data.name);
}

// 4. 发送消息
async function sendMessage() {
  const response = await fetch(`${BASE_URL}/chat/test-chat/message`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      content: '你好'
    })
  });
  const data = await response.json();
  console.log('✅ AI 回复:', data.content);
}

// 运行测试
(async () => {
  await login();
  await createAgent();
  await createConversation();
  await sendMessage();
})();
```

---

## 附录

### A. API 环境配置

前端项目建议配置环境变量：

```javascript
// .env.production
VITE_API_BASE_URL=https://atlas.matrix-net.tech/atlas/api

// .env.development
VITE_API_BASE_URL=http://localhost:8000/api
```

使用示例：
```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

fetch(`${API_BASE_URL}/agents`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### B. CORS 配置

后端已配置 CORS 允许所有来源，前端可直接调用 API。

生产环境 CORS 配置：
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type
```

### C. 后端环境变量

后端使用以下环境变量（仅供参考，前端无需关心）：

```bash
# OpenAI API
OPENAI_API_KEY=your-key
OPENAI_BASE_URL=https://openrouter.ai/api/v1

# 数据库
DATABASE_URL=postgresql://postgres:p0stgr3s@117.72.204.201:5432/atlas

# Milvus
MILVUS_HOST=117.72.204.201
MILVUS_PORT=19530

# JWT
JWT_SECRET_KEY=your-secret-key
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### D. 在线文档

- **Swagger UI**: https://atlas.matrix-net.tech/atlas/docs
- **ReDoc**: https://atlas.matrix-net.tech/atlas/redoc
- **健康检查**: https://atlas.matrix-net.tech/atlas/health

### E. 常用工具

- **Postman Collection**: 可导入 Swagger JSON
- **cURL 示例**:

```bash
# 登录
curl -X POST "https://atlas.matrix-net.tech/atlas/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 获取智能体列表
curl -X GET "https://atlas.matrix-net.tech/atlas/api/agents" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 健康检查（无需认证）
curl https://atlas.matrix-net.tech/atlas/health
```

---

## 联系支持

如有问题，请查看：
- 📚 在线文档：https://atlas.matrix-net.tech/atlas/docs
- 🐛 GitHub Issues：提交 Bug 或功能请求
- 📧 Email：技术支持邮箱

---

**文档版本**: v0.2.0  
**最后更新**: 2025-01-19  
**后端 API 版本**: v0.2.0
