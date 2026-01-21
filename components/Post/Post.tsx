'use client'

import React, { useState } from "react";
import { FaHeart, FaRegHeart, FaRegComment, FaRegBookmark, FaBookmark, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useUser } from '@/app/providers/UserProvider';
import { useRouter } from "next/navigation";
import { DisplayPostType } from '@/types/displayPost';
import styles from "./Post.module.css";
import MustLoginModal from "../MustLoginModal/MustLoginModal";
import { createPortal } from 'react-dom';
import axios from 'axios';

interface PostProps {
  postData?: DisplayPostType | null;
}

export default function Post({ postData = null }: PostProps) {
  const router = useRouter();
  const [currImageIndex, setCurrImageIndex] = useState(0);
  const { user } = useUser();
  const hasImage = (postData?.imageUrls?.length ?? 0) > 0;  //  true if one image or more false otherwise
  const deletedAuthor = postData?.authorId == null; //  true if the user has been deleted
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [hasLiked, setHasLiked] = useState(postData?.hasLiked);
  const [hasSaved, setHasSaved] = useState(postData?.hasSaved);
  const [likeCount, setLikeCount] = useState<number>(postData?.likeCount ?? 0);

  if (!postData) {
    return null;
  }

  async function handleGoToProfile(authorId: number) {
    return;
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

  function handleSave() {
    //  TODO
    if (!user) {
      setShowLoginModal(true);
      return;
    }
  }

  function handleComments() {
    //  TODO
    return;
  }

  async function handleLike() {
    console.log("hit");
    //  TODO
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    try {
      const endpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/post/${postData?.postId}/like`;
      if (!hasLiked) {
        setHasLiked(true);
        setLikeCount(prev => prev + 1);
        try {
          await axios.post(
            endpoint,
            {},
            {
              headers: { Authorization: `Bearer ${user.accessToken}` },
            }
          );
        } catch (err) {
          console.error("Failed to like post", err);
        }
      } else {
        setHasLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));
        try {
          await axios.delete(endpoint, {
            headers: { Authorization: `Bearer ${user.accessToken}` },
          });
        } catch (err) {
          console.error("Failed to unlike post", err);
        }
      }
    } catch (err) {
      console.error("Unexpected error in handleSave", err);
    }
    console.log("complete");

  }

  return (
    <>

      {showLoginModal &&
        createPortal(
          <MustLoginModal onClose={() => setShowLoginModal(false)} />,
          document.body
        )}

      <div className={styles.postContainer}>
        {/* header section */}
        <div
          className={styles.headerSection}
          onClick={
            deletedAuthor
              ? undefined
              : () => handleGoToProfile(postData.authorId)
          }
          style={deletedAuthor ? { cursor: "default" } : undefined}
        >
          <img
            className={styles.profilePic}
            src={
              deletedAuthor
                ? "/images/deletedUserPfp.png"
                : postData.createdByProfilePicUrl
            }
            alt="profile picture"
          />
          <p className={styles.userName}>
            {deletedAuthor ? "Deleted User" : postData.createdBy}
          </p>
        </div>
        {/* Image Section */}
        {hasImage ? (
          <div className={styles.imageSection}>
            {postData.imageUrls?.[0] && (
              <img
                className={styles.postImage}
                src={postData.imageUrls[currImageIndex]}
                alt="post image"
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
        <p className={styles.likeCount}>{likeCount || 0} likes</p>
        {/* like comment save icons */}
        <div className={styles.actionIcons}>

          {hasLiked ? (
            <FaHeart
              className={`${styles.icon} ${styles.active}`}
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
            onClick={handleComments}
          />

          {hasSaved ? (
            <FaBookmark
              className={`${styles.icon} ${styles.active}`}
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