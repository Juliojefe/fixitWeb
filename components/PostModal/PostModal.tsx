'use client'

import React, { useState, useEffect, useRef } from "react";
import { FaHeart, FaRegHeart, FaRegComment, FaRegBookmark, FaBookmark, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useUser } from '@/app/providers/UserProvider';
import { useRouter } from "next/navigation";
import { DisplayPostType } from '@/types/displayPost';
import { comment } from "@/types/comment";
import styles from "./PostModal.module.css";
import { formatDistanceToNow } from "date-fns";
import commonStyles from "../../app/styles/common.module.css"
import axios from 'axios';

interface PostProps {
  postData?: DisplayPostType | null;
  hasLiked?: boolean;
  hasSaved?: boolean;
  likeCount: number;
  currImageIndex: number;
  onLike: () => void;
  onSave: () => void;
  onNextImage: () => void;
  onPrevImage: () => void;
  onClose?: () => void;
  onGoToProfile: (id: number) => void;
}

export default function PostModal({
  postData,
  hasLiked,
  hasSaved,
  likeCount,
  currImageIndex,
  onLike,
  onSave,
  onNextImage,
  onPrevImage,
  onClose,
  onGoToProfile
}: PostProps) {

  // basic needs
  const router = useRouter();
  const { user } = useUser();

  // post specific
  const hasImage = (postData?.imageUrls?.length ?? 0) > 0;  // true if one image or more false otherwise
  const deletedAuthor = postData?.authorId == null; // true if the user has been deleted

  // comments section 
  const [loadingComments, setLoadingComments] = useState(true);
  const [comments, setComments] = useState<comment[]>([]);
  const [last, setLast] = useState(false);
  const [currPage, setCurrPage] = useState(0);
  const PAGE_SIZE = 10;

  // for adding comment
  const [commentContent, setCommentContent] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [postingComment, setPostingComment] = useState(false);

  // for enlarging image
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

  if (!postData) {
    return null;
  }

  // useEffect(() => {
  //   if (loadingComments && !last) {
  //     fetchComments();
  //   }
  // }, [loadingComments, currPage, last]);

    if (loadingComments && !last) {
      fetchComments();
    }

  async function fetchComments() {
    try {
      const endpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/comment/post/${postData?.postId}?page=${currPage}&size=${PAGE_SIZE}`;
      const res = await axios.get(endpoint);
      const page = res.data;
      setComments(prev => [...prev, ...page.content.map((c: any) => ({
        commentId: c.commentId,
        authorId: c.authorId,
        createdBy: c.createdByName,
        createdByProfilePicUrl: c.createdByProfilePicUrl,
        content: c.content,
        imageUrls: c.imageUrls,
        createdAt: c.createdAt
      }))]);
      setLast(page.last);
    } catch (err) {
      console.error("Failed to fetch comments", err);
    } finally {
      setLoadingComments(false);
    }
  }

  function handleLoadMore() {
    if (!last && !loadingComments) {
      setCurrPage(prev => prev + 1);
      setLoadingComments(true);
    }
  }

  async function handlePostComment() {
    if (!commentContent.trim() || postingComment) return;
    setPostingComment(true);
    try {
      const dto = {
        postId: postData?.postId,
        userId: user?.userId,
        content: commentContent,
        createdAt: null // use server time
      };
      const formData = new FormData();
      formData.append('dto', new Blob([JSON.stringify(dto)], { type: 'application/json' }));
      selectedImages.forEach(file => formData.append('images', file));

      const endpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/comment`;
      console.log(dto);
      const res = await axios.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${user?.accessToken}`
        }
      });

      const newComment = res.data;
      setComments(prev => [...prev, {
        commentId: newComment.commentId,
        authorId: newComment.authorId,
        createdBy: newComment.createdByName,
        createdByProfilePicUrl: newComment.createdByProfilePicUrl,
        content: newComment.content,
        imageUrls: newComment.imageUrls,
        createdAt: newComment.createdAt
      }]);
      setCommentContent('');
      setSelectedImages([]);
    } catch (err) {
      console.error("Failed to post comment", err);
    } finally {
      setPostingComment(false);
    }
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setSelectedImages(Array.from(e.target.files));
    }
  }

  function handleEnlargeImage(url: string) {
    setEnlargedImage(url);
  }

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.postModalContainer} onClick={(e) => e.stopPropagation()}>
        {/* Image Section */}
        {hasImage ? (
          <div className={styles.postModalImageSection}>
            {postData?.imageUrls?.[0] && (
              <img
                className={styles.postImage}
                src={postData.imageUrls[currImageIndex]}
              />
            )}
            {postData.imageUrls.length > 1 && currImageIndex > 0 && (
              <button className={styles.prevImageButton} onClick={onPrevImage}>
                <FaChevronLeft />
              </button>
            )}
            {postData.imageUrls.length > 1 && currImageIndex < postData.imageUrls.length - 1 && (
              <button className={styles.nextImageButton} onClick={onNextImage}>
                <FaChevronRight />
              </button>
            )}
          </div>
        ) : null}
        <div className={styles.commentsSection}>
          {/* header section */}
          <div
            className={styles.headerSection}
            onClick={
              deletedAuthor
                ? undefined
                : () => onGoToProfile(postData.authorId!)
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

          {/* comments list */}
          <div className={styles.commentsList}>
            {comments.length === 0 && !loadingComments ? (
              <p className={styles.noComments}>No comments yet</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.commentId} className={styles.commentItem}>
                  <img
                    className={styles.commentProfilePic}
                    src={comment.createdByProfilePicUrl}
                    alt="comment author"
                    onClick={() => onGoToProfile(comment.authorId)}
                  />
                  <div className={styles.commentContent}>
                    <p className={styles.commentAuthor} onClick={() => onGoToProfile(comment.authorId)}>
                      {comment.createdBy}
                    </p>
                    <p className={styles.commentText}>{comment.content}</p>
                    {comment.imageUrls.length > 0 && (
                      <div className={styles.commentImages}>
                        {comment.imageUrls.map((url, idx) => (
                          <img
                            key={idx}
                            src={url}
                            alt="comment image"
                            className={styles.smallImage}
                            onClick={() => handleEnlargeImage(url)}
                          />
                        ))}
                      </div>
                    )}
                    <p className={styles.commentTime}>
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))
            )}
            {loadingComments && comments.length === 0 && (
              <div className={styles.spinnerCenter}>Loading...</div>
            )}
            {loadingComments && comments.length > 0 && (
              <div className={styles.spinnerBottom}>Loading more...</div>
            )}
            {!last && !loadingComments && (
              <button className={styles.loadMore} onClick={handleLoadMore}>
                +
              </button>
            )}
          </div>

          {/* auth user extras */}
          {user && (
            <>
              <div className={styles.actionIcons}>
                {hasLiked ? (
                  <FaHeart className={styles.likeIconActive} onClick={onLike} />
                ) : (
                  <FaRegHeart className={styles.icon} onClick={onLike} />
                )}
                <FaRegComment className={styles.icon} />
                {hasSaved ? (
                  <FaBookmark className={styles.icon} onClick={onSave} />
                ) : (
                  <FaRegBookmark className={styles.icon} onClick={onSave} />
                )}
              </div>
              <div className={styles.addComment}>
                <textarea
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="Add a comment..."
                  className={styles.commentInput}
                />
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className={styles.imageUpload}
                />
                {selectedImages.length > 0 && (
                  <div className={styles.previewImages}>
                    {selectedImages.map((file, idx) => (
                      <img
                        key={idx}
                        src={URL.createObjectURL(file)}
                        alt="preview"
                        className={styles.smallImage}
                      />
                    ))}
                  </div>
                )}
                <button onClick={handlePostComment} disabled={postingComment || !commentContent.trim()}>
                  Post
                </button>
              </div>
            </>
          )}

          {enlargedImage && (
            <div className={styles.enlargeOverlay} onClick={() => setEnlargedImage(null)}>
              <img src={enlargedImage} alt="enlarged" className={styles.enlargedImage} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}