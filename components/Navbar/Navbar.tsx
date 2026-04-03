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

  function doNothing() {
    return;
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

      {/* remove temporarily */}
      {/* <div
        className={`${styles.iconWrapper} ${pathname === '/home' ? styles.active : ''}`}
        onClick={() => router.push("/home")}
      >
        <FaHome className={styles.icon} />
        <p>Home</p>
      </div> */}

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

      {isCreatePostModalOpen &&
        createPortal(
          <CreatePostModal onClose={() => setIsCreatePostModalOpen(false)} />,
          document.body
        )}

      { /* Guest user case*/}
      {isMustLoginModalOpen && 
        createPortal(
        <MustLoginModal onClose={() => setIsMustLoginModalOpen(false)} />,
        document.body
      )}

    </nav>
  );
}
