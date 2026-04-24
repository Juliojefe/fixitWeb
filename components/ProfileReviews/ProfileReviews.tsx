'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

import { ReviewItem, ReviewPageResponse, ReviewStats } from '@/types/review';

import styles from './ProfileReviews.module.css';

type ReviewDraft = {
  rating: number;
  content: string;
  existingImageUrlsToKeep: string[];
  newImages: File[];
};

type ProfileReviewsProps = {
  profileUserId: number | null;
  profileName: string;
  apiBase: string;
  authToken: string | null;
  viewerUserId: number | null;
  showSection: boolean;
  canCreateReview: boolean;
  canViewOwnProfile: boolean;
  createDisabledReason?: string | null;
};

const REVIEW_PAGE_SIZE = 10;
const MAX_REVIEW_IMAGES = 5;
const RATING_OPTIONS = [1, 2, 3, 4, 5];

function parseNumber(value: unknown): number | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeStats(data: unknown): ReviewStats {
  const rawStats = Array.isArray(data) ? data : [];
  const statsArray =
    rawStats.length === 1 && Array.isArray(rawStats[0])
      ? rawStats[0]
      : rawStats;
  const average = parseNumber(statsArray[0]);
  const count = parseNumber(statsArray[1]);

  return {
    averageRating: average,
    reviewCount: count == null ? 0 : count,
  };
}

function normalizeReview(item: Partial<ReviewItem>): ReviewItem {
  const currentUsersReview =
    'isCurrentUsersReview' in item
      ? item.isCurrentUsersReview
      : (item as Partial<ReviewItem> & { currentUsersReview?: boolean }).currentUsersReview;

  return {
    reviewId: Number(item.reviewId ?? 0),
    reviewerId: Number(item.reviewerId ?? 0),
    reviewerName: item.reviewerName?.trim?.() || 'Unknown user',
    reviewerProfilePicUrl: item.reviewerProfilePicUrl?.trim?.() || '/images/deletedUserPfp.png',
    mechanicId: Number(item.mechanicId ?? 0),
    rating: parseNumber(item.rating) ?? 0,
    content: item.content ?? '',
    createdAt: item.createdAt ?? new Date().toISOString(),
    updatedAt: item.updatedAt ?? item.createdAt ?? new Date().toISOString(),
    imageUrls: Array.isArray(item.imageUrls) ? item.imageUrls.filter((url): url is string => typeof url === 'string') : [],
    isCurrentUsersReview: Boolean(currentUsersReview),
  };
}

function makeEmptyDraft(): ReviewDraft {
  return {
    rating: 5,
    content: '',
    existingImageUrlsToKeep: [],
    newImages: [],
  };
}

function makeEditDraft(review: ReviewItem): ReviewDraft {
  return {
    rating: review.rating || 5,
    content: review.content || '',
    existingImageUrlsToKeep: [...review.imageUrls],
    newImages: [],
  };
}

function formatReviewStars(rating: number) {
  const filled = Math.max(0, Math.min(5, Math.round(rating)));
  return `${'★'.repeat(filled)}${'☆'.repeat(5 - filled)}`;
}

export default function ProfileReviews({
  profileUserId,
  profileName,
  apiBase,
  authToken,
  viewerUserId,
  showSection,
  canCreateReview,
  canViewOwnProfile,
  createDisabledReason,
}: ProfileReviewsProps) {
  const router = useRouter();

  const [stats, setStats] = useState<ReviewStats>({ averageRating: null, reviewCount: 0 });
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [reviewsPage, setReviewsPage] = useState(0);
  const [reviewsLast, setReviewsLast] = useState(false);
  const [hasLoadedReviews, setHasLoadedReviews] = useState(false);

  const [editorMode, setEditorMode] = useState<'create' | 'edit' | null>(null);
  const [draft, setDraft] = useState<ReviewDraft>(makeEmptyDraft);
  const [draftPreviews, setDraftPreviews] = useState<string[]>([]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const authHeaders = authToken ? { Authorization: `Bearer ${authToken}` } : undefined;
  const currentUserReview = reviews.find((review) => review.isCurrentUsersReview) ?? null;

  useEffect(() => {
    if (canViewOwnProfile) {
      setDetailsOpen(false);
      return;
    }
  }, [canViewOwnProfile]);

  useEffect(() => {
    if (!detailsOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setDetailsOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [detailsOpen]);

  useEffect(() => {
    return () => {
      draftPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [draftPreviews]);

  useEffect(() => {
    draftPreviews.forEach((url) => URL.revokeObjectURL(url));
    setDraftPreviews(draft.newImages.map((file) => URL.createObjectURL(file)));
  }, [draft.newImages]);

  useEffect(() => {
    if (!showSection || profileUserId == null) {
      setStats({ averageRating: null, reviewCount: 0 });
      setStatsError(null);
      setDetailsOpen(false);
      setReviews([]);
      setReviewsError(null);
      setReviewsPage(0);
      setReviewsLast(false);
      setHasLoadedReviews(false);
      setEditorMode(null);
      setDraft(makeEmptyDraft());
      return;
    }

    void loadStats();
  }, [showSection, profileUserId]);

  async function loadStats() {
    if (profileUserId == null) return;

    setStatsLoading(true);
    setStatsError(null);
    try {
      const res = await axios.get(`${apiBase}/api/review/mechanic/${profileUserId}/stats`);
      setStats(normalizeStats(res.data));
    } catch (err: any) {
      console.error(err);
      setStatsError(err?.response?.status ? `Failed to load review stats (${err.response.status}).` : 'Failed to load review stats.');
    } finally {
      setStatsLoading(false);
    }
  }

  async function loadReviews(options?: { reset?: boolean }) {
    if (profileUserId == null) return;

    const reset = options?.reset ?? false;
    if (reviewsLoading) return;
    if (!reset && reviewsLast) return;

    const nextPage = reset ? 0 : reviewsPage;
    setReviewsLoading(true);
    setReviewsError(null);

    try {
      const res = await axios.get<ReviewPageResponse>(`${apiBase}/api/review/mechanic/${profileUserId}`, {
        params: { page: nextPage, size: REVIEW_PAGE_SIZE },
        headers: authHeaders ?? {},
      });

      const nextReviews = Array.isArray(res.data?.content) ? res.data.content.map(normalizeReview) : [];
      setReviews((prev) => {
        if (reset) return nextReviews;
        const existingIds = new Set(prev.map((review) => review.reviewId));
        return [...prev, ...nextReviews.filter((review) => !existingIds.has(review.reviewId))];
      });
      setReviewsPage(nextPage + 1);
      setReviewsLast(Boolean(res.data?.last));
      setHasLoadedReviews(true);
    } catch (err: any) {
      console.error(err);
      setReviewsError(err?.response?.status ? `Failed to load reviews (${err.response.status}).` : 'Failed to load reviews.');
    } finally {
      setReviewsLoading(false);
    }
  }

  async function refreshReviewsAfterMutation() {
    await Promise.all([loadStats(), loadReviews({ reset: true })]);
  }

  async function handleToggleDetails() {
    if (!detailsOpen && !hasLoadedReviews) {
      await loadReviews({ reset: true });
    }
    setDetailsOpen((current) => !current);
  }

  function handleCreateClick() {
    setSubmitError(null);
    setEditorMode('create');
    setDraft(makeEmptyDraft());
  }

  function handleEditClick(review: ReviewItem) {
    setSubmitError(null);
    setEditorMode('edit');
    setDraft(makeEditDraft(review));
  }

  function handleCancelEditor() {
    setEditorMode(null);
    setSubmitError(null);
    setDraft(makeEmptyDraft());
  }

  function handleDraftImagesChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);
    const existingCount = draft.existingImageUrlsToKeep.length;
    const totalCount = existingCount + selectedFiles.length;

    if (totalCount > MAX_REVIEW_IMAGES) {
      setSubmitError(`You can attach up to ${MAX_REVIEW_IMAGES} images to a review.`);
      return;
    }

    setSubmitError(null);
    setDraft((current) => ({ ...current, newImages: selectedFiles }));
  }

  function removeExistingImage(url: string) {
    setDraft((current) => ({
      ...current,
      existingImageUrlsToKeep: current.existingImageUrlsToKeep.filter((imageUrl) => imageUrl !== url),
    }));
  }

  function removeNewImage(index: number) {
    setDraft((current) => ({
      ...current,
      newImages: current.newImages.filter((_, currentIndex) => currentIndex !== index),
    }));
  }

  async function handleSubmitReview() {
    if (!authHeaders || profileUserId == null) return;

    setSubmitLoading(true);
    setSubmitError(null);

    try {
      const formData = new FormData();

      if (editorMode === 'edit' && currentUserReview) {
        formData.append(
          'dto',
          new Blob(
            [
              JSON.stringify({
                reviewId: currentUserReview.reviewId,
                rating: draft.rating,
                content: draft.content,
                existingImageUrlsToKeep: draft.existingImageUrlsToKeep,
              }),
            ],
            { type: 'application/json' }
          )
        );
        draft.newImages.forEach((file) => formData.append('newImages', file));

        await axios.put(`${apiBase}/api/review`, formData, {
          headers: {
            ...authHeaders,
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        formData.append(
          'dto',
          new Blob(
            [
              JSON.stringify({
                mechanicId: profileUserId,
                businessId: null,
                rating: draft.rating,
                content: draft.content,
              }),
            ],
            { type: 'application/json' }
          )
        );
        draft.newImages.forEach((file) => formData.append('images', file));

        await axios.post(`${apiBase}/api/review`, formData, {
          headers: {
            ...authHeaders,
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      setDetailsOpen(true);
      setEditorMode(null);
      setDraft(makeEmptyDraft());
      await refreshReviewsAfterMutation();
    } catch (err: any) {
      console.error(err);
      setSubmitError(err?.response?.data?.message ?? (err?.response?.status ? `Failed (${err.response.status}).` : 'Failed to save review.'));
    } finally {
      setSubmitLoading(false);
    }
  }

  async function handleDeleteReview(reviewId: number) {
    if (!authHeaders || deleteLoading) return;
    if (!window.confirm('Delete your review? This cannot be undone.')) return;

    setDeleteLoading(true);
    setSubmitError(null);

    try {
      await axios.delete(`${apiBase}/api/review`, {
        headers: authHeaders,
        data: { reviewId },
      });
      setEditorMode(null);
      setDraft(makeEmptyDraft());
      await refreshReviewsAfterMutation();
    } catch (err: any) {
      console.error(err);
      setReviewsError(err?.response?.status ? `Failed to delete review (${err.response.status}).` : 'Failed to delete review.');
    } finally {
      setDeleteLoading(false);
    }
  }

  function goToReviewerProfile(reviewerId: number) {
    if (!Number.isFinite(reviewerId)) return;

    if (viewerUserId === reviewerId) {
      router.push('/myProfile');
      return;
    }

    router.push(`/profile/${reviewerId}`);
  }

  if (!showSection || profileUserId == null) {
    return null;
  }

  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <div className={styles.headerText}>
          <h2 className={styles.title}>Customer Reviews</h2>
          <p className={styles.subtitle}>See what people are saying about {profileName}.</p>
        </div>
        {!canViewOwnProfile && (
          <div className={styles.actions}>
            <button className={styles.secondaryButton} type="button" onClick={() => void handleToggleDetails()}>
              {detailsOpen ? 'Hide details' : canCreateReview ? 'More details / create a review' : 'More details'}
            </button>
          </div>
        )}
      </div>

      <div className={styles.summary}>
        {statsLoading ? (
          <p className={styles.hint}>Loading reviews...</p>
        ) : stats.reviewCount === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.summaryStat}>No reviews yet, be the first to share your experience.</p>
          </div>
        ) : (
          <>
            <p className={styles.summaryStat}>
              Average rating:{' '}
              <span className={styles.summaryValue}>
                {(stats.averageRating ?? 0).toFixed(1)}
              </span>{' '}
              stars
            </p>
            <p className={styles.summaryStat}>
              {stats.reviewCount} customer review{stats.reviewCount === 1 ? '' : 's'}{' '}
              <span className={styles.stars}>{formatReviewStars(stats.averageRating ?? 0)}</span>
            </p>
          </>
        )}
        {statsError && <p className={styles.error}>{statsError}</p>}
      </div>

      {!canViewOwnProfile && detailsOpen && (
        <div className={styles.modalOverlay} onMouseDown={() => setDetailsOpen(false)}>
          <div
            className={styles.modalCard}
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="reviews-modal-title"
          >
            <div className={styles.modalHeader}>
              <div>
                <h3 id="reviews-modal-title" className={styles.detailsTitle}>Customer reviews</h3>
                <p className={styles.hint}>See the full review feed and manage your own review here.</p>
              </div>
              <button className={styles.closeButton} type="button" onClick={() => setDetailsOpen(false)} aria-label="Close reviews">
                x
              </button>
            </div>

            <div className={styles.details}>
              <div className={styles.detailsHeader}>
                <div>
                  {!canCreateReview && createDisabledReason && <p className={styles.hint}>{createDisabledReason}</p>}
                  {canViewOwnProfile && <p className={styles.hint}>You can view your customer reviews here.</p>}
                </div>

                <div className={styles.actions}>
                  {!authToken && (
                    <button className={styles.primaryButton} type="button" onClick={() => router.push('/login')}>
                      Sign in to review
                    </button>
                  )}
                  {authToken && canCreateReview && !currentUserReview && editorMode == null && (
                    <button className={styles.primaryButton} type="button" onClick={handleCreateClick}>
                      Create a review
                    </button>
                  )}
                </div>
              </div>

              {editorMode && (
                <div className={styles.formCard}>
                  <h4 className={styles.formTitle}>{editorMode === 'edit' ? 'Edit your review' : 'Share your experience'}</h4>

                  <div>
                    <label className={styles.label}>Rating</label>
                    <div className={styles.starRow}>
                      {RATING_OPTIONS.map((value) => (
                        <button
                          key={value}
                          className={`${styles.starButton} ${draft.rating === value ? styles.starActive : ''}`}
                          type="button"
                          onClick={() => setDraft((current) => ({ ...current, rating: value }))}
                          disabled={submitLoading}
                        >
                          {value} star{value === 1 ? '' : 's'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className={styles.label} htmlFor="review-content">Description</label>
                    <textarea
                      id="review-content"
                      className={styles.textarea}
                      value={draft.content}
                      onChange={(event) => setDraft((current) => ({ ...current, content: event.target.value }))}
                      placeholder="Write about your experience..."
                      disabled={submitLoading}
                    />
                  </div>

                  {draft.existingImageUrlsToKeep.length > 0 && (
                    <div>
                      <span className={styles.label}>Current images</span>
                      <div className={styles.imageGrid}>
                        {draft.existingImageUrlsToKeep.map((url) => (
                          <div key={url} className={styles.imageFrame}>
                            <img className={styles.image} src={url} alt="Current review image" />
                            <button
                              className={styles.imageRemoveButton}
                              type="button"
                              onClick={() => removeExistingImage(url)}
                              disabled={submitLoading}
                              aria-label="Remove image"
                            >
                              x
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className={styles.label} htmlFor="review-images">Add images</label>
                    <input
                      id="review-images"
                      className={styles.fileInput}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleDraftImagesChange}
                      disabled={submitLoading}
                    />
                    <p className={styles.fileHelp}>Up to {MAX_REVIEW_IMAGES} images total.</p>
                  </div>

                  {draftPreviews.length > 0 && (
                    <div>
                      <span className={styles.label}>New image previews</span>
                      <div className={styles.imageGrid}>
                        {draftPreviews.map((url, index) => (
                          <div key={`${url}-${index}`} className={styles.imageFrame}>
                            <img className={styles.image} src={url} alt="Selected review upload" />
                            <button
                              className={styles.imageRemoveButton}
                              type="button"
                              onClick={() => removeNewImage(index)}
                              disabled={submitLoading}
                              aria-label="Remove new image"
                            >
                              x
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {submitError && <p className={styles.error}>{submitError}</p>}

                  <div className={styles.actions}>
                    <button className={styles.ghostButton} type="button" onClick={handleCancelEditor} disabled={submitLoading}>
                      Cancel
                    </button>
                    <button className={styles.primaryButton} type="button" onClick={() => void handleSubmitReview()} disabled={submitLoading}>
                      {submitLoading ? 'Saving...' : editorMode === 'edit' ? 'Save changes' : 'Post review'}
                    </button>
                  </div>
                </div>
              )}

              {reviewsError && <p className={styles.error}>{reviewsError}</p>}

              {reviewsLoading && reviews.length === 0 ? (
                <p className={styles.hint}>Loading reviews...</p>
              ) : reviews.length === 0 ? (
                <p className={styles.hint}>No reviews have been posted yet.</p>
              ) : (
                <div className={styles.list}>
                  {reviews.map((review) => {
                    const wasEdited = review.updatedAt !== review.createdAt;

                    return (
                      <article key={review.reviewId} className={styles.reviewCard}>
                        <div className={styles.reviewHeader}>
                          <button className={styles.reviewerButton} type="button" onClick={() => goToReviewerProfile(review.reviewerId)}>
                            <img
                              className={styles.reviewerAvatar}
                              src={review.reviewerProfilePicUrl || '/images/deletedUserPfp.png'}
                              alt=""
                              onError={(event) => {
                                (event.currentTarget as HTMLImageElement).src = '/images/deletedUserPfp.png';
                              }}
                            />
                            <div className={styles.reviewerMeta}>
                              <div className={styles.reviewerNameRow}>
                                <span className={styles.reviewerName}>{review.reviewerName}</span>
                                {review.isCurrentUsersReview && <span className={styles.ownBadge}>Your review</span>}
                              </div>
                              <div className={styles.reviewMeta}>
                                <span>{formatReviewStars(review.rating)} {review.rating.toFixed(1)}</span>
                                <span>{formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}</span>
                                {wasEdited && <span>Edited</span>}
                              </div>
                            </div>
                          </button>

                          {review.isCurrentUsersReview && canCreateReview && (
                            <div className={styles.actions}>
                              <button className={styles.secondaryButton} type="button" onClick={() => handleEditClick(review)} disabled={deleteLoading}>
                                Edit
                              </button>
                              <button className={styles.dangerButton} type="button" onClick={() => void handleDeleteReview(review.reviewId)} disabled={deleteLoading}>
                                {deleteLoading ? 'Deleting...' : 'Delete'}
                              </button>
                            </div>
                          )}
                        </div>

                        {review.content && <p className={styles.reviewContent}>{review.content}</p>}

                        {review.imageUrls.length > 0 && (
                          <div className={styles.imageGrid}>
                            {review.imageUrls.map((url) => (
                              <img key={url} className={styles.image} src={url} alt="Review upload" />
                            ))}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}

              {!reviewsLast && reviews.length > 0 && (
                <div className={styles.loadMoreRow}>
                  <button className={styles.secondaryButton} type="button" onClick={() => void loadReviews()} disabled={reviewsLoading}>
                    {reviewsLoading ? 'Loading...' : 'Load more'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
