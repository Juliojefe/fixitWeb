'use client';

import { useUser } from '@/app/providers/UserProvider';
import { useRouter } from "next/navigation";
import styles from "./UserCard.module.css";
import MustLoginModal from "../MustLoginModal/MustLoginModal";
import { createPortal } from 'react-dom';
import axios from 'axios';
import { useState } from 'react';
import ReportMenu from '../ReportMenu/ReportMenu';

interface UserCardProps {
  followingAuthor: boolean;
  authorId: number | null;
  createdBy: string;
  createdByProfilePicUrl: string;
  authorIsMechanic: boolean;
  onFollowChange?: (newFollowing: boolean) => void;
  showBottomBorder?: boolean;
  reportEntityType?: 'POST';
  reportEntityId?: number;
}

export default function UserCard({
  followingAuthor,
  authorId,
  createdBy,
  createdByProfilePicUrl,
  authorIsMechanic,
  onFollowChange,
  showBottomBorder = true,
  reportEntityType,
  reportEntityId,
}: UserCardProps) {

  const router = useRouter();
  const { user } = useUser();

  const deletedAuthor = authorId == null;
  const ownsPost = user?.userId === authorId;

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleGoToProfile() {
    if (deletedAuthor) return;
    if (user?.userId === authorId) {
      router.push("/myProfile");
      return;
    }
    router.push(`/profile/${authorId}`);
  }

  async function handleFollowToggle() {
    if (deletedAuthor || isLoading) return;
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    setIsLoading(true);
    const newFollowing = !followingAuthor;
    onFollowChange?.(newFollowing);

    const endpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/follow/${authorId}`;
    try {
      if (followingAuthor) {
        await axios.delete(endpoint, { headers: { Authorization: `Bearer ${user.accessToken}` } });
      } else {
        await axios.post(endpoint, {}, { headers: { Authorization: `Bearer ${user.accessToken}` } });
      }
    } catch (error) {
      console.error("Error toggling follow status:", error);
      onFollowChange?.(followingAuthor);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      {showLoginModal &&
        createPortal(
          <MustLoginModal onClose={() => setShowLoginModal(false)} />,
          document.body
        )}

      <div
        className={`${styles.headerSection} ${!showBottomBorder ? styles.noBottomBorder : ''}`}
        onClick={deletedAuthor ? undefined : () => handleGoToProfile()}
        style={deletedAuthor ? { cursor: "default" } : undefined}
      >
        <img
          className={styles.profilePic}
          src={deletedAuthor ? "/images/deletedUserPfp.png" : createdByProfilePicUrl}
          alt="profile picture"
        />

        <div className={styles.nameContainer}>
          <p className={styles.userName}>
            {deletedAuthor ? "Deleted User" : createdBy}
          </p>
          {authorIsMechanic && <img className={styles.mechanicBadge} src="/icons/wrench.png" alt="mechanic badge" />}
        </div>

        {/* Right-side actions wrapper */}
        <div className={styles.headerActions}>
          {!ownsPost && (
            <button
              className={`${styles.followButton} ${followingAuthor ? styles.following : ""} ${isLoading ? styles.loading : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                handleFollowToggle();
              }}
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : followingAuthor ? "Following" : "Follow"}
            </button>
          )}

          {reportEntityType === 'POST' &&
           reportEntityId !== undefined &&
           !ownsPost &&
           !deletedAuthor && (
            <ReportMenu
              entityType="POST"
              entityId={reportEntityId}
              className={styles.reportMenu}
            />
          )}
        </div>
      </div>
    </>
  );
}