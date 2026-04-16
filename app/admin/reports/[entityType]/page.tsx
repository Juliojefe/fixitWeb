'use client';

import { useParams } from 'next/navigation';
import { useUser } from '@/app/providers/UserProvider';
import { useEffect } from 'react';
import styles from './page.module.css';

export default function ReportsListPage() {
  const params = useParams();
  const { user } = useUser();
  const entityType = params.entityType as string;

    if (!user?.isAdmin) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Access Denied</h1>
        <p>Only admins can see this page.</p>
      </div>
    );
  }

  useEffect(() => {
    console.log(`✅ Admin selected entity type to filter reports: ${entityType}`);
    // Future: Fetch filtered reports here based on entityType
  }, [entityType]);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Reports for: <strong>{entityType}</strong></h1>
      <p className={styles.subtitle}>
        This page will list all reports for the selected entity type.<br />
        (Currently just logging the choice — full list coming next)
      </p>
    </div>
  );
}