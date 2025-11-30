// SSE (Server-Sent Events) 服务
import { API_BASE_URL, TOKEN_KEY } from '@/lib/constants';

export interface SSEMessage {
  content: string;
  done: boolean;
  message_id?: string;
}

export interface SSEStreamParams {
  conversation_id: string;
  content: string;
  agent_id?: string;
  onMessage: (data: SSEMessage) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
}

export class SSEService {
  private eventSource: EventSource | null = null;
  private controller: AbortController | null = null;

  // 开始流式对话
  async startStream({ conversation_id, content, agent_id, onMessage, onError, onComplete }: SSEStreamParams) {
    try {
      // 验证必需参数
      if (!conversation_id) {
        throw new Error('conversation_id 是必需的参数');
      }
      
      const token = localStorage.getItem(TOKEN_KEY);
      const url = new URL(`${API_BASE_URL}/chat/${conversation_id}/message/stream`);
      
      console.log('[SSE] 流式对话 URL:', url.toString());
      console.log('[SSE] conversation_id:', conversation_id);
      
      // 使用 fetch 进行 SSE 流式请求
      this.controller = new AbortController();
      
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          conversation_id,
          content,
          agent_id,
        }),
        signal: this.controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body reader');
      }

      // 读取流
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          onComplete?.();
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6)) as SSEMessage;
              onMessage(data);
              
              if (data.done) {
                onComplete?.();
                return;
              }
            } catch (e) {
              console.error('解析 SSE 数据失败:', e);
            }
          }
        }
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('SSE 连接错误:', error);
        onError?.(error as Error);
      }
    }
  }

  // 停止流式对话
  stopStream() {
    if (this.controller) {
      this.controller.abort();
      this.controller = null;
    }
    
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}
