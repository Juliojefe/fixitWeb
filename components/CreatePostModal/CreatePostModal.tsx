'use client'

import React, { useEffect, useState } from "react";
import styles from "./CreatePostModal.module.css";
import commonStyles from "../../app/styles/common.module.css";
import axios from 'axios';
import { useUser } from "../../app/providers/UserProvider";
import MustLoginModal from "../MustLoginModal/MustLoginModal";

type CreatePostModalProps = {
  onClose: () => void;
};

export default function CreatePostModal({ onClose }: CreatePostModalProps) {
  const { user } = useUser();
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [description, setDescription] = useState<string>('');
  const [images, setImages] = useState<File[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [successfulUpload, setSuccessfulUpload] = useState(false);

  useEffect(() => {
    if (successfulUpload) {
      const timer = setTimeout(() => onClose(), 2000);
      return () => clearTimeout(timer);
    }
  }, [successfulUpload, onClose]);

  const addTag = () => {
    const trimmed = newTagInput.trim().toLowerCase().replace(/^#/, '');
    if (!trimmed || tags.includes(trimmed)) {
      setNewTagInput('');
      return;
    }
    setTags([...tags, trimmed]);
    setNewTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  //  5 image limit
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? []);

    if (selectedFiles.length > 5) {
      setErrorMessage("You can only upload a maximum of 5 images.");
      setImages([]);
      e.target.value = "";
      return;
    }
    // valid selection (5 or fewer)
    setErrorMessage("");
    setImages(selectedFiles);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");
    if (!description.trim()) {
      setErrorMessage("Description is required");
      return;
    }
    if (images.length > 5) {
      setErrorMessage("You can only upload a maximum of 5 images.");
      setImages([]);                    // clear again just in case
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("description", description.trim());
      formData.append("createdAt", new Date().toISOString());

      images.forEach(img => formData.append("requestImages", img));

      tags.forEach(tag => formData.append("tags", tag));

      const rawResponse = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/post/create/images`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${user?.accessToken}`,
          },
        }
      );

      const data = rawResponse.data;
      setSuccessfulUpload(data.success);
      if (!data.success) {
        setErrorMessage(data.message ?? "Upload failed");
      } else {
        setSuccessMessage(data.message);
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setErrorMessage(err.response.data.message || "Upload failed");
      } else {
        setErrorMessage("Network error");
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      {(user === undefined || user) && (
        <div className={commonStyles.modalBackdrop} onClick={user === undefined ? undefined : onClose}>
          {user === undefined ? (
            <div className={commonStyles.formContainer}>
              <h3 className={styles.loadingUser}>
                Getting things ready<span className={styles.dots}></span>
              </h3>
            </div>
          ) : successfulUpload ? (
            <div className={commonStyles.formContainer}>
              <h2 className={styles.successMessage}>{successMessage}</h2>
            </div>
          ) : (
            <form
              className={commonStyles.formContainer}
              onSubmit={handleSubmit}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className={commonStyles.formHeader}>Create New Post</h2>

              <textarea
                placeholder="What’s on your mind? (max 20000 chars)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={20000}
                disabled={uploading}
                className={styles.textarea}
              />
              <div className={styles.charCount}>
                {description.length} / 20000
              </div>

              <div className={styles.section}>
                <label className={styles.label}>Upload Images (max 5)</label>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  multiple
                  onChange={handleImageSelect}
                  disabled={uploading}
                  className={styles.fileInput}
                />
                {images.length > 0 && (
                  <p className={styles.fileCount}>
                    {images.length} / 5 image(s) selected
                  </p>
                )}
                <small className={styles.supportedFormats}>
                  Supported: JPG, JPEG, PNG, WebP
                </small>
              </div>

              <div className={styles.section}>
                <label className={styles.label}>Add Tags (optional)</label>
                <div className={styles.tagInputRow}>
                  <input
                    type="text"
                    placeholder="e.g. brakes, oilchange"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={uploading}
                    className={styles.tagInput}
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    disabled={!newTagInput.trim() || uploading}
                    className={styles.addTagBtn}
                  >
                    Add
                  </button>
                </div>

                {tags.length > 0 && (
                  <div className={styles.tagsContainer}>
                    {tags.map((tag, index) => (
                      <div key={index} className={styles.tagChip}>
                        #{tag}
                        <span
                          className={styles.removeTag}
                          onClick={() => removeTag(tag)}
                        >
                          ✕
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                className={commonStyles.primaryBtn}
                type="submit"
                disabled={uploading || !description.trim()}
              >
                {uploading ? (
                  <>Uploading<span className={commonStyles.dots}></span></>
                ) : (
                  'Post Now'
                )}
              </button>

              {errorMessage && <p className={commonStyles.error}>{errorMessage}</p>}
            </form>
          )}
        </div>
      )}

      {!user && user !== undefined && <MustLoginModal onClose={onClose} />}
    </>
  );
}