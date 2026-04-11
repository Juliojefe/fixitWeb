'use client';

import { useState } from 'react';
import styles from './MessageBubble.module.css';

interface MessageBubbleProps {
  message: {
    messageId?: number | string;
    content: string;
    userId: number;
    senderName?: string;
    createdAt: string;
    imageUrls: string[];
    failed?: boolean;
    tempId?: string;
  };
  isMine: boolean;
  onRetry?: () => void;
}

export default function MessageBubble({ message, isMine, onRetry }: MessageBubbleProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const hasImages = message.imageUrls && message.imageUrls.length > 0;
  const largeImage = hasImages ? message.imageUrls[currentIndex] : null;

  const nextImage = () => setCurrentIndex((prev) => (prev + 1) % message.imageUrls.length);
  const prevImage = () => setCurrentIndex((prev) => (prev - 1 + message.imageUrls.length) % message.imageUrls.length);

  return (
    <div className={`${styles.messageRow} ${isMine ? styles.mine : styles.theirs}`}>
      <div className={styles.bubble}>
        {!isMine && message.senderName && (
          <div className={styles.senderName}>{message.senderName}</div>
        )}

        {message.content && <p className={styles.messageText}>{message.content}</p>}

        {hasImages && (
          <div className={styles.imageContainer}>
            <img
              src={largeImage!}
              alt="large attachment"
              className={styles.enlargedImage}
            />

            {message.imageUrls.length > 1 && (
              <>
                <button className={styles.navLeft} onClick={prevImage}>‹</button>
                <button className={styles.navRight} onClick={nextImage}>›</button>
              </>
            )}

            {message.imageUrls.length > 1 && (
              <div className={styles.thumbnailStrip}>
                {message.imageUrls.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`thumb ${i}`}
                    className={`${styles.smallThumbnail} ${i === currentIndex ? styles.activeThumb : ''}`}
                    onClick={() => setCurrentIndex(i)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <span className={styles.timestamp}>
          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>

        {/* Failed indicator */}
        {message.failed && onRetry && (
          <div
            className={styles.failedIndicator}
            title="Message failed to send. Click to try again."
            onClick={onRetry}
          >
            ⚠
          </div>
        )}
      </div>
    </div>
  );
}