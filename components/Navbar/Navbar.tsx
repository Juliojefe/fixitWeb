'use client';

import { FaHome, FaCompass, FaPlusSquare, FaBell, FaUser } from "react-icons/fa";
import styles from "./navbar.module.css";
import CreatePostModal from '../CreatePostModal/CreatePostModal';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from "react";
import { createPortal } from 'react-dom';

export default function Navbar() {
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setIsClient(true);
  }, []);

  function doNothing() {
    return;
  }

  return (
    <nav className={styles.navbar}>
      <div
        className={`${styles.iconWrapper} ${pathname === '/home' ? styles.active : ''}`}
        onClick={() => router.push("/home")}
      >
        <FaHome className={styles.icon} />
        <p>Home</p>
      </div>

      <div
        className={`${styles.iconWrapper} ${pathname === '/myProfile' ? styles.active : ''}`}
        onClick={() => router.push("/myProfile")}
      >
        <FaUser className={styles.icon} />
        <p>Profile</p>
      </div>

      <div
        className={`${styles.iconWrapper} ${pathname === '/explore' ? styles.active : ''}`}
        onClick={() => router.push("/explore")}
      >
        <FaCompass className={styles.icon} />
        <p>Explore</p>
      </div>

      <div
        className={styles.iconWrapper}
        onClick={() => setIsCreatePostModalOpen(true)}
      >
        <FaPlusSquare className={styles.icon} />
        <p>Create</p>
      </div>

      <div className={styles.iconWrapper} onClick={doNothing}>
        <FaBell className={styles.icon} />
        <p>Notifs</p>
      </div>

      {/* Render modal via portal if open and on client */}
      {isClient && isCreatePostModalOpen && createPortal(
        <CreatePostModal onClose={() => setIsCreatePostModalOpen(false)} />,
        document.body  // Appends directly to <body>
      )}
    </nav>
  );
}