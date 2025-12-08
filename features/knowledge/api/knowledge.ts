// Knowledge feature API
import { http } from '@/lib/http/http';
import type { DocumentInfo } from '@/types/models';

export interface KnowledgeStats {
  total_files: number;
  total_size_mb: number;
  total_chunks: number;
}

export const knowledgeApi = {
  // 上传文件到智能体 (使用 agent UUID)
  upload: async (agentId: string, files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('file', file, file.name);  // ✅ 后端要求字段名为 'file' (单数)
    });
    
    // 不要手动设置 Content-Type，让浏览器自动设置（包含 boundary）
    return http.post<{ uploaded_files: DocumentInfo[] }>(
      `/knowledge-base/${agentId}/documents`,
      formData
    ).then(res => {
      return res.data;
    }).catch(error => {
      console.error('[Knowledge API] 上传失败:', error.response?.data);
      throw error;
    });
  },

  // 获取智能体的知识库文件列表 (使用 agent UUID)
  list: async (agentId: string) => {
    const response = await http.get<any>(`/knowledge-base/${agentId}/documents`);
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
    const normalizedFiles = fileList.map((file: any) => {
      // 处理文件大小：可能是字节数或MB数
      let fileSizeMb = 0;
      if (file.file_size_mb) {
        fileSizeMb = parseFloat(file.file_size_mb);
      } else if (file.size_mb) {
        fileSizeMb = parseFloat(file.size_mb);
      } else if (file.file_size) {
        // 字节转MB
        fileSizeMb = file.file_size / (1024 * 1024);
      } else if (file.size) {
        // 字节转MB
        fileSizeMb = file.size / (1024 * 1024);
      }
      
      return {
        file_id: file.file_id || file.id || '',
        filename: file.filename || file.name || file.file_name || '',
        file_size_mb: fileSizeMb,
        chunks_count: parseInt(file.chunks_count || file.chunks || file.chunk_count || 0),
        upload_time: file.upload_time || file.uploaded_at || file.created_at || new Date().toISOString(),
        status: file.status || 'ready',
        processing_progress: parseInt(file.processing_progress || 100),
        error_message: file.error_message || null,
      };
    });
    
    console.log('[Knowledge API] 规范化后的文件列表:', normalizedFiles);
    
    return normalizedFiles as DocumentInfo[];
  },

  // 删除指定文件 (agent 和 file 都使用 UUID)
  delete: (agentId: string, fileId: string) =>
    http.delete(`/knowledge-base/${agentId}/documents/${fileId}`).then(res => res.data),

  // 清空智能体的知识库 (使用 agent UUID)
  clear: (agentId: string) =>
    http.delete(`/knowledge-base/${agentId}/clear`).then(res => res.data),

  // 重建智能体的知识库索引 (使用 agent UUID)
  rebuild: (agentId: string) =>
    http.post(`/knowledge-base/${agentId}/rebuild`).then(res => res.data),

  // 获取知识库统计信息 (使用 agent UUID)
  stats: async (agentId: string) => {
    const response = await http.get<any>(`/knowledge-base/${agentId}/stats`);
    const data = response.data;
    
    console.log('[Knowledge API] 获取统计数据 - 原始响应:', data);
    
    // 后端返回的是向量数据库统计：{collection_name, total_vectors, exists}
    // 需要从文件列表中计算实际的文件统计
    
    // 获取文件列表来计算统计数据
    const fileListResponse = await http.get<any>(`/knowledge-base/${agentId}/documents`);
    const fileData = fileListResponse.data;
    
    let fileList: any[] = [];
    if (fileData && typeof fileData === 'object') {
      if ('data' in fileData && Array.isArray(fileData.data)) {
        fileList = fileData.data;
      } else if (Array.isArray(fileData)) {
        fileList = fileData;
      }
    }
    
    console.log('[Knowledge API] 用于统计的文件列表:', fileList);
    
    // 从文件列表计算统计数据
    const totalFiles = fileList.length;
    const totalSize = fileList.reduce((sum, file) => {
      const fileSize = file.file_size || 0; // 字节数
      return sum + fileSize;
    }, 0);
    const totalChunks = fileList.reduce((sum, file) => {
      return sum + parseInt(file.chunks_count || 0);
    }, 0);
    
    const normalizedStats: KnowledgeStats = {
      total_files: totalFiles,
      total_size_mb: totalSize / (1024 * 1024), // 字节转MB
      total_chunks: totalChunks,
    };
    
    console.log('[Knowledge API] 计算后的统计数据:', normalizedStats);
    
    return normalizedStats;
  },
};
