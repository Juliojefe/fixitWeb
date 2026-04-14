'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '@/app/providers/UserProvider';
import { FaPlusSquare, FaTimes } from 'react-icons/fa';
import { createPortal } from 'react-dom';
import CreateChatModal from '../CreateChatModal/CreateChatModal';
import styles from './ChatListSidebar.module.css';
import commonStyles from '../../app/styles/common.module.css';

interface ChatSummary {
  chatId: number;
  name: string;
  unreadCount: number;
}

interface ChatListSidebarProps {
  onChatSelect: (chatId: number, name: string) => void;
  selectedChatId: number | null;
  onChatOpened?: (chatId: number) => void;
}

export default function ChatListSidebar({ onChatSelect, selectedChatId, onChatOpened }: ChatListSidebarProps) {
  const { user, refreshUnreadCount } = useUser();
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isCreateChatModalOpen, setIsCreateChatModalOpen] = useState(false);

  const [chatToLeave, setChatToLeave] = useState<ChatSummary | null>(null);
  const [leaving, setLeaving] = useState(false);

  const pageSize = 20;

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

  const handleLeaveClick = (e: React.MouseEvent, chat: ChatSummary) => {
    e.stopPropagation();
    setChatToLeave(chat);
  };

  const confirmLeaveChat = async () => {
    if (!chatToLeave || !user?.accessToken) return;

    setLeaving(true);
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/chat/${chatToLeave.chatId}/leave`,
        {},
        { headers: { Authorization: `Bearer ${user.accessToken}` } }
      );

      setChats(prev => prev.filter(c => c.chatId !== chatToLeave.chatId));

      if (selectedChatId === chatToLeave.chatId) {
        onChatSelect(0, '');
      }

      refreshUnreadCount();
    } catch (err: any) {
      console.error('Failed to leave chat', err);
      alert(err.response?.data?.message || 'Failed to leave chat. Please try again.');
    } finally {
      setLeaving(false);
      setChatToLeave(null);
    }
  };

  function handleChatClick(chat: ChatSummary) {
    setChats(prevChats =>
      prevChats.map(c =>
        c.chatId === chat.chatId ? { ...c, unreadCount: 0 } : c
      )
    );

    refreshUnreadCount();

    onChatSelect(chat.chatId, chat.name);
    if (onChatOpened) onChatOpened(chat.chatId);
  }

  function handleCreateNewChat() {
    setIsCreateChatModalOpen(true);
  }

  const handleChatCreated = (newChat: ChatSummary) => {
    setChats(prev => [newChat, ...prev]);
    onChatSelect(newChat.chatId, newChat.name);
  };

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
            chats.map((chat) => (
              <div
                key={chat.chatId}
                className={`${styles.chatRow} ${selectedChatId === chat.chatId ? styles.active : ''}`}
                onClick={() => handleChatClick(chat)}
              >
                <div className={styles.chatContent}>
                  <span className={`${styles.chatName} ${chat.unreadCount > 0 ? styles.bold : ''}`}>
                    {chat.name || 'Unnamed Chat'}
                  </span>
                  {chat.unreadCount > 0 && (
                    <span className={styles.unreadBadge}>{chat.unreadCount}</span>
                  )}
                </div>

                <button
                  className={styles.leaveBtn}
                  onClick={(e) => handleLeaveClick(e, chat)}
                  title="Leave this chat"
                >
                  <FaTimes />
                </button>
              </div>
            ))
          )}

          {hasMore && (
            <button className={styles.loadMoreBtn} onClick={handleLoadMore} disabled={loading}>
              {loading ? 'Loading...' : 'Load More Chats'}
            </button>
          )}
        </div>

        <button className={styles.createChatBtn} onClick={handleCreateNewChat} title="Create a new chat">
          <FaPlusSquare />
        </button>
      </div>

      {/* leave confirmation */}
      {chatToLeave && createPortal(
        <div className={commonStyles.modalBackdrop} onClick={() => setChatToLeave(null)}>
          <div
            className={`${commonStyles.formContainer} ${styles.leaveModalContainer}`}
            onClick={e => e.stopPropagation()}
          >
            <h2 className={`${commonStyles.formHeader} ${styles.leaveModalHeader}`}>
              Leave Chat
            </h2>

            <p className={styles.leaveWarningText}>
              Are you sure you want to leave <strong>“{chatToLeave.name || 'this chat'}”</strong>?
            </p>

            <p className={styles.leaveWarningSubtext}>
              Your old messages will remain visible to others,<br />
              but you will no longer be part of this chat and <strong>will not be able to rejoin</strong>.
            </p>

            <div className={styles.leaveModalActions}>
              <button
                type="button"
                onClick={() => setChatToLeave(null)}
                className={`${commonStyles.secondaryBtn} ${styles.leaveModalCancel}`}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmLeaveChat}
                disabled={leaving}
                className={`${commonStyles.primaryBtn} ${styles.leaveModalLeave}`}
              >
                {leaving ? (
                  <>Leaving<span className={commonStyles.dots}></span></>
                ) : (
                  'Yes, Leave Chat'
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {isCreateChatModalOpen && createPortal(
        <CreateChatModal 
          onClose={() => setIsCreateChatModalOpen(false)}
          onChatCreated={(newChat) => handleChatCreated({ ...newChat, unreadCount: 0 })}
        />,
        document.body
      )}
    </>
  );
}