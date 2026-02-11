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
  authorId: number;
  createdBy: string;
  createdByProfilePicUrl: string;
}

export default function UserCard({ followingAuthor, authorId, createdBy, createdByProfilePicUrl }: UserCardProps) {
  //  basic needs
  const router = useRouter();
  const { user } = useUser();

  //  redering needs
  const deletedAuthor = authorId == null; //  true if the user has been deleted
  const [isFollowing, setIsFollowing] = useState(followingAuthor);

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
    setIsFollowing((prev) => !prev);  //  testing only, api logic needs to be implemented still
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
          className={`${styles.followButton} ${isFollowing ? styles.following : ""}`}
          onClick={handleFollowToggle}
        >
          {isFollowing ? "Following" : "Follow"}
        </button>
      </div>
    </>
  )

}