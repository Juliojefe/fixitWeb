'use client'

import React, { useState } from "react";
import { FaHeart, FaRegHeart, FaRegComment, FaRegBookmark, FaBookmark, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useUser } from '@/app/providers/UserProvider';
import { useRouter } from "next/navigation";
import { DisplayPostType } from '@/types/displayPost';
import { comment } from "@/types/comment";
import AuthLoading from "../AuthLoading/AuthLoading";
import styles from "./PostModal.module.css";
import commonStyles from "../../app/styles/common.module.css"
import MustLoginModal from "../MustLoginModal/MustLoginModal";
import { createPortal } from 'react-dom';
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
  onClose
}: PostProps) {

  //  basic needs
  const router = useRouter();
  const { user } = useUser();

  // post specific
  const hasImage = (postData?.imageUrls?.length ?? 0) > 0;  //  true if one image or more false otherwise
  const deletedAuthor = postData?.authorId == null; //  true if the user has been deleted

  //  comments section 
  const [loadingComments, setLoadingComments] = useState(true);
  const [comments, setComments] = useState<comment[] | null>(null);

  if (!postData) {
    return null;
  }

  if (loadingComments) {
    //  TODO
    //  Fetch comments by postId
    setLoadingComments(false);
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


        {/* Description and comments section */}
      </div>

    </div>
  )

}