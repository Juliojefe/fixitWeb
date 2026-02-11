'use client'

import { useState } from "react";
import { FaHeart, FaRegHeart, FaRegComment, FaRegBookmark, FaBookmark, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useUser } from '@/app/providers/UserProvider';
import { useRouter } from "next/navigation";
import { DisplayPostType } from '@/types/displayPost';
import styles from "./Post.module.css";
import MustLoginModal from "../MustLoginModal/MustLoginModal";
import PostModal from "../PostModal/PostModal";
import { createPortal } from 'react-dom';
import axios from 'axios';

interface PostProps {
  postData?: DisplayPostType | null;
}

export default function Post({ postData = null }: PostProps) {
  //  basic needs
  const router = useRouter();
  const { user } = useUser();

  //  post specific features
  const [hasLiked, setHasLiked] = useState(postData?.hasLiked);
  const [hasSaved, setHasSaved] = useState(postData?.hasSaved);
  const [likeCount, setLikeCount] = useState<number>(postData?.likeCount ?? 0);
  const hasImage = (postData?.imageUrls?.length ?? 0) > 0;  //  true if one image or more false otherwise
  const deletedAuthor = postData?.authorId == null; //  true if the user has been deleted
  const [currImageIndex, setCurrImageIndex] = useState(0);

  // used for modal rendition
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showWhoLikedModal, setShowWhoLikedModal] = useState(false);

  if (!postData) {
    return null;
  }

  async function handleGoToProfile(authorId: number) {
    console.log("go to profile with id " + authorId)
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

  async function handleSave() {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    try {
      const endpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/post/${postData?.postId}/save`;
      if (!hasSaved) {
        setHasSaved(true);
        try {
          await axios.post(
            endpoint,
            {},
            {
              headers: { Authorization: `Bearer ${user.accessToken}` },
            }
          );
        } catch (err) {
          console.error("Failed to save post", err);
        }
      } else {
        setHasSaved(false);
        try {
          await axios.delete(endpoint, {
            headers: { Authorization: `Bearer ${user.accessToken}` },
          });
        } catch (err) {
          console.error("Failed to unsave post", err);
        }
      }
    } catch (err) {
      console.error("Unexpected error in handleSave", err);
    }
  }

  async function handleLike() {
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
      console.error("Unexpected error in handleLike", err);
    }
  }

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
            onGoToProfile={(id: number) => handleGoToProfile(id)}
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
            onClick={ () => setShowPostModal(true)}
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