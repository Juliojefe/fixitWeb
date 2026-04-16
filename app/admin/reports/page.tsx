'use client';

import { useUser } from '@/app/providers/UserProvider';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

const entityTypes = [
  { type: 'USER', label: 'Users', description: 'Reports about user profiles or behavior' },
  { type: 'POST', label: 'Posts', description: 'Reports about posts and their content' },
  { type: 'COMMENT', label: 'Comments', description: 'Reports about comments under posts' },
  { type: 'REVIEW', label: 'Reviews', description: 'Reports about mechanic reviews' },
  { type: 'MESSAGE', label: 'Messages', description: 'Reports about chat messages' },
];

export default function ReportsSelectorPage() {
  const { user } = useUser();
  const router = useRouter();

  if (!user?.isAdmin) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Access Denied</h1>
        <p>Only admins can access this page.</p>
      </div>
    );
  }

  const handleSelect = (entityType: string) => {
    console.log(`Selected entity type for filtering: ${entityType}`);
    router.push(`/admin/reports/${entityType}`);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Manage Reports</h1>
      <p className={styles.subtitle}>Select the type of content you want to review</p>

      <div className={styles.grid}>
        {entityTypes.map(({ type, label, description }) => (
          <div
            key={type}
            className={styles.card}
            onClick={() => handleSelect(type)}
          >
            <h3 className={styles.cardTitle}>{label}</h3>
            <p className={styles.cardDescription}>{description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}