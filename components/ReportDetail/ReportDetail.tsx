'use client';

import styles from './ReportDetail.module.css';

interface ReportDetailProps {
  report: any;
}

export default function ReportDetail({ report }: ReportDetailProps) {
  const entityType = report.entityType;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>
          Report #{report.reportId} — {entityType}
        </h1>
        <div className={styles.statusBadge}>
          Status: <span className={styles[report.status.toLowerCase()]}>{report.status}</span>
        </div>
      </div>

      {/* Reporter */}
      <div className={styles.section}>
        <h3>Reporter</h3>
        <div className={styles.reporterRow}>
          <div className={styles.reporterInfo}>
            <p className={styles.name}>{report.reporterName}</p>
            <p className={styles.email}>{report.reporterEmail}</p>
          </div>
          {report.reporterProfilePic && (
            <img
              src={report.reporterProfilePic}
              alt="reporter"
              className={styles.profilePic}
            />
          )}
        </div>
      </div>

      {/* Reasons */}
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

      {/* Explanation */}
      <div className={styles.section}>
        <h3>Explanation</h3>
        <p className={styles.explanation}>{report.explanation}</p>
      </div>

      {/* Admin Review (if exists) */}
      {report.adminExplanation && (
        <div className={styles.section}>
          <h3>Admin Review</h3>
          <p className={styles.adminNote}>{report.adminExplanation}</p>
        </div>
      )}

      <div className={styles.section}>
        <h3>Reported Content</h3>
        {entityType === 'USER' && (
          <div className={styles.entityCard}>
            <div className={styles.entityRow}>
              <div>
                <p className={styles.name}>{report.name}</p>
                <p className={styles.email}>{report.email}</p>
              </div>
              {report.profilePic && <img src={report.profilePic} alt="user" className={styles.profilePic} />}
            </div>
          </div>
        )}

        {entityType === 'POST' && (
          <div className={styles.entityCard}>
            <p><strong>Post #{report.postId}</strong></p>
            <p className={styles.content}>{report.description}</p>
            {report.imageUrls?.length > 0 && (
              <div className={styles.imageStrip}>
                {report.imageUrls.map((url: string, i: number) => (
                  <img key={i} src={url} alt="post image" className={styles.thumbnail} />
                ))}
              </div>
            )}
            <div className={styles.authorRow}>
              <div>
                <p className={styles.name}>{report.authorName}</p>
                <p className={styles.email}>{report.authorEmail}</p>
              </div>
              {report.authorProfilePic && <img src={report.authorProfilePic} alt="author" className={styles.profilePic} />}
            </div>
          </div>
        )}

        {entityType === 'COMMENT' && (
          <div className={styles.entityCard}>
            <p><strong>Comment #{report.commentId}</strong></p>
            <p className={styles.content}>{report.content}</p>
            {report.imageUrls?.length > 0 && (
              <div className={styles.imageStrip}>
                {report.imageUrls.map((url: string, i: number) => (
                  <img key={i} src={url} alt="comment image" className={styles.thumbnail} />
                ))}
              </div>
            )}
            <div className={styles.authorRow}>
              <div>
                <p className={styles.name}>{report.authorName}</p>
                <p className={styles.email}>{report.authorEmail}</p>
              </div>
              {report.authorProfilePic && <img src={report.authorProfilePic} alt="author" className={styles.profilePic} />}
            </div>
          </div>
        )}

        {entityType === 'REVIEW' && (
          <div className={styles.entityCard}>
            <p><strong>Review #{report.reviewId}</strong> — ⭐ {report.rating}</p>
            <p className={styles.content}>{report.content}</p>
            {report.imageUrls?.length > 0 && (
              <div className={styles.imageStrip}>
                {report.imageUrls.map((url: string, i: number) => (
                  <img key={i} src={url} alt="review image" className={styles.thumbnail} />
                ))}
              </div>
            )}
            <div className={styles.authorRow}>
              <div>
                <p className={styles.name}>{report.reviewerName}</p>
                <p className={styles.email}>{report.reviewerEmail}</p>
              </div>
              {report.reviewerProfilePic && <img src={report.reviewerProfilePic} alt="reviewer" className={styles.profilePic} />}
            </div>
          </div>
        )}

        {entityType === 'REVIEW_RESPONSE' && (
          <div className={styles.entityCard}>
            <p><strong>Review Response #{report.responseId}</strong></p>
            <p className={styles.content}>{report.content}</p>
            {report.imageUrls?.length > 0 && (
              <div className={styles.imageStrip}>
                {report.imageUrls.map((url: string, i: number) => (
                  <img key={i} src={url} alt="response image" className={styles.thumbnail} />
                ))}
              </div>
            )}
            <div className={styles.authorRow}>
              <div>
                <p className={styles.name}>{report.authorName}</p>
                <p className={styles.email}>{report.authorEmail}</p>
              </div>
              {report.authorProfilePic && <img src={report.authorProfilePic} alt="author" className={styles.profilePic} />}
            </div>
          </div>
        )}

        {entityType === 'MESSAGE' && (
          <div className={styles.entityCard}>
            <p><strong>Message #{report.messageId}</strong></p>
            <p className={styles.content}>{report.content}</p>
            {report.imageUrls?.length > 0 && (
              <div className={styles.imageStrip}>
                {report.imageUrls.map((url: string, i: number) => (
                  <img key={i} src={url} alt="message image" className={styles.thumbnail} />
                ))}
              </div>
            )}
            <div className={styles.authorRow}>
              <div>
                <p className={styles.name}>{report.authorName}</p>
                <p className={styles.email}>{report.authorEmail}</p>
              </div>
              {report.authorProfilePic && <img src={report.authorProfilePic} alt="author" className={styles.profilePic} />}
            </div>
          </div>
        )}

        {entityType === 'MESSAGE_IMAGE' && (
          <div className={styles.entityCard}>
            <p><strong>Message Image #{report.messageImageId}</strong></p>
            {report.imageUrls?.length > 0 && (
              <div className={styles.imageStrip}>
                {report.imageUrls.map((url: string, i: number) => (
                  <img key={i} src={url} alt="message image" className={styles.thumbnail} />
                ))}
              </div>
            )}
            <div className={styles.authorRow}>
              <div>
                <p className={styles.name}>{report.authorName}</p>
                <p className={styles.email}>{report.authorEmail}</p>
              </div>
              {report.authorProfilePic && <img src={report.authorProfilePic} alt="author" className={styles.profilePic} />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}