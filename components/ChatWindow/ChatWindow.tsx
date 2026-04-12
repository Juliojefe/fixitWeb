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
  createdAt: string | number;
  imageUrls: string[];
  failed?: boolean;
  tempId?: string;
}

interface Participant {
  name: string;
  profilePic?: string;
}

interface ChatWindowProps {
  selectedChatId: number;
  chatName: string;
  onChatOpened: (chatId: number) => void;
}

export default function ChatWindow({ selectedChatId, chatName, onChatOpened }: ChatWindowProps) {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load messages + participants
  const loadChatData = async () => {
    if (!user?.accessToken) return;

    // Load messages
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/message/${selectedChatId}?page=0&size=50`,
        { headers: { Authorization: `Bearer ${user.accessToken}` } }
      );
      setMessages(res.data);
    } catch (err) {
      console.error('Failed to load messages', err);
    }

    // Load participants
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/chat/${selectedChatId}/participants`,
        { headers: { Authorization: `Bearer ${user.accessToken}` } }
      );
      setParticipants(res.data);
    } catch (err) {
      console.error('Failed to load participants', err);
    }

    // Mark as read
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/chat/${selectedChatId}/read`,
        {},
        { headers: { Authorization: `Bearer ${user.accessToken}` } }
      );
      onChatOpened(selectedChatId);
    } catch (err) {
      console.error('Mark as read failed', err);
    }
  };

  useEffect(() => {
    if (selectedChatId) {
      loadChatData();
    }
  }, [selectedChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Live WebSocket
  useEffect(() => {
    if (!user?.accessToken || !selectedChatId) return;

    const client = new (require('@stomp/stompjs').Client)({
      brokerURL: `${process.env.NEXT_PUBLIC_API_URL?.replace('http', 'ws')}/ws-chat`,
      connectHeaders: { Authorization: `Bearer ${user.accessToken}` },
      debug: (str: string) => console.log(str),
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/topic/chat/${selectedChatId}`, (message: any) => {
          const newMsg = JSON.parse(message.body) as Message;
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

  // Send with optimistic update
  const handleSend = async () => {
    if ((!inputValue.trim() && previewImages.length === 0) || !user?.accessToken) return;

    const tempId = 'temp-' + Date.now();

    const optimisticMsg: Message = {
      tempId,
      messageId: tempId,
      content: inputValue.trim() || '',
      userId: user.userId!,
      senderName: user.name,
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
      {/* HEADER - Chat name LEFT, Participants RIGHT with space in between */}
      <div className={styles.header}>
        <h3 className={styles.chatTitle}>{chatName}</h3>

        {/* Participants pushed to the right side */}
        <div className={styles.participantsContainer}>
          {participants.map((p, i) => (
            <div key={i} className={styles.participant}>
              <img
                src={p.profilePic || '/images/defaultPfp.png'}
                alt={p.name}
                className={styles.participantPic}
              />
              <span className={styles.participantName}>{p.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* MESSAGES */}
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
                  setMessages(prev => prev.filter(m => m.tempId !== msg.tempId));
                })
                .catch(() => console.error('Retry failed'));
            }}
          />
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