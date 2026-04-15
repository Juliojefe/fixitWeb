'use client';

import { useState, useRef, useEffect } from 'react';
import { FaEllipsisV } from 'react-icons/fa';
import { useUser } from '@/app/providers/UserProvider';
import MustLoginModal from '../MustLoginModal/MustLoginModal';
import { createPortal } from 'react-dom';
import styles from './ReportMenu.module.css';

interface ReportMenuProps {
  /** Must match one of the allowed entity_type values from the DB */
  entityType: 'USER' | 'POST' | 'COMMENT' | 'REVIEW' | 'MESSAGE' | 'MESSAGE_IMAGE' | 'REVIEW_RESPONSE';
  /** The primary key of the entity being reported */
  entityId: number;
  /** Optional extra class for positioning (e.g. absolute top-right) */
  className?: string;
  /** Callback that will open the real Report modal (we'll build it next) */
  onReportClick?: (entityType: string, entityId: number) => void;
}

export default function ReportMenu({
  entityType,
  entityId,
  className = '',
  onReportClick,
}: ReportMenuProps) {
  const { user } = useUser();
  const [showMenu, setShowMenu] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
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
    e.stopPropagation(); // important – prevents opening post modal, chat actions, etc.
    setShowMenu((prev) => !prev);
  };

  const handleReportClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);

    if (!user) {
      setShowLoginModal(true);
      return;
    }

    // This is the hook for the future ReportModal
    // For now it just logs – we'll replace the console with the modal open later
    console.log(`[ReportMenu] User wants to report ${entityType} #${entityId}`);
    onReportClick?.(entityType, entityId);
  };

  return (
    <>
      {/* Login modal for guests */}
      {showLoginModal &&
        createPortal(
          <MustLoginModal
            onClose={() => setShowLoginModal(false)}
            message="You must be logged in to report content."
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
          <div className={styles.dropdown}>
            <button
              onClick={handleReportClick}
              className={styles.reportOption}
            >
              Report
            </button>
          </div>
        )}
      </div>
    </>
  );
}