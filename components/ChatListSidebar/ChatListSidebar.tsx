'use client';

import { useState } from 'react';
import styles from './ChatListSidebar.module.css';

interface ChatSummary {
  chatId: number;
  name: string;
}

export default function ChatListSidebar() {
  // TEMPORARY MOCK DATA — remove this whole block when connecting to real backend
  const [chats] = useState<ChatSummary[]>([
    { chatId: 1, name: "Sarah Chen" },
    { chatId: 2, name: "Mechanic Group - Bay Area" },
    { chatId: 3, name: "David Rodriguez" },
    { chatId: 4, name: "Car Parts Deal" },
    { chatId: 5, name: "Emma Thompson" },
    { chatId: 6, name: "Weekend Project Crew" },
    { chatId: 7, name: "Michael Park" },
    { chatId: 8, name: "Auto Repair Tips" },
    { chatId: 9, name: "Jessica Rivera" },
    { chatId: 10, name: "Classic Car Enthusiasts" },
    { chatId: 11, name: "John Ramirez" },
    { chatId: 12, name: "Engine Swap Discussion" },
  ]);

  const [hasMore] = useState(false); // set to true if you want to test "Load More"

  function handleChatClick(chatId: number) {
    console.log(`Chat ${chatId} clicked — will open messages on right later`);
  }

  function handleLoadMore() {
    alert("Load more clicked — mock only");
  }

  return (
    <div className={styles.sidebar}>
      <div className={styles.scrollContainer}>
        {chats.map((chat) => (
          <div
            key={chat.chatId}
            className={styles.chatRow}
            onClick={() => handleChatClick(chat.chatId)}
          >
            <div className={styles.chatContent}>
              <span className={styles.chatName}>{chat.name}</span>
            </div>
          </div>
        ))}

        {/* Empty space at bottom when few chats (exactly as you wanted) */}
        {chats.length < 8 && <div className={styles.emptySpace} />}

        {/* Load More Button (still works for demo) */}
        {hasMore && (
          <button
            className={styles.loadMoreBtn}
            onClick={handleLoadMore}
          >
            Load More Chats
          </button>
        )}
      </div>
    </div>
  );
}