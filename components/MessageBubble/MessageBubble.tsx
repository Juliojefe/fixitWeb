'use client';

import { useState } from 'react';
import styles from './MessageBubble.module.css';

interface MessageBubbleProps {
  message: {
    messageId: number;
    content: string;
    userId: number;
    createdAt: string;
    imageUrls: string[];
  };
  isMine: boolean;
}

export default function MessageBubble({ message, isMine }: MessageBubbleProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const hasImages = message.imageUrls && message.imageUrls.length > 0;
  const largeImage = hasImages ? message.imageUrls[currentIndex] : null;

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % message.imageUrls.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + message.imageUrls.length) % message.imageUrls.length);
  };

  return (
    <div className={`${styles.messageRow} ${isMine ? styles.mine : styles.theirs}`}>
      <div className={styles.bubble}>
        {message.content && <p className={styles.messageText}>{message.content}</p>}

        {hasImages && (
          <div className={styles.imageContainer}>
            {/* Large image (always shown by default) */}
            <img
              src={largeImage!}
              alt="large attachment"
              className={styles.enlargedImage}
            />

            {/* Navigation arrows when there are multiple images */}
            {message.imageUrls.length > 1 && (
              <>
                <button className={styles.navBtn} onClick={prevImage}>‹</button>
                <button className={styles.navBtn} onClick={nextImage}>›</button>
              </>
            )}

            {/* Small thumbnails below */}
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
      </div>
    </div>
  );
}