'use client'

import { useRouter } from 'next/navigation';
import styles from "./notifs.module.css";
import { useUser } from '@/app/providers/UserProvider';
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import ChatListSidebar from '@/components/ChatListSidebar/ChatListSidebar';

export default function Notifs() {
  const { user } = useUser();
  const router = useRouter();

  // placeholder will expand this later when messages appear on the right
  return (
    <div className={styles.pageContainer}>
      <ChatListSidebar />

      {/* right side empty area for now messages will go here later */}
      <div className={styles.messageArea}>
        <div className={styles.placeholder}>
          <p>Select a chat from the left to view messages</p>
        </div>
      </div>
    </div>
  );
}