'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '@/app/providers/UserProvider';
import { FaPlusSquare } from 'react-icons/fa';
import { createPortal } from 'react-dom';
import CreateChatModal from '../CreateChatModal/CreateChatModal';
import styles from './ChatListSidebar.module.css';

interface ChatSummary {
  chatId: number;
  name: string;
}

export default function ChatListSidebar() {
  const { user } = useUser();
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [isCreateChatModalOpen, setIsCreateChatModalOpen] = useState(false);

  const pageSize = 10;

  async function fetchChats(currentPage: number, reset = false) {
    if (!user?.accessToken || loading) return;
    setLoading(true);
    try {
      const endpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/chat/user?page=${currentPage}&size=${pageSize}`;
      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${user.accessToken}` },
      });
      const newChats = res.data.content || [];

      if (reset) setChats(newChats);
      else setChats(prev => [...prev, ...newChats]);

      setPage(currentPage + 1);
      setHasMore(!res.data.last);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user?.accessToken) fetchChats(0, true);
  }, [user?.accessToken]);

  function handleLoadMore() {
    if (hasMore && !loading) fetchChats(page, false);
  }

  function handleChatClick(chatId: number) {
    console.log(`Chat ${chatId} clicked`);
  }

  function handleCreateNewChat() {
    setIsCreateChatModalOpen(true);
  }

  return (
    <>
      <div className={styles.sidebar}>
        <div className={styles.scrollContainer}>
          {chats.length === 0 && !loading ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>No chats yet</p>
              <p className={styles.emptySubtitle}>
                Create your first chat using the <strong>+</strong> button
              </p>
            </div>
          ) : (
            <>
              {chats.map((chat) => (
                <div
                  key={chat.chatId}
                  className={styles.chatRow}
                  onClick={() => handleChatClick(chat.chatId)}
                >
                  <div className={styles.chatContent}>
                    <span className={styles.chatName}>
                      {chat.name || 'Unnamed Chat'}
                    </span>
                  </div>
                </div>
              ))}

              {chats.length < 8 && <div className={styles.emptySpace} />}

              {hasMore && (
                <button
                  className={styles.loadMoreBtn}
                  onClick={handleLoadMore}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Load More Chats'}
                </button>
              )}
            </>
          )}
        </div>

        {/* Create Chat Button */}
        <button
          className={styles.createChatBtn}
          onClick={handleCreateNewChat}
          title="Create a new chat"
        >
          <FaPlusSquare />
        </button>
      </div>

      {isCreateChatModalOpen && createPortal(
        <CreateChatModal onClose={() => setIsCreateChatModalOpen(false)} />,
        document.body
      )}
    </>
  );
}