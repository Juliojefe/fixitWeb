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

      {/* Reported Entity — dynamic per type */}
      <div className={styles.section}>
        <h3>Reported Content</h3>

        {/* USER */}
        {entityType === 'USER' && (
          <div className={styles.entityCard}>
            <div className={styles.reportedPerson}>
              <div>
                <p className={styles.name}>{report.name}</p>
                <p className={styles.email}>{report.email}</p>
              </div>
              {report.profilePic && (
                <img src={report.profilePic} alt="user" className={styles.profilePic} />
              )}
            </div>
          </div>
        )}

        {/* POST */}
        {entityType === 'POST' && (
          <div className={styles.entityCard}>
            <div className={styles.reportedPerson}>
              <div>
                <p className={styles.name}>{report.authorName}</p>
                <p className={styles.email}>{report.authorEmail}</p>
              </div>
              {report.authorProfilePic && (
                <img src={report.authorProfilePic} alt="author" className={styles.profilePic} />
              )}
            </div>

            {report.imageUrls?.length > 0 && (
              <div className={styles.imageStrip}>
                {report.imageUrls.map((url: string, i: number) => (
                  <img key={i} src={url} alt="post image" className={styles.largeImage} />
                ))}
              </div>
            )}

            <p className={styles.content}>{report.description}</p>
            <p className={styles.entityId}>Post #{report.postId}</p>
          </div>
        )}

        {/* COMMENT */}
        {entityType === 'COMMENT' && (
          <div className={styles.entityCard}>
            <div className={styles.reportedPerson}>
              <div>
                <p className={styles.name}>{report.authorName}</p>
                <p className={styles.email}>{report.authorEmail}</p>
              </div>
              {report.authorProfilePic && (
                <img src={report.authorProfilePic} alt="author" className={styles.profilePic} />
              )}
            </div>

            {report.imageUrls?.length > 0 && (
              <div className={styles.imageStrip}>
                {report.imageUrls.map((url: string, i: number) => (
                  <img key={i} src={url} alt="comment image" className={styles.largeImage} />
                ))}
              </div>
            )}

            <p className={styles.content}>{report.content}</p>
            <p className={styles.entityId}>Comment #{report.commentId}</p>
          </div>
        )}

        {/* REVIEW */}
        {entityType === 'REVIEW' && (
          <div className={styles.entityCard}>
            <div className={styles.reportedPerson}>
              <div>
                <p className={styles.name}>{report.reviewerName}</p>
                <p className={styles.email}>{report.reviewerEmail}</p>
              </div>
              {report.reviewerProfilePic && (
                <img src={report.reviewerProfilePic} alt="reviewer" className={styles.profilePic} />
              )}
            </div>

            {report.imageUrls?.length > 0 && (
              <div className={styles.imageStrip}>
                {report.imageUrls.map((url: string, i: number) => (
                  <img key={i} src={url} alt="review image" className={styles.largeImage} />
                ))}
              </div>
            )}

            <p className={styles.content}>{report.content}</p>
            <p className={styles.entityId}>Review #{report.reviewId} — ⭐ {report.rating}</p>
          </div>
        )}

        {/* REVIEW_RESPONSE */}
        {entityType === 'REVIEW_RESPONSE' && (
          <div className={styles.entityCard}>
            <div className={styles.reportedPerson}>
              <div>
                <p className={styles.name}>{report.authorName}</p>
                <p className={styles.email}>{report.authorEmail}</p>
              </div>
              {report.authorProfilePic && (
                <img src={report.authorProfilePic} alt="author" className={styles.profilePic} />
              )}
            </div>

            {report.imageUrls?.length > 0 && (
              <div className={styles.imageStrip}>
                {report.imageUrls.map((url: string, i: number) => (
                  <img key={i} src={url} alt="response image" className={styles.largeImage} />
                ))}
              </div>
            )}

            <p className={styles.content}>{report.content}</p>
            <p className={styles.entityId}>Review Response #{report.responseId}</p>
          </div>
        )}

        {/* MESSAGE */}
        {entityType === 'MESSAGE' && (
          <div className={styles.entityCard}>
            <div className={styles.reportedPerson}>
              <div>
                <p className={styles.name}>{report.authorName}</p>
                <p className={styles.email}>{report.authorEmail}</p>
              </div>
              {report.authorProfilePic && (
                <img src={report.authorProfilePic} alt="author" className={styles.profilePic} />
              )}
            </div>

            {report.imageUrls?.length > 0 && (
              <div className={styles.imageStrip}>
                {report.imageUrls.map((url: string, i: number) => (
                  <img key={i} src={url} alt="message image" className={styles.largeImage} />
                ))}
              </div>
            )}

            <p className={styles.content}>{report.content}</p>
            <p className={styles.entityId}>Message #{report.messageId}</p>
          </div>
        )}
      </div>
    </div >
  );
}