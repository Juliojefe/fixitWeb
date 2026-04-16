'use client';

import styles from './ReportDetail.module.css';

interface ReportDetailProps {
  report: any;
}

export default function ReportDetail({ report }: ReportDetailProps) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          Report #{report.reportId} — {report.entityType}
        </h1>
        <div className={styles.statusBadge}>
          Status: <span className={styles[report.status.toLowerCase()]}>{report.status}</span>
        </div>
      </div>

      <div className={styles.section}>
        <h3>Reporter</h3>
        <p><strong>Name:</strong> {report.reporterName}</p>
        <p><strong>Email:</strong> {report.reporterEmail}</p>
        {report.reporterProfilePic && (
          <img
            src={report.reporterProfilePic}
            alt="reporter"
            className={styles.profilePic}
          />
        )}
      </div>

      <div className={styles.section}>
        <h3>Reason(s)</h3>
        <ul className={styles.reasonsList}>
          {report.reasons?.map((reason: any) => (
            <li key={reason.code} className={styles.reasonItem}>
              <strong>{reason.code}</strong>: {reason.description}
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.section}>
        <h3>Explanation</h3>
        <p className={styles.explanation}>{report.explanation}</p>
      </div>

      {report.adminExplanation && (
        <div className={styles.section}>
          <h3>Admin Review</h3>
          <p><strong>Admin Note:</strong> {report.adminExplanation}</p>
        </div>
      )}

      <div className={styles.entityInfo}>
        <h3>Entity Information</h3>
        <pre className={styles.json}>{JSON.stringify(report, null, 2)}</pre>
      </div>
    </div>
  );
}
