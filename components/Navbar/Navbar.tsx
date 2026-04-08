'use client';

import { FaHome, FaCompass, FaPlusSquare, FaBell, FaUser } from "react-icons/fa";
import styles from "./navbar.module.css";
import CreatePostModal from '../CreatePostModal/CreatePostModal';
import MustLoginModal from "../MustLoginModal/MustLoginModal";
import { useRouter, usePathname } from 'next/navigation';
import { useState } from "react";
import { useUser } from '@/app/providers/UserProvider';
import { createPortal } from 'react-dom';

export default function Navbar() {
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [isMustLoginModalOpen, setIsMustLoginModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0); // placeholder for now connect to WebSocket/context later
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUser();

  function handleGoToMyProfile() {
    if (!user) {
      setIsMustLoginModalOpen(true);
      return;
    } else {
      router.push("/myProfile");
    }
  }

  function handleNotificationsClick() {
    if (!user) {
      setIsMustLoginModalOpen(true);
      return;
    } else {
      router.push("/notifs");
    }
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