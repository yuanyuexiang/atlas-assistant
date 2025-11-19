import { useEffect, useRef } from 'react';
import { message as antMessage } from 'antd';
import { useChatStore } from '../store';
import { SSEService } from '../api/sse';
import type { Message } from '@/types/models';

export const useSSEChat = (conversationId: string) => {
  const sseServiceRef = useRef<SSEService | null>(null);
  const {
    messages,
    currentStreamingMessage,
    isStreaming,
    addMessage,
    appendStreamingContent,
    completeStreamingMessage,
    setStreaming,
  } = useChatStore();

  useEffect(() => {
    sseServiceRef.current = new SSEService();
    
    return () => {
      sseServiceRef.current?.stopStream();
    };
  }, []);

  const sendMessage = async (content: string, agentId?: string) => {
    if (!content.trim() || isStreaming) return;

    // 添加用户消息
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: conversationId,
      content,
      role: 'user',
      created_at: new Date().toISOString(),
    };
    addMessage(conversationId, userMessage);

    // 开始流式接收
    setStreaming(true);
    let fullContent = '';
    let messageId = '';

    try {
      await sseServiceRef.current?.startStream({
        conversation_id: conversationId,
        content,
        agent_id: agentId,
        onMessage: (data) => {
          if (data.message_id) {
            messageId = data.message_id;
          }
          if (data.content) {
            fullContent += data.content;
            appendStreamingContent(data.content);
          }
        },
        onError: (error) => {
          console.error('流式对话错误:', error);
          antMessage.error('消息发送失败');
          setStreaming(false);
        },
        onComplete: () => {
          const assistantMessage: Message = {
            id: messageId || `msg-${Date.now()}`,
            conversation_id: conversationId,
            content: fullContent,
            role: 'assistant',
            created_at: new Date().toISOString(),
            agent_id: agentId,
          };
          completeStreamingMessage(conversationId, assistantMessage);
        },
      });
    } catch (error) {
      console.error('发送消息失败:', error);
      antMessage.error('消息发送失败');
      setStreaming(false);
    }
  };

  const stopStreaming = () => {
    sseServiceRef.current?.stopStream();
    setStreaming(false);
  };

  return {
    messages: messages[conversationId] || [],
    currentStreamingMessage,
    isStreaming,
    sendMessage,
    stopStreaming,
  };
};
