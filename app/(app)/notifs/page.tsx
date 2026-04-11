'use client'

import { useState } from 'react';
import styles from "./notifs.module.css";
import { useUser } from '@/app/providers/UserProvider';
import ChatListSidebar from '@/components/ChatListSidebar/ChatListSidebar';

export default function Notifs() {
  const { user } = useUser();
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);

  const handleChatSelect = (chatId: number) => {
    setSelectedChatId(chatId);
  };

  return (
    <div className={styles.pageContainer}>
      {/* left column */}
      <ChatListSidebar onChatSelect={handleChatSelect} />

      {/* right side - Messages area */}
      <div className={styles.messageArea}>
        {selectedChatId ? (
          <div className={styles.chatOpened}>
            <h3>Chat #{selectedChatId} opened</h3>
            <p>Messages will appear here soon...</p>
            {/* replace this later with actual message view */}
          </div>
        ) : (
          <div className={styles.placeholder}>
            <p>Select a chat from the left to view messages</p>
          </div>
        )}
      </div>
    </div>
  );
}