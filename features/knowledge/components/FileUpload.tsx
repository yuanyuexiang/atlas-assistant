import { useState } from 'react';
import { Upload, Button, message, Progress, Alert, Space } from 'antd';
import { InboxOutlined, UploadOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import { MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from '@/lib/constants';
import styles from './FileUpload.module.css';

const { Dragger } = Upload;

interface FileUploadProps {
  agentName: string;
  onUploadSuccess?: () => void;
  onUpload: (files: File[]) => Promise<void>;
  uploading?: boolean;
  uploadProgress?: number;
}

export const FileUpload = ({ 
  agentName,
  onUploadSuccess, 
  onUpload,
  uploading = false,
  uploadProgress = 0,
}: FileUploadProps) => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const uploadProps: UploadProps = {
    name: 'files',
    multiple: true,
    accept: ALLOWED_FILE_TYPES.join(','),
    fileList,
    beforeUpload: (file) => {
      // 检查文件类型
      const fileExt = `.${file.name.split('.').pop()?.toLowerCase()}`;
      if (!ALLOWED_FILE_TYPES.includes(fileExt)) {
        message.error(`不支持的文件类型: ${file.name}。仅支持 ${ALLOWED_FILE_TYPES.join(', ')}`);
        return Upload.LIST_IGNORE;
      }

      // 检查文件大小
      if (file.size > MAX_FILE_SIZE) {
        message.error(`文件 ${file.name} 超过 10MB 限制`);
        return Upload.LIST_IGNORE;
      }

      // 添加到文件列表
      setFileList((prev) => [
        ...prev,
        {
          uid: file.uid,
          name: file.name,
          status: 'done',
          originFileObj: file,
        } as UploadFile,
      ]);
      
      return false; // 阻止自动上传
    },
    onRemove: (file) => {
      setFileList((prev) => prev.filter((item) => item.uid !== file.uid));
    },
  };

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.warning('请先选择文件');
      return;
    }

    console.log('[FileUpload] 开始上传，fileList:', fileList);

    try {
      const files = fileList
        .map((file) => file.originFileObj as File)
        .filter((file): file is File => file !== undefined);
      
      console.log('[FileUpload] 提取的 File 对象:', files);
      console.log('[FileUpload] 目标智能体:', agentName);
      
      if (files.length === 0) {
        message.error('文件列表为空，请重新选择文件');
        return;
      }
      
      await onUpload(files);
      message.success(`成功上传 ${files.length} 个文件到 ${agentName}`);
      setFileList([]);
      onUploadSuccess?.();
    } catch (error: any) {
      console.error('[FileUpload] 上传失败:', error);
      console.error('[FileUpload] 错误详情:', error.response?.data);
      const errorMsg = error.response?.data?.detail || error.message || '上传失败';
      message.error(errorMsg);
    }
  };

  return (
    <div className={styles.container}>
      <Alert
        message="上传说明"
        description={
          <>
            <p>• 支持的文件格式: PDF, TXT, MD</p>
            <p>• 单个文件最大 10MB</p>
            <p>• 可同时上传多个文件</p>
            <p>• 上传的文件将被自动分块并建立向量索引</p>
          </>
        }
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Dragger {...uploadProps} disabled={uploading}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined style={{ fontSize: 48, color: '#1890ff' }} />
        </p>
        <p className="ant-upload-text">点击或拖拽文件到此区域</p>
        <p className="ant-upload-hint">
          支持单个或批量上传。仅支持 PDF、TXT、MD 格式，单个文件最大 10MB
        </p>
      </Dragger>

      {fileList.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <Space>
            <Button
              type="primary"
              icon={<UploadOutlined />}
              onClick={handleUpload}
              loading={uploading}
              disabled={uploading}
            >
              上传 {fileList.length} 个文件
            </Button>
            <Button
              onClick={() => setFileList([])}
              disabled={uploading}
            >
              清空列表
            </Button>
          </Space>
        </div>
      )}

      {uploading && (
        <div style={{ marginTop: 16 }}>
          <Progress percent={uploadProgress} status="active" />
          <p style={{ textAlign: 'center', marginTop: 8, color: '#666' }}>
            正在上传到 {agentName}，请稍候...
          </p>
        </div>
      )}
    </div>
  );
};
