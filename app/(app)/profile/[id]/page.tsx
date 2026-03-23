'use client';

import { useParams, useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function ProfilePage() {
  const { id } = useParams();
  const router = useRouter();

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Profile</h1>
        <p className={styles.userId}>User ID: <strong>#{id}</strong></p>

        <div className={styles.comingSoon}>
          <div className={styles.icon}>🚧</div>
          <h2>Profile page coming soon!</h2>
          <p>This feature is not implemented yet.</p>
          <p>We'll have full user profiles, bio, posts, and more here very soon.</p>
        </div>

        <button
          onClick={() => router.push('/explore')}
          className={styles.backBtn}
        >
          ← Back to Explore
        </button>
      </div>
    </div>
  );
}
