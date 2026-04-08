'use client';

import { FaCompass, FaPlusSquare, FaBell, FaUser } from "react-icons/fa";
import styles from "./navbar.module.css";
import CreatePostModal from '../CreatePostModal/CreatePostModal';
import MustLoginModal from "../MustLoginModal/MustLoginModal";
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from "react";
import { useUser } from '@/app/providers/UserProvider';
import { createPortal } from 'react-dom';
import axios from 'axios';


export default function Navbar() {
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [isMustLoginModalOpen, setIsMustLoginModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUser();

  // fetch initial unread count
  useEffect(() => {
    async function fetchUnreadCount() {
      if (!user?.accessToken) return;

      try {
        const endpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/chat/unread-count`;
        const res = await axios.get(endpoint, {
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
          },
        });
        setUnreadCount(res.data);
      } catch (err) {
        console.error(err);
        setUnreadCount(0);
      }
    }
    fetchUnreadCount();
  }, [user?.accessToken]);

  function handleGoToMyProfile() {
    if (!user) {
      setIsMustLoginModalOpen(true);
      return;
    }
    router.push("/myProfile");
  }

  function handleNotificationsClick() {
    if (!user) {
      setIsMustLoginModalOpen(true);
      return;
    }
    router.push("/notifs");
  }

  return (
    <nav className={styles.navbar}>

      <div
        className={`${styles.iconWrapper} ${pathname === '/explore' ? styles.active : ''}`}
        onClick={() => router.push("/explore")}
      >
        <FaCompass className={styles.icon} />
        <p>Explore</p>
      </div>

      <div
        className={`${styles.iconWrapper} ${pathname === '/myProfile' ? styles.active : ''}`}
        onClick={handleGoToMyProfile}
      >
        <FaUser className={styles.icon} />
        <p>Profile</p>
      </div>

      <div
        className={styles.iconWrapper}
        onClick={() => setIsCreatePostModalOpen(true)}
      >
        <FaPlusSquare className={styles.icon} />
        <p>Create</p>
      </div>

      {/* notificatoins section with badge */}
      <div
        className={`${styles.iconWrapper} ${pathname === '/notifs' ? styles.active : ''}`}
        onClick={handleNotificationsClick}
      >
        <div className={styles.notificationBellWrapper}>
          <FaBell className={styles.icon} />
          {unreadCount > 0 && (
            <span className={styles.notificationBadge}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        <p>Notifs</p>
      </div>

      {isCreatePostModalOpen &&
        createPortal(
          <CreatePostModal onClose={() => setIsCreatePostModalOpen(false)} />,
          document.body
        )}

      {isMustLoginModalOpen && 
        createPortal(
          <MustLoginModal onClose={() => setIsMustLoginModalOpen(false)} />,
          document.body
        )}

    </nav>
  );
}