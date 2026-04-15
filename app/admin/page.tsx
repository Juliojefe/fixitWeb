'use client';

import { useUser } from '@/app/providers/UserProvider';
import Link from 'next/link';
import styles from './page.module.css';

export default function AdminPage() {
  const { user } = useUser();

  if (!user?.isAdmin) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Access Denied</h1>
        <p>Only admins can see this page.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Admin Dashboard</h1>
      <p className={styles.subtitle}>Choose an action below</p>

      <div className={styles.navGrid}>
        <Link href="/admin/reports" className={styles.navCard}>
          <h3>📋 Reports</h3>
          <p>Review and manage user reports</p>
        </Link>

        {/* Future sections can be added here */}
      </div>
    </div>
  );
}