// Knowledge feature API
import { http } from '@/lib/http/http';
import type { DocumentInfo } from '@/types/models';

export interface UploadFileParams {
  agent_name: string;
  files: File[];
}

export interface KnowledgeListParams {
  agent_name: string;
}

export interface DeleteFileParams {
  agent_name: string;
  file_id: string;
}

export interface ClearKnowledgeParams {
  agent_name: string;
}

export interface RebuildIndexParams {
  agent_name: string;
}

export interface KnowledgeStats {
  total_files: number;
  total_size_mb: number;
  total_chunks: number;
}

export const knowledgeApi = {
  // 上传文件到智能体
  upload: async (agentName: string, files: File[]) => {
    console.log('[Knowledge API] 准备上传到:', agentName);
    console.log('[Knowledge API] 文件数量:', files.length);
    
    const formData = new FormData();
    files.forEach((file, index) => {
      console.log(`[Knowledge API] 添加文件 ${index + 1}:`, file.name, file.size, 'bytes');
      // 后端可能期望的字段名是 'files' 或 'file'
      formData.append('files', file, file.name);
    });

    console.log('[Knowledge API] 请求 URL:', `/knowledge-base/${agentName}/documents`);
    console.log('[Knowledge API] FormData entries:');
    for (let pair of formData.entries()) {
      console.log('  -', pair[0], ':', pair[1]);
    }
    
    // 不要手动设置 Content-Type，让浏览器自动设置（包含 boundary）
    return http.post<{ uploaded_files: DocumentInfo[] }>(
      `/knowledge-base/${agentName}/documents`,
      formData
    ).then(res => {
      console.log('[Knowledge API] 上传响应:', res.data);
      return res.data;
    }).catch(error => {
      console.error('[Knowledge API] 上传失败:', error.response?.data);
      throw error;
    });
  },

  // 获取智能体的知识库文件列表
  list: async (agentName: string) => {
    const response = await http.get<any>(`/knowledge-base/${agentName}/documents`);
    const data = response.data;
    
    // 处理可能的返回格式
    if (data && typeof data === 'object' && 'files' in data) {
      return data.files as DocumentInfo[];
    }
    return Array.isArray(data) ? data : [];
  },

  // 删除指定文件
  delete: (agentName: string, fileId: string) =>
    http.delete(`/knowledge-base/${agentName}/documents/${fileId}`).then(res => res.data),

  // 清空智能体的知识库
  clear: (agentName: string) =>
    http.delete(`/knowledge-base/${agentName}/documents`).then(res => res.data),

  // 重建智能体的知识库索引
  rebuild: (agentName: string) =>
    http.post(`/knowledge-base/${agentName}/rebuild`).then(res => res.data),

  // 获取知识库统计信息
  stats: (agentName: string) =>
    http.get<KnowledgeStats>(`/knowledge-base/${agentName}/stats`).then(res => res.data),
};
