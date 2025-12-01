import { create } from 'zustand';
import type { DocumentInfo } from '@/types/models';
import { knowledgeApi, type KnowledgeStats } from './api/knowledge';

interface KnowledgeState {
  files: DocumentInfo[];
  stats: KnowledgeStats | null;
  loading: boolean;
  uploading: boolean;
  uploadProgress: number;
  
  // 获取知识库文件列表 (使用 agent UUID)
  fetchFiles: (agentId: string) => Promise<void>;
  
  // 获取知识库统计数据 (使用 agent UUID)
  fetchStats: (agentId: string) => Promise<void>;
  
  // 上传文件 (使用 agent UUID)
  uploadFiles: (agentId: string, files: File[]) => Promise<DocumentInfo[]>;
  
  // 删除文件 (使用 agent UUID)
  deleteFile: (agentId: string, fileId: string) => Promise<void>;
  
  // 清空知识库 (使用 agent UUID)
  clearKnowledge: (agentId: string) => Promise<void>;
  
  // 重建索引 (使用 agent UUID)
  rebuildIndex: (agentId: string) => Promise<void>;
  
  // 设置上传进度
  setUploadProgress: (progress: number) => void;
}

export const useKnowledgeStore = create<KnowledgeState>((set) => ({
  files: [],
  stats: null,
  loading: false,
  uploading: false,
  uploadProgress: 0,

  fetchStats: async (agentId) => {
    console.log('[Knowledge Store] 获取统计数据:', agentId);
    try {
      const stats = await knowledgeApi.stats(agentId);
      console.log('[Knowledge Store] 统计数据:', stats);
      set({ stats });
    } catch (error: any) {
      console.error('[Knowledge Store] 获取统计数据失败:', error);
      // 直接抛出错误，不做任何处理
      throw error;
    }
  },

  fetchFiles: async (agentId) => {
    console.log('[Knowledge Store] 获取文件列表:', agentId);
    set({ loading: true });
    try {
      const files = await knowledgeApi.list(agentId);
      console.log('[Knowledge Store] 获取成功:', files.length, '个文件');
      set({ files, loading: false });
    } catch (error: any) {
      console.error('[Knowledge Store] 获取文件列表失败:', error);
      console.error('[Knowledge Store] 错误详情:', error.response?.data);
      console.error('[Knowledge Store] 状态码:', error.response?.status);
      
      // 如果是 404，可能是这个智能体还没有知识库，设置为空数组
      if (error.response?.status === 404) {
        console.log('[Knowledge Store] 智能体暂无知识库，设置为空');
        set({ files: [], loading: false });
      } else {
        set({ loading: false });
        throw error;
      }
    }
  },

  uploadFiles: async (agentId, files) => {
    console.log('[Knowledge Store] 开始上传:', files.length, '个文件');
    console.log('[Knowledge Store] 智能体 ID:', agentId);
    console.log('[Knowledge Store] 文件详情:', files.map(f => ({ name: f.name, size: f.size, type: f.type })));
    set({ uploading: true, uploadProgress: 0 });
    try {
      const result = await knowledgeApi.upload(agentId, files);
      console.log('[Knowledge Store] 上传响应:', result);
      
      // 处理各种可能的返回格式
      let uploadedFiles: DocumentInfo[] = [];
      if (result && typeof result === 'object') {
        if ('uploaded_files' in result && Array.isArray(result.uploaded_files)) {
          uploadedFiles = result.uploaded_files;
        } else if ('data' in result && Array.isArray(result.data)) {
          uploadedFiles = result.data;
        } else if (Array.isArray(result)) {
          uploadedFiles = result;
        }
      }
      
      console.log('[Knowledge Store] 上传成功:', uploadedFiles.length, '个文件');
      
      // 更新文件列表
      set((state) => ({
        files: [...state.files, ...uploadedFiles],
        uploading: false,
        uploadProgress: 100,
      }));
      
      return uploadedFiles;
    } catch (error) {
      console.error('[Knowledge Store] 上传失败:', error);
      set({ uploading: false, uploadProgress: 0 });
      throw error;
    }
  },

  deleteFile: async (agentId, fileId) => {
    console.log('[Knowledge Store] 删除文件:', fileId);
    set({ loading: true });
    try {
      await knowledgeApi.delete(agentId, fileId);
      console.log('[Knowledge Store] 删除成功:', fileId);
      
      set((state) => ({
        files: state.files.filter((file) => file.file_id !== fileId),
        loading: false,
      }));
    } catch (error) {
      console.error('[Knowledge Store] 删除文件失败:', error);
      set({ loading: false });
      throw error;
    }
  },

  clearKnowledge: async (agentId) => {
    set({ loading: true });
    try {
      await knowledgeApi.clear(agentId);
      set({ files: [], loading: false });
    } catch (error) {
      console.error('[Knowledge Store] 清空知识库失败:', error);
      set({ loading: false });
      throw error;
    }
  },

  rebuildIndex: async (agentId) => {
    set({ loading: true });
    try {
      await knowledgeApi.rebuild(agentId);
      set({ loading: false });
    } catch (error) {
      console.error('[Knowledge Store] 重建索引失败:', error);
      set({ loading: false });
      throw error;
    }
  },

  setUploadProgress: (progress) => {
    set({ uploadProgress: progress });
  },
}));
