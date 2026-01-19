import React, { ReactNode, useEffect, useState } from "react";
import styles from "./CreatePostModal.module.css";
import axios from 'axios';
import { useRouter } from "next/navigation";
import { useUser } from "../../app/providers/UserProvider";
import MustLoginModal from "../MustLoginModal/MustLoginModal";

type CreatePostModalProps = {
  onClose: () => void;
};

export default function CreatePostModal({ onClose }: CreatePostModalProps) {
  const { user } = useUser();
  const router = useRouter();
  const [errorMessage, setErrorMessage] = React.useState("");
  const [successMessage, setSuccessMessage] = React.useState("");
  const [description, setDescription] = useState<string>('');
  const [images, setImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [successfulUpload, setSuccessfulUpload] = useState(false);

  useEffect(() => {
    if (successfulUpload) {
      const timer = setTimeout(() => {
        onClose();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [successfulUpload, onClose]);


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("description", description);
      formData.append("createdAt", new Date().toISOString());
      for (let i = 0; i < images.length; i++) {
        formData.append("requestImages", images[i]);
      }
      const rawResponse = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/post/create/images`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${user?.accessToken}`,
          },
        }
      );
      const cookedData = rawResponse.data;
      setSuccessfulUpload(cookedData.success);
      if (!cookedData.success) {
        setErrorMessage(cookedData.message ?? "Upload failed");
      } else {
        setSuccessMessage(cookedData.message);
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

  // return (
  //   <div
  //     className={styles.backdrop}
  //     onClick={user === undefined ? undefined : onClose}  // prevent closing modal while it is still loading
  //   >
  //     {user === undefined ? ( //  loading user info case
  //       <div className={styles.modalForm}>
  //         <h3 className={styles.loadingUser}>Getting things ready<span className={styles.dots}></span></h3>
  //       </div>
  //     ) : user ? (
  //       successfulUpload ? (
  //         <div className={styles.modalForm}>
  //           <h2 className={styles.successMessage}>{successMessage}</h2>
  //         </div>
  //       ) : (
  //         <form className={styles.modalForm} onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
  //           <h2 className={styles.formHeader}>Create Post</h2>

  //           <textarea
  //             name="description"
  //             placeholder="Write a description..."
  //             value={description}
  //             onChange={(e) => setDescription(e.target.value)}
  //             required
  //             disabled={uploading}
  //           />

  //           <input
  //             type="file"
  //             name="images"
  //             accept="image/*"
  //             multiple
  //             onChange={(e) => setImages(Array.from(e.target.files ?? []))}
  //             disabled={uploading}
  //           />

  //           <button
  //             className={styles.primaryBtn}
  //             type="submit"
  //             disabled={uploading}
  //           >
  //             {uploading ? (
  //               <>Uploading<span className={styles.dots}></span></>
  //             ) : (
  //               'Upload'
  //             )}
  //           </button>

  //           {errorMessage && (
  //             <p className={styles.error}>{errorMessage}</p>
  //           )}
  //         </form>
  //       )
  //     </div >
  //     ) : ( // guest user case
  //       <MustLoginModal/>
  //     )}
  // );
  return (
    <>
      {/* CREATE POST MODAL */}
      {(user === undefined || user) && (
        <div
          className={styles.backdrop}
          onClick={user === undefined ? undefined : onClose}
        >
          {user === undefined ? (
            <div className={styles.modalForm}>
              <h3 className={styles.loadingUser}>
                Getting things ready<span className={styles.dots}></span>
              </h3>
            </div>
          ) : successfulUpload ? (
            <div className={styles.modalForm}>
              <h2 className={styles.successMessage}>{successMessage}</h2>
            </div>
          ) : (
            <form className={styles.modalForm} onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
              <h2 className={styles.formHeader}>Create Post</h2>

              <textarea
                name="description"
                placeholder="Write a description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                disabled={uploading}
              />

              <input
                type="file"
                name="images"
                accept="image/*"
                multiple
                onChange={(e) => setImages(Array.from(e.target.files ?? []))}
                disabled={uploading}
              />

              <button
                className={styles.primaryBtn}
                type="submit"
                disabled={uploading}
              >
                {uploading ? (
                  <>Uploading<span className={styles.dots}></span></>
                ) : (
                  'Upload'
                )}
              </button>

              {errorMessage && (
                <p className={styles.error}>{errorMessage}</p>
              )}
            </form>
          )}
        </div>
      )}
      {/* GUEST MODAL — SEPARATE */}
      {!user && user !== undefined && (
        <MustLoginModal onClose={onClose} />
      )}
    </>
  );

}
