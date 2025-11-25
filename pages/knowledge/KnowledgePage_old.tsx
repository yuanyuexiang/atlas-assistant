import { useState, useEffect } from 'react';
import { 
  App, Button, Input, Space, Card, Table, Tag, Dropdown, 
  Progress, Statistic, Row, Col, Upload, Modal, Select, Empty, Spin 
} from 'antd';
import { 
  CloudUploadOutlined, DeleteOutlined, ReloadOutlined, 
  FileTextOutlined, MoreOutlined, ClearOutlined, 
  SyncOutlined, SearchOutlined, DownloadOutlined,
  FolderOpenOutlined, FileOutlined, DatabaseOutlined
} from '@ant-design/icons';
import type { UploadFile, MenuProps, TableColumnsType } from 'antd';
import { useKnowledge } from '@/features/knowledge/hooks/useKnowledge';
import { useAgentList } from '@/features/agent/hooks/useAgent';
import type { DocumentInfo } from '@/types/models';
import styles from './KnowledgePage.module.css';

const { Search } = Input;

export const KnowledgePage = () => {
  const [selectedAgentName, setSelectedAgentName] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
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

  // 获取选中的智能体对象
  const selectedAgent = agents.find(a => a.name === selectedAgentName);

  // 自动选择第一个智能体
  useEffect(() => {
    if (agents.length > 0 && !selectedAgentName) {
      setSelectedAgentName(agents[0].name);
    }
  }, [agents, selectedAgentName]);

  // 当选中智能体时，加载其知识库文件
  useEffect(() => {
    if (selectedAgentName) {
      fetchFiles(selectedAgentName).catch(error => {
        if (error.response?.status !== 404) {
          console.error('[KnowledgePage] 加载失败:', error);
        }
      });
    }
  }, [selectedAgentName, fetchFiles]);

  const handleAgentTabChange = (agentName: string) => {
    setSelectedAgentName(agentName);
    setSearchQuery(''); // 切换智能体时清空搜索
  };

  const handleRefresh = () => {
    if (selectedAgentName) {
      message.loading('刷新中...', 0.5);
      fetchFiles(selectedAgentName);
    }
  };

  const handleUploadClick = () => {
    setUploadModalVisible(true);
  };

  const handleUpload = async (fileList: File[]) => {
    if (!selectedAgentName) {
      return;
    }
    try {
      await uploadFiles(selectedAgentName, fileList);
      message.success(`成功上传 ${fileList.length} 个文件`);
      setUploadModalVisible(false);
      // 刷新列表
      await fetchFiles(selectedAgentName);
    } catch (error: any) {
      console.error('[KnowledgePage] 上传失败:', error);
      message.error(error.response?.data?.detail || '上传失败');
    }
  };

  const handleDelete = async (fileId: string, filename: string) => {
    if (!selectedAgentName) {
      return;
    }
    try {
      await deleteFile(selectedAgentName, fileId);
      message.success(`已删除文件: ${filename}`);
      await fetchFiles(selectedAgentName);
    } catch (error: any) {
      console.error('[KnowledgePage] 删除失败:', error);
      message.error(error.response?.data?.detail || '删除失败');
    }
  };

  const handleClearAll = () => {
    if (!selectedAgentName || files.length === 0) {
      return;
    }

    modal.confirm({
      title: '⚠️ 确认清空知识库',
      content: (
        <>
          <p>确定要清空智能体 <strong>{selectedAgent?.display_name}</strong> 的所有知识库文件吗？</p>
          <p style={{ color: '#ff4d4f', marginTop: 8 }}>
            将删除 <strong>{files.length}</strong> 个文件及其向量数据，此操作不可恢复！
          </p>
        </>
      ),
      okText: '确认清空',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await clearKnowledge(selectedAgentName);
          message.success('知识库已清空');
          await fetchFiles(selectedAgentName);
        } catch (error: any) {
          console.error('[KnowledgePage] 清空失败:', error);
          message.error(error.response?.data?.detail || '清空失败');
        }
      },
    });
  };

  const handleRebuildIndex = () => {
    if (!selectedAgentName) {
      return;
    }

    modal.confirm({
      title: '确认重建索引',
      content: (
        <>
          <p>确定要重建智能体 <strong>{selectedAgent?.display_name}</strong> 的知识库索引吗？</p>
          <p style={{ color: '#1890ff', marginTop: 8 }}>
            将重新处理所有文件并更新向量数据库，可能需要几分钟时间。
          </p>
        </>
      ),
      okText: '确认重建',
      okType: 'primary',
      cancelText: '取消',
      onOk: async () => {
        try {
          await rebuildIndex(selectedAgentName);
          message.success('索引重建任务已启动');
        } catch (error: any) {
          console.error('[KnowledgePage] 重建失败:', error);
          message.error(error.response?.data?.detail || '重建失败');
        }
      },
    });
  };

  // 过滤文件列表
  const filteredFiles = files.filter(file => {
    // 搜索过滤
    if (searchQuery && !file.filename.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    // 类型过滤
    if (fileTypeFilter !== 'all') {
      const ext = file.filename.split('.').pop()?.toLowerCase();
      if (ext !== fileTypeFilter) return false;
    }
    return true;
  });

  // 转换为 Table 数据
  const tableData: TableDataType[] = filteredFiles.map(file => ({
    ...file,
    key: file.filename,
  }));

  // 计算统计数据
  const totalFiles = files.length;
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  const totalChunks = files.reduce((sum, file) => sum + file.chunks, 0);

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
      dataIndex: 'size',
      key: 'size',
      width: 120,
      sorter: (a, b) => a.size - b.size,
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
      dataIndex: 'chunks',
      key: 'chunks',
      width: 100,
      sorter: (a, b) => a.chunks - b.chunks,
    },
    {
      title: '上传时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 140,
      sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
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

  // 构建智能体标签页
  const tabItems = agents.map((agent: Agent) => {
    const agentFiles = agent.name === selectedAgentName ? files : [];
    return {
      key: agent.name,
      label: (
        <span>
          {agent.display_name}
          {agentFiles.length > 0 && (
            <span style={{ marginLeft: 8, color: '#1890ff' }}>
              ({agentFiles.length})
            </span>
          )}
        </span>
      ),
    };
  });

  return (
    <div className={styles.container}>
      {/* 页面头部 */}
      <div className={styles.header}>
        <div>
          <h1>知识库管理</h1>
          <p className={styles.description}>
            管理智能体的知识库文件，支持 PDF、TXT、MD 格式文档上传和向量化
          </p>
        </div>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleUploadClick}
            disabled={!selectedAgentName}
          >
            上传文件
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            disabled={!selectedAgentName}
          >
            刷新
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={handleClearAll}
            disabled={!selectedAgentName || files.length === 0}
          >
            清空知识库
          </Button>
        </Space>
      </div>

      {/* 智能体标签页 */}
      {loadingAgents ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          加载智能体列表...
        </div>
      ) : agents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          暂无智能体，请先创建智能体
        </div>
      ) : (
        <>
          <Tabs
            activeKey={selectedAgentName}
            items={tabItems}
            onChange={handleAgentTabChange}
            className={styles.tabs}
          />

          {/* 搜索和操作栏 */}
          <div className={styles.toolbar}>
            <Search
              placeholder="搜索文件名..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onSearch={setSearchQuery}
              style={{ width: 300 }}
              allowClear
            />
            <Space>
              <span style={{ color: '#666' }}>
                共 {files.length} 个文件
                {searchQuery && ` (显示 ${filteredFiles.length} 个)`}
              </span>
            </Space>
          </div>

          {/* 文件列表 */}
          <FileList
            files={filteredFiles}
            loading={loading}
            onDelete={handleDelete}
            onClear={handleClearAll}
            onRebuild={handleRebuildIndex}
            agentName={selectedAgentName}
          />
        </>
      )}

      {/* 上传文件对话框 */}
      <Modal
        title={
          <Space>
            <CloudUploadOutlined />
            <span>上传文件到 {selectedAgent?.display_name}</span>
          </Space>
        }
        open={uploadModalVisible}
        onCancel={() => !uploading && setUploadModalVisible(false)}
        footer={null}
        width={600}
        maskClosable={!uploading}
      >
        <FileUpload
          onUpload={handleUpload}
          uploading={uploading}
          uploadProgress={uploadProgress}
          agentName={selectedAgent?.display_name || selectedAgentName}
        />
      </Modal>
    </div>
  );
};
