import { useState, useEffect } from 'react';
import { 
  App, Button, Input, Space, Card, Table, Tag, Dropdown, 
  Upload, Empty, Spin, Select
} from 'antd';
import { 
  CloudUploadOutlined, DeleteOutlined, ReloadOutlined, 
  FileTextOutlined, MoreOutlined, SyncOutlined, DownloadOutlined, ClearOutlined,
  FileOutlined, DatabaseOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import type { UploadProps, MenuProps, TableColumnsType } from 'antd';
import { useKnowledge } from '@/features/knowledge/hooks/useKnowledge';
import { useAgentList } from '@/features/agent/hooks/useAgent';
import type { DocumentInfo, Agent } from '@/types/models';
import styles from './KnowledgePage.module.css';

const { Search } = Input;
const { Dragger } = Upload;

interface TableDataType extends DocumentInfo {
  key: string;
}

export const KnowledgePage = () => {
  const { modal, message } = App.useApp();
  
  const { agents, loading: loadingAgents } = useAgentList();
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
  } = useKnowledge();

  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // 获取选中的智能体对象
  const selectedAgent = agents.find(a => a.id === selectedAgentId);

  // 自动选择第一个智能体
  useEffect(() => {
    if (agents.length > 0 && !selectedAgentId) {
      setSelectedAgentId(agents[0].id);
    }
  }, [agents, selectedAgentId]);

  // 当选中智能体时，加载其知识库文件
  useEffect(() => {
    if (selectedAgentId) {
      fetchFiles(selectedAgentId).catch(error => {
        if (error.response?.status !== 404) {
          console.error('[KnowledgePage] 加载失败:', error);
        }
      });
    }
  }, [selectedAgentId, fetchFiles]);

  // 格式化文件大小
  const formatFileSize = (sizeMB: number): string => {
    if (sizeMB < 0.01) return '< 0.01 MB';
    if (sizeMB < 1) return `${(sizeMB * 1024).toFixed(2)} KB`;
    if (sizeMB < 1024) return `${sizeMB.toFixed(2)} MB`;
    return `${(sizeMB / 1024).toFixed(2)} GB`;
  };

  // 格式化日期
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days} 天前`;
    return date.toLocaleDateString('zh-CN');
  };

  // 获取文件类型标签颜色
  const getFileTypeColor = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return 'red';
      case 'txt': return 'blue';
      case 'md': return 'green';
      case 'doc':
      case 'docx': return 'orange';
      default: return 'default';
    }
  };

  // 上传文件处理
  const handleUpload = async (fileList: File[]) => {
    if (!selectedAgentId) {
      message.error('请先选择智能体');
      return;
    }

    try {
      await uploadFiles(selectedAgentId, fileList);
      message.success(`成功上传 ${fileList.length} 个文件`);
    } catch (error: any) {
      message.error(error.response?.data?.detail || '文件上传失败');
    }
  };

  // 删除单个文件
  const handleDelete = (filename: string) => {
    if (!selectedAgentId) {
      message.error('请先选择智能体');
      return;
    }

    modal.confirm({
      title: '确认删除',
      content: `确定要删除文件 "${filename}" 吗？此操作不可恢复。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteFile(selectedAgentId, filename);
          message.success('文件已删除');
          setSelectedRowKeys(prev => prev.filter(key => key !== filename));
        } catch (error: any) {
          message.error(error.response?.data?.detail || '删除失败');
        }
      },
    });
  };

  // 批量删除
  const handleBatchDelete = () => {
    if (!selectedAgentId || selectedRowKeys.length === 0) return;

    modal.confirm({
      title: '批量删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 个文件吗？此操作不可恢复。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await Promise.all(
            selectedRowKeys.map(key => 
              deleteFile(selectedAgentId, key as string)
            )
          );
          message.success(`已删除 ${selectedRowKeys.length} 个文件`);
          setSelectedRowKeys([]);
        } catch (error: any) {
          message.error(error.response?.data?.detail || '批量删除失败');
        }
      },
    });
  };

  // 清空知识库
  const handleClearAll = () => {
    if (!selectedAgentId || files.length === 0) return;

    modal.confirm({
      title: '清空知识库',
      icon: <DeleteOutlined style={{ color: '#ff4d4f' }} />,
      content: (
        <>
          <p>确定要清空 <strong>{selectedAgent?.display_name}</strong> 的知识库吗？</p>
          <p style={{ color: '#ff4d4f' }}>
            这将删除该智能体的所有 {files.length} 个文件，此操作不可恢复！
          </p>
        </>
      ),
      okText: '确认清空',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await clearKnowledge(selectedAgentId);
          message.success('知识库已清空');
          setSelectedRowKeys([]);
        } catch (error: any) {
          message.error(error.response?.data?.detail || '清空失败');
        }
      },
    });
  };

  // 重建索引
  const handleRebuildIndex = () => {
    if (!selectedAgentId) return;

    modal.confirm({
      title: '重建向量索引',
      icon: <SyncOutlined />,
      content: (
        <>
          <p>确定要重建 <strong>{selectedAgent?.display_name}</strong> 的向量索引吗？</p>
          <p>此操作将：</p>
          <ul>
            <li>重新处理所有文档</li>
            <li>重新生成向量嵌入</li>
            <li>可能需要较长时间</li>
          </ul>
        </>
      ),
      okText: '确认重建',
      okType: 'primary',
      cancelText: '取消',
      onOk: async () => {
        try {
          await rebuildIndex(selectedAgentId);
          message.success('索引重建任务已启动');
        } catch (error: any) {
          message.error(error.response?.data?.detail || '重建失败');
        }
      },
    });
  };

  // 刷新文件列表
  const handleRefresh = async () => {
    if (!selectedAgentId) {
      message.warning('请先选择智能体');
      return;
    }
    await fetchFiles(selectedAgentId);
    message.success('刷新成功');
  };

  // 下载文件
  const handleDownload = (_file: DocumentInfo) => {
    // TODO: 实现文件下载功能
    message.info('文件下载功能开发中');
  };

  // 查看文件详情
  const handleView = (file: DocumentInfo) => {
    modal.info({
      title: '文件详情',
      width: 600,
      content: (
        <div style={{ marginTop: 16 }}>
          <p><strong>文件名:</strong> {file.filename}</p>
          <p><strong>大小:</strong> {formatFileSize(file.file_size_mb)}</p>
          <p><strong>类型:</strong> {file.filename.split('.').pop()?.toUpperCase()}</p>
          <p><strong>上传时间:</strong> {new Date(file.upload_time).toLocaleString('zh-CN')}</p>
          <p><strong>Chunks 数量:</strong> {file.chunks_count}</p>
          <p><strong>文件 ID:</strong> {file.file_id}</p>
          <p><strong>所属智能体:</strong> {selectedAgent?.display_name}</p>
        </div>
      ),
    });
  };

  // 过滤文件列表
  const filteredFiles = files.filter(file => {
    // 搜索过滤
    if (searchQuery && !file.filename.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  // 转换为 Table 数据
  const tableData: TableDataType[] = filteredFiles.map(file => ({
    ...file,
    key: file.file_id,
  }));

  // 计算统计数据
  const totalFiles = files.length;
  const totalSize = files.reduce((sum, file) => sum + file.file_size_mb, 0);
  const totalChunks = files.reduce((sum, file) => sum + file.chunks_count, 0);

  // Table 操作菜单
  const getActionMenu = (record: TableDataType): MenuProps => ({
    items: [
      {
        key: 'view',
        icon: <FileTextOutlined />,
        label: '查看详情',
        onClick: () => handleView(record),
      },
      {
        key: 'download',
        icon: <DownloadOutlined />,
        label: '下载',
        onClick: () => handleDownload(record),
      },
      {
        type: 'divider',
      },
      {
        key: 'delete',
        icon: <DeleteOutlined />,
        label: '删除',
        danger: true,
        onClick: () => handleDelete(record.filename),
      },
    ],
  });

  // Table 列定义
  const columns: TableColumnsType<TableDataType> = [
    {
      title: '文件名',
      dataIndex: 'filename',
      key: 'filename',
      sorter: (a, b) => a.filename.localeCompare(b.filename),
      render: (text: string) => (
        <Space>
          <FileOutlined />
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: '大小',
      dataIndex: 'file_size_mb',
      key: 'file_size_mb',
      width: 120,
      sorter: (a, b) => a.file_size_mb - b.file_size_mb,
      render: (size: number) => formatFileSize(size),
    },
    {
      title: '类型',
      key: 'type',
      width: 100,
      filters: [
        { text: 'PDF', value: 'pdf' },
        { text: 'TXT', value: 'txt' },
        { text: 'MD', value: 'md' },
        { text: 'DOC', value: 'doc' },
        { text: 'DOCX', value: 'docx' },
      ],
      onFilter: (value, record) => {
        const ext = record.filename.split('.').pop()?.toLowerCase();
        return ext === value;
      },
      render: (_: any, record) => {
        const ext = record.filename.split('.').pop()?.toUpperCase() || '';
        return <Tag color={getFileTypeColor(record.filename)}>{ext}</Tag>;
      },
    },
    {
      title: 'Chunks',
      dataIndex: 'chunks_count',
      key: 'chunks_count',
      width: 100,
      sorter: (a, b) => a.chunks_count - b.chunks_count,
    },
    {
      title: '上传时间',
      dataIndex: 'upload_time',
      key: 'upload_time',
      width: 140,
      sorter: (a, b) => new Date(a.upload_time).getTime() - new Date(b.upload_time).getTime(),
      render: (date: string) => formatDate(date),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      fixed: 'right',
      render: (_: any, record) => (
        <Dropdown menu={getActionMenu(record)} trigger={['click']}>
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  // 行选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  };

  // Upload 配置
  const uploadProps: UploadProps = {
    name: 'file',
    multiple: true,
    accept: '.pdf,.txt,.md,.doc,.docx',
    beforeUpload: (file) => {
      const isValidType = [
        'application/pdf',
        'text/plain',
        'text/markdown',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ].includes(file.type) || file.name.match(/\.(pdf|txt|md|doc|docx)$/i);

      if (!isValidType) {
        message.error(`${file.name} 不是支持的文件格式`);
        return Upload.LIST_IGNORE;
      }

      const isLt50M = file.size / 1024 / 1024 < 50;
      if (!isLt50M) {
        message.error(`${file.name} 文件大小超过 50MB`);
        return Upload.LIST_IGNORE;
      }

      return false; // 阻止自动上传
    },
    onChange: (info) => {
      const fileList = info.fileList
        .filter(file => file.status !== 'error')
        .map(file => file.originFileObj as File);
      
      if (fileList.length > 0 && info.file.status !== 'uploading') {
        handleUpload(fileList);
      }
    },
  };

  // 如果正在加载智能体列表
  if (loadingAgents) {
    return (
      <div className={styles.container}>
        <Spin tip="加载智能体列表..." size="large">
          <div style={{ minHeight: 400 }} />
        </Spin>
      </div>
    );
  }

  // 如果没有智能体
  if (agents.length === 0) {
    return (
      <div className={styles.container}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="暂无智能体"
        >
          <p>请先在「智能体管理」中创建智能体</p>
        </Empty>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 顶部栏：智能体选择 + 操作按钮 */}
      <div className={styles.topBar}>
        <div className={styles.agentSelector}>
          <DatabaseOutlined className={styles.agentIcon} />
          <Select
            value={selectedAgentId}
            onChange={setSelectedAgentId}
            className={styles.agentSelect}
            placeholder="选择智能体"
            size="large"
          >
            {agents.map((agent: Agent) => (
              <Select.Option key={agent.id} value={agent.id}>
                <Space>
                  <span>{agent.display_name}</span>
                  {selectedAgentId === agent.id && files.length > 0 && (
                    <Tag color="blue">{files.length} 个文件</Tag>
                  )}
                </Space>
              </Select.Option>
            ))}
          </Select>
        </div>
        
        <Space size="middle">
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            disabled={!selectedAgentId || loading}
            size="large"
          >
            刷新
          </Button>
          <Button
            icon={<SyncOutlined />}
            onClick={handleRebuildIndex}
            disabled={!selectedAgentId || files.length === 0}
            size="large"
          >
            重建索引
          </Button>
          <Button
            danger
            icon={<ClearOutlined />}
            onClick={handleClearAll}
            disabled={!selectedAgentId || files.length === 0}
            size="large"
          >
            清空知识库
          </Button>
        </Space>
      </div>

      {/* 统计卡片 */}
      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <div className={styles.statContent}>
            <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <DatabaseOutlined />
            </div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>{totalFiles}</div>
              <div className={styles.statLabel}>文件总数</div>
            </div>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statContent}>
            <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
              <FileOutlined />
            </div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>{totalSize.toFixed(2)} MB</div>
              <div className={styles.statLabel}>总大小</div>
            </div>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statContent}>
            <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
              <FileTextOutlined />
            </div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>{totalChunks}</div>
              <div className={styles.statLabel}>Chunks 总数</div>
            </div>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statContent}>
            <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
              <CheckCircleOutlined />
            </div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>{selectedRowKeys.length}</div>
              <div className={styles.statLabel}>已选中</div>
            </div>
          </div>
        </Card>
      </div>

      {/* 统一的文件管理卡片 */}
      <Card className={styles.fileManageCard}>
        <div className={styles.sectionTitle}>
          <DatabaseOutlined />
          <span>文件管理</span>
        </div>

        {/* 上传区域（紧凑型） */}
        <div className={styles.uploadArea}>
          <Dragger {...uploadProps} disabled={!selectedAgentId || uploading} className={styles.compactDragger}>
            <div className={styles.uploadContent}>
              <CloudUploadOutlined className={styles.uploadIcon} />
              <div className={styles.uploadText}>
                <span className={styles.uploadMainText}>
                  拖拽文件到此处或 <a>点击上传</a>
                </span>
                <span className={styles.uploadHint}>
                  支持 PDF、TXT、MD、DOC、DOCX，单文件不超过 50MB
                </span>
              </div>
            </div>
            {uploading && uploadProgress > 0 && (
              <div className={styles.uploadProgress}>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill}
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <span className={styles.progressText}>上传中 {uploadProgress}%</span>
              </div>
            )}
          </Dragger>
        </div>

        {/* 搜索和操作工具栏 */}
        <div className={styles.toolbar}>
          <Search
            placeholder="搜索文件名..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onSearch={setSearchQuery}
            style={{ width: 300 }}
            allowClear
            size="large"
          />
          {selectedRowKeys.length > 0 && (
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={handleBatchDelete}
              size="large"
            >
              批量删除 ({selectedRowKeys.length})
            </Button>
          )}
        </div>

        {/* 文件表格 */}
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={tableData}
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 个文件`,
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="暂无文件"
              >
                <p style={{ color: '#999' }}>拖拽文件到上方区域开始上传</p>
              </Empty>
            ),
          }}
        />
      </Card>
    </div>
  );
};

export default KnowledgePage;
