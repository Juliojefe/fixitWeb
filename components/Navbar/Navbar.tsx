'use client';

import { FaCompass, FaPlusSquare, FaBell, FaUser, FaShieldAlt } from "react-icons/fa";
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
  const router = useRouter();
  const pathname = usePathname();
  const { user, totalUnreadCount } = useUser();

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

  function handleAdminClick() {
    if (!user) {
      setIsMustLoginModalOpen(true);
      return;
    }
    router.push("/admin");
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

      <div
        className={`${styles.iconWrapper} ${pathname === '/notifs' ? styles.active : ''}`}
        onClick={handleNotificationsClick}
      >
        <div className={styles.notificationBellWrapper}>
          <FaBell className={styles.icon} />
          {totalUnreadCount > 0 && (
            <span className={styles.notificationBadge}>
              {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
            </span>
          )}
        </div>
        <p>Notifs</p>
      </div>

      {/* only visible to admins */}
      {user?.isAdmin && (
        <div
          className={`${styles.iconWrapper} ${pathname.startsWith('/admin') ? styles.active : ''}`}
          onClick={handleAdminClick}
        >
          <FaShieldAlt className={styles.icon} />
          <p>Admin</p>
        </div>
      )}

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