'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '@/app/providers/UserProvider';
import { createPortal } from 'react-dom';
import { FaTimes } from 'react-icons/fa';
import styles from './CreateChatModal.module.css';
import commonStyles from '../../app/styles/common.module.css';

interface SelectedUser {
  userId: number;
  name: string;
  profilePic?: string;
}

interface CreateChatModalProps {
  onClose: () => void;
  onChatCreated: (newChat: { chatId: number; name: string }) => void;
}

export default function CreateChatModal({ onClose, onChatCreated }: CreateChatModalProps) {
  const { user } = useUser();

  const [chatName, setChatName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SelectedUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [successfulUpload, setSuccessfulUpload] = useState(false);
  const [successMessage, setSuccessMessage] = useState('Chat created successfully!');

  useEffect(() => {
    if (successfulUpload) {
      const timer = setTimeout(() => onClose(), 2000);
      return () => clearTimeout(timer);
    }
  }, [successfulUpload, onClose]);

  // debounced user search
  useEffect(() => {
    if (!searchQuery.trim() || !user?.accessToken) {
      setSearchResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoadingSearch(true);
      try {
        const endpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/search/users?query=${encodeURIComponent(searchQuery)}&page=0&size=15`;
        const res = await axios.get(endpoint, {
          headers: { Authorization: `Bearer ${user.accessToken}` },
        });
        setSearchResults(res.data.content || []);
      } catch (err) {
        console.error(err);
        setSearchResults([]);
      } finally {
        setLoadingSearch(false);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [searchQuery, user?.accessToken]);

  const addUser = (userToAdd: SelectedUser) => {
    if (!selectedUsers.find(u => u.userId === userToAdd.userId)) {
      setSelectedUsers(prev => [...prev, userToAdd]);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeUser = (userId: number) => {
    setSelectedUsers(prev => prev.filter(u => u.userId !== userId));
  };

  const handleCreateChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.accessToken) return;
    if (selectedUsers.length === 0) {
      setError('You must add at least one other user');
      return;
    }

    setCreating(true);
    setError('');

    try {
      const payload = {
        name: chatName.trim() || null,
        userIds: selectedUsers.map(u => u.userId),
      };

      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/chat/create`,
        payload,
        { headers: { Authorization: `Bearer ${user.accessToken}` } }
      );

      // tell parent to add the new chat to the list and open it
      onChatCreated({
        chatId: res.data.chatId,
        name: res.data.name || 'Unnamed Chat'
      });

      setSuccessfulUpload(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create chat');
    } finally {
      setCreating(false);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') e.preventDefault();
  };

  return createPortal(
    <div className={commonStyles.modalBackdrop} onClick={onClose}>
      {successfulUpload ? (
        <div className={commonStyles.formContainer}>
          <h2 className={commonStyles.successMessage}>{successMessage}</h2>
        </div>
      ) : (
        <form
          className={commonStyles.formContainer}
          onSubmit={handleCreateChat}
          onClick={e => e.stopPropagation()}
          style={{ width: '700px', maxHeight: 'none' }}
        >
          <h2 className={commonStyles.formHeader}>Create New Chat</h2>

          {/* Chat Name */}
          <div className={styles.field}>
            <label className={styles.label}>Chat Name (optional)</label>
            <input
              type="text"
              value={chatName}
              onChange={e => setChatName(e.target.value)}
              placeholder="e.g. Car Club"
              className={styles.input}
              maxLength={50}
            />
          </div>

          {/* Side-by-side panels */}
          <div className={styles.twoColumnLayout}>
            {/* left: search users */}
            <div className={styles.panel}>
              <label className={styles.label}>Search Users</label>
              <div className={styles.searchRow}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search users by name..."
                  className={styles.searchInput}
                />
              </div>

              <div className={styles.resultsContainer}>
                {searchResults.map(u => (
                  <div
                    key={u.userId}
                    className={styles.resultRow}
                    onClick={() => addUser(u)}
                  >
                    <img
                      src={u.profilePic || '/images/defaultPfp.png'}
                      alt={u.name}
                      className={styles.resultPic}
                    />
                    <span className={styles.resultName}>{u.name}</span>
                    <button type="button" className={styles.addBtn}>Add</button>
                  </div>
                ))}
                {searchResults.length === 0 && searchQuery.trim() && (
                  <p className={styles.noResults}>No users found</p>
                )}
              </div>
            </div>

            {/* right: selected users */}
            <div className={styles.panel}>
              <label className={styles.label}>
                Selected ({selectedUsers.length})
              </label>
              <div className={styles.selectedContainer}>
                {selectedUsers.map(u => (
                  <div key={u.userId} className={styles.selectedChip}>
                    <img
                      src={u.profilePic || '/images/defaultPfp.png'}
                      alt={u.name}
                      className={styles.chipPic}
                    />
                    <span className={styles.chipName}>{u.name}</span>
                    <button
                      type="button"
                      onClick={() => removeUser(u.userId)}
                      className={styles.removeChip}
                    >
                      <FaTimes />
                    </button>
                  </div>
                ))}
                {selectedUsers.length === 0 && (
                  <p className={styles.emptySelected}>No users selected yet</p>
                )}
              </div>
            </div>
          </div>

          {error && <p className={commonStyles.error}>{error}</p>}

          <button
            type="submit"
            className={commonStyles.primaryBtn}
            disabled={creating || selectedUsers.length === 0}
          >
            {creating ? (
              <>Creating<span className={commonStyles.dots}></span></>
            ) : (
              'Create Chat'
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className={styles.cancelBtn}
          >
            Cancel
          </button>
        </form>
      )}
    </div>,
    document.body
  );
}