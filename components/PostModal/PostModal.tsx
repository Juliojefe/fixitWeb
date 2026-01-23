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
  onLike: () => void;
  onSave: () => void;
}

export default function PostModal({ postData, onLike, onSave }: PostProps) {
  //  basic needs
  const router = useRouter();
  const { user } = useUser();

  //  comments section 
  const [loadingComments, setLoadingComments] = useState(true);
  const [comments, setComments] = useState<comment[] | null>(null);

  if (loadingComments) {
    //  TODO
    //  Fetch comments by postId
    setLoadingComments(false);
  }


  return (
    <div className={styles.modalBackdrop}>
      <div className={commonStyles.modalContainer}>

      </div>

    </div>
  )

}