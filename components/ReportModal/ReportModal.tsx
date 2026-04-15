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
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch all report reasons WITH auth token
  useEffect(() => {
    const fetchReasons = async () => {
      if (!user?.accessToken) {
        setError('You must be logged in to report content.');
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/report/reasons`,
          {
            headers: {
              Authorization: `Bearer ${user.accessToken}`,
            },
          }
        );
        setReasons(res.data);
      } catch (err: any) {
        console.error(err);
        setError(err.response?.data?.message || 'Failed to load report reasons');
      } finally {
        setLoading(false);
      }
    };

    fetchReasons();
  }, [user?.accessToken]);

  const toggleReason = (code: string) => {
    const newSet = new Set(selectedCodes);
    if (newSet.has(code)) {
      newSet.delete(code);
    } else {
      newSet.add(code);
    }
    setSelectedCodes(newSet);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/report`, payload, {
        headers: { Authorization: `Bearer ${user?.accessToken}` },
      });

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
        <h2 className={commonStyles.formHeader}>Report {entityType}</h2>

        {loading ? (
          <p className={styles.loading}>Loading reasons...</p>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Two-column checklist */}
            <div className={styles.checklistGrid}>
              {reasons.map((reason) => (
                <label key={reason.code} className={styles.checklistItem}>
                  <input
                    type="checkbox"
                    checked={selectedCodes.has(reason.code)}
                    onChange={() => toggleReason(reason.code)}
                  />
                  <span>{reason.description}</span>
                </label>
              ))}
            </div>

            {/* Explanation */}
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
              />
            </div>

            {error && <p className={commonStyles.error}>{error}</p>}

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

            <button
              type="button"
              onClick={onClose}
              className={commonStyles.secondaryBtn}
            >
              Cancel
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}