import { useKnowledgeStore } from '../store';

export const useKnowledge = () => {
  const {
    files,
    loading,
    uploading,
    uploadProgress,
    fetchFiles,
    uploadFiles,
    deleteFile,
    clearKnowledge,
    rebuildIndex,
    setUploadProgress,
  } = useKnowledgeStore();

  return {
    files,
    loading,
    uploading,
    uploadProgress,
    fetchFiles,
    uploadFiles,
    deleteFile,
    clearKnowledge,
    rebuildIndex,
    setUploadProgress,
  };
};
