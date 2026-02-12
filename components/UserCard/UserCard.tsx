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
  onFollowChange?: (newFollowing: boolean) => void;
}

export default function UserCard({ followingAuthor, authorId, createdBy, createdByProfilePicUrl, onFollowChange }: UserCardProps) {
  // basic needs
  const router = useRouter();
  const { user } = useUser();

  // rendering needs
  const deletedAuthor = authorId == null; // true if the user has been deleted
  const ownsPost = user?.userId === authorId; // true if the current user is the author of the post

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
    if (deletedAuthor) {
      return;
    }
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    const newFollowing = !followingAuthor;
    onFollowChange?.(newFollowing); //  let the parent component know about the change in follow status
    const endpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/follow/${authorId}`;
    try {
      if (followingAuthor) {
        // currently following, so unfollow
        await axios.delete(
          endpoint,
          {
            headers: { Authorization: `Bearer ${user.accessToken}` },
          }
        );
      } else {
        // currently not following, so follow
        await axios.post(
          endpoint,
          {},
          {
            headers: { Authorization: `Bearer ${user.accessToken}` },
          }
        );
      }
    } catch (error) {
      console.error("Error toggling follow status:", error);
      // undo follow status change in case of error
      onFollowChange?.(followingAuthor); // revert to previous state
    }

    //  API logic bellow
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
        {!ownsPost ? (
        <button
          className={`${styles.followButton} ${followingAuthor ? styles.following : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            handleFollowToggle();
          }}
        >
          {followingAuthor ? "Following" : "Follow"}
        </button>
        ) : null}
      </div>
    </>
  )

}