'use client';

import Image from 'next/image';
import styles from './UserSearchResults.module.css';

type UserSearchResult = {
  userId: number;
  name: string;
  profilePic?: string;
  isMechanic: boolean;
};

type Props = {
  users: UserSearchResult[];
  onUserClick: (userId: number) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  loading: boolean;
};

export default function UserSearchResults({ users, onUserClick, onLoadMore, hasMore, loading }: Props) {
  return (
    <div className={styles.userResultsContainer}>
      <h2 className={styles.header}>People Results</h2>

      <div className={styles.userGrid}>
        {users.map(user => (
          <div
            key={user.userId}
            className={styles.userCard}
            onClick={() => onUserClick(user.userId)}
          >
            <div className={styles.userAvatar}>
              {user.profilePic ? (
                <img
                  src={user.profilePic}
                  alt={user.name}
                  width={64}
                  height={64}
                  className={styles.avatarImage}
                />
              ) : (
                <div className={styles.avatarPlaceholder}>👤</div>
              )}
            </div>

            <div className={styles.userInfo}>
              <h3>{user.name}</h3>
              {user.isMechanic && <span className={styles.mechanicBadge}>🔧 Mechanic</span>}
            </div>

            <button className={styles.viewProfileBtn}>View Profile →</button>
          </div>
        ))}
      </div>

      {hasMore && (
        <button
          className={styles.loadMoreBtn}
          onClick={onLoadMore}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Load More People'}
        </button>
      )}

      {users.length === 0 && <p className={styles.noResults}>No users found.</p>}
    </div>
  );
}