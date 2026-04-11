'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useUser } from '@/app/providers/UserProvider';
import styles from './ChatWindow.module.css';
import MessageBubble from '../MessageBubble/MessageBubble';

interface Message {
  messageId?: number | string;
  content: string;
  userId: number;
  senderName?: string;
  createdAt: string;
  imageUrls: string[];
  failed?: boolean;
  tempId?: string;
}

interface ChatWindowProps {
  selectedChatId: number;
  chatName: string;
  onChatOpened: (chatId: number) => void;
}

export default function ChatWindow({ selectedChatId, chatName, onChatOpened }: ChatWindowProps) {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadMessages = async () => {
    if (!user?.accessToken) return;
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/message/${selectedChatId}?page=0&size=50`,
        { headers: { Authorization: `Bearer ${user.accessToken}` } }
      );
      setMessages(res.data);
    } catch (err) {
      console.error('Failed to load messages', err);
    }
  };

  const markAsRead = async () => {
    if (!user?.accessToken) return;
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/chat/${selectedChatId}/read`,
        {},
        { headers: { Authorization: `Bearer ${user.accessToken}` } }
      );
      // Instant UI update in sidebar
      onChatOpened(selectedChatId);
    } catch (err) {
      console.error('Mark as read failed', err);
    }
  };

  useEffect(() => {
    if (selectedChatId) {
      loadMessages();
      markAsRead();
    }
  }, [selectedChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // WebSocket remains unchanged
  useEffect(() => {
    if (!user?.accessToken || !selectedChatId) return;

    const client = new (require('@stomp/stompjs').Client)({
      brokerURL: `${process.env.NEXT_PUBLIC_API_URL?.replace('http', 'ws')}/ws-chat`,
      connectHeaders: { Authorization: `Bearer ${user.accessToken}` },
      debug: (str: string) => console.log(str),
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/topic/chat/${selectedChatId}`, (message: any) => {
          const newMsg: Message = JSON.parse(message.body);
          setMessages((prev) => {
            const filtered = prev.filter(m => m.tempId !== newMsg.tempId && m.messageId !== newMsg.messageId);
            return [...filtered, newMsg];
          });
        });
      },
    });

    client.activate();

    return () => client.deactivate();
  }, [selectedChatId, user?.accessToken]);

  // Send logic (unchanged)
  const handleSend = async () => {
    if ((!inputValue.trim() && previewImages.length === 0) || !user?.accessToken) return;

    const tempId = 'temp-' + Date.now();

    const optimisticMsg: Message = {
      tempId,
      messageId: tempId,
      content: inputValue.trim() || '',
      userId: user.userId!,
      createdAt: new Date().toISOString(),
      imageUrls: [...previewImages],
      failed: false,
    };

    setMessages(prev => [...prev, optimisticMsg]);
    setInputValue('');
    setPreviewImages([]);

    try {
      const payload = {
        content: optimisticMsg.content || null,
        imageUrls: optimisticMsg.imageUrls,
      };

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/message/${selectedChatId}`,
        payload,
        { headers: { Authorization: `Bearer ${user.accessToken}` } }
      );
    } catch (err) {
      console.error('Send failed', err);
      setMessages(prev =>
        prev.map(m => m.tempId === tempId ? { ...m, failed: true } : m)
      );
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files).slice(0, 3 - previewImages.length);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setPreviewImages(prev => [...prev, ev.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePreview = (index: number) => {
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className={styles.chatWindow}>
      <div className={styles.header}>
        <h3>{chatName}</h3>
      </div>

      <div className={styles.messagesContainer}>
        {messages.map((msg) => (
          <MessageBubble
            key={msg.tempId || msg.messageId}
            message={msg}
            isMine={msg.userId === user?.userId}
            onRetry={() => {
              if (!user?.accessToken) return;
              const payload = {
                content: msg.content || null,
                imageUrls: msg.imageUrls,
              };

              axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/api/message/${selectedChatId}`,
                payload,
                { headers: { Authorization: `Bearer ${user.accessToken}` } }
              )
                .then(() => {
                  // On successful retry, clear the failed flag immediately
                  setMessages(prev =>
                    prev.map(m =>
                      m.tempId === msg.tempId ? { ...m, failed: false } : m
                    )
                  );
                })
                .catch(() => {
                  console.error('Retry failed');
                });
            }}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.inputArea}>
        {previewImages.length > 0 && (
          <div className={styles.previewStrip}>
            {previewImages.map((src, i) => (
              <div key={i} className={styles.previewItem}>
                <img src={src} alt="preview" />
                <button onClick={() => removePreview(i)} className={styles.removePreview}>✕</button>
              </div>
            ))}
          </div>
        )}

        <div className={styles.inputRow}>
          <label className={styles.attachBtn}>
            📎
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              style={{ display: 'none' }}
            />
          </label>

          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message..."
            className={styles.messageInput}
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />

          <button onClick={handleSend} className={styles.sendBtn}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}