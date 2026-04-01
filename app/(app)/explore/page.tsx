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
  mechanic: boolean;
  following: boolean;
};

export default function Explore() {
  const router = useRouter();
  const { user } = useUser();

  const [activeTab, setActiveTab] = useState<'posts' | 'people'>('posts');
  const [searchQuery, setSearchQuery] = useState('');

  // explore feed
  const [postData, setPostData] = useState<DisplayPostType[]>([]);
  const [currPage, setCurrPage] = useState(0);
  const [last, setLast] = useState(false);
  const [loading, setLoading] = useState(false);
  const pageSize = 5;

  // search results (posts)
  const [searchPosts, setSearchPosts] = useState<DisplayPostType[]>([]);
  const [searchPostPage, setSearchPostPage] = useState(0);
  const [searchPostLast, setSearchPostLast] = useState(false);
  const [searchPostLoading, setSearchPostLoading] = useState(false);

  // search results (people)
  const [searchUsers, setSearchUsers] = useState<UserSearchResult[]>([]);
  const [searchUserPage, setSearchUserPage] = useState(0);
  const [searchUserLast, setSearchUserLast] = useState(false);
  const [searchUserLoading, setSearchUserLoading] = useState(false);
  const [hasSearchedUsers, setHasSearchedUsers] = useState(false);

  const loaderRef = useRef<HTMLDivElement>(null);
  const hasInitialFetched = useRef(false);

  async function fetchWithAuth(endpoint: string, config: any = {}) {
    if (user?.accessToken) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${user.accessToken}`,
      };
    }
    return axios.get(endpoint, config);
  }

  async function fetchPosts() {
    if (loading || last) return;
    setLoading(true);
    try {
      let endpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/explore?page=${currPage}&size=${pageSize}`;
      if (!user?.accessToken) {
        endpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/explore/guest?page=${currPage}&size=${pageSize}`;
      }
      const res = await fetchWithAuth(endpoint);
      const page = res.data;
      setLast(page.last);
      setCurrPage(page.number + 1);
      setPostData(prev => {
        const existingIds = new Set(prev.map((p: DisplayPostType) => p.postId));
        const uniquePosts = page.content.filter(
          (p: DisplayPostType) => !existingIds.has(p.postId)
        );
        return [...prev, ...uniquePosts];
      });
    } catch (err) {
      console.error("Failed to fetch posts", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSearchPosts(reset = false) {
    if (!searchQuery.trim() || searchPostLoading) return;
    const pageNum = reset ? 0 : searchPostPage;
    if (!reset && searchPostLast) return;
    setSearchPostLoading(true);
    try {
      const endpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/search/posts/text?query=${encodeURIComponent(searchQuery)}&page=${pageNum}&size=${pageSize}`;
      const res = await fetchWithAuth(endpoint);
      const data = res.data;
      if (reset) {
        setSearchPosts(data.content);
      } else {
        const existingIds = new Set(searchPosts.map((p: DisplayPostType) => p.postId));
        const uniquePosts = data.content.filter(
          (p: DisplayPostType) => !existingIds.has(p.postId)
        );
        setSearchPosts(prev => [...prev, ...uniquePosts]);
      }
      setSearchPostPage(data.number + 1);
      setSearchPostLast(data.last);
    } catch (err) {
      console.error(err);
    } finally {
      setSearchPostLoading(false);
    }
  }

  async function fetchSearchUsers(reset = false) {
    if (!searchQuery.trim() || searchUserLoading) return;
    const pageNum = reset ? 0 : searchUserPage;
    if (!reset && searchUserLast) return;
    setSearchUserLoading(true);
    try {
      const endpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/search/users?query=${encodeURIComponent(searchQuery)}&page=${pageNum}&size=${pageSize}`;
      const res = await fetchWithAuth(endpoint);
      const data = res.data;
      if (reset) {
        setSearchUsers(data.content);
      } else {
        setSearchUsers(prev => {
          const existingIds = new Set(prev.map(user => user.userId));
          const uniqueUsers = data.content.filter(
            (user: UserSearchResult) => !existingIds.has(user.userId)
          );
          return [...prev, ...uniqueUsers];
        });
      }
      setSearchUserPage(data.number + 1);
      setSearchUserLast(data.last);
    } catch (err) {
      console.error(err);
    } finally {
      setSearchUserLoading(false);
    }
  }

  // initial load
  useEffect(() => {
    if (
      activeTab === 'posts' &&
      postData.length === 0 &&
      !searchQuery &&
      !hasInitialFetched.current
    ) {
      hasInitialFetched.current = true;
      fetchPosts();
    }
  }, [activeTab]);

  // infinite scroll
  useEffect(() => {
    if (!loaderRef.current) return;
    const observer = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) return;
      if (activeTab === 'posts') {
        if (searchQuery) {
          if (searchPostLoading || searchPostLast) return;
          fetchSearchPosts();
        } else {
          if (loading || last) return;
          fetchPosts();
        }
      } else if (activeTab === 'people') {
        if (!hasSearchedUsers) return;
        if (searchUserLoading || searchUserLast) return;
        fetchSearchUsers();
      }
    });

    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [
    activeTab,
    searchQuery,
    loading,
    searchPostLoading,
    searchUserLoading,
    last,
    searchPostLast,
    searchUserLast,
    hasSearchedUsers
  ]);

  // handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    if (activeTab === 'posts') {
      setSearchPosts([]);
      setSearchPostPage(0);
      setSearchPostLast(false);
      fetchSearchPosts(true);
    } else {
      setHasSearchedUsers(true);
      setSearchUsers([]);
      setSearchUserPage(0);
      setSearchUserLast(false);
      fetchSearchUsers(true);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchPosts([]);
    setSearchUsers([]);
    setSearchUserPage(0);
    setSearchUserLast(false);
    setHasSearchedUsers(false);
  };
  // people ui states
  const showPeopleInitial =
    activeTab === 'people' && !hasSearchedUsers;

  const showPeopleLoading =
    activeTab === 'people' &&
    hasSearchedUsers &&
    searchUserLoading &&
    searchUsers.length === 0;

  const showPeopleEmpty =
    activeTab === 'people' &&
    hasSearchedUsers &&
    !searchUserLoading &&
    searchUsers.length === 0;

  const showPeopleLoadMore =
    activeTab === 'people' &&
    hasSearchedUsers &&
    searchUsers.length > 0 &&
    !searchUserLast;

  return (
    <div className={styles.container}>
      {/* search bar */}
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
            <button
              type="button"
              onClick={clearSearch}
              className={styles.clearBtn}
            >
              ✕
            </button>
          )}
          <button type="submit" className={styles.searchBtn}>
            🔎
          </button>
        </form>

        <div className={styles.tabs}>
          <button
            onClick={() => setActiveTab('posts')}
            className={`${styles.tabBtn} ${
              activeTab === 'posts' ? styles.activeTab : ''
            }`}
          >
            Posts
          </button>
          <button
            onClick={() => setActiveTab('people')}
            className={`${styles.tabBtn} ${
              activeTab === 'people' ? styles.activeTab : ''
            }`}
          >
            People
          </button>
        </div>
      </div>

      {/* main content */}
      <div className={styles.postContentContainer}>
        {activeTab === 'posts' ? (
          searchQuery ? (
            <PostList postDataArray={searchPosts} />
          ) : (
            <PostList postDataArray={postData} />
          )
        ) : showPeopleInitial ? (
          <div className={styles.emptyMessage}>
            search for people to get started
          </div>
        ) : showPeopleLoading ? (
          <div className={styles.loader}>
            loading...
          </div>
        ) : showPeopleEmpty ? (
          <div className={styles.emptyMessage}>
            no people found for "{searchQuery}"
          </div>
        ) : (
          <UserSearchResults
            users={searchUsers}
            onLoadMore={() => fetchSearchUsers()}
            hasMore={!searchUserLast}
            loading={searchUserLoading}
          />
        )}

        {/* loader */}
        {!(
          (activeTab === 'posts' && (searchQuery ? searchPostLast : last)) ||
          (activeTab === 'people' && !showPeopleLoadMore)
        ) && (
          <div ref={loaderRef} className={styles.loader}>
            Loading...
          </div>
        )}
      </div>
    </div>
  );
}