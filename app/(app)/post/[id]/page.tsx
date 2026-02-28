"use client";

import { useParams } from "next/navigation";
import { DisplayPostType } from "@/types/displayPost";
import Post from "@/components/Post/Post";
import { useUser } from "@/app/providers/UserProvider";
import axios from "axios";
import { useEffect, useState } from "react";
import styles from "./postId.module.css";

export default function PostPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { user } = useUser();

  const [postData, setPostData] = useState<DisplayPostType | null>(null);
  const [loadingPost, setLoadingPost] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(id)) return;

    let cancelled = false;

    async function fetchPost() {
      setLoadingPost(true);
      setError(null);
      const endpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/post/${id}`;
      let config = {}
      if (user?.accessToken) {
        config = {
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
          },
        };
      }
      try {
        const res = await axios.get<DisplayPostType>(endpoint, config);
        if (!cancelled) setPostData(res.data);
      } catch (err) {
        console.error(err);
        if (!cancelled) setError("Failed to load post.");
      } finally {
        if (!cancelled) setLoadingPost(false);
      }
    }

    fetchPost();

    return () => {
      cancelled = true; // prevents state updates after unmount / id change
    };
  }, [id, user?.accessToken]);

  if (loadingPost) return (
    <div className={styles.container}>
      <h2 className={styles.header}>Loading…</h2>
    </div>
  );

  if (error) return (
    <div className={styles.container}>
      <h2 className={styles.error}>{error}</h2>
    </div>
  );

  if (!postData) return (
    <div className={styles.container}>
      <h2 className={styles.header}>No post found.</h2>
    </div>
  );

  return (
    <div className={styles.container}>
      <Post postData={postData} />
    </div>
  );
}