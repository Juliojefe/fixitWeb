'use client';

import { useParams } from 'next/navigation';
import styles from './page.module.css';

export default function SingleReportPage() {
  const params = useParams();
  const entityType = params.entityType as string;
  const reportId = params.reportId as string;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        Single Report — ID <strong>{reportId}</strong>
      </h1>
      <p className={styles.subtitle}>
        Entity Type: <strong>{entityType}</strong>
      </p>
      <div className={styles.placeholder}>
        <p>This is a temporary placeholder for viewing a single report.</p>
        <p>Full report details and review tools will be added here next.</p>
      </div>
    </div>
  );
}
