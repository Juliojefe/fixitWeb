'use client'

import { useRouter } from 'next/navigation';
import styles from "./explore.module.css";
import { useUser } from '@/app/providers/UserProvider';
import { DisplayPostType } from '@/types/displayPost';
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import PostList from '@/components/PostList/PostList';

export default function explore() {
  const router = useRouter();
  const { user } = useUser();
  const [postData, setPostData] = useState<DisplayPostType[]>([]);
  const [currPage, setCurrPage] = useState(0);
  const [first, setFirst] = useState(false);
  const [last, setLast] = useState(false);
  const [loading, setLoading] = useState(false);
  const pageSize = 5;
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loaderRef.current) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !loading && !last) {
        fetchPosts();
      }
    });
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [loading, last]);

  async function fetchPosts() {
    if (loading || last) return;
    setLoading(true);
    try {
      if (user) {
        console.log(`Fetching posts for user: ${user.name} on page: ${currPage}`);
        const endpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/explore?page=${currPage}&size=${pageSize}`;
        try {
          const res = await axios.get(endpoint, {
            headers: { Authorization: `Bearer ${user.accessToken}` },
          });
          const page = res.data;
          setFirst(page.first);
          setLast(page.last);
          setCurrPage(page.number + 1);
          setPostData(prev => [...prev, ...page.content]);
        } catch (err) {
          console.error("Failed to fetch posts (authenticated user)", err);
        }
      } else {
        console.log(`Fetching posts for guest on page: ${currPage}`);
        const endpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/explore/guest?page=${currPage}&size=${pageSize}`;
        try {
          const res = await axios.get(endpoint);
          const page = res.data;
          setFirst(page.first);
          setLast(page.last);
          setCurrPage(page.number + 1);
          setPostData(prev => [...prev, ...page.content]);
        } catch (err) {
          console.error("Failed to fetch posts (guest)", err);
        }
      }
    } catch (err) {
      console.error("Unexpected error in fetchPosts", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.postContentContainer}>
        <h2>My Explore Page</h2>
        <PostList postDataArray={postData} />
        {!last && <div ref={loaderRef} />}
      </div>
    </div>
  );
}