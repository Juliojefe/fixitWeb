'use client'

import { useRouter } from 'next/navigation';
import styles from "./explore.module.css";
import { useUser } from '@/app/providers/UserProvider';
import { DisplayPostType } from '@/types/displayPost';
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import PostList from '@/components/PostList/PostList';
import UserSearchResults from '@/components/UserSearchResults/UserSearchResults';
import TagSuggestions from '@/components/TagSuggestions/TagSuggestions';

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

  // semantic search (posts)
  const [searchPosts, setSearchPosts] = useState<DisplayPostType[]>([]);
  const [searchPostPage, setSearchPostPage] = useState(0);
  const [searchPostLast, setSearchPostLast] = useState(false);
  const [searchPostLoading, setSearchPostLoading] = useState(false);

  // tag suggestions (when query starts with #)
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [tagSuggestionsLoading, setTagSuggestionsLoading] = useState(false);
  const [tagSuggestionsLast, setTagSuggestionsLast] = useState(false);
  const [tagSuggestionsPage, setTagSuggestionsPage] = useState(0);

  // selected tag mode (after user clicks a suggestion)
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [tagPosts, setTagPosts] = useState<DisplayPostType[]>([]);
  const [tagPostPage, setTagPostPage] = useState(0);
  const [tagPostLast, setTagPostLast] = useState(false);
  const [tagPostLoading, setTagPostLoading] = useState(false);

  // people search
  const [searchUsers, setSearchUsers] = useState<UserSearchResult[]>([]);
  const [searchUserPage, setSearchUserPage] = useState(0);
  const [searchUserLast, setSearchUserLast] = useState(false);
  const [searchUserLoading, setSearchUserLoading] = useState(false);
  const [hasSearchedUsers, setHasSearchedUsers] = useState(false);

  const loaderRef = useRef<HTMLDivElement>(null);
  const hasInitialFetched = useRef(false);

  // helper to decide search type
  const isTagSearch = searchQuery.trim().startsWith('#');
  const hasHashAnywhere = searchQuery.includes('#') && !isTagSearch;

  async function fetchWithAuth(endpoint: string, config: any = {}) {
    if (user?.accessToken) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${user.accessToken}`,
      };
    }
    return axios.get(endpoint, config);
  }

  //  explore feed
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
        const uniquePosts = page.content.filter((p: DisplayPostType) => !existingIds.has(p.postId));
        return [...prev, ...uniquePosts];
      });
    } catch (err) {
      console.error("Failed to fetch posts", err);
    } finally {
      setLoading(false);
    }
  }

  //  semantic search
  async function fetchSearchPosts(reset = false) {
    if (!searchQuery.trim() || searchPostLoading) return;
    const pageNum = reset ? 0 : searchPostPage;
    if (!reset && searchPostLast) return;
    setSearchPostLoading(true);
    try {
      const endpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/search/posts/text?query=${encodeURIComponent(searchQuery)}&page=${pageNum}&size=${pageSize}`;
      const res = await fetchWithAuth(endpoint);
      const data = res.data;
      if (reset) setSearchPosts(data.content);
      else {
        const existingIds = new Set(searchPosts.map((p: DisplayPostType) => p.postId));
        const uniquePosts = data.content.filter((p: DisplayPostType) => !existingIds.has(p.postId));
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

  // tag suggestions
  async function fetchTagSuggestions(reset = false) {
    if (!searchQuery.trim() || tagSuggestionsLoading) return;
    const cleanQuery = searchQuery.trim().replace(/^#/, '');
    const pageNum = reset ? 0 : tagSuggestionsPage;
    if (!reset && tagSuggestionsLast) return;

    setTagSuggestionsLoading(true);
    try {
      const endpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/search/tags?query=${encodeURIComponent(cleanQuery)}&page=${pageNum}&size=20`;
      const res = await axios.get(endpoint); // no auth needed
      const data = res.data;

      if (reset) setTagSuggestions(data.content);
      else setTagSuggestions(prev => [...prev, ...data.content]);

      setTagSuggestionsPage(data.number + 1);
      setTagSuggestionsLast(data.last);
    } catch (err) {
      console.error(err);
    } finally {
      setTagSuggestionsLoading(false);
    }
  }

  // posts by selected tag
  async function fetchTagPosts(reset = false) {
    if (!selectedTag || tagPostLoading) return;
    const pageNum = reset ? 0 : tagPostPage;
    if (!reset && tagPostLast) return;
    setTagPostLoading(true);
    try {
      const endpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/search/posts/tag?tag=${encodeURIComponent(selectedTag)}&page=${pageNum}&size=${pageSize}`;
      const res = await fetchWithAuth(endpoint);
      const data = res.data;
      if (reset) setTagPosts(data.content);
      else {
        const existingIds = new Set(tagPosts.map((p: DisplayPostType) => p.postId));
        const uniquePosts = data.content.filter((p: DisplayPostType) => !existingIds.has(p.postId));
        setTagPosts(prev => [...prev, ...uniquePosts]);
      }
      setTagPostPage(data.number + 1);
      setTagPostLast(data.last);
    } catch (err) {
      console.error(err);
    } finally {
      setTagPostLoading(false);
    }
  }

  // people search
  async function fetchSearchUsers(reset = false) {
    if (!searchQuery.trim() || searchUserLoading) return;
    const pageNum = reset ? 0 : searchUserPage;
    if (!reset && searchUserLast) return;
    setSearchUserLoading(true);
    try {
      const endpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/search/users?query=${encodeURIComponent(searchQuery)}&page=${pageNum}&size=${pageSize}`;
      const res = await fetchWithAuth(endpoint);
      const data = res.data;
      if (reset) setSearchUsers(data.content);
      else {
        const existingIds = new Set(searchUsers.map(user => user.userId));
        const uniqueUsers = data.content.filter((user: UserSearchResult) => !existingIds.has(user.userId));
        setSearchUsers(prev => [...prev, ...uniqueUsers]);
      }
      setSearchUserPage(data.number + 1);
      setSearchUserLast(data.last);
    } catch (err) {
      console.error(err);
    } finally {
      setSearchUserLoading(false);
    }
  }

  // handle tag selection from suggestions
  const handleTagSelect = (tag: string) => {
    const cleanTag = tag.startsWith('#') ? tag : `#${tag}`;
    setSelectedTag(cleanTag);
    setSearchPosts([]); // clear any previous results
    setTagPosts([]); // clear previous tag posts
    setTagPostPage(0);
    setTagPostLast(false);
    fetchTagPosts(true); // load first page of posts for this tag
  };

  // clear everything when search is cleared
  const clearSearch = () => {
    setSearchQuery('');
    setSelectedTag(null);
    setSearchPosts([]);
    setTagPosts([]);
    setTagSuggestions([]);
    setSearchUsers([]);
    setSearchUserPage(0);
    setSearchUserLast(false);
    setHasSearchedUsers(false);
    setTagSuggestionsPage(0);
    setTagSuggestionsLast(false);
    setTagPostPage(0);
    setTagPostLast(false);
  };

  // main search handler
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // reset selected tag if user is doing a new search
    setSelectedTag(null);

    if (activeTab === 'posts') {
      if (isTagSearch) {
        setTagSuggestions([]);
        setTagSuggestionsPage(0);
        setTagSuggestionsLast(false);
        fetchTagSuggestions(true);
      } else {
        setSearchPosts([]);
        setSearchPostPage(0);
        setSearchPostLast(false);
        fetchSearchPosts(true);
      }
    } else {
      setHasSearchedUsers(true);
      setSearchUsers([]);
      setSearchUserPage(0);
      setSearchUserLast(false);
      fetchSearchUsers(true);
    }
  };

  // decide what to show in Posts tab
  const getPostContent = () => {
    if (!searchQuery) {
      return <PostList postDataArray={postData} />;
    }

    if (selectedTag) {
      return <PostList postDataArray={tagPosts} />;
    }

    if (isTagSearch) {
      return (
        <TagSuggestions
          suggestions={tagSuggestions}
          loading={tagSuggestionsLoading}
          onTagSelect={handleTagSelect}
        />
      );
    }

    // normal semantic search (or hash in the middle/end)
    return <PostList postDataArray={searchPosts} />;
  };

  // infinite scroll logic
  useEffect(() => {
    if (!loaderRef.current) return;
    const observer = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) return;

      if (activeTab === 'posts') {
        if (selectedTag) {
          if (tagPostLoading || tagPostLast) return;
          fetchTagPosts();
        } else if (searchQuery) {
          if (isTagSearch) {
            if (tagSuggestionsLoading || tagSuggestionsLast) return;
            fetchTagSuggestions();
          } else {
            if (searchPostLoading || searchPostLast) return;
            fetchSearchPosts();
          }
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
    activeTab, searchQuery, selectedTag,
    loading, searchPostLoading, tagPostLoading, tagSuggestionsLoading, searchUserLoading,
    last, searchPostLast, tagPostLast, tagSuggestionsLast, searchUserLast, hasSearchedUsers
  ]);

  // initial explore feed
  useEffect(() => {
    if (activeTab === 'posts' && postData.length === 0 && !searchQuery && !hasInitialFetched.current) {
      hasInitialFetched.current = true;
      fetchPosts();
    }
  }, [activeTab]);

  const showPeopleInitial = activeTab === 'people' && !hasSearchedUsers;
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
            onChange={(e) => {
              const newQuery = e.target.value;
              setSearchQuery(newQuery);
              // if user removes the leading # while in tag mode, exit tag mode
              if (!newQuery.trim().startsWith('#')) {
                setSelectedTag(null);
              }
            }}
            placeholder="Search posts, tags (#mechanic), or people..."
            className={styles.searchInput}
          />
          {searchQuery && (
            <button type="button" onClick={clearSearch} className={styles.clearBtn}>
              ✕
            </button>
          )}
          <button type="submit" className={styles.searchBtn}>
            🔎
          </button>
        </form>

        <div className={styles.tabs}>
          <button onClick={() => setActiveTab('posts')} className={`${styles.tabBtn} ${activeTab === 'posts' ? styles.activeTab : ''}`}>
            Posts
          </button>
          <button onClick={() => setActiveTab('people')} className={`${styles.tabBtn} ${activeTab === 'people' ? styles.activeTab : ''}`}>
            People
          </button>
        </div>
      </div>

      {/* main content */}
      <div className={styles.postContentContainer}>
        {activeTab === 'posts' ? (
          getPostContent()
        ) : showPeopleInitial ? (
          <div className={styles.emptyMessage}>search for people to get started</div>
        ) : showPeopleLoading ? (
          <div className={styles.loader}>loading...</div>
        ) : showPeopleEmpty ? (
          <div className={styles.emptyMessage}>no people found for "{searchQuery}"</div>
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
          (activeTab === 'posts' && 
            (selectedTag 
              ? tagPostLast 
              : searchQuery 
                ? (isTagSearch ? tagSuggestionsLast : searchPostLast) 
                : last)
          ) ||
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