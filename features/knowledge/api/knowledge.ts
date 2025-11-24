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
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file, file.name);
    });
    
    // 不要手动设置 Content-Type，让浏览器自动设置（包含 boundary）
    return http.post<{ uploaded_files: DocumentInfo[] }>(
      `/knowledge-base/${agentName}/documents`,
      formData
    ).then(res => {
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
