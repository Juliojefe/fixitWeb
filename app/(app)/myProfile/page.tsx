'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

import styles from './myProfile.module.css';
import { useUser } from '../../providers/UserProvider';

import CreatePostModal from '@/components/CreatePostModal/CreatePostModal';
import PostList from '@/components/PostList/PostList';

L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        (markerIcon2x as unknown as { src: string }).src ??
        (markerIcon2x as unknown as string),
    iconUrl:
        (markerIcon as unknown as { src: string }).src ??
        (markerIcon as unknown as string),
    shadowUrl:
        (markerShadow as unknown as { src: string }).src ??
        (markerShadow as unknown as string),
});

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
    businessAddress?: string;
    businessLat?: number;
    businessLon?: number;
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

type LocationIQPlace = {
    place_id?: string | number;
    display_name?: string;
    lat?: string;
    lon?: string;
};

type SavedBusinessLocation = {
    address: string;
    lat: number;
    lon: number;
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

function toNumber(v: unknown): number | null {
    if (typeof v !== 'string' && typeof v !== 'number') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
}

function normalizeBusinessLocation(source: ProfilePrivate | ProfilePublic | null): SavedBusinessLocation | null {
    const address = (source as any)?.businessAddress?.trim?.() ?? '';
    const lat = toNumber((source as any)?.businessLat);
    const lon = toNumber((source as any)?.businessLon);

    if (!address || lat == null || lon == null) {
        return null;
    }

    return { address, lat, lon };
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
    const [showEditAddress, setShowEditAddress] = useState(false);

    // Business map card
    const [businessAddressInput, setBusinessAddressInput] = useState('');
    const [businessLocation, setBusinessLocation] = useState<SavedBusinessLocation | null>(null);
    const [businessSuggestions, setBusinessSuggestions] = useState<LocationIQPlace[]>([]);
    const [businessSuggestionsOpen, setBusinessSuggestionsOpen] = useState(false);
    const [businessMapLoading, setBusinessMapLoading] = useState(false);
    const [businessLocationSaving, setBusinessLocationSaving] = useState(false);
    const [businessMapError, setBusinessMapError] = useState<string | null>(null);
    const [businessDraftLocation, setBusinessDraftLocation] = useState<SavedBusinessLocation | null>(null);
    const [businessMapCenter, setBusinessMapCenter] = useState<[number, number]>([36.6777, -121.6555]);
    const [businessMarker, setBusinessMarker] = useState<{ lat: number; lon: number; label: string } | null>(null);
    const businessSearchAbortRef = useRef<AbortController | null>(null);
    const businessAutocompleteAbortRef = useRef<AbortController | null>(null);
    const businessAutocompleteDebounceRef = useRef<number | null>(null);
    const businessSearchBlockRef = useRef<HTMLDivElement | null>(null);
    const businessMapRef = useRef<any>(null);

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
    const canManageBusinessLocation = isAdmin || isMechanic;

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

    function syncBusinessLocationState(nextLocation: SavedBusinessLocation | null) {
        setBusinessLocation(nextLocation);

        if (!nextLocation) {
            setBusinessMapCenter([36.6777, -121.6555]);
            setBusinessMarker(null);
            return;
        }

        setBusinessMapCenter([nextLocation.lat, nextLocation.lon]);
        setBusinessMarker({ lat: nextLocation.lat, lon: nextLocation.lon, label: nextLocation.address });
    }

    function selectBusinessPlace(place: LocationIQPlace) {
        const lat = toNumber(place.lat);
        const lon = toNumber(place.lon);
        const address = place.display_name?.trim() ?? '';

        if (lat == null || lon == null || !address) {
            setBusinessMapError('That result is missing map coordinates.');
            return;
        }

        const nextLocation: SavedBusinessLocation = { address, lat, lon };
        setBusinessDraftLocation(nextLocation);
        setBusinessAddressInput(address);
        setBusinessSuggestions([]);
        setBusinessSuggestionsOpen(false);
        setBusinessMapError(null);
    }

    async function fetchBusinessAutocomplete(q: string) {
        if (!API_BASE || q.trim().length < 2) return;

        businessAutocompleteAbortRef.current?.abort();
        const controller = new AbortController();
        businessAutocompleteAbortRef.current = controller;

        try {
            const res = await fetch(`${API_BASE}/api/geocode/autocomplete?q=${encodeURIComponent(q)}&limit=5`, {
                signal: controller.signal,
                credentials: 'include',
            });

            if (!res.ok) {
                throw new Error(`Autocomplete failed with ${res.status}`);
            }

            const data = (await res.json()) as LocationIQPlace[];
            const nextSuggestions = Array.isArray(data) ? data : [];
            setBusinessSuggestions(nextSuggestions);
            setBusinessSuggestionsOpen(nextSuggestions.length > 0);
        } catch (err: any) {
            if (err?.name === 'AbortError') return;
            console.error(err);
            setBusinessSuggestions([]);
            setBusinessSuggestionsOpen(false);
        }
    }

    async function searchBusinessLocation(q: string) {
        if (!API_BASE) {
            setBusinessMapError('Map search is not configured.');
            return;
        }

        setBusinessMapLoading(true);
        setBusinessMapError(null);
        businessSearchAbortRef.current?.abort();
        const controller = new AbortController();
        businessSearchAbortRef.current = controller;

        try {
            const res = await fetch(`${API_BASE}/api/geocode/search?q=${encodeURIComponent(q)}&limit=1`, {
                signal: controller.signal,
                credentials: 'include',
            });

            if (!res.ok) {
                const text = await res.text().catch(() => '');
                throw new Error(`Search failed: ${res.status} ${text}`);
            }

            const data = (await res.json()) as LocationIQPlace[];
            const first = Array.isArray(data) ? data[0] : null;

            if (!first) {
                setBusinessMapError('No matching address was found.');
                return;
            }

            selectBusinessPlace(first);
        } catch (err: any) {
            if (err?.name === 'AbortError') return;
            console.error(err);
            setBusinessMapError('Unable to load that address right now.');
        } finally {
            setBusinessMapLoading(false);
        }
    }

    async function saveBusinessLocation() {
        if (!user?.accessToken) return;

        setBusinessLocationSaving(true);
        setBusinessMapError(null);

        const payload = businessDraftLocation
            ? {
                address: businessDraftLocation.address,
                lat: businessDraftLocation.lat,
                lon: businessDraftLocation.lon,
            }
            : {
                address: null,
                lat: null,
                lon: null,
            };

        try {
            await axios.patch(`${API_BASE}/api/user/business-location`, payload, {
                headers: authHeaders ?? {},
            });

            syncBusinessLocationState(businessDraftLocation);
            setProfile((prev: any) => prev ? ({
                ...prev,
                businessAddress: businessDraftLocation?.address ?? null,
                businessLat: businessDraftLocation?.lat ?? null,
                businessLon: businessDraftLocation?.lon ?? null,
            }) : prev);
            setShowEditAddress(false);
            setBusinessSuggestionsOpen(false);
        } catch (err: any) {
            console.error(err);
            setBusinessMapError(
                err?.response?.status
                    ? `Failed to save address (${err.response.status})`
                    : 'Failed to save address.'
            );
        } finally {
            setBusinessLocationSaving(false);
        }
    }

    function clearBusinessLocationDraft() {
        setBusinessDraftLocation(null);
        setBusinessAddressInput('');
        setBusinessSuggestions([]);
        setBusinessSuggestionsOpen(false);
        setBusinessMapError(null);
    }

    function openBusinessLocationInGoogleMaps() {
        if (!businessLocation) return;

        const destination = `${businessLocation.lat},${businessLocation.lon}`;
        const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`;
        window.open(url, '_blank', 'noopener,noreferrer');
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
            void fetchProfile(userId);
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
        void fetchProfile(userId);
    }, [userId]);

    useEffect(() => {
        syncBusinessLocationState(normalizeBusinessLocation(profile));
    }, [profile]);

    // Load follower/following mini lists
    useEffect(() => {
        if (!profile) return;
        void loadMiniLists(followersExpanded, followingExpanded);
    }, [profile, followersExpanded, followingExpanded]);

    // Load posts when tab changes
    useEffect(() => {
        if (!profile) return;
        void loadPostsForTab(activeTab);
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

    useEffect(() => {
        if (showEditAddress) {
            setBusinessAddressInput(businessLocation?.address ?? '');
            setBusinessDraftLocation(businessLocation);
            setBusinessMapError(null);
            setBusinessSuggestions([]);
            setBusinessSuggestionsOpen(false);
        }
    }, [showEditAddress, businessLocation]);

    useEffect(() => {
        const q = businessAddressInput.trim();

        if (!showEditAddress || !canManageBusinessLocation || q.length < 2) {
            businessAutocompleteAbortRef.current?.abort();
            setBusinessSuggestions([]);
            setBusinessSuggestionsOpen(false);
            return;
        }

        if (businessAutocompleteDebounceRef.current) {
            window.clearTimeout(businessAutocompleteDebounceRef.current);
        }

        businessAutocompleteDebounceRef.current = window.setTimeout(() => {
            void fetchBusinessAutocomplete(q);
        }, 250);

        return () => {
            if (businessAutocompleteDebounceRef.current) {
                window.clearTimeout(businessAutocompleteDebounceRef.current);
            }
        };
    }, [businessAddressInput, canManageBusinessLocation, showEditAddress]);

    useEffect(() => {
        function onDocumentMouseDown(e: MouseEvent) {
            const block = businessSearchBlockRef.current;
            if (!block) return;
            if (e.target instanceof Node && !block.contains(e.target)) {
                setBusinessSuggestionsOpen(false);
            }
        }

        document.addEventListener('mousedown', onDocumentMouseDown);
        return () => document.removeEventListener('mousedown', onDocumentMouseDown);
    }, []);

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
                                {false && canManageBusinessLocation && (
                                    <section className={styles.businessMapSection}>
                                        <div className={styles.businessMapHeader}>
                                            <div>
                                                <h3 className={styles.h3}>Business location</h3>
                                                <p className={styles.muted}>
                                                    Add your shop address to preview it on the map here.
                                                </p>
                                            </div>
                                        </div>

                                        <div ref={businessSearchBlockRef} className={styles.businessSearchBlock}>
                                            <form
                                                className={styles.businessSearchRow}
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    const q = businessAddressInput.trim();
                                                    if (!q) return;
                                                    setBusinessSuggestionsOpen(false);
                                                    void searchBusinessLocation(q);
                                                }}
                                            >
                                                <input
                                                    className={styles.input}
                                                    type="text"
                                                    value={businessAddressInput}
                                                    onChange={(e) => {
                                                        setBusinessAddressInput(e.target.value);
                                                        setBusinessMapError(null);
                                                    }}
                                                    onFocus={() => {
                                                        if (businessSuggestions.length > 0) {
                                                            setBusinessSuggestionsOpen(true);
                                                        }
                                                    }}
                                                    placeholder="Enter the business address"
                                                    aria-label="Business address"
                                                    autoComplete="off"
                                                />
                                                <button
                                                    className={styles.primaryBtn}
                                                    type="submit"
                                                    disabled={!businessAddressInput.trim() || businessMapLoading}
                                                >
                                                    {businessMapLoading ? 'Searching...' : 'Show map'}
                                                </button>
                                                {(businessDraftLocation || businessLocation) && (
                                                    <button className={styles.secondaryBtn} type="button" onClick={clearBusinessLocationDraft}>
                                                        Clear
                                                    </button>
                                                )}
                                            </form>

                                            {businessSuggestionsOpen && businessSuggestions.length > 0 && (
                                                <div className={styles.businessSuggestions} role="listbox">
                                                    {businessSuggestions.map((suggestion, idx) => (
                                                        <button
                                                            key={`${suggestion.place_id ?? 'na'}-${suggestion.lat ?? 'na'}-${suggestion.lon ?? 'na'}-${idx}`}
                                                            className={styles.businessSuggestionItem}
                                                            type="button"
                                                            onClick={() => selectBusinessPlace(suggestion)}
                                                        >
                                                            {suggestion.display_name}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {businessMapError && <p className={styles.error}>{businessMapError}</p>}

                                        {businessLocation ? (
                                            <div className={styles.businessMapCard}>
                                                <div className={styles.businessMapMeta}>
                                                    <span className={styles.businessMapLabel}>Current address</span>
                                                    <p className={styles.businessMapAddress}>{businessLocation?.address ?? ''}</p>
                                                </div>
                                                <div className={styles.businessMapWrapper}>
                                                    <MapContainer
                                                        center={businessMapCenter}
                                                        zoom={16}
                                                        scrollWheelZoom={false}
                                                        dragging={false}
                                                        doubleClickZoom={false}
                                                        touchZoom={false}
                                                        boxZoom={false}
                                                        keyboard={false}
                                                        zoomControl={false}
                                                        attributionControl={false}
                                                        className={styles.businessMap}
                                                        ref={businessMapRef}
                                                    >
                                                        <TileLayer
                                                            attribution="&copy; OpenStreetMap contributors"
                                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                        />

                                                        {businessMarker && (
                                                            <Marker position={[businessMarker!.lat, businessMarker!.lon]}>
                                                                <Popup>{businessMarker!.label}</Popup>
                                                            </Marker>
                                                        )}
                                                    </MapContainer>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className={styles.businessMapEmpty}>
                                                <p className={styles.emptyTitle}>No business address yet</p>
                                                <p className={styles.muted}>
                                                    Search for the address above and we&apos;ll pin it here on the interactive map.
                                                </p>
                                            </div>
                                        )}
                                    </section>
                                )}

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
                            {canManageBusinessLocation && (
                                <div className={`${styles.sideCard} ${styles.sectionOutline} ${styles.businessLocationCard}`}>
                                    <section className={styles.businessMapSection}>
                                        <div className={styles.businessMapCard}>
                                            {businessLocation ? (
                                                <>
                                                    <span className={styles.businessMapLabel}>Business Location</span>
                                                    <p className={styles.businessMapAddress}>{businessLocation.address}</p>
                                                    <div
                                                        className={styles.businessMapWrapper}
                                                        onClick={openBusinessLocationInGoogleMaps}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' || e.key === ' ') {
                                                                e.preventDefault();
                                                                openBusinessLocationInGoogleMaps();
                                                            }
                                                        }}
                                                        role="link"
                                                        tabIndex={0}
                                                        aria-label="Open this address in Google Maps"
                                                    >
                                                        <MapContainer
                                                            center={businessMapCenter}
                                                            zoom={16}
                                                            scrollWheelZoom={false}
                                                            dragging={false}
                                                            doubleClickZoom={false}
                                                            touchZoom={false}
                                                            boxZoom={false}
                                                            keyboard={false}
                                                            zoomControl={false}
                                                            attributionControl={false}
                                                            className={styles.businessMap}
                                                            ref={businessMapRef}
                                                        >
                                                            <TileLayer
                                                                attribution="&copy; OpenStreetMap contributors"
                                                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                            />

                                                            {businessMarker && (
                                                                <Marker position={[businessMarker.lat, businessMarker.lon]}>
                                                                    <Popup>{businessMarker.label}</Popup>
                                                                </Marker>
                                                            )}
                                                        </MapContainer>

                                                        <div className={styles.mapNavigateBadge}>
                                                            Get Directions
                                                        </div>

                                                        <button
                                                            className={styles.mapSettingsButton}
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setShowEditAddress(true);
                                                            }}
                                                            aria-label="Edit address"
                                                        >
                                                            ⚙️
                                                        </button>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className={styles.businessMapEmpty}>
                                                    <span className={styles.businessMapLabel}>Add your business location</span>
                                                    <p className={styles.businessMapAddress}>
                                                        Help people find your shop faster by adding the address you want shown on your profile.
                                                    </p>
                                                    <p className={styles.businessMapHint}>
                                                        Your pinned location will appear here once you save it.
                                                    </p>
                                                    <button className={styles.emptyAddressButton} type="button" onClick={() => setShowEditAddress(true)}>
                                                        Add business address
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </section>
                                </div>
                            )}

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
                        if (userId) void fetchProfile(userId);
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

            {showEditAddress && (
                <div
                    className={styles.modalOverlay}
                    onMouseDown={() => {
                        setShowEditAddress(false);
                        setBusinessSuggestionsOpen(false);
                    }}
                >
                    <div className={styles.modalCard} onMouseDown={(e) => e.stopPropagation()}>
                        <div className={styles.modalTitle}>Edit address</div>
                        <p className={styles.muted}>Search for a shop address, then select a result and save it to your profile.</p>

                        <div ref={businessSearchBlockRef} className={styles.businessSearchBlock}>
                            <form
                                className={styles.businessSearchRow}
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    const q = businessAddressInput.trim();
                                    if (!q) return;
                                    setBusinessSuggestionsOpen(false);
                                    void searchBusinessLocation(q);
                                }}
                            >
                                <input
                                    className={styles.input}
                                    type="text"
                                    value={businessAddressInput}
                                    onChange={(e) => {
                                        setBusinessAddressInput(e.target.value);
                                        setBusinessMapError(null);
                                    }}
                                    onFocus={() => {
                                        if (businessSuggestions.length > 0) {
                                            setBusinessSuggestionsOpen(true);
                                        }
                                    }}
                                    placeholder="Enter the business address"
                                    aria-label="Business address"
                                    autoComplete="off"
                                />
                            </form>

                            {businessSuggestionsOpen && businessSuggestions.length > 0 && (
                                <div className={styles.businessSuggestions} role="listbox">
                                    {businessSuggestions.map((suggestion, idx) => (
                                        <button
                                            key={`${suggestion.place_id ?? 'na'}-${suggestion.lat ?? 'na'}-${suggestion.lon ?? 'na'}-${idx}`}
                                            className={styles.businessSuggestionItem}
                                            type="button"
                                            onClick={() => selectBusinessPlace(suggestion)}
                                        >
                                            {suggestion.display_name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {businessMapError && <div className={styles.error}>{businessMapError}</div>}

                        <div className={styles.modalActionsSplit}>
                            <div className={styles.modalActionsLeft}>
                                <button
                                    className={styles.primaryBtn}
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        const q = businessAddressInput.trim();
                                        if (!q) return;
                                        setBusinessSuggestionsOpen(false);
                                        void searchBusinessLocation(q);
                                    }}
                                    disabled={!businessAddressInput.trim() || businessMapLoading}
                                >
                                    {businessMapLoading ? 'Searching...' : 'Search'}
                                </button>
                            </div>
                            <div className={styles.modalActionsRight}>
                                {(businessDraftLocation || businessLocation) && (
                                    <button className={styles.secondaryBtn} type="button" onClick={clearBusinessLocationDraft} disabled={businessLocationSaving}>
                                        Clear
                                    </button>
                                )}
                                <button
                                    className={styles.primaryBtn}
                                    type="button"
                                    onClick={() => void saveBusinessLocation()}
                                    disabled={businessMapLoading || businessLocationSaving}
                                >
                                    {businessLocationSaving ? 'Saving...' : 'Save'}
                                </button>
                            </div>
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
