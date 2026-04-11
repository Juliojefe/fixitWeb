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

  const handleChatSelect = (chatId: number) => {
    setSelectedChatId(chatId);
    setCurrentChatName(`Chat #${chatId}`);
  };

  return (
    <div className={styles.pageContainer}>
      <ChatListSidebar 
        onChatSelect={handleChatSelect} 
        selectedChatId={selectedChatId} 
      />

      <div className={styles.messageArea}>
        {selectedChatId ? (
          <ChatWindow 
            selectedChatId={selectedChatId} 
            chatName={currentChatName} 
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