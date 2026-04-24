'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

import { useUser } from '@/app/providers/UserProvider';
import FollowListModal from '@/components/FollowListModal/FollowListModal';
import PostList from '@/components/PostList/PostList';
import { DisplayPostType } from '@/types/displayPost';
import { ProfileTabKey, ProfileViewTab, SavedBusinessLocation, UserNameAndPfp } from '@/types/profile';

import styles from '../../app/(app)/myProfile/myProfile.module.css';

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

type ProfileViewProps = {
    title: string;
    bio: string;
    profilePic: string;
    isAdmin: boolean;
    isMechanic: boolean;
    followerCount: number;
    followingCount: number;
    profileLoading: boolean;
    profileError: string | null;
    visibleTabs: ProfileViewTab[];
    activeTab: ProfileTabKey;
    onTabChange: (tab: ProfileTabKey) => void;
    currentPosts: DisplayPostType[];
    currentTabTotalCount: number;
    tabLoading: boolean;
    tabError: string | null;
    postLoadMoreSlot?: ReactNode;
    showComposer: boolean;
    onOpenCreatePost?: () => void;
    onEditBio?: () => void;
    onEditPhoto?: () => void;
    businessLocation: SavedBusinessLocation | null;
    showBusinessLocationCard: boolean;
    canEditBusinessLocation: boolean;
    onEditAddress?: () => void;
    followers: UserNameAndPfp[];
    following: UserNameAndPfp[];
    followLoading: boolean;
    hasMoreFollowers: boolean;
    onOpenFollowersModal?: () => void;
    hasMoreFollowing: boolean;
    onOpenFollowingModal?: () => void;
    followButtonLabel?: string | null;
    onFollowButtonClick?: () => void;
    followButtonDisabled?: boolean;
    preGridSlot?: ReactNode;
};

export default function ProfileView({
    title,
    bio,
    profilePic,
    isAdmin,
    isMechanic,
    followerCount,
    followingCount,
    profileLoading,
    profileError,
    visibleTabs,
    activeTab,
    onTabChange,
    currentPosts,
    currentTabTotalCount,
    tabLoading,
    tabError,
    postLoadMoreSlot,
    showComposer,
    onOpenCreatePost,
    onEditBio,
    onEditPhoto,
    businessLocation,
    showBusinessLocationCard,
    canEditBusinessLocation,
    onEditAddress,
    followers,
    following,
    followLoading,
    hasMoreFollowers,
    onOpenFollowersModal,
    hasMoreFollowing,
    onOpenFollowingModal,
    followButtonLabel,
    onFollowButtonClick,
    followButtonDisabled = false,
    preGridSlot,
}: ProfileViewProps) {
    const router = useRouter();
    const { user } = useUser();
    const [followModalTab, setFollowModalTab] = useState<'followers' | 'following' | null>(null);
    const followPreviewLimit = 5;
    const previewFollowers = followers.slice(0, followPreviewLimit);
    const previewFollowing = following.slice(0, followPreviewLimit);
    const isFollowModalOpen = followModalTab !== null;

    function openBusinessLocationInGoogleMaps() {
        if (!businessLocation) return;

        const destination = `${businessLocation.lat},${businessLocation.lon}`;
        const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`;
        window.open(url, '_blank', 'noopener,noreferrer');
    }

    function renderEmptyStateMessage(tab: ProfileTabKey) {
        if (tab === 'posts') return 'Posts will show up here.';
        if (tab === 'liked') return 'Posts liked by this user will show up here.';
        return 'Posts saved by this user will show up here.';
    }

    function goToUserProfile(targetUserId: number) {
        if (!Number.isFinite(targetUserId)) return;

        if (user?.userId === targetUserId) {
            router.push('/myProfile');
            return;
        }

        router.push(`/profile/${targetUserId}`);
    }

    function openFollowModal(tab: 'followers' | 'following') {
        setFollowModalTab(tab);
        if (tab === 'followers') {
            onOpenFollowersModal?.();
            return;
        }
        onOpenFollowingModal?.();
    }

    function closeFollowModal() {
        setFollowModalTab(null);
    }

    function handleFollowModalProfileClick(targetUserId: number) {
        closeFollowModal();
        goToUserProfile(targetUserId);
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
                                src={profilePic}
                                alt="Profile picture"
                                onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src = '/images/deletedUserPfp.png';
                                }}
                            />

                            <div className={styles.headerText}>
                                <div className={styles.nameRow}>
                                    <h1 className={styles.name}>{title}</h1>
                                    <div className={styles.badges}>
                                        {isAdmin && <span className={styles.badge}>Admin 👑</span>}
                                        {isMechanic && <span className={styles.badge}>Mechanic</span>}
                                    </div>
                                </div>

                                <p className={styles.headline}>
                                    {bio || 'No bio yet.'}
                                </p>

                                <div className={styles.statsRow}>
                                    <button className={`${styles.stat} ${styles.statButton}`} type="button" onClick={() => openFollowModal('followers')}>
                                        <span className={styles.statNumber}>{followerCount}</span>
                                        <span className={styles.statLabel}>Followers</span>
                                    </button>
                                    <button className={`${styles.stat} ${styles.statButton}`} type="button" onClick={() => openFollowModal('following')}>
                                        <span className={styles.statNumber}>{followingCount}</span>
                                        <span className={styles.statLabel}>Following</span>
                                    </button>
                                </div>

                                {(onEditBio || onEditPhoto) && (
                                    <div className={styles.headerActions}>
                                        {onEditBio && (
                                            <button className={styles.secondaryBtn} onClick={onEditBio} type="button">
                                                Edit bio
                                            </button>
                                        )}
                                        {onEditPhoto && (
                                            <button className={styles.secondaryBtn} onClick={onEditPhoto} type="button">
                                                Change photo
                                            </button>
                                        )}
                                    </div>
                                )}

                                {followButtonLabel && onFollowButtonClick && (
                                    <div className={styles.headerActions}>
                                        <button
                                            className={styles.primaryBtn}
                                            onClick={onFollowButtonClick}
                                            type="button"
                                            disabled={followButtonDisabled}
                                        >
                                            {followButtonLabel}
                                        </button>
                                    </div>
                                )}

                                {profileLoading && <p className={styles.muted}>Loading profile...</p>}
                                {profileError && <p className={styles.error}>{profileError}</p>}
                            </div>
                        </div>
                    </section>

                    {(showComposer || showBusinessLocationCard || preGridSlot) && (
                        <div className={styles.preGridStack}>
                            {showComposer && onOpenCreatePost && (
                                <div className={`${styles.composerCard} ${styles.sectionOutline}`}>
                                    <img
                                        className={styles.composerAvatar}
                                        src={profilePic}
                                        alt="Your avatar"
                                        onError={(e) => {
                                            (e.currentTarget as HTMLImageElement).src = '/images/deletedUserPfp.png';
                                        }}
                                    />
                                    <button className={styles.composerButton} onClick={onOpenCreatePost} type="button">
                                        Start a post...
                                    </button>
                                </div>
                            )}

                            {showBusinessLocationCard && (
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
                                                            center={[businessLocation.lat, businessLocation.lon]}
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
                                                        >
                                                            <TileLayer
                                                                attribution="&copy; OpenStreetMap contributors"
                                                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                            />

                                                            <Marker position={[businessLocation.lat, businessLocation.lon]}>
                                                                <Popup>{businessLocation.address}</Popup>
                                                            </Marker>
                                                        </MapContainer>

                                                        <div className={styles.mapNavigateBadge}>
                                                            Get Directions
                                                        </div>

                                                        {canEditBusinessLocation && onEditAddress && (
                                                            <button
                                                                className={styles.mapSettingsButton}
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onEditAddress();
                                                                }}
                                                                aria-label="Edit address"
                                                            >
                                                                ⚙️
                                                            </button>
                                                        )}
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
                                                    {canEditBusinessLocation && onEditAddress && (
                                                        <button className={styles.emptyAddressButton} type="button" onClick={onEditAddress}>
                                                            Add business address
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </section>
                                </div>
                            )}

                            {preGridSlot}
                        </div>
                    )}

                    <div className={styles.grid}>
                        <section className={styles.mainCol}>
                            <div className={`${styles.tabsCard} ${styles.sectionOutline}`}>
                                {visibleTabs.map((tab) => (
                                    <button
                                        key={tab.key}
                                        className={`${styles.tabBtn} ${activeTab === tab.key ? styles.tabActive : ''}`}
                                        onClick={() => onTabChange(tab.key)}
                                        type="button"
                                    >
                                        {tab.label} <span className={styles.tabCount}>{tab.count}</span>
                                    </button>
                                ))}
                            </div>

                            <div className={`${styles.feedCard} ${styles.sectionOutline}`}>
                                {tabLoading && <p className={styles.muted}>Loading {activeTab}...</p>}
                                {tabError && <p className={styles.error}>{tabError}</p>}

                                {!tabLoading && !tabError && currentPosts.length === 0 && currentTabTotalCount === 0 && (
                                    <div className={styles.emptyState}>
                                        <p className={styles.emptyTitle}>Nothing here yet</p>
                                        <p className={styles.muted}>{renderEmptyStateMessage(activeTab)}</p>
                                    </div>
                                )}

                                <PostList postDataArray={currentPosts} />
                                {postLoadMoreSlot}
                            </div>
                        </section>

                        <aside className={styles.sideCol}>
                            <div className={`${styles.sideCard} ${styles.sectionOutline}`}>
                                <div className={styles.sideHeader}>
                                    <h3 className={styles.h3}>Followers</h3>
                                    <span className={styles.sideCount}>{followerCount}</span>
                                </div>

                                {followLoading && <p className={styles.muted}>Loading...</p>}
                                {!followLoading && followers.length === 0 && <p className={styles.muted}>No followers to show.</p>}

                                <div className={styles.userList}>
                                    {previewFollowers.map((u) => (
                                        <button
                                            key={u.userId}
                                            className={`${styles.userRow} ${styles.userRowButton}`}
                                            type="button"
                                            onClick={() => goToUserProfile(u.userId)}
                                        >
                                            <img
                                                className={styles.userAvatar}
                                                src={u.profilePic || '/images/deletedUserPfp.png'}
                                                alt=""
                                                onError={(e) => {
                                                    (e.currentTarget as HTMLImageElement).src = '/images/deletedUserPfp.png';
                                                }}
                                            />
                                            <span className={styles.userName}>{u.name}</span>
                                        </button>
                                    ))}
                                </div>

                                {hasMoreFollowers && onOpenFollowersModal && (
                                    <button className={styles.linkBtn} type="button" onClick={() => openFollowModal('followers')}>
                                        Show all
                                    </button>
                                )}
                            </div>

                            <div className={`${styles.sideCard} ${styles.sectionOutline}`}>
                                <div className={styles.sideHeader}>
                                    <h3 className={styles.h3}>Following</h3>
                                    <span className={styles.sideCount}>{followingCount}</span>
                                </div>

                                {followLoading && <p className={styles.muted}>Loading...</p>}
                                {!followLoading && following.length === 0 && <p className={styles.muted}>Not following anyone yet.</p>}

                                <div className={styles.userList}>
                                    {previewFollowing.map((u) => (
                                        <button
                                            key={u.userId}
                                            className={`${styles.userRow} ${styles.userRowButton}`}
                                            type="button"
                                            onClick={() => goToUserProfile(u.userId)}
                                        >
                                            <img
                                                className={styles.userAvatar}
                                                src={u.profilePic || '/images/deletedUserPfp.png'}
                                                alt=""
                                                onError={(e) => {
                                                    (e.currentTarget as HTMLImageElement).src = '/images/deletedUserPfp.png';
                                                }}
                                            />
                                            <span className={styles.userName}>{u.name}</span>
                                        </button>
                                    ))}
                                </div>

                                {hasMoreFollowing && onOpenFollowingModal && (
                                    <button className={styles.linkBtn} type="button" onClick={() => openFollowModal('following')}>
                                        Show all
                                    </button>
                                )}
                            </div>
                        </aside>
                    </div>
                </div>
            </div>

            <FollowListModal
                isOpen={isFollowModalOpen}
                defaultTab={followModalTab ?? 'followers'}
                followers={followers}
                following={following}
                followLoading={followLoading}
                onClose={closeFollowModal}
                onOpenFollowersTab={onOpenFollowersModal}
                onOpenFollowingTab={onOpenFollowingModal}
                onSelectUser={handleFollowModalProfileClick}
            />
        </div>
    );
}
