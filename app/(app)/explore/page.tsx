'use client'

import { useRouter } from 'next/navigation';
import styles from "./explore.module.css";
import { useUser } from '@/app/providers/UserProvider';
import { DisplayPostType } from '@/types/displayPost';
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import PostList from '@/components/PostList/PostList';
import UserSearchResults from '@/components/UserSearchResults/UserSearchResults';

type UserSearchResult = {
  userId: number;
  name: string;
  profilePic?: string;
  isMechanic: boolean;
};

export default function Explore() {
  const router = useRouter();
  const { user } = useUser();

  const [activeTab, setActiveTab] = useState<'explore' | 'posts' | 'people'>('explore');
  const [searchQuery, setSearchQuery] = useState('');

  // Explore feed
  const [explorePosts, setExplorePosts] = useState<DisplayPostType[]>([]);
  const [explorePage, setExplorePage] = useState(0);
  const [exploreLast, setExploreLast] = useState(false);
  const [exploreLoading, setExploreLoading] = useState(false);

  // Search posts
  const [searchPosts, setSearchPosts] = useState<DisplayPostType[]>([]);
  const [searchPostPage, setSearchPostPage] = useState(0);
  const [searchPostLast, setSearchPostLast] = useState(false);
  const [searchPostLoading, setSearchPostLoading] = useState(false);

  // Search users
  const [searchUsers, setSearchUsers] = useState<UserSearchResult[]>([]);
  const [searchUserPage, setSearchUserPage] = useState(0);
  const [searchUserLast, setSearchUserLast] = useState(false);
  const [searchUserLoading, setSearchUserLoading] = useState(false);

  const loaderRef = useRef<HTMLDivElement>(null);
  const pageSize = 8;

  // ==================== FETCH FUNCTIONS ====================
  const fetchExplore = async () => {
    if (exploreLoading || exploreLast) return;
    setExploreLoading(true);

    try {
      const endpoint = user?.accessToken
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/explore?page=${explorePage}&size=${pageSize}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/explore/guest?page=${explorePage}&size=${pageSize}`;

      const res = await axios.get(endpoint, {
        headers: user?.accessToken ? { Authorization: `Bearer ${user.accessToken}` } : {},
      });

      const page = res.data;
      setExplorePosts(prev => [...prev, ...page.content]);
      setExplorePage(page.number + 1);
      setExploreLast(page.last);
    } catch (err) {
      console.error("Explore fetch failed", err);
    } finally {
      setExploreLoading(false);
    }
  };

  const fetchSearchPosts = async (reset = false) => {
    if (!searchQuery.trim()) return;
    const pageNum = reset ? 0 : searchPostPage;
    if (!reset && searchPostLast) return;

    setSearchPostLoading(true);
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/search/posts/text?query=${encodeURIComponent(searchQuery)}&page=${pageNum}&size=${pageSize}`
      );
      const data = res.data;

      if (reset) {
        setSearchPosts(data.content);
      } else {
        // Prevent duplicate postIds
        const existingIds = new Set(searchPosts.map(p => p.postId));
        const newPosts = data.content.filter((p: DisplayPostType) => !existingIds.has(p.postId));
        setSearchPosts(prev => [...prev, ...newPosts]);
      }

      setSearchPostPage(data.number + 1);
      setSearchPostLast(data.last);
    } catch (err) {
      console.error(err);
    } finally {
      setSearchPostLoading(false);
    }
  };

  const fetchSearchUsers = async (reset = false) => {
    if (!searchQuery.trim()) return;
    const pageNum = reset ? 0 : searchUserPage;
    if (!reset && searchUserLast) return;

    setSearchUserLoading(true);
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/search/users?query=${encodeURIComponent(searchQuery)}&page=${pageNum}&size=${pageSize}`
      );
      const data = res.data;

      if (reset) setSearchUsers(data.content);
      else setSearchUsers(prev => [...prev, ...data.content]);

      setSearchUserPage(data.number + 1);
      setSearchUserLast(data.last);
    } catch (err) {
      console.error(err);
    } finally {
      setSearchUserLoading(false);
    }
  };

  // ==================== EFFECTS ====================
  useEffect(() => {
    if (activeTab === 'explore' && explorePosts.length === 0) fetchExplore();
  }, [activeTab]);

  // Clear old results when changing tabs
  useEffect(() => {
    if (activeTab === 'posts') {
      setSearchPosts([]);
      setSearchPostPage(0);
      setSearchPostLast(false);
      if (searchQuery) fetchSearchPosts(true);
    }
    if (activeTab === 'people') {
      setSearchUsers([]);
      setSearchUserPage(0);
      setSearchUserLast(false);
      if (searchQuery) fetchSearchUsers(true);
    }
  }, [activeTab]);

  // Infinite scroll
  useEffect(() => {
    if (!loaderRef.current) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        if (activeTab === 'explore') fetchExplore();
        else if (activeTab === 'posts') fetchSearchPosts();
        else if (activeTab === 'people') fetchSearchUsers();
      }
    });
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [activeTab, exploreLoading, searchPostLoading, searchUserLoading]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    if (activeTab === 'explore') setActiveTab('posts');

    setSearchPosts([]);
    setSearchUsers([]);
    setSearchPostPage(0);
    setSearchUserPage(0);
    setSearchPostLast(false);
    setSearchUserLast(false);

    if (activeTab === 'posts') fetchSearchPosts(true);
    if (activeTab === 'people') fetchSearchUsers(true);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchPosts([]);
    setSearchUsers([]);
  };

  return (
    <div className={styles.container}>
      {/* SEARCH BAR SECTION */}
      <div className={styles.searchSection}>
        <form onSubmit={handleSearch} className={styles.searchBarContainer}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search posts, tags, or people..."
            className={styles.searchInput}
          />
          {searchQuery && (
            <button type="button" onClick={clearSearch} className={styles.clearBtn}>✕</button>
          )}
          <button type="submit" className={styles.searchBtn}>🔎</button>
        </form>

        {/* TABS - now centered */}
        <div className={styles.tabs}>
          <button
            onClick={() => setActiveTab('explore')}
            className={`${styles.tabBtn} ${activeTab === 'explore' ? styles.activeTab : ''}`}
          >
            Explore
          </button>
          <button
            onClick={() => setActiveTab('posts')}
            className={`${styles.tabBtn} ${activeTab === 'posts' ? styles.activeTab : ''}`}
          >
            Posts
          </button>
          <button
            onClick={() => setActiveTab('people')}
            className={`${styles.tabBtn} ${activeTab === 'people' ? styles.activeTab : ''}`}
          >
            People
          </button>
        </div>
      </div>

      {/* MAIN SCROLLABLE COLUMN */}
      <div className={styles.postContentContainer}>
        {activeTab === 'explore' ? (
          <>
            <h2 className={styles.header}>My Explore Page</h2>
            <PostList postDataArray={explorePosts} />
          </>
        ) : activeTab === 'posts' ? (
          <PostList postDataArray={searchPosts} />
        ) : (
          <UserSearchResults
            users={searchUsers}
            onUserClick={(id) => router.push(`/profile/${id}`)}
            onLoadMore={() => fetchSearchUsers()}
            hasMore={!searchUserLast}
            loading={searchUserLoading}
          />
        )}

        {/* Loader for infinite scroll */}
        {!((activeTab === 'explore' && exploreLast) ||
           (activeTab === 'posts' && searchPostLast) ||
           (activeTab === 'people' && searchUserLast)) && (
          <div ref={loaderRef} className={styles.loader}>Loading more...</div>
        )}
      </div>
    </div>
  );
}