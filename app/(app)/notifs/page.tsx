'use client'

import { useState } from 'react';
import styles from "./notifs.module.css";
import { useUser } from '@/app/providers/UserProvider';
import ChatListSidebar from '@/components/ChatListSidebar/ChatListSidebar';
import ChatWindow from '@/components/ChatWindow/ChatWindow';

export default function Notifs() {
  const { user } = useUser();
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [currentChatName, setCurrentChatName] = useState<string>('');

  // Callback to instantly reset unread count in sidebar when a chat is opened
  const handleChatOpened = (chatId: number) => {
    // The sidebar now handles the instant UI update itself
    // This callback is here for future global unread count if needed
  };

  const handleChatSelect = (chatId: number, name: string) => {
    setSelectedChatId(chatId);
    setCurrentChatName(name);
  };

  return (
    <div className={styles.pageContainer}>
      <ChatListSidebar 
        onChatSelect={handleChatSelect} 
        selectedChatId={selectedChatId}
        onChatOpened={handleChatOpened}
      />

      <div className={styles.messageArea}>
        {selectedChatId ? (
          <ChatWindow 
            selectedChatId={selectedChatId} 
            chatName={currentChatName}
            onChatOpened={handleChatOpened}
          />
        ) : (
          <div className={styles.placeholder}>
            <p>Select a chat from the left to view messages</p>
          </div>
        )}
      </div>
    </div>
  );
}