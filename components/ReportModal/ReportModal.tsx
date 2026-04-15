'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '@/app/providers/UserProvider';
import { createPortal } from 'react-dom';
import styles from './ReportModal.module.css';
import commonStyles from '../../app/styles/common.module.css';

interface ReportModalProps {
  entityType: string;
  entityId: number;
  onClose: () => void;
}

export default function ReportModal({ entityType, entityId, onClose }: ReportModalProps) {
  const { user } = useUser();

  const [reasons, setReasons] = useState<{ code: string; description: string }[]>([]);
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());
  const [explanation, setExplanation] = useState('');
  const [existingReportId, setExistingReportId] = useState<number | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  // 1. Fetch all reasons + check if user already reported this entity
  useEffect(() => {
    const loadData = async () => {
      if (!user?.accessToken) {
        setError('You must be logged in to report content.');
        setLoading(false);
        return;
      }

      try {
        // Fetch reasons
        const reasonsRes = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/report/reasons`,
          { headers: { Authorization: `Bearer ${user.accessToken}` } }
        );
        setReasons(reasonsRes.data);

        // Check if user already has a report for this entity
        const reportRes = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/report/entity/${entityType}/${entityId}`,
          { headers: { Authorization: `Bearer ${user.accessToken}` } }
        );

        if (reportRes.data) {
          const report = reportRes.data;
          setExistingReportId(report.reportId);

          // Pre-fill form
          setSelectedCodes(new Set(report.reasons.map((r: any) => r.code)));
          setExplanation(report.explanation || '');

          // Check if editable
          if (report.status !== 'PENDING') {
            setIsReadOnly(true);
            setStatusMessage('Review underway — you can no longer edit this report.');
          }
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          // No existing report → new report (normal flow)
        } else {
          console.error(err);
          setError('Failed to load report data');
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.accessToken, entityType, entityId]);

  const toggleReason = (code: string) => {
    if (isReadOnly) return;
    const newSet = new Set(selectedCodes);
    if (newSet.has(code)) newSet.delete(code);
    else newSet.add(code);
    setSelectedCodes(newSet);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (selectedCodes.size === 0) {
      setError('Please select at least one reason');
      return;
    }
    if (!explanation.trim()) {
      setError('Please add an explanation');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        entityType,
        entityId,
        reasonCodes: Array.from(selectedCodes),
        explanation: explanation.trim(),
      };

      if (existingReportId) {
        // Update existing report
        await axios.put(
          `${process.env.NEXT_PUBLIC_API_URL}/api/report/${existingReportId}`,
          payload,
          { headers: { Authorization: `Bearer ${user?.accessToken}` } }
        );
      } else {
        // Create new report
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/report`,
          payload,
          { headers: { Authorization: `Bearer ${user?.accessToken}` } }
        );
      }

      alert('Report submitted successfully!');
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className={commonStyles.modalBackdrop} onClick={onClose}>
      <div
        className={commonStyles.formContainer}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px', width: '100%' }}
      >
        <h2 className={commonStyles.formHeader}>Submit a Report</h2>

        {statusMessage && <p className={styles.statusMessage}>{statusMessage}</p>}

        {loading ? (
          <p className={styles.loading}>Loading...</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className={styles.checklistGrid}>
              {reasons.map((reason) => (
                <label key={reason.code} className={styles.checklistItem}>
                  <input
                    type="checkbox"
                    checked={selectedCodes.has(reason.code)}
                    onChange={() => toggleReason(reason.code)}
                    disabled={isReadOnly}
                  />
                  <span>{reason.description}</span>
                </label>
              ))}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Explanation <span className={styles.required}>*</span>
              </label>
              <textarea
                className={styles.input}
                rows={4}
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Please explain why you are reporting this..."
                required
                disabled={isReadOnly}
              />
            </div>

            {error && <p className={commonStyles.error}>{error}</p>}

            {!isReadOnly && (
              <button
                type="submit"
                className={commonStyles.primaryBtn}
                disabled={submitting}
              >
                {submitting ? (
                  <>Submitting<span className={commonStyles.dots}></span></>
                ) : (
                  'Submit Report'
                )}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className={commonStyles.secondaryBtn}
            >
              Close
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}