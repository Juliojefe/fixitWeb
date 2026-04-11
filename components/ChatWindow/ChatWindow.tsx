'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useUser } from '@/app/providers/UserProvider';
import styles from './ChatWindow.module.css';
import { Client } from '@stomp/stompjs';

interface Message {
  messageId: number;
  content: string;
  userId: number;
  createdAt: string;
  imageUrls: string[];
}

interface ChatWindowProps {
  selectedChatId: number;
  chatName: string;
}

export default function ChatWindow({ selectedChatId, chatName }: ChatWindowProps) {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [stompClient, setStompClient] = useState<Client | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load past messages
  const loadMessages = async () => {
    if (!user?.accessToken) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/message/${selectedChatId}?page=0&size=50`,
        { headers: { Authorization: `Bearer ${user.accessToken}` } }
      );
      setMessages(res.data);
    } catch (err) {
      console.error('Failed to load messages', err);
    } finally {
      setLoading(false);
    }
  };

  // Mark chat as read when opened
  const markAsRead = async () => {
    if (!user?.accessToken) return;
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/chat/${selectedChatId}/read`,
        {},
        { headers: { Authorization: `Bearer ${user.accessToken}` } }
      );
    } catch (err) {
      console.error('Mark as read failed', err);
    }
  };

  useEffect(() => {
    if (selectedChatId) {
      loadMessages();
      markAsRead();           // mark as read immediately
    }
  }, [selectedChatId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Live WebSocket (only connects when chat is open)
  useEffect(() => {
    if (!user?.accessToken || !selectedChatId) return;

    const client = new Client({
      brokerURL: `${process.env.NEXT_PUBLIC_API_URL?.replace('http', 'ws')}/ws-chat`,
      connectHeaders: { Authorization: `Bearer ${user.accessToken}` },
      debug: (str) => console.log(str),
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/topic/chat/${selectedChatId}`, (message) => {
          const newMsg = JSON.parse(message.body);
          setMessages(prev => [...prev, newMsg]);
        });
      },
    });

    client.activate();
    setStompClient(client);

    return () => {
      client.deactivate();
    };
  }, [selectedChatId, user?.accessToken]);

  // Send message (text + up to 3 images)
  const handleSend = async () => {
    if (!inputValue.trim() && previewImages.length === 0) return;
    if (!user?.accessToken) return;

    const payload = {
      content: inputValue.trim() || null,
      imageUrls: previewImages,
    };

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/message/${selectedChatId}`,
        payload,
        { headers: { Authorization: `Bearer ${user.accessToken}` } }
      );
      // Optimistic update already handled by WebSocket
      setInputValue('');
      setPreviewImages([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files).slice(0, 3 - previewImages.length);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => ev.target?.result && setPreviewImages(prev => [...prev, ev.target!.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const removePreview = (index: number) => {
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className={styles.chatWindow}>
      {/* HEADER */}
      <div className={styles.header}>
        <h3>{chatName}</h3>
      </div>

      {/* MESSAGES */}
      <div className={styles.messagesContainer}>
        {messages.map((msg) => (
          <div key={msg.messageId} className={`${styles.messageRow} ${msg.userId === user?.userId ? styles.mine : styles.theirs}`}>
            <div className={styles.bubble}>
              {msg.content && <p>{msg.content}</p>}
              {msg.imageUrls?.length > 0 && (
                <div className={styles.imageGrid}>
                  {msg.imageUrls.map((url, i) => (
                    <img key={i} src={url} alt="attachment" className={styles.messageImage} />
                  ))}
                </div>
              )}
              <span className={styles.timestamp}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT BAR */}
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
            <input type="file" accept="image/*" multiple onChange={handleImageSelect} style={{ display: 'none' }} />
          </label>

          <textarea
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="Type a message..."
            className={styles.messageInput}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          />

          <button onClick={handleSend} className={styles.sendBtn}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}