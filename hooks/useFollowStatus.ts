// src/hooks/useFollowStatus.ts
import { useState } from 'react';
import { useUser } from '@/app/providers/UserProvider'; // Assuming this is available
import axios from 'axios';

export const useFollowStatus = (authorId: number | null, initialFollowing: boolean = false) => {
  const { user } = useUser();
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleToggleFollow = async () => {
    if (authorId == null) return; // No toggle for deleted users
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    const newFollowing = !isFollowing;
    setIsFollowing(newFollowing); // Optimistic update

    try {
      // TODO: Implement real API logic here
      const endpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/follow/${authorId}`;
      if (newFollowing) {
        await axios.post(endpoint, {}, { headers: { Authorization: `Bearer ${user.accessToken}` } });
      } else {
        await axios.delete(endpoint, { headers: { Authorization: `Bearer ${user.accessToken}` } });
      }
    } catch (err) {
      console.error('Follow toggle failed:', err);
      setIsFollowing(isFollowing); // Revert on error
    }
  };

  return {
    isFollowing,
    handleToggleFollow,
    showLoginModal,
    setShowLoginModal,
  };
};