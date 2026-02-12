'use client';

import { useUser } from '@/app/providers/UserProvider';
import { useRouter } from "next/navigation";
import styles from "./UserCard.module.css";
import MustLoginModal from "../MustLoginModal/MustLoginModal";
import { createPortal } from 'react-dom';
import axios from 'axios';
import { useState } from 'react';

interface UserCardProps {
  followingAuthor: boolean;
  authorId: number | null;  // null if the user has been deleted
  createdBy: string;
  createdByProfilePicUrl: string;
  onToggleFollow: () => void;
}

export default function UserCard({ followingAuthor, authorId, createdBy, createdByProfilePicUrl, onToggleFollow }: UserCardProps) {
  // basic needs
  const router = useRouter();
  const { user } = useUser();

  // rendering needs
  const deletedAuthor = authorId == null; // true if the user has been deleted

  // used for modal rendition
  const [showLoginModal, setShowLoginModal] = useState(false);

  async function handleGoToProfile() {
    if (deletedAuthor) {
      return;
    }
    console.log("go to profile with id " + authorId)
    return;
  }

  async function handleFollowToggle() {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    onToggleFollow();
  }

  return (
    <>
      {showLoginModal &&
        createPortal(
          <MustLoginModal onClose={() => setShowLoginModal(false)} />,
          document.body
        )}


      <div
        className={styles.headerSection}
        onClick={
          deletedAuthor
            ? undefined
            : () => handleGoToProfile()
        }
        style={deletedAuthor ? { cursor: "default" } : undefined}
      >
        <img
          className={styles.profilePic}
          src={
            deletedAuthor
              ? "/images/deletedUserPfp.png"
              : createdByProfilePicUrl
          }
          alt="profile picture"
        />
        <p className={styles.userName}>
          {deletedAuthor ? "Deleted User" : createdBy}
        </p>
        <button
          className={`${styles.followButton} ${followingAuthor ? styles.following : ""}`}
          onClick={handleFollowToggle}
        >
          {followingAuthor ? "Following" : "Follow"}
        </button>
      </div>
    </>
  )

}