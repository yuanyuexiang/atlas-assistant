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
    
    console.log('[Knowledge API] 获取文件列表 - 原始响应:', data);
    
    let fileList: any[] = [];
    
    // 处理可能的返回格式
    if (data && typeof data === 'object') {
      if ('data' in data && Array.isArray(data.data)) {
        // 格式: {success: true, data: [...]}
        fileList = data.data;
      } else if ('files' in data && Array.isArray(data.files)) {
        // 格式: {files: [...]}
        fileList = data.files;
      } else if (Array.isArray(data)) {
        // 格式: [...]
        fileList = data;
      }
    } else if (Array.isArray(data)) {
      fileList = data;
    }
    
    console.log('[Knowledge API] 提取的文件列表:', fileList);
    
    // 规范化数据格式
    const normalizedFiles = fileList.map((file: any) => ({
      file_id: file.file_id || file.id || '',
      filename: file.filename || file.name || file.file_name || '',
      file_size_mb: parseFloat(file.file_size_mb || file.size_mb || file.size || 0),
      chunks_count: parseInt(file.chunks_count || file.chunks || file.chunk_count || 0),
      upload_time: file.upload_time || file.uploaded_at || file.created_at || new Date().toISOString(),
    }));
    
    console.log('[Knowledge API] 规范化后的文件列表:', normalizedFiles);
    
    return normalizedFiles as DocumentInfo[];
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
