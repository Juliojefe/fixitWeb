'use client';

import { useState, useEffect } from 'react';
import UserCard from '@/components/UserCard/UserCard';
import styles from './UserSearchResults.module.css';

type UserSearchResult = {
  userId: number;
  name: string;
  profilePic?: string;
  mechanic: boolean;
  following: boolean;
};

type Props = {
  users: UserSearchResult[];
  onLoadMore: () => void;
  hasMore: boolean;
  loading: boolean;
};

export default function UserSearchResults({ users, onLoadMore, hasMore, loading }: Props) {
  const [localUsers, setLocalUsers] = useState(users);

  useEffect(() => {
    setLocalUsers(users);
  }, [users]);

  const handleFollowChange = (userId: number, newFollowing: boolean) => {
    setLocalUsers(prev =>
      prev.map(u => u.userId === userId ? { ...u, following: newFollowing } : u)
    );
  };

  return (
    <div className={styles.userResultsContainer}>
      <div className={styles.userGrid}>
        {localUsers.map((user) => (
          <div key={user.userId} className={styles.userCard}>
            <UserCard
              followingAuthor={user.following}
              authorId={user.userId}
              createdBy={user.name}
              createdByProfilePicUrl={user.profilePic || ''}
              authorIsMechanic={user.mechanic}
              onFollowChange={(newFollowing) => handleFollowChange(user.userId, newFollowing)}
              showBottomBorder={false}
              reportEntityType="USER"
              reportEntityId={user.userId}
              popupPosition="post-pos"
            />
          </div>
        ))}
      </div>

      {localUsers.length === 0 && (
        <p className={styles.noResults}>
          enter a name you would like to search for
        </p>
      )}
    </div>
  );
}