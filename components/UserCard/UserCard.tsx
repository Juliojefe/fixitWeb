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

  // used for modal rendition
  const [showLoginModal, setShowLoginModal] = useState(false);

  async function handleGoToProfile() {
    if (deletedAuthor) {
      return;
    }
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    console.log("go to profile with id " + authorId)
    return;
  }

}