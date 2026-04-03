'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';

import ProfileView from '@/components/ProfileView/ProfileView';
import { useUser } from '@/app/providers/UserProvider';
import { DisplayPostType } from '@/types/displayPost';
import { ProfilePublic, SavedBusinessLocation, UserNameAndPfp } from '@/types/profile';

type LocationAwareProfile = ProfilePublic | null;

function safeNumberArray(v: unknown): number[] {
    if (!Array.isArray(v)) return [];
    return v.map((x) => Number(x)).filter((n) => Number.isFinite(n)) as number[];
}

function toNumber(v: unknown): number | null {
    if (typeof v !== 'string' && typeof v !== 'number') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
}

function normalizeBusinessLocation(source: LocationAwareProfile): SavedBusinessLocation | null {
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

export default function PublicProfilePage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useUser();

    const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id;
    const profileUserId = rawId ? Number(rawId) : null;
    const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

    const authHeaders = useMemo(() => {
        const token = user?.accessToken;
        return token ? { Authorization: `Bearer ${token}` } : undefined;
    }, [user?.accessToken]);

    const [profile, setProfile] = useState<LocationAwareProfile>(null);
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileError, setProfileError] = useState<string | null>(null);

    const [activeTab, setActiveTab] = useState<'posts' | 'liked'>('posts');
    const [ownedPosts, setOwnedPosts] = useState<DisplayPostType[]>([]);
    const [likedPosts, setLikedPosts] = useState<DisplayPostType[]>([]);
    const [tabLoading, setTabLoading] = useState(false);
    const [tabError, setTabError] = useState<string | null>(null);

    const [followers, setFollowers] = useState<UserNameAndPfp[]>([]);
    const [following, setFollowing] = useState<UserNameAndPfp[]>([]);
    const [followLoading, setFollowLoading] = useState(false);
    const [followersExpanded, setFollowersExpanded] = useState(false);
    const [followingExpanded, setFollowingExpanded] = useState(false);
    const [followActionLoading, setFollowActionLoading] = useState(false);

    const postCacheRef = useRef<Map<number, DisplayPostType>>(new Map());
    const userMiniCacheRef = useRef<Map<number, UserNameAndPfp>>(new Map());

    const followerIds = useMemo(() => safeNumberArray(profile?.followerIds), [profile]);
    const followingIds = useMemo(() => safeNumberArray(profile?.followingIds), [profile]);
    const ownedIds = useMemo(() => safeNumberArray(profile?.ownedPostIds), [profile]);
    const likedIds = useMemo(() => safeNumberArray(profile?.likedPostIds), [profile]);

    const followerCount = profile?.followerCount ?? followerIds.length;
    const followingCount = profile?.followingCount ?? followingIds.length;
    const businessLocation = normalizeBusinessLocation(profile);

    const effectiveName = profile?.name ?? 'Profile';
    const effectiveBio = profile?.biography?.trim?.() || '';
    const effectivePfp =
        profile?.profilePicUrl?.trim?.() ||
        profile?.profilePic?.trim?.() ||
        '/images/deletedUserPfp.png';

    const isAdmin = Boolean(profile?.isAdmin ?? profile?.admin ?? false);
    const isMechanic = Boolean(profile?.isMechanic ?? profile?.mechanic ?? false);
    const canViewFullProfile = Boolean(profile?.viewerCanViewFullProfile);
    const isFollowing = Boolean(profile?.viewerFollowsUser);
    const shouldShowFollowButton = Boolean(user && profileUserId && user.userId !== profileUserId);

    const MAX_POSTS_PER_TAB = 25;
    const MINI_LIST_LIMIT = 10;

    async function fetchProfile(uid: number) {
        setProfileLoading(true);
        setProfileError(null);

        try {
            const res = await axios.get(`${API_BASE}/api/user/${uid}/profile/public`, {
                headers: authHeaders ?? {},
            });
            setProfile(res.data);
        } catch (err: any) {
            const status = err?.response?.status;
            console.error(err);
            setProfile(null);
            setFollowers([]);
            setFollowing([]);
            setOwnedPosts([]);
            setLikedPosts([]);

            if (status === 401) {
                setProfileError('Log in to view this profile.');
                return;
            }

            setProfileError(status ? `Profile load failed (${status}).` : 'Profile load failed.');
        } finally {
            setProfileLoading(false);
        }
    }

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
        if (!profile || !canViewFullProfile) {
            setFollowers([]);
            setFollowing([]);
            return;
        }

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

    async function fetchPostSummary(postId: number): Promise<DisplayPostType> {
        const cached = postCacheRef.current.get(postId);
        if (cached) return cached;

        try {
            const res = await axios.get(`${API_BASE}/api/post/${postId}`, {
                headers: authHeaders ?? {},
            });
            const cooked = res.data as DisplayPostType;
            postCacheRef.current.set(postId, cooked);
            return cooked;
        } catch {
            return makePostPlaceholder(postId, {});
        }
    }

    async function loadPostsForTab(tab: 'posts' | 'liked') {
        if (!profile || !canViewFullProfile) {
            setOwnedPosts([]);
            setLikedPosts([]);
            setTabError(null);
            return;
        }

        setTabLoading(true);
        setTabError(null);

        try {
            const ids = tab === 'posts' ? ownedIds : likedIds;
            const unique = Array.from(new Set(ids)).slice(0, MAX_POSTS_PER_TAB);

            const results = await Promise.all(
                unique.map(async (id) => {
                    const post = await fetchPostSummary(id);
                    const isPlaceholder =
                        typeof post?.description === 'string' &&
                        post.description.includes('could not be loaded');

                    if (isPlaceholder) {
                        return makePostPlaceholder(id, { liked: tab === 'liked' });
                    }
                    return post;
                })
            );

            results.sort((a, b) => (Date.parse(b.createdAt || '') || 0) - (Date.parse(a.createdAt || '') || 0));

            if (tab === 'posts') setOwnedPosts(results);
            if (tab === 'liked') setLikedPosts(results);
        } catch (err) {
            console.error(err);
            setTabError('Failed to load posts for this tab.');
        } finally {
            setTabLoading(false);
        }
    }

    async function handleFollowToggle() {
        if (!profileUserId || !authHeaders) return;

        setFollowActionLoading(true);
        setProfileError(null);
        try {
            if (isFollowing) {
                await axios.delete(`${API_BASE}/api/follow/${profileUserId}`, {
                    headers: authHeaders,
                });
            } else {
                await axios.post(
                    `${API_BASE}/api/follow/${profileUserId}`,
                    {},
                    {
                        headers: authHeaders,
                    }
                );
            }

            setFollowersExpanded(false);
            setFollowingExpanded(false);
            await fetchProfile(profileUserId);
        } catch (err) {
            console.error(err);
            setProfileError(isFollowing ? 'Failed to unfollow this user.' : 'Failed to follow this user.');
        } finally {
            setFollowActionLoading(false);
        }
    }

    useEffect(() => {
        if (profileUserId == null || !Number.isFinite(profileUserId)) {
            setProfileError('Invalid profile id.');
            return;
        }

        if (user?.userId === profileUserId) {
            router.replace('/myProfile');
            return;
        }

        void fetchProfile(profileUserId);
    }, [profileUserId, user?.userId, router]);

    useEffect(() => {
        if (!profile || !canViewFullProfile) {
            setFollowers([]);
            setFollowing([]);
            return;
        }
        void loadMiniLists(followersExpanded, followingExpanded);
    }, [profile, followersExpanded, followingExpanded, canViewFullProfile]);

    useEffect(() => {
        if (!profile || !canViewFullProfile) {
            setOwnedPosts([]);
            setLikedPosts([]);
            setTabError(null);
            return;
        }
        void loadPostsForTab(activeTab);
    }, [activeTab, profile, canViewFullProfile]);

    const currentPosts = activeTab === 'posts' ? ownedPosts : likedPosts;

    return (
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
            visibleTabs={[
                { key: 'posts', label: 'Posts', count: ownedIds.length },
                { key: 'liked', label: 'Liked', count: likedIds.length },
            ]}
            activeTab={activeTab}
            onTabChange={(tab) => {
                if (tab === 'saved') return;
                setActiveTab(tab);
            }}
            currentPosts={currentPosts}
            tabLoading={tabLoading}
            tabError={tabError}
            showComposer={false}
            businessLocation={businessLocation}
            showBusinessLocationCard={canViewFullProfile && Boolean(businessLocation)}
            canEditBusinessLocation={false}
            followers={followers}
            following={following}
            followLoading={followLoading}
            hasMoreFollowers={followerIds.length > 10}
            followersExpanded={followersExpanded}
            onToggleFollowersExpanded={() => setFollowersExpanded((v) => !v)}
            hasMoreFollowing={followingIds.length > 10}
            followingExpanded={followingExpanded}
            onToggleFollowingExpanded={() => setFollowingExpanded((v) => !v)}
            canViewFullProfile={canViewFullProfile}
            hiddenContentMessage="Follow this user to view their posts and follower lists."
            followButtonLabel={shouldShowFollowButton ? (isFollowing ? 'Following' : 'Follow') : null}
            onFollowButtonClick={shouldShowFollowButton ? () => void handleFollowToggle() : undefined}
            followButtonDisabled={followActionLoading}
        />
    );
}
