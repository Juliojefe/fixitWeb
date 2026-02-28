'use client'

import { useState } from "react";
import { FaHeart, FaRegHeart, FaRegComment, FaRegBookmark, FaBookmark, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useUser } from '@/app/providers/UserProvider';
import { useRouter } from "next/navigation";
import { DisplayPostType } from '@/types/displayPost';
import styles from "./Post.module.css";
import MustLoginModal from "../MustLoginModal/MustLoginModal";
import UserCard from "../UserCard/UserCard";
import PostModal from "../PostModal/PostModal";
import { createPortal } from 'react-dom';
import axios from 'axios';

interface PostProps {
  postData?: DisplayPostType | null;
}

export default function Post({ postData = null }: PostProps) {
  // basic needs
  const router = useRouter();
  const { user } = useUser();

  // post specific features
  const [hasLiked, setHasLiked] = useState(postData?.hasLiked);
  const [hasSaved, setHasSaved] = useState(postData?.hasSaved);
  const [likeCount, setLikeCount] = useState<number>(postData?.likeCount ?? 0);
  const hasImage = (postData?.imageUrls?.length ?? 0) > 0;  // true if one image or more false otherwise
  const [currImageIndex, setCurrImageIndex] = useState(0);
  const [followingAuthor, setFollowingAuthor] = useState(postData?.followingAuthor || false);

  // used for modal rendition
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showWhoLikedModal, setShowWhoLikedModal] = useState(false);

  // used to prevent double-clicking during request
  const [likeLoading, setLikeLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  if (!postData) {
    return null;
  }

  function handleShowNextImage() {
    if (postData?.imageUrls && currImageIndex < postData?.imageUrls.length - 1) {
      setCurrImageIndex((prev) => prev + 1);
    }
  }

  function handleShowPrevImage() {
    if (currImageIndex > 0) {
      setCurrImageIndex((prev) => prev - 1);
    }
  }

  function handleFollowChange(newFollowing: boolean) {
    setFollowingAuthor(newFollowing);
  }

  async function handleSave() {
    if (saveLoading) return;
    if (!user?.accessToken) {
      setShowLoginModal(true);
      return;
    }
    setSaveLoading(true);
    const endpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/post/${postData?.postId}/save`;
    try {
      if (!hasSaved) {
        setHasSaved(true);
        await axios.post(
          endpoint,
          {},
          {
            headers: { Authorization: `Bearer ${user.accessToken}` },
          }
        );
      } else {
        setHasSaved(false);
        await axios.delete(endpoint, {
          headers: { Authorization: `Bearer ${user.accessToken}` },
        });
      }
    } catch (err) {
      console.error("Unexpected error in handleSave", err);
      setHasSaved((prev) => !prev);
    } finally {
      setSaveLoading(false);
    }
  }

  async function handleLike() {
    if (likeLoading) return;

    if (!user?.accessToken) {
      setShowLoginModal(true);
      return;
    }

    const endpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/post/${postData?.postId}/like`;
    setLikeLoading(true);

    try {
      if (!hasLiked) {
        setHasLiked(true);
        setLikeCount((prev) => prev + 1);

        await axios.post(
          endpoint,
          {}, // body
          { headers: { Authorization: `Bearer ${user.accessToken}` } }
        );
      } else {
        setHasLiked(false);
        setLikeCount((prev) => Math.max(0, prev - 1));

        await axios.delete(endpoint, {
          headers: { Authorization: `Bearer ${user.accessToken}` },
        });
      }
    } catch (err) {
      console.error("Failed to toggle like", err);
      setHasLiked((prev) => !prev);
      setLikeCount((prev) => (hasLiked ? prev + 1 : Math.max(0, prev - 1)));
    } finally {
      setLikeLoading(false);
    }
  }

  // used for header
  const userCard = (
    <UserCard
      followingAuthor={followingAuthor}
      authorId={postData?.authorId || null}
      createdBy={postData?.createdBy || "Deleted User"}
      createdByProfilePicUrl={postData?.createdByProfilePicUrl || "/images/deletedUserPfp.png"}
      authorIsMechanic={postData?.authorIsMechanic || false}
      onFollowChange={handleFollowChange}
    />
  );

  return (
    <>
      {showPostModal &&
        createPortal(
          <PostModal
            postData={postData}
            hasLiked={hasLiked}
            hasSaved={hasSaved}
            likeCount={likeCount}
            currImageIndex={currImageIndex}
            onLike={handleLike}
            onSave={handleSave}
            onNextImage={handleShowNextImage}
            onPrevImage={handleShowPrevImage}
            onClose={() => setShowPostModal(false)}
            header={userCard}
          />,
          document.body
        )}

      {showLoginModal &&
        createPortal(
          <MustLoginModal onClose={() => setShowLoginModal(false)} />,
          document.body
        )}

      <div className={styles.postContainer}>
        {/* header section */}
        {userCard} {/* pre-rendered component */}
        {/* Image Section */}
        {hasImage ? (
          <div className={styles.imageSection}>
            {postData.imageUrls?.[0] && (
              <img
                className={styles.postImage}
                src={postData.imageUrls[currImageIndex]}
              />
            )}
            {postData.imageUrls.length > 1 && currImageIndex > 0 && (
              <button className={styles.prevImageButton} onClick={handleShowPrevImage}>
                <FaChevronLeft />
              </button>
            )}
            {postData.imageUrls.length > 1 && currImageIndex < postData.imageUrls.length - 1 && (
              <button className={styles.nextImageButton} onClick={handleShowNextImage}>
                <FaChevronRight />
              </button>
            )}
          </div>
        ) : null}
        {/* description section */}
        <p className={styles.postDescription}>{postData.description || ""}</p>
        {/* like count */}
        <p onClick={() => setShowWhoLikedModal(true)} className={styles.likeCount}>{likeCount || 0} likes</p>
        {/* like comment save icons */}
        <div className={styles.actionIcons}>

          {hasLiked ? (
            <FaHeart
              className={styles.likeIconActive}
              onClick={handleLike}
            />
          ) : (
            <FaRegHeart
              className={styles.icon}
              onClick={handleLike}
            />
          )}

          <FaRegComment
            className={styles.icon}
            onClick={() => setShowPostModal(true)}
          />

          {hasSaved ? (
            <FaBookmark
              className={styles.icon}
              onClick={handleSave}
            />
          ) : (
            <FaRegBookmark
              className={styles.icon}
              onClick={handleSave}
            />
          )}
        </div>
      </div>
    </>
  )
}