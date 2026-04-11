'use client';

import { useState } from 'react';
import styles from './ChatWindow.module.css';

interface Message {
  id: number;
  content: string;
  isMine: boolean;
  timestamp: string;
  images?: string[]; // up to 3 local preview URLs
}

interface ChatWindowProps {
  selectedChatId: number | null;
  chatName: string; // passed from parent later
}

export default function ChatWindow({ selectedChatId, chatName }: ChatWindowProps) {
  // Sample messages (visual only)
  const [messages] = useState<Message[]>([
    {
      id: 1,
      content: "Hey, did you see the new suspension kit I posted?",
      isMine: false,
      timestamp: "11:42",
      images: ["/images/sample-suspension.jpg"], // replace with real paths later
    },
    {
      id: 2,
      content: "Yeah looks sick! How much was it?",
      isMine: true,
      timestamp: "11:43",
    },
    {
      id: 3,
      content: "Only $650. I can send you the link if you want",
      isMine: false,
      timestamp: "11:44",
      images: ["/images/sample-1.jpg", "/images/sample-2.jpg"],
    },
    {
      id: 4,
      content: "Perfect, send it over 🔥",
      isMine: true,
      timestamp: "11:45",
    },
  ]);

  const [inputValue, setInputValue] = useState('');
  const [previewImages, setPreviewImages] = useState<string[]>([]);

  // Local image preview (up to 3) — no backend call
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files).slice(0, 3 - previewImages.length);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setPreviewImages(prev => [...prev, ev.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePreviewImage = (index: number) => {
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendClick = () => {
    // Visual only — does nothing to backend yet
    if (inputValue.trim() || previewImages.length > 0) {
      console.log('📤 [VISUAL ONLY] Would send:', { text: inputValue, images: previewImages });
      // Clear input (for demo feel)
      setInputValue('');
      setPreviewImages([]);
    }
  };

  if (!selectedChatId) return null;

  return (
    <div className={styles.chatWindow}>
      {/* HEADER */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h3 className={styles.chatTitle}>{chatName || `Chat #${selectedChatId}`}</h3>
          <span className={styles.participants}>2 participants</span>
        </div>
      </div>

      {/* MESSAGES AREA */}
      <div className={styles.messagesContainer}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`${styles.messageRow} ${msg.isMine ? styles.mine : styles.theirs}`}
          >
            <div className={styles.bubble}>
              {msg.content && <p className={styles.messageText}>{msg.content}</p>}
              
              {/* Images in message */}
              {msg.images && msg.images.length > 0 && (
                <div className={styles.imageGrid}>
                  {msg.images.map((img, i) => (
                    <img key={i} src={img} alt={`attachment ${i}`} className={styles.messageImage} />
                  ))}
                </div>
              )}

              <span className={styles.timestamp}>{msg.timestamp}</span>
            </div>
          </div>
        ))}
      </div>

      {/* INPUT BAR */}
      <div className={styles.inputArea}>
        {/* Image previews */}
        {previewImages.length > 0 && (
          <div className={styles.previewStrip}>
            {previewImages.map((src, i) => (
              <div key={i} className={styles.previewItem}>
                <img src={src} alt="preview" />
                <button
                  type="button"
                  onClick={() => removePreviewImage(i)}
                  className={styles.removePreview}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div className={styles.inputRow}>
          <label className={styles.attachBtn}>
            📎
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              style={{ display: 'none' }}
            />
          </label>

          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message..."
            className={styles.messageInput}
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendClick();
              }
            }}
          />

          <button
            onClick={handleSendClick}
            className={styles.sendBtn}
            disabled={!inputValue.trim() && previewImages.length === 0}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
