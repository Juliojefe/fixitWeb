'use client';

import { useState, useRef, useEffect } from 'react';
import { FaEllipsisV } from 'react-icons/fa';
import { useUser } from '@/app/providers/UserProvider';
import MustLoginModal from '../MustLoginModal/MustLoginModal';
import { createPortal } from 'react-dom';
import styles from './ReportMenu.module.css';
import ReportModal from '../ReportModal/ReportModal';   // ← NEW

interface ReportMenuProps {
  entityType: 'USER' | 'POST' | 'COMMENT' | 'REVIEW' | 'MESSAGE' | 'MESSAGE_IMAGE' | 'REVIEW_RESPONSE';
  entityId: number;
  className?: string;
  popupPosition?: 'comment-pos' | 'post-pos' | 'post-modal-pos';
}

export default function ReportMenu({
  entityType,
  entityId,
  className = '',
  popupPosition = 'post-pos',
}: ReportMenuProps) {
  const { user } = useUser();
  const [showMenu, setShowMenu] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDotsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu((prev) => !prev);
  };

  const handleReportClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);

    if (!user) {
      setShowLoginModal(true);
      return;
    }

    setShowReportModal(true);
  };

  return (
    <>
      {showLoginModal && createPortal(
        <MustLoginModal
          onClose={() => setShowLoginModal(false)}
          message="You must be logged in to report content."
        />,
        document.body
      )}

      {showReportModal && createPortal(
        <ReportModal
          entityType={entityType}
          entityId={entityId}
          onClose={() => setShowReportModal(false)}
        />,
        document.body
      )}

      <div ref={menuRef} className={`${styles.reportContainer} ${className}`}>
        <button
          onClick={handleDotsClick}
          className={styles.dotsButton}
          aria-label="Report options"
          title="Report"
        >
          <FaEllipsisV />
        </button>

        {showMenu && (
          <div className={`${styles.menuPopup} ${styles[popupPosition]}`}>
            <button onClick={handleReportClick} className={styles.reportOption}>
              Report
            </button>
          </div>
        )}
      </div>
    </>
  );
}