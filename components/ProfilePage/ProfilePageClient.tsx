'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

import CreatePostModal from '@/components/CreatePostModal/CreatePostModal';
import ProfileView from '@/components/ProfileView/ProfileView';
import { useUser } from '@/app/providers/UserProvider';
import styles from '@/app/(app)/myProfile/myProfile.module.css';
import { DisplayPostType } from '@/types/displayPost';
import { ProfilePrivate, ProfilePublic, ProfileTabKey, SavedBusinessLocation, UserNameAndPfp } from '@/types/profile';

type ProfilePageClientProps = {
    routeMode: 'self' | 'public';
    profileUserId?: number | null;
};

type LocationIQPlace = {
    place_id?: string | number;
    display_name?: string;
    lat?: string;
    lon?: string;
};

type ProfileResponse = ProfilePrivate | ProfilePublic;

function safeNumberArray(value: unknown): number[] {
    if (!Array.isArray(value)) return [];
    return value.map((item) => Number(item)).filter((item) => Number.isFinite(item)) as number[];
}

function toNumber(value: unknown): number | null {
    if (typeof value !== 'string' && typeof value !== 'number') return null;
    const next = Number(value);
    return Number.isFinite(next) ? next : null;
}

function normalizeBusinessLocation(source: ProfileResponse | null): SavedBusinessLocation | null {
    const address = source?.businessAddress?.trim?.() ?? '';
    const lat = toNumber(source?.businessLat);
    const lon = toNumber(source?.businessLon);

    if (!address || lat == null || lon == null) {
        return null;
    }

    return { address, lat, lon };
}

function makePostPlaceholder(postId: number, flags: { liked?: boolean; saved?: boolean }): DisplayPostType {
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

export default function ProfilePageClient({ routeMode, profileUserId }: ProfilePageClientProps) {
    const router = useRouter();
    const { user, setUser } = useUser();

    const isOwnProfile = routeMode === 'self';
    const targetUserId = isOwnProfile ? (user?.userId ?? null) : (profileUserId ?? null);
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

    const authHeaders = useMemo(() => {
        const token = user?.accessToken;
        return token ? { Authorization: `Bearer ${token}` } : undefined;
    }, [user?.accessToken]);

    const [profile, setProfile] = useState<ProfileResponse | null>(null);
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileError, setProfileError] = useState<string | null>(null);

    const [activeTab, setActiveTab] = useState<ProfileTabKey>('posts');
    const [ownedPosts, setOwnedPosts] = useState<DisplayPostType[]>([]);
    const [likedPosts, setLikedPosts] = useState<DisplayPostType[]>([]);
    const [savedPosts, setSavedPosts] = useState<DisplayPostType[]>([]);
    const [tabLoading, setTabLoading] = useState(false);
    const [tabError, setTabError] = useState<string | null>(null);

    const [followers, setFollowers] = useState<UserNameAndPfp[]>([]);
    const [following, setFollowing] = useState<UserNameAndPfp[]>([]);
    const [followLoading, setFollowLoading] = useState(false);
    const [followersExpanded, setFollowersExpanded] = useState(false);
    const [followingExpanded, setFollowingExpanded] = useState(false);
    const [followActionLoading, setFollowActionLoading] = useState(false);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditBio, setShowEditBio] = useState(false);
    const [bioDraft, setBioDraft] = useState('');
    const [bioSaving, setBioSaving] = useState(false);
    const [bioError, setBioError] = useState<string | null>(null);

    const [showEditPhoto, setShowEditPhoto] = useState(false);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoSaving, setPhotoSaving] = useState(false);
    const [photoError, setPhotoError] = useState<string | null>(null);
    const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);

    const [showEditAddress, setShowEditAddress] = useState(false);
    const [businessAddressInput, setBusinessAddressInput] = useState('');
    const [businessLocation, setBusinessLocation] = useState<SavedBusinessLocation | null>(null);
    const [businessSuggestions, setBusinessSuggestions] = useState<LocationIQPlace[]>([]);
    const [businessSuggestionsOpen, setBusinessSuggestionsOpen] = useState(false);
    const [businessMapLoading, setBusinessMapLoading] = useState(false);
    const [businessLocationSaving, setBusinessLocationSaving] = useState(false);
    const [businessMapError, setBusinessMapError] = useState<string | null>(null);
    const [businessDraftLocation, setBusinessDraftLocation] = useState<SavedBusinessLocation | null>(null);

    const businessSearchAbortRef = useRef<AbortController | null>(null);
    const businessAutocompleteAbortRef = useRef<AbortController | null>(null);
    const businessAutocompleteDebounceRef = useRef<number | null>(null);
    const businessSearchBlockRef = useRef<HTMLDivElement | null>(null);

    const postCacheRef = useRef<Map<number, DisplayPostType>>(new Map());
    const userMiniCacheRef = useRef<Map<number, UserNameAndPfp>>(new Map());

    const effectiveName = profile?.name ?? (isOwnProfile ? user?.name ?? 'Your profile' : 'Profile');
    const effectiveBio = profile?.biography?.trim?.() || (isOwnProfile ? user?.biography?.trim?.() || '' : '');
    const effectivePfp =
        profile?.profilePicUrl?.trim?.() ||
        profile?.profilePic?.trim?.() ||
        (isOwnProfile ? user?.profilePic?.trim?.() || '' : '') ||
        '/images/deletedUserPfp.png';

    const isAdmin = Boolean(profile?.isAdmin ?? profile?.admin ?? (isOwnProfile ? user?.isAdmin : false));
    const isMechanic = Boolean(profile?.isMechanic ?? profile?.mechanic ?? (isOwnProfile ? user?.isMechanic : false));
    const canManageBusinessLocation = isOwnProfile && (isAdmin || isMechanic);

    const followerIds = useMemo(() => safeNumberArray(profile?.followerIds), [profile]);
    const followingIds = useMemo(() => safeNumberArray(profile?.followingIds), [profile]);
    const ownedIds = useMemo(() => safeNumberArray(profile?.ownedPostIds), [profile]);
    const likedIds = useMemo(() => safeNumberArray(profile?.likedPostIds), [profile]);
    const savedIds = useMemo(() => safeNumberArray((profile as ProfilePrivate | null)?.savedPostIds), [profile]);

    const followerCount = profile?.followerCount ?? followerIds.length;
    const followingCount = profile?.followingCount ?? followingIds.length;
    const canViewFullProfile = isOwnProfile || Boolean((profile as ProfilePublic | null)?.viewerCanViewFullProfile);
    const isFollowing = Boolean((profile as ProfilePublic | null)?.viewerFollowsUser);
    const shouldShowFollowButton = !isOwnProfile && Boolean(user && targetUserId && user.userId !== targetUserId);

    const maxPostsPerTab = 25;
    const miniListLimit = 10;

    function resetLoadedData() {
        setProfile(null);
        setFollowers([]);
        setFollowing([]);
        setOwnedPosts([]);
        setLikedPosts([]);
        setSavedPosts([]);
        setTabError(null);
    }

    async function fetchProfile(userId: number) {
        setProfileLoading(true);
        setProfileError(null);

        try {
            const res = await axios.get(`${apiBase}/api/user/${userId}/profile`, {
                headers: authHeaders ?? {},
            });
            setProfile(res.data as ProfileResponse);
        } catch (err: any) {
            const status = err?.response?.status;
            console.error(err);
            resetLoadedData();

            if (status === 401) {
                setProfileError(isOwnProfile ? 'You need to log in to view your profile.' : 'Log in to view this profile.');
                return;
            }

            setProfileError(status ? `Profile load failed (${status}).` : 'Profile load failed.');
        } finally {
            setProfileLoading(false);
        }
    }

    async function fetchUserMini(userId: number): Promise<UserNameAndPfp> {
        const cached = userMiniCacheRef.current.get(userId);
        if (cached) return cached;

        try {
            const res = await axios.get(`${apiBase}/api/user/${userId}/name-and-pfp`);
            const nextUser: UserNameAndPfp = {
                userId,
                name: res.data?.name ?? `User ${userId}`,
                profilePic: res.data?.profilePic || '/images/deletedUserPfp.png',
            };
            userMiniCacheRef.current.set(userId, nextUser);
            return nextUser;
        } catch {
            const fallback: UserNameAndPfp = {
                userId,
                name: `User ${userId}`,
                profilePic: '/images/deletedUserPfp.png',
            };
            userMiniCacheRef.current.set(userId, fallback);
            return fallback;
        }
    }

    async function loadMiniLists(expandFollowers: boolean, expandFollowing: boolean) {
        if (!profile || !canViewFullProfile) {
            setFollowers([]);
            setFollowing([]);
            return;
        }

        setFollowLoading(true);
        try {
            const followerSlice = expandFollowers ? followerIds : followerIds.slice(0, miniListLimit);
            const followingSlice = expandFollowing ? followingIds : followingIds.slice(0, miniListLimit);

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

    async function fetchPostSummary(postId: number): Promise<DisplayPostType> {
        const cached = postCacheRef.current.get(postId);
        if (cached) return cached;

        try {
            const res = await axios.get(`${apiBase}/api/post/${postId}`, {
                headers: authHeaders ?? {},
            });
            const nextPost = res.data as DisplayPostType;
            postCacheRef.current.set(postId, nextPost);
            return nextPost;
        } catch {
            return makePostPlaceholder(postId, {});
        }
    }

    async function loadPostsForTab(tab: ProfileTabKey) {
        if (!profile || !canViewFullProfile) {
            setOwnedPosts([]);
            setLikedPosts([]);
            setSavedPosts([]);
            setTabError(null);
            return;
        }

        setTabLoading(true);
        setTabError(null);

        try {
            const ids = tab === 'posts' ? ownedIds : tab === 'liked' ? likedIds : savedIds;
            const uniqueIds = Array.from(new Set(ids)).slice(0, maxPostsPerTab);

            const results = await Promise.all(
                uniqueIds.map(async (id) => {
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

    async function handleFollowToggle() {
        if (!targetUserId || !authHeaders) return;

        setFollowActionLoading(true);
        setProfileError(null);
        try {
            if (isFollowing) {
                await axios.delete(`${apiBase}/api/follow/${targetUserId}`, {
                    headers: authHeaders,
                });
            } else {
                await axios.post(
                    `${apiBase}/api/follow/${targetUserId}`,
                    {},
                    {
                        headers: authHeaders,
                    }
                );
            }

            setFollowersExpanded(false);
            setFollowingExpanded(false);
            await fetchProfile(targetUserId);
        } catch (err) {
            console.error(err);
            setProfileError(isFollowing ? 'Failed to unfollow this user.' : 'Failed to follow this user.');
        } finally {
            setFollowActionLoading(false);
        }
    }

    function syncBusinessLocationState(nextLocation: SavedBusinessLocation | null) {
        setBusinessLocation(nextLocation);
    }

    function selectBusinessPlace(place: LocationIQPlace) {
        const lat = toNumber(place.lat);
        const lon = toNumber(place.lon);
        const address = place.display_name?.trim?.() ?? '';

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

    async function fetchBusinessAutocomplete(query: string) {
        if (query.trim().length < 2) return;

        businessAutocompleteAbortRef.current?.abort();
        const controller = new AbortController();
        businessAutocompleteAbortRef.current = controller;

        try {
            const res = await fetch(`${apiBase}/api/geocode/autocomplete?q=${encodeURIComponent(query)}&limit=5`, {
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

    async function searchBusinessLocation(query: string) {
        setBusinessMapLoading(true);
        setBusinessMapError(null);
        businessSearchAbortRef.current?.abort();
        const controller = new AbortController();
        businessSearchAbortRef.current = controller;

        try {
            const res = await fetch(`${apiBase}/api/geocode/search?q=${encodeURIComponent(query)}&limit=1`, {
                signal: controller.signal,
                credentials: 'include',
            });

            if (!res.ok) {
                const text = await res.text().catch(() => '');
                throw new Error(`Search failed: ${res.status} ${text}`);
            }

            const data = (await res.json()) as LocationIQPlace[];
            const firstResult = Array.isArray(data) ? data[0] : null;

            if (!firstResult) {
                setBusinessMapError('No matching address was found.');
                return;
            }

            selectBusinessPlace(firstResult);
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
            await axios.patch(`${apiBase}/api/user/business-location`, payload, {
                headers: authHeaders ?? {},
            });

            syncBusinessLocationState(businessDraftLocation);
            setProfile((prev) =>
                prev
                    ? {
                          ...prev,
                          businessAddress: businessDraftLocation?.address,
                          businessLat: businessDraftLocation?.lat,
                          businessLon: businessDraftLocation?.lon,
                      }
                    : prev
            );
            setShowEditAddress(false);
            setBusinessSuggestionsOpen(false);
        } catch (err: any) {
            console.error(err);
            setBusinessMapError(
                err?.response?.status ? `Failed to save address (${err.response.status})` : 'Failed to save address.'
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

    async function saveBio() {
        if (!targetUserId || !isOwnProfile) return;

        setBioSaving(true);
        setBioError(null);
        try {
            await axios.patch(
                `${apiBase}/api/user/update-bio`,
                { userId: targetUserId, newBio: bioDraft },
                { headers: authHeaders ?? {} }
            );

            if (user) {
                setUser({ ...user, biography: bioDraft });
            }

            setShowEditBio(false);
            await fetchProfile(targetUserId);
        } catch (err: any) {
            console.error(err);
            setBioError(err?.response?.status ? `Failed (${err.response.status})` : 'Failed to update bio.');
        } finally {
            setBioSaving(false);
        }
    }

    async function saveProfilePicUpload() {
        if (!targetUserId || !isOwnProfile) return;

        setPhotoSaving(true);
        setPhotoError(null);

        if (!photoFile) {
            setPhotoError('Please choose an image file.');
            setPhotoSaving(false);
            return;
        }

        try {
            const formData = new FormData();
            formData.append('userId', String(targetUserId));
            formData.append('file', photoFile);

            const res = await axios.post(`${apiBase}/api/user/update-profile-pic/upload`, formData, {
                headers: {
                    ...(authHeaders ?? {}),
                    'Content-Type': 'multipart/form-data',
                },
            });

            const newUrl = res.data as string;

            if (user) {
                setUser({ ...user, profilePic: newUrl });
            }

            setProfile((prev) => (prev ? { ...prev, profilePic: newUrl, profilePicUrl: newUrl } : prev));
            postCacheRef.current.clear();
            setShowEditPhoto(false);

            if (photoPreviewUrl) {
                URL.revokeObjectURL(photoPreviewUrl);
                setPhotoPreviewUrl(null);
            }

            setPhotoFile(null);
            await fetchProfile(targetUserId);
            await loadPostsForTab(activeTab);
        } catch (err: any) {
            console.error(err);
            setPhotoError(err?.response?.status ? `Upload failed (${err.response.status})` : 'Upload failed.');
        } finally {
            setPhotoSaving(false);
        }
    }

    useEffect(() => {
        if (targetUserId == null || !Number.isFinite(targetUserId)) {
            if (!isOwnProfile) {
                setProfileError('Invalid profile id.');
            }
            return;
        }

        if (!isOwnProfile && user?.userId === targetUserId) {
            router.replace('/myProfile');
            return;
        }

        void fetchProfile(targetUserId);
    }, [targetUserId, isOwnProfile, user?.userId, router]);

    useEffect(() => {
        syncBusinessLocationState(normalizeBusinessLocation(profile));
    }, [profile]);

    useEffect(() => {
        void loadMiniLists(followersExpanded, followingExpanded);
    }, [profile, followersExpanded, followingExpanded, canViewFullProfile]);

    useEffect(() => {
        void loadPostsForTab(activeTab);
    }, [activeTab, profile, canViewFullProfile]);

    useEffect(() => {
        if (showEditBio) {
            setBioDraft(effectiveBio);
            setBioError(null);
        }
    }, [showEditBio, effectiveBio]);

    useEffect(() => {
        if (showEditPhoto) {
            setPhotoError(null);
            setPhotoFile(null);
            if (photoPreviewUrl) {
                URL.revokeObjectURL(photoPreviewUrl);
                setPhotoPreviewUrl(null);
            }
        }
    }, [showEditPhoto, photoPreviewUrl]);

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
        const query = businessAddressInput.trim();

        if (!showEditAddress || !canManageBusinessLocation || query.length < 2) {
            businessAutocompleteAbortRef.current?.abort();
            setBusinessSuggestions([]);
            setBusinessSuggestionsOpen(false);
            return;
        }

        if (businessAutocompleteDebounceRef.current) {
            window.clearTimeout(businessAutocompleteDebounceRef.current);
        }

        businessAutocompleteDebounceRef.current = window.setTimeout(() => {
            void fetchBusinessAutocomplete(query);
        }, 250);

        return () => {
            if (businessAutocompleteDebounceRef.current) {
                window.clearTimeout(businessAutocompleteDebounceRef.current);
            }
        };
    }, [businessAddressInput, canManageBusinessLocation, showEditAddress]);

    useEffect(() => {
        function onDocumentMouseDown(event: MouseEvent) {
            const block = businessSearchBlockRef.current;
            if (!block) return;
            if (event.target instanceof Node && !block.contains(event.target)) {
                setBusinessSuggestionsOpen(false);
            }
        }

        document.addEventListener('mousedown', onDocumentMouseDown);
        return () => document.removeEventListener('mousedown', onDocumentMouseDown);
    }, []);

    const currentPosts = activeTab === 'posts' ? ownedPosts : activeTab === 'liked' ? likedPosts : savedPosts;
    const displayedPosts = useMemo(() => {
        if (!isOwnProfile || !targetUserId) return currentPosts;
        return currentPosts.map((post) =>
            post.authorId === targetUserId ? { ...post, createdByProfilePicUrl: effectivePfp } : post
        );
    }, [currentPosts, effectivePfp, isOwnProfile, targetUserId]);

    if (isOwnProfile && !user) {
        return (
            <div className={styles.container}>
                <div className={styles.page}>
                    <div className={styles.card}>
                        <h2 className={styles.h2}>My Profile</h2>
                        <p className={styles.muted}>You need to log in to view your profile.</p>
                        <button className={styles.primaryBtn} onClick={() => router.push('/login')} type="button">
                            Go to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <ProfileView
                title={effectiveName}
                bio={effectiveBio}
                profilePic={effectivePfp}
                isAdmin={isAdmin}
                isMechanic={isMechanic}
                followerCount={followerCount}
                followingCount={followingCount}
                profileLoading={profileLoading}
                profileError={profileError}
                visibleTabs={
                    isOwnProfile
                        ? [
                              { key: 'posts', label: 'Posts', count: ownedIds.length },
                              { key: 'liked', label: 'Liked', count: likedIds.length },
                              { key: 'saved', label: 'Saved', count: savedIds.length },
                          ]
                        : [
                              { key: 'posts', label: 'Posts', count: ownedIds.length },
                              { key: 'liked', label: 'Liked', count: likedIds.length },
                          ]
                }
                activeTab={activeTab}
                onTabChange={(tab) => {
                    if (!isOwnProfile && tab === 'saved') return;
                    setActiveTab(tab);
                }}
                currentPosts={displayedPosts}
                tabLoading={tabLoading}
                tabError={tabError}
                showComposer={isOwnProfile}
                onOpenCreatePost={isOwnProfile ? () => setShowCreateModal(true) : undefined}
                onEditBio={isOwnProfile ? () => setShowEditBio(true) : undefined}
                onEditPhoto={isOwnProfile ? () => setShowEditPhoto(true) : undefined}
                businessLocation={businessLocation}
                showBusinessLocationCard={canViewFullProfile && (isOwnProfile ? canManageBusinessLocation : Boolean(businessLocation))}
                canEditBusinessLocation={canManageBusinessLocation}
                onEditAddress={canManageBusinessLocation ? () => setShowEditAddress(true) : undefined}
                followers={followers}
                following={following}
                followLoading={followLoading}
                hasMoreFollowers={followerIds.length > miniListLimit}
                followersExpanded={followersExpanded}
                onToggleFollowersExpanded={() => setFollowersExpanded((value) => !value)}
                hasMoreFollowing={followingIds.length > miniListLimit}
                followingExpanded={followingExpanded}
                onToggleFollowingExpanded={() => setFollowingExpanded((value) => !value)}
                canViewFullProfile={canViewFullProfile}
                hiddenContentMessage="Follow this user to view their posts and follower lists."
                followButtonLabel={shouldShowFollowButton ? (isFollowing ? 'Following' : 'Follow') : null}
                onFollowButtonClick={shouldShowFollowButton ? () => void handleFollowToggle() : undefined}
                followButtonDisabled={followActionLoading}
            />

            {isOwnProfile && showCreateModal && (
                <CreatePostModal
                    onClose={() => {
                        setShowCreateModal(false);
                        if (targetUserId) {
                            void fetchProfile(targetUserId);
                        }
                    }}
                />
            )}

            {isOwnProfile && showEditBio && (
                <div className={styles.modalOverlay} onMouseDown={() => setShowEditBio(false)}>
                    <div className={styles.modalCard} onMouseDown={(event) => event.stopPropagation()}>
                        <div className={styles.modalTitle}>Edit bio</div>
                        <textarea
                            className={styles.textarea}
                            value={bioDraft}
                            onChange={(event) => setBioDraft(event.target.value)}
                            rows={5}
                            placeholder="Write something about yourself..."
                        />
                        {bioError && <div className={styles.error}>{bioError}</div>}
                        <div className={styles.modalActions}>
                            <button className={styles.secondaryBtn} onClick={() => setShowEditBio(false)} disabled={bioSaving} type="button">
                                Cancel
                            </button>
                            <button className={styles.primaryBtn} onClick={() => void saveBio()} disabled={bioSaving} type="button">
                                {bioSaving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isOwnProfile && showEditAddress && (
                <div
                    className={styles.modalOverlay}
                    onMouseDown={() => {
                        setShowEditAddress(false);
                        setBusinessSuggestionsOpen(false);
                    }}
                >
                    <div className={styles.modalCard} onMouseDown={(event) => event.stopPropagation()}>
                        <div className={styles.modalTitle}>Edit address</div>
                        <p className={styles.muted}>Search for a shop address, then select a result and save it to your profile.</p>

                        <div ref={businessSearchBlockRef} className={styles.businessSearchBlock}>
                            <form
                                className={styles.businessSearchRow}
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    const query = businessAddressInput.trim();
                                    if (!query) return;
                                    setBusinessSuggestionsOpen(false);
                                    void searchBusinessLocation(query);
                                }}
                            >
                                <input
                                    className={styles.input}
                                    type="text"
                                    value={businessAddressInput}
                                    onChange={(event) => {
                                        setBusinessAddressInput(event.target.value);
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
                                    {businessSuggestions.map((suggestion, index) => (
                                        <button
                                            key={`${suggestion.place_id ?? 'na'}-${suggestion.lat ?? 'na'}-${suggestion.lon ?? 'na'}-${index}`}
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
                                    onClick={() => void searchBusinessLocation(businessAddressInput.trim())}
                                    disabled={!businessAddressInput.trim() || businessMapLoading}
                                >
                                    {businessMapLoading ? 'Searching...' : 'Search'}
                                </button>
                            </div>
                            <div className={styles.modalActionsRight}>
                                {(businessDraftLocation || businessLocation) && (
                                    <button
                                        className={styles.secondaryBtn}
                                        type="button"
                                        onClick={clearBusinessLocationDraft}
                                        disabled={businessLocationSaving}
                                    >
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

            {isOwnProfile && showEditPhoto && (
                <div className={styles.modalOverlay} onMouseDown={() => setShowEditPhoto(false)}>
                    <div className={styles.modalCard} onMouseDown={(event) => event.stopPropagation()}>
                        <div className={styles.modalTitle}>Change profile picture</div>

                        <input
                            className={styles.input}
                            type="file"
                            accept="image/*"
                            onChange={(event) => {
                                const nextFile = event.target.files?.[0] ?? null;
                                setPhotoFile(nextFile);
                                setPhotoError(null);

                                if (photoPreviewUrl) {
                                    URL.revokeObjectURL(photoPreviewUrl);
                                    setPhotoPreviewUrl(null);
                                }

                                if (nextFile) {
                                    setPhotoPreviewUrl(URL.createObjectURL(nextFile));
                                }
                            }}
                        />

                        {photoPreviewUrl && (
                            <div style={{ marginTop: 10 }}>
                                <img
                                    src={photoPreviewUrl}
                                    alt="Preview"
                                    style={{
                                        width: 96,
                                        height: 96,
                                        borderRadius: 999,
                                        objectFit: 'cover',
                                        border: '1px solid rgba(0,0,0,0.12)',
                                    }}
                                />
                            </div>
                        )}

                        {photoError && <div className={styles.error}>{photoError}</div>}

                        <div className={styles.modalActions}>
                            <button className={styles.secondaryBtn} onClick={() => setShowEditPhoto(false)} disabled={photoSaving} type="button">
                                Cancel
                            </button>
                            <button className={styles.primaryBtn} onClick={() => void saveProfilePicUpload()} disabled={photoSaving} type="button">
                                {photoSaving ? 'Uploading...' : 'Upload'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
