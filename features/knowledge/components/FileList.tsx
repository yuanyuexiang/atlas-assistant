import { Table, Button, Popconfirm, Tag, Empty, Tooltip } from 'antd';
import { DeleteOutlined, FileTextOutlined, CheckCircleOutlined, CloseCircleOutlined, SyncOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { DocumentInfo, DocumentStatus } from '@/types/models';
import { formatRelativeTime } from '@/lib/utils/format';
import styles from './FileList.module.css';

interface FileListProps {
  files: DocumentInfo[];
  loading?: boolean;
  onDelete: (fileId: string, filename: string) => void;
  onClear?: () => void;
  onRebuild?: () => void;
  agentName?: string;
}

// 状态徽章组件
const FileStatusBadge = ({ status, progress, errorMessage }: { 
  status: DocumentStatus; 
  progress: number; 
  errorMessage?: string | null;
}) => {
  if (status === 'ready') {
    return (
      <Tag color="success" icon={<CheckCircleOutlined />}>
        已就绪
      </Tag>
    );
  } else if (status === 'failed') {
    return (
      <Tooltip title={errorMessage || '处理失败'}>
        <Tag color="error" icon={<CloseCircleOutlined />}>
          失败
        </Tag>
      </Tooltip>
    );
  } else if (status === 'processing') {
    return (
      <Tooltip title={`处理进度: ${progress}%`}>
        <Tag color="processing" icon={<SyncOutlined spin />}>
          处理中 ({progress}%)
        </Tag>
      </Tooltip>
    );
  }
  return null;
};

export const FileList = ({
  files,
  loading = false,
  onDelete,
}: FileListProps) => {

  const columns: ColumnsType<DocumentInfo> = [
    {
      title: '文件名',
      dataIndex: 'filename',
      key: 'filename',
      ellipsis: true,
      render: (filename: string) => (
        <span>
          <FileTextOutlined style={{ color: '#1890ff', marginRight: 8 }} />
          {filename}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status: DocumentStatus, record) => (
        <FileStatusBadge 
          status={status} 
          progress={record.processing_progress}
          errorMessage={record.error_message}
        />
      ),
      filters: [
        { text: '已就绪', value: 'ready' },
        { text: '处理中', value: 'processing' },
        { text: '失败', value: 'failed' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: '文件大小',
      dataIndex: 'file_size_mb',
      key: 'file_size_mb',
      width: 120,
      render: (size: number) => `${(size || 0).toFixed(2)} MB`,
      sorter: (a, b) => a.file_size_mb - b.file_size_mb,
    },
    {
      title: '分块数',
      dataIndex: 'chunks_count',
      key: 'chunks_count',
      width: 120,
      render: (count: number, record) => {
        if (record.status === 'processing') {
          return <Tag color="default">处理中...</Tag>;
        }
        return <Tag color="blue">{count} 个分块</Tag>;
      },
      sorter: (a, b) => a.chunks_count - b.chunks_count,
    },
    {
      title: '上传时间',
      dataIndex: 'upload_time',
      key: 'upload_time',
      width: 180,
      render: (time: string) => formatRelativeTime(time),
      sorter: (a, b) => new Date(a.upload_time).getTime() - new Date(b.upload_time).getTime(),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Popconfirm
          title="确认删除"
          description={`确定要删除文件 "${record.filename}" 吗？`}
          onConfirm={() => onDelete(record.file_id, record.filename)}
          okText="确认"
          cancelText="取消"
          disabled={record.status === 'processing'}
        >
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            size="small"
            disabled={record.status === 'processing'}
          >
            删除
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      {files.length === 0 ? (
        <Empty
          description="暂无知识库文件，请上传文件"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ padding: '60px 0' }}
        />
      ) : (
        <Table
          columns={columns}
          dataSource={files}
          rowKey="file_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total) => `共 ${total} 个文件`,
          }}
        />
      )}
    </div>
  );
};
