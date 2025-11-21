# 知识库管理 API 对照表

## ✅ 后端 API 端点（已实现）

| 功能 | 方法 | 路径 | 前端方法 |
|------|------|------|----------|
| 上传文档 | POST | `/atlas/api/knowledge-base/{agent_name}/documents` | `knowledgeApi.upload()` |
| 获取文档列表 | GET | `/atlas/api/knowledge-base/{agent_name}/documents` | `knowledgeApi.list()` |
| 删除单个文档 | DELETE | `/atlas/api/knowledge-base/{agent_name}/documents/{file_id}` | `knowledgeApi.delete()` |
| 清空知识库 | DELETE | `/atlas/api/knowledge-base/{agent_name}/documents` | `knowledgeApi.clear()` |
| 获取统计信息 | GET | `/atlas/api/knowledge-base/{agent_name}/stats` | `knowledgeApi.stats()` |
| 重建索引 | POST | `/atlas/api/knowledge-base/{agent_name}/rebuild` | `knowledgeApi.rebuild()` |

## 📝 API 详细说明

### 1. 上传文档
- **请求**: `POST /knowledge-base/{agent_name}/documents`
- **Content-Type**: `multipart/form-data`
- **参数**: `files` (File[])
- **响应**: 
```typescript
{
  uploaded_files: DocumentInfo[]
}
```

### 2. 获取文档列表
- **请求**: `GET /knowledge-base/{agent_name}/documents`
- **响应**:
```typescript
{
  files: DocumentInfo[]
}
// 或
DocumentInfo[]
```

### 3. 删除单个文档
- **请求**: `DELETE /knowledge-base/{agent_name}/documents/{file_id}`
- **响应**: `{ message: string }`

### 4. 清空知识库
- **请求**: `DELETE /knowledge-base/{agent_name}/documents`
- **响应**: `{ message: string }`

### 5. 获取统计信息
- **请求**: `GET /knowledge-base/{agent_name}/stats`
- **响应**:
```typescript
{
  total_files: number;
  total_size_mb: number;
  total_chunks: number;
}
```

### 6. 重建索引
- **请求**: `POST /knowledge-base/{agent_name}/rebuild`
- **响应**: `{ message: string }`

## 🔄 数据类型

```typescript
interface DocumentInfo {
  file_id: string;
  filename: string;
  file_size_mb: number;
  chunks_count: number;
  upload_time: string;
}
```

## ✅ 前端实现状态

- ✅ API 层完整实现（`features/knowledge/api/knowledge.ts`）
- ✅ Store 状态管理（`features/knowledge/store.ts`）
- ✅ Hooks 封装（`features/knowledge/hooks/useKnowledge.ts`）
- ✅ 文件上传组件（`features/knowledge/components/FileUpload.tsx`）
- ✅ 文件列表组件（`features/knowledge/components/FileList.tsx`）
- ✅ 知识库管理页面（`pages/knowledge/KnowledgePage.tsx`）
- ✅ 路由配置（`/knowledge`）

## 🎉 功能特性

1. **文件上传**
   - 支持拖拽上传
   - 多文件批量上传
   - 文件类型验证（PDF, TXT, MD）
   - 文件大小限制（10MB）
   - 实时上传进度

2. **文件管理**
   - 文件列表展示（表格形式）
   - 文件详情（名称、大小、分块数、上传时间）
   - 单个文件删除
   - 批量清空知识库

3. **数据统计**
   - 文件总数
   - 总大小
   - 总分块数

4. **向量索引**
   - 自动向量化
   - 存储到 Milvus
   - 手动重建索引

## 🚀 使用方法

1. 访问 `/knowledge` 页面
2. 选择智能体
3. 上传文档文件
4. 查看和管理知识库文件

所有功能已完全对接后端 API，可以正常使用！
