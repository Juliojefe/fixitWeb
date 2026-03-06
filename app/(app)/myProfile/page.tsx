'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

import styles from './myProfile.module.css';
import { useUser } from '../../providers/UserProvider';

import CreatePostModal from '@/components/CreatePostModal/CreatePostModal';
import PostList from '@/components/PostList/PostList';

type TabKey = 'posts' | 'liked' | 'saved';

type ProfilePublic = {
    name?: string;
    profilePicUrl?: string;
    profilePic?: string;

    followerIds?: number[];
    followingIds?: number[];

    ownedPostIds?: number[];
    likedPostIds?: number[];

    followerCount?: number;
    followingCount?: number;

    isAdmin?: boolean;
    admin?: boolean;
    isMechanic?: boolean;
    mechanic?: boolean;

    biography?: string;
};

type ProfilePrivate = ProfilePublic & {
    savedPostIds?: number[];
    chatIds?: number[];
};

type UserNameAndPfp = {
    userId: number;
    name: string;
    profilePic: string;
};

type DisplayPost = {
    postId: number;
    authorId: number | null;
    createdBy: string | null;
    createdByProfilePicUrl: string | null;
    authorIsMechanic: boolean;
    description: string;
    createdAt: string;
    likeCount: number;
    imageUrls: string[];

    hasLiked: boolean;
    hasSaved: boolean;
    followingAuthor: boolean;
};

function safeNumberArray(v: unknown): number[] {
    if (!Array.isArray(v)) return [];
    return v.map((x) => Number(x)).filter((n) => Number.isFinite(n)) as number[];
}

export default function MyProfilePage() {
    const router = useRouter();
    const { user, setUser } = useUser() as any;

    const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';
    const userId = user?.userId ?? null;

    const authHeaders = useMemo(() => {
        const token = user?.accessToken;
        return token ? { Authorization: `Bearer ${token}` } : undefined;
    }, [user?.accessToken]);

    // Profile state
    const [profile, setProfile] = useState<ProfilePrivate | ProfilePublic | null>(null);
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileError, setProfileError] = useState<string | null>(null);

    // Tabs
    const [activeTab, setActiveTab] = useState<TabKey>('posts');

    // Posts per tab
    const [ownedPosts, setOwnedPosts] = useState<DisplayPost[]>([]);
    const [likedPosts, setLikedPosts] = useState<DisplayPost[]>([]);
    const [savedPosts, setSavedPosts] = useState<DisplayPost[]>([]);
    const [tabLoading, setTabLoading] = useState(false);
    const [tabError, setTabError] = useState<string | null>(null);

    // Followers/following lists
    const [followers, setFollowers] = useState<UserNameAndPfp[]>([]);
    const [following, setFollowing] = useState<UserNameAndPfp[]>([]);
    const [followLoading, setFollowLoading] = useState(false);

    // Show more/less followers/following
    const [followersExpanded, setFollowersExpanded] = useState(false);
    const [followingExpanded, setFollowingExpanded] = useState(false);

    // Create post modal
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Edit bio modal
    const [showEditBio, setShowEditBio] = useState(false);
    const [bioDraft, setBioDraft] = useState('');
    const [bioSaving, setBioSaving] = useState(false);
    const [bioError, setBioError] = useState<string | null>(null);

    // Edit photo modal
    const [showEditPhoto, setShowEditPhoto] = useState(false);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoSaving, setPhotoSaving] = useState(false);
    const [photoError, setPhotoError] = useState<string | null>(null);
    const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);

    // Small caches so we don't refetch the same things repeatedly
    const postCacheRef = useRef<Map<number, DisplayPost>>(new Map());
    const userMiniCacheRef = useRef<Map<number, UserNameAndPfp>>(new Map());

    const effectiveName = (profile as any)?.name ?? user?.name ?? 'Your profile';

    const effectiveBio =
        (profile as any)?.biography?.trim?.() ||
        user?.biography?.trim?.() ||
        '';

    const effectivePfp =
        (profile as any)?.profilePicUrl?.trim?.() ||
        (profile as any)?.profilePic?.trim?.() ||
        user?.profilePic?.trim?.() ||
        user?.profilePicUrl?.trim?.() ||
        '/images/deletedUserPfp.png';

    const isAdmin = Boolean((profile as any)?.isAdmin ?? (profile as any)?.admin ?? user?.isAdmin ?? false);
    const isMechanic = Boolean((profile as any)?.isMechanic ?? (profile as any)?.mechanic ?? user?.isMechanic ?? false);

    const followerIds = useMemo(() => safeNumberArray((profile as any)?.followerIds), [profile]);
    const followingIds = useMemo(() => safeNumberArray((profile as any)?.followingIds), [profile]);
    const ownedIds = useMemo(() => safeNumberArray((profile as any)?.ownedPostIds), [profile]);
    const likedIds = useMemo(() => safeNumberArray((profile as any)?.likedPostIds), [profile]);
    const savedIds = useMemo(() => safeNumberArray((profile as any)?.savedPostIds), [profile]);

    // Use backend counts if present otherwise use list lengths
    const followerCount = (profile as any)?.followerCount ?? followerIds.length;
    const followingCount = (profile as any)?.followingCount ?? followingIds.length;

    const MAX_POSTS_PER_TAB = 25;
    const MINI_LIST_LIMIT = 10;

    // Loads private profile first then falls back to public profile if needed
    async function fetchProfile(uid: number) {
        setProfileLoading(true);
        setProfileError(null);

        try {
            const res = await axios.get(`${API_BASE}/api/user/${uid}/profile/private`, {
                headers: authHeaders ?? {},
            });
            setProfile(res.data);
            return;
        } catch (err: any) {
            const status = err?.response?.status;

            if (status === 401 || status === 403) {
                try {
                    const pub = await axios.get(`${API_BASE}/api/user/${uid}/profile/public`);
                    setProfile(pub.data);
                    setProfileError('Private profile requires auth; showing public profile for now.');
                    return;
                } catch (e: any) {
                    setProfile(null);
                    setProfileError(`Profile load failed (${e?.response?.status ?? 'unknown'}).`);
                    return;
                }
            }

            console.error(err);
            setProfile(null);
            setProfileError(status ? `Profile load failed (${status}).` : 'Profile load failed.');
        } finally {
            setProfileLoading(false);
        }
    }

    // small user card for follower/following lists
    async function fetchUserMini(uid: number): Promise<UserNameAndPfp> {
        const cached = userMiniCacheRef.current.get(uid);
        if (cached) return cached;

        try {
            const res = await axios.get(`${API_BASE}/api/user/${uid}/name-and-pfp`);
            const cooked: UserNameAndPfp = {
                userId: uid,
                name: res.data?.name ?? `User ${uid}`,
                profilePic: res.data?.profilePic || '/images/deletedUserPfp.png',
            };
            userMiniCacheRef.current.set(uid, cooked);
            return cooked;
        } catch {
            const fallback: UserNameAndPfp = {
                userId: uid,
                name: `User ${uid}`,
                profilePic: '/images/deletedUserPfp.png',
            };
            userMiniCacheRef.current.set(uid, fallback);
            return fallback;
        }
    }

    async function loadMiniLists(expandFollowers: boolean, expandFollowing: boolean) {
        if (!profile) return;

        setFollowLoading(true);
        try {
            const followerSlice = expandFollowers ? followerIds : followerIds.slice(0, MINI_LIST_LIMIT);
            const followingSlice = expandFollowing ? followingIds : followingIds.slice(0, MINI_LIST_LIMIT);

            const [followerMinis, followingMinis] = await Promise.all([
                Promise.all(followerSlice.map((id) => fetchUserMini(id))),
                Promise.all(followingSlice.map((id) => fetchUserMini(id))),
            ]);

            setFollowers(followerMinis);
            setFollowing(followingMinis);
        } finally {
            setFollowLoading(false);
        }
    }

    // Placeholder post
    function makePostPlaceholder(postId: number, flags: { liked?: boolean; saved?: boolean }): DisplayPost {
        return {
            postId,
            authorId: null,
            createdBy: 'Unknown',
            createdByProfilePicUrl: '/images/deletedUserPfp.png',
            authorIsMechanic: false,
            description: 'Post details could not be loaded yet.',
            createdAt: new Date().toISOString(),
            likeCount: 0,
            imageUrls: [],
            hasLiked: Boolean(flags.liked),
            hasSaved: Boolean(flags.saved),
            followingAuthor: false,
        };
    }

    // Fetches post and caches it
    async function fetchPostSummary(postId: number): Promise<DisplayPost> {
        const cached = postCacheRef.current.get(postId);
        if (cached) return cached;

        try {
            const res = await axios.get(`${API_BASE}/api/post/${postId}`, {
                headers: authHeaders ?? {},
            });
            const cooked = res.data as DisplayPost;
            postCacheRef.current.set(postId, cooked);
            return cooked;
        } catch {
            return makePostPlaceholder(postId, {});
        }
    }

    async function loadPostsForTab(tab: TabKey) {
        if (!profile) return;

        setTabLoading(true);
        setTabError(null);

        try {
            const ids = tab === 'posts' ? ownedIds : tab === 'liked' ? likedIds : savedIds;
            const unique = Array.from(new Set(ids)).slice(0, MAX_POSTS_PER_TAB);

            const results = await Promise.all(
                unique.map(async (id) => {
                    const post = await fetchPostSummary(id);
                    const isPlaceholder =
                        typeof post?.description === 'string' &&
                        post.description.includes('could not be loaded');

                    if (isPlaceholder) {
                        return makePostPlaceholder(id, { liked: tab === 'liked', saved: tab === 'saved' });
                    }
                    return post;
                })
            );

            results.sort((a, b) => (Date.parse(b.createdAt || '') || 0) - (Date.parse(a.createdAt || '') || 0));

            if (tab === 'posts') setOwnedPosts(results);
            if (tab === 'liked') setLikedPosts(results);
            if (tab === 'saved') setSavedPosts(results);
        } catch (err) {
            console.error(err);
            setTabError('Failed to load posts for this tab.');
        } finally {
            setTabLoading(false);
        }
    }

    // Saves bio to backend and updates local state
    async function saveBio() {
        if (!userId) return;
        setBioSaving(true);
        setBioError(null);
        try {
            await axios.patch(
                `${API_BASE}/api/user/update-bio`,
                { userId, newBio: bioDraft },
                { headers: authHeaders ?? {} }
            );

            if (user && setUser) {
                setUser({ ...user, biography: bioDraft });
            }

            setShowEditBio(false);
            fetchProfile(userId);
        } catch (err: any) {
            console.error(err);
            setBioError(err?.response?.status ? `Failed (${err.response.status})` : 'Failed to update bio.');
        } finally {
            setBioSaving(false);
        }
    }

    // Uploads profile picture to backend
    async function saveProfilePicUpload() {
        if (!userId) return;

        setPhotoSaving(true);
        setPhotoError(null);

        if (!photoFile) {
            setPhotoError('Please choose an image file.');
            setPhotoSaving(false);
            return;
        }

        try {
            const formData = new FormData();
            formData.append('userId', String(userId));
            formData.append('file', photoFile);

            const res = await axios.post(
                `${API_BASE}/api/user/update-profile-pic/upload`,
                formData,
                {
                    headers: {
                        ...(authHeaders ?? {}),
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            const newUrl: string = res.data;

            if (user && setUser) {
                setUser({ ...user, profilePic: newUrl });
            }

            setProfile((prev: any) => prev ? ({ ...prev, profilePic: newUrl, profilePicUrl: newUrl }) : prev);

            postCacheRef.current.clear();
            setShowEditPhoto(false);

            if (photoPreviewUrl) {
                URL.revokeObjectURL(photoPreviewUrl);
                setPhotoPreviewUrl(null);
            }
            setPhotoFile(null);

            fetchProfile(userId);
            loadPostsForTab(activeTab);
        } catch (err: any) {
            console.error(err);
            setPhotoError(err?.response?.status ? `Upload failed (${err.response.status})` : 'Upload failed.');
        } finally {
            setPhotoSaving(false);
        }
    }

    // Load profile when the user is available
    useEffect(() => {
        if (!userId) return;
        fetchProfile(userId);
    }, [userId]);

    // Load follower/following mini lists
    useEffect(() => {
        if (!profile) return;
        loadMiniLists(followersExpanded, followingExpanded);
    }, [profile, followersExpanded, followingExpanded]);

    // Load posts when tab changes
    useEffect(() => {
        if (!profile) return;
        loadPostsForTab(activeTab);
    }, [activeTab, profile]);

    // Fill the bio draft when opening the modal
    useEffect(() => {
        if (showEditBio) {
            setBioDraft(effectiveBio);
            setBioError(null);
        }
    }, [showEditBio]);

    // Reset photo upload state when opening photo modal
    useEffect(() => {
        if (showEditPhoto) {
            setPhotoError(null);
            setPhotoFile(null);
            if (photoPreviewUrl) {
                URL.revokeObjectURL(photoPreviewUrl);
                setPhotoPreviewUrl(null);
            }
        }
    }, [showEditPhoto]);

    const currentPosts = activeTab === 'posts' ? ownedPosts : activeTab === 'liked' ? likedPosts : savedPosts;

    const currentPostsWithUpdatedPfp = useMemo(() => {
        if (!userId) return currentPosts;
        return currentPosts.map((p) => {
            if (p?.authorId === userId) {
                return { ...p, createdByProfilePicUrl: effectivePfp };
            }
            return p;
        });
    }, [currentPosts, userId, effectivePfp]);

    if (!user) {
        return (
            <div className={styles.container}>
                <div className={styles.page}>
                    <div className={styles.card}>
                        <h2 className={styles.h2}>My Profile</h2>
                        <p className={styles.muted}>You need to log in to view your profile.</p>
                        <button className={styles.primaryBtn} onClick={() => router.push('/login')}>
                            Go to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.page}>
                <div className={styles.shell}>
                    <section className={`${styles.headerCard} ${styles.sectionOutline}`}>
                        <div className={styles.cover} />
                        <div className={styles.headerBody}>
                            <img
                                className={styles.avatar}
                                src={effectivePfp}
                                alt="Profile picture"
                                onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src = '/images/deletedUserPfp.png';
                                }}
                            />

                            <div className={styles.headerText}>
                                <div className={styles.nameRow}>
                                    <h1 className={styles.name}>{effectiveName}</h1>
                                    <div className={styles.badges}>
                                        {isAdmin && <span className={styles.badge}>Admin 👑</span>}
                                        {isMechanic && <span className={styles.badge}>Mechanic 🔧</span>}
                                    </div>
                                </div>

                                <p className={styles.headline}>
                                    {effectiveBio || 'Add a short bio to make your profile stand out.'}
                                </p>

                                <div className={styles.statsRow}>
                                    <div className={styles.stat}>
                                        <span className={styles.statNumber}>{followerCount}</span>
                                        <span className={styles.statLabel}>Followers</span>
                                    </div>
                                    <div className={styles.stat}>
                                        <span className={styles.statNumber}>{followingCount}</span>
                                        <span className={styles.statLabel}>Following</span>
                                    </div>
                                </div>

                                <div className={styles.headerActions}>
                                    <button className={styles.secondaryBtn} onClick={() => setShowEditBio(true)} type="button">
                                        Edit bio
                                    </button>

                                    <button className={styles.secondaryBtn} onClick={() => setShowEditPhoto(true)} type="button">
                                        Change photo
                                    </button>
                                </div>

                                {profileLoading && <p className={styles.muted}>Loading profile…</p>}
                                {profileError && <p className={styles.error}>{profileError}</p>}
                            </div>
                        </div>
                    </section>

                    <div className={styles.grid}>
                        <section className={styles.mainCol}>
                            <div className={`${styles.composerCard} ${styles.sectionOutline}`}>
                                <img
                                    className={styles.composerAvatar}
                                    src={effectivePfp}
                                    alt="Your avatar"
                                    onError={(e) => {
                                        (e.currentTarget as HTMLImageElement).src = '/images/deletedUserPfp.png';
                                    }}
                                />
                                <button className={styles.composerButton} onClick={() => setShowCreateModal(true)} type="button">
                                    Start a post…
                                </button>
                            </div>

                            <div className={`${styles.tabsCard} ${styles.sectionOutline}`}>
                                <button className={`${styles.tabBtn} ${activeTab === 'posts' ? styles.tabActive : ''}`} onClick={() => setActiveTab('posts')} type="button">
                                    Posts <span className={styles.tabCount}>{ownedIds.length}</span>
                                </button>
                                <button className={`${styles.tabBtn} ${activeTab === 'liked' ? styles.tabActive : ''}`} onClick={() => setActiveTab('liked')} type="button">
                                    Liked <span className={styles.tabCount}>{likedIds.length}</span>
                                </button>
                                <button className={`${styles.tabBtn} ${activeTab === 'saved' ? styles.tabActive : ''}`} onClick={() => setActiveTab('saved')} type="button">
                                    Saved <span className={styles.tabCount}>{savedIds.length}</span>
                                </button>
                            </div>

                            <div className={`${styles.feedCard} ${styles.sectionOutline}`}>
                                {tabLoading && <p className={styles.muted}>Loading {activeTab}…</p>}
                                {tabError && <p className={styles.error}>{tabError}</p>}

                                {!tabLoading && !tabError && currentPostsWithUpdatedPfp.length === 0 && (
                                    <div className={styles.emptyState}>
                                        <p className={styles.emptyTitle}>Nothing here yet</p>
                                        <p className={styles.muted}>
                                            {activeTab === 'posts' && 'Create your first post to show it here.'}
                                            {activeTab === 'liked' && 'Posts you like will show up here.'}
                                            {activeTab === 'saved' && 'Posts you save will show up here.'}
                                        </p>
                                    </div>
                                )}

                                <PostList postDataArray={currentPostsWithUpdatedPfp as any} />
                            </div>
                        </section>

                        <aside className={styles.sideCol}>
                            <div className={`${styles.sideCard} ${styles.sectionOutline}`}>
                                <div className={styles.sideHeader}>
                                    <h3 className={styles.h3}>Followers</h3>
                                    <span className={styles.sideCount}>{followerCount}</span>
                                </div>

                                {followLoading && <p className={styles.muted}>Loading…</p>}
                                {!followLoading && followers.length === 0 && <p className={styles.muted}>No followers to show.</p>}

                                <div className={styles.userList}>
                                    {followers.map((u) => (
                                        <div key={u.userId} className={styles.userRow}>
                                            <img
                                                className={styles.userAvatar}
                                                src={u.profilePic || '/images/deletedUserPfp.png'}
                                                alt=""
                                                onError={(e) => {
                                                    (e.currentTarget as HTMLImageElement).src = '/images/deletedUserPfp.png';
                                                }}
                                            />
                                            <span className={styles.userName}>{u.name}</span>
                                        </div>
                                    ))}
                                </div>

                                {followerIds.length > 10 && (
                                    <button className={styles.linkBtn} type="button" onClick={() => setFollowersExpanded((v) => !v)}>
                                        {followersExpanded ? 'Show less' : 'Show all'}
                                    </button>
                                )}
                            </div>

                            <div className={`${styles.sideCard} ${styles.sectionOutline}`}>
                                <div className={styles.sideHeader}>
                                    <h3 className={styles.h3}>Following</h3>
                                    <span className={styles.sideCount}>{followingCount}</span>
                                </div>

                                {followLoading && <p className={styles.muted}>Loading…</p>}
                                {!followLoading && following.length === 0 && <p className={styles.muted}>Not following anyone yet.</p>}

                                <div className={styles.userList}>
                                    {following.map((u) => (
                                        <div key={u.userId} className={styles.userRow}>
                                            <img
                                                className={styles.userAvatar}
                                                src={u.profilePic || '/images/deletedUserPfp.png'}
                                                alt=""
                                                onError={(e) => {
                                                    (e.currentTarget as HTMLImageElement).src = '/images/deletedUserPfp.png';
                                                }}
                                            />
                                            <span className={styles.userName}>{u.name}</span>
                                        </div>
                                    ))}
                                </div>

                                {followingIds.length > 10 && (
                                    <button className={styles.linkBtn} type="button" onClick={() => setFollowingExpanded((v) => !v)}>
                                        {followingExpanded ? 'Show less' : 'Show all'}
                                    </button>
                                )}
                            </div>
                        </aside>
                    </div>
                </div>
            </div>

            {/* Create Post */}
            {showCreateModal && (
                <CreatePostModal
                    onClose={() => {
                        setShowCreateModal(false);
                        if (userId) fetchProfile(userId);
                    }}
                />
            )}

            {/* Edit Bio Modal */}
            {showEditBio && (
                <div className={styles.modalOverlay} onMouseDown={() => setShowEditBio(false)}>
                    <div className={styles.modalCard} onMouseDown={(e) => e.stopPropagation()}>
                        <div className={styles.modalTitle}>Edit bio</div>
                        <textarea
                            className={styles.textarea}
                            value={bioDraft}
                            onChange={(e) => setBioDraft(e.target.value)}
                            rows={5}
                            placeholder="Write something about yourself…"
                        />
                        {bioError && <div className={styles.error}>{bioError}</div>}
                        <div className={styles.modalActions}>
                            <button className={styles.secondaryBtn} onClick={() => setShowEditBio(false)} disabled={bioSaving}>
                                Cancel
                            </button>
                            <button className={styles.primaryBtn} onClick={saveBio} disabled={bioSaving}>
                                {bioSaving ? 'Saving…' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit pfp Modal */}
            {showEditPhoto && (
                <div className={styles.modalOverlay} onMouseDown={() => setShowEditPhoto(false)}>
                    <div className={styles.modalCard} onMouseDown={(e) => e.stopPropagation()}>
                        <div className={styles.modalTitle}>Change profile picture</div>

                        <input
                            className={styles.input}
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                const f = e.target.files?.[0] ?? null;
                                setPhotoFile(f);
                                setPhotoError(null);

                                if (photoPreviewUrl) {
                                    URL.revokeObjectURL(photoPreviewUrl);
                                    setPhotoPreviewUrl(null);
                                }

                                if (f) {
                                    const preview = URL.createObjectURL(f);
                                    setPhotoPreviewUrl(preview);
                                }
                            }}
                        />

                        {photoPreviewUrl && (
                            <div style={{ marginTop: 10 }}>
                                <img
                                    src={photoPreviewUrl}
                                    alt="Preview"
                                    style={{ width: 96, height: 96, borderRadius: 999, objectFit: 'cover', border: '1px solid rgba(0,0,0,0.12)' }}
                                />
                            </div>
                        )}

                        {photoError && <div className={styles.error}>{photoError}</div>}

                        <div className={styles.modalActions}>
                            <button className={styles.secondaryBtn} onClick={() => setShowEditPhoto(false)} disabled={photoSaving}>
                                Cancel
                            </button>
                            <button className={styles.primaryBtn} onClick={saveProfilePicUpload} disabled={photoSaving}>
                                {photoSaving ? 'Uploading…' : 'Upload'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}