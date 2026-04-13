'use client';

import { useState, useEffect, useRef, useLayoutEffect } from 'react';
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

const PAGE_SIZE = 15; //  matches backend

export default function ChatWindow({
  selectedChatId,
  chatName,
  onChatOpened,
}: ChatWindowProps) {
  const { user } = useUser();

  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [previewImages, setPreviewImages] = useState<string[]>([]);

  const [page, setPage] = useState(0);
  const [last, setLast] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const shouldScrollToBottomRef = useRef(false);
  const preserveScrollRef = useRef<{
    shouldPreserve: boolean;
    prevScrollHeight: number;
    prevScrollTop: number;
  }>({
    shouldPreserve: false,
    prevScrollHeight: 0,
    prevScrollTop: 0,
  });

  // Ensure consistent chronological order oldest first
  const normalizeMessages = (incoming: Message[]) => {
    return [...incoming].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  };

  // Reset chat when switching chats
  useEffect(() => {
    if (!selectedChatId) return;

    setMessages([]);
    setParticipants([]);
    setPage(0);
    setLast(false);

    loadInitialData();
  }, [selectedChatId]);

  // Mark chat as read
  const markChatAsRead = async () => {
    if (!user?.accessToken || !selectedChatId) return;
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/chat/${selectedChatId}/read`,
        {},
        { headers: { Authorization: `Bearer ${user.accessToken}` } }
      );
      onChatOpened(selectedChatId); // refreshes navbar instantly
    } catch (err) {
      console.error('Mark as read failed', err);
    }
  };

  const loadInitialData = async () => {
    if (!user?.accessToken || !selectedChatId) return;

    setLoading(true);

    try {
      const [messagesRes, participantsRes] = await Promise.all([
        axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/message/${selectedChatId}?page=0&size=${PAGE_SIZE}`,
          { headers: { Authorization: `Bearer ${user.accessToken}` } }
        ),
        axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/chat/${selectedChatId}/participants`,
          { headers: { Authorization: `Bearer ${user.accessToken}` } }
        ),
      ]);

      const initialMessages = normalizeMessages(messagesRes.data);

      setMessages(initialMessages);
      setParticipants(participantsRes.data);

      setPage(1);
      setLast(messagesRes.data.length < PAGE_SIZE);

      shouldScrollToBottomRef.current = true;

      // Mark as read when first opening the chat
      await markChatAsRead();
    } catch (err) {
      console.error('Failed to load initial chat data', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreMessages = async () => {
    if (loadingMore || last || !selectedChatId || !user?.accessToken) return;

    const container = messagesContainerRef.current;
    if (container) {
      preserveScrollRef.current = {
        shouldPreserve: true,
        prevScrollHeight: container.scrollHeight,
        prevScrollTop: container.scrollTop,
      };
    }

    setLoadingMore(true);

    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/message/${selectedChatId}?page=${page}&size=${PAGE_SIZE}`,
        { headers: { Authorization: `Bearer ${user.accessToken}` } }
      );

      const olderMessages = normalizeMessages(res.data);

      if (olderMessages.length > 0) {
        setMessages((prev) => {
          const existingIds = new Set(
            prev.map((m) => `${m.messageId ?? ''}-${m.tempId ?? ''}`)
          );
          const deduped = olderMessages.filter(
            (m) => !existingIds.has(`${m.messageId ?? ''}-${m.tempId ?? ''}`)
          );
          return [...deduped, ...prev];
        });

        setPage((prev) => prev + 1);
      }

      setLast(res.data.length < PAGE_SIZE);
      shouldScrollToBottomRef.current = false;
    } catch (err) {
      console.error('Failed to load more messages', err);
      preserveScrollRef.current.shouldPreserve = false;
    } finally {
      setLoadingMore(false);
    }
  };

  // Scroll handling: preserve position when loading older messages, auto-scroll on new messages
  useLayoutEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    if (preserveScrollRef.current.shouldPreserve) {
      const { prevScrollHeight, prevScrollTop } = preserveScrollRef.current;
      const newScrollHeight = container.scrollHeight;
      const heightDiff = newScrollHeight - prevScrollHeight;
      container.scrollTop = prevScrollTop + heightDiff;
      preserveScrollRef.current.shouldPreserve = false;
      return;
    }

    if (shouldScrollToBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      shouldScrollToBottomRef.current = false;
    }
  }, [messages]);

  // Live WebSocket
  useEffect(() => {
    if (!user?.accessToken || !selectedChatId) return;

    const client = new (require('@stomp/stompjs').Client)({
      brokerURL: `${process.env.NEXT_PUBLIC_API_URL?.replace('http', 'ws')}/ws-chat`,
      connectHeaders: { Authorization: `Bearer ${user.accessToken}` },
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/topic/chat/${selectedChatId}`, (message: any) => {
          const newMsg: Message = JSON.parse(message.body);

          setMessages((prev) => {
            const exists = prev.some((m) => {
              if (m.messageId && newMsg.messageId) return m.messageId === newMsg.messageId;
              if (m.tempId && newMsg.tempId) return m.tempId === newMsg.tempId;
              return false;
            });
            if (exists) return prev;

            return normalizeMessages([...prev, newMsg]);
          });

          shouldScrollToBottomRef.current = true;

          // If we are actively viewing this chat and it's not our own message,
          // mark it as read immediately so the unread count does not increment
          if (newMsg.userId !== user?.userId) {
            markChatAsRead();
          }
        });
      },
    });

    client.activate();

    return () => client.deactivate();
  }, [selectedChatId, user?.accessToken, user?.userId]);

  const handleSend = async () => {
    if ((!inputValue.trim() && previewImages.length === 0) || !user?.accessToken) return;

    const payload = {
      content: inputValue.trim() || null,
      imageUrls: [...previewImages],
    };

    setInputValue('');
    setPreviewImages([]);

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/message/${selectedChatId}`,
        payload,
        { headers: { Authorization: `Bearer ${user.accessToken}` } }
      );
    } catch (err) {
      console.error('Send failed', err);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files).slice(0, 3 - previewImages.length);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setPreviewImages((prev) => [...prev, ev.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const removePreview = (index: number) => {
    setPreviewImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className={styles.chatWindow}>
      <div className={styles.header}>
        <h3 className={styles.chatTitle}>{chatName}</h3>

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

      <div className={styles.messagesContainer} ref={messagesContainerRef}>
        {/* Load More Button - appears at the top */}
        {!loading && !last && (
          <button
            className={styles.loadMoreBtn}
            onClick={loadMoreMessages}
            disabled={loadingMore}
          >
            {loadingMore ? 'Loading more messages...' : 'Load more messages'}
          </button>
        )}

        {messages.length === 0 && !loading ? (
          <div className={styles.emptyMessage}>No messages in this chat yet</div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.messageId ?? msg.tempId ?? `${msg.userId}-${msg.createdAt}`}
              message={msg}
              isMine={msg.userId === user?.userId}
            />
          ))
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className={styles.inputArea}>
        {previewImages.length > 0 && (
          <div className={styles.previewStrip}>
            {previewImages.map((src, i) => (
              <div key={i} className={styles.previewItem}>
                <img src={src} alt="preview" />
                <button
                  onClick={() => removePreview(i)}
                  className={styles.removePreview}
                >
                  ✕
                </button>
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