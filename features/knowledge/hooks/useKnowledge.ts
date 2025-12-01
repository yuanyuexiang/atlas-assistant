import { useKnowledgeStore } from '../store';

export const useKnowledge = () => {
  const {
    files,
    stats,
    loading,
    uploading,
    uploadProgress,
    fetchFiles,
    fetchStats,
    uploadFiles,
    deleteFile,
    clearKnowledge,
    rebuildIndex,
    setUploadProgress,
  } = useKnowledgeStore();

  return {
    files,
    stats,
    loading,
    uploading,
    uploadProgress,
    fetchFiles,
    fetchStats,
    uploadFiles,
    deleteFile,
    clearKnowledge,
    rebuildIndex,
    setUploadProgress,
  };
};
