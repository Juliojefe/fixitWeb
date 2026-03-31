'use client';

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
              {user.isMechanic && <span className={styles.mechanicBadge}>🔧 mechanic</span>}
            </div>
            <button className={styles.viewProfileBtn}>view profile →</button>
          </div>
        ))}
      </div>
      {hasMore && (
        <button
          className={styles.loadMoreBtn}
          onClick={onLoadMore}
          disabled={loading}
        >
          {loading ? 'loading...' : 'load more people'}
        </button>
      )}
      {users.length === 0 && <p className={styles.noResults}>no users found.</p>}
    </div>
  );
}