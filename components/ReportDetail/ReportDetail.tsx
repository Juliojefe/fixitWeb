'use client';

import { useState } from 'react';
import styles from './ReportDetail.module.css';

interface ReportDetailProps {
  report: any;
  user: any;
  onReviewSubmitted: (newStatus: string, newExplanation: string) => Promise<void>;
}

export default function ReportDetail({ report, user, onReviewSubmitted }: ReportDetailProps) {
  const entityType = report.entityType;
  const isAdmin = user?.isAdmin;
  const currentUserId = user?.userId;

  // Form state for admin review
  const [selectedStatus, setSelectedStatus] = useState(report.status || "PENDING");
  const [adminExplanation, setAdminExplanation] = useState(report.adminExplanation || "");
  const [submitting, setSubmitting] = useState(false);

  const VALID_STATUSES = ["PENDING", "IN_REVIEW", "RESOLVED", "CLOSED", "DISMISSED"] as const;

  // Determine if the admin review section should be editable
  const hasReview = !!report.adminExplanation;
  const isPending = report.status === "PENDING";
  const isInReview = report.status === "IN_REVIEW";
  const isReviewer = report.reviewedBy === currentUserId;

  const canEditReview = 
    isAdmin && 
    (!hasReview || isPending || (isInReview && isReviewer));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditReview) return;
    setSubmitting(true);
    await onReviewSubmitted(selectedStatus, adminExplanation);
    setSubmitting(false);
  };

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
        <h3>User Explanation For Reporting</h3>
        <p className={styles.explanation}>{report.explanation}</p>
      </div>

      <div className={styles.section}>
        <h3>Admin Provided Review</h3>

        {canEditReview ? (
          /* Editable form */
          <form onSubmit={handleSubmit} className={styles.adminReviewForm}>
            {(!hasReview) && (
              <p className={styles.noReviewYet}>No review yet — add yours here.</p>
            )}

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className={styles.formSelect}
                required
              >
                {VALID_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Explanation</label>
              <textarea
                value={adminExplanation}
                onChange={(e) => setAdminExplanation(e.target.value)}
                rows={4}
                placeholder="Explain your decision..."
                className={styles.formTextarea}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={styles.submitButton}
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
          </form>
        ) : (
          /* Read-only view */
          hasReview ? (
            <p className={styles.adminNote}>{report.adminExplanation}</p>
          ) : (
            <p className={styles.noReviewYet}>No admin review yet.</p>
          )
        )}
      </div>

      {/* Reported Entity — dynamic per type (unchanged) */}
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
    </div>
  );
}