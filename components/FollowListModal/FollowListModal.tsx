'use client';

import { useEffect, useState } from 'react';

import { UserNameAndPfp } from '@/types/profile';

import styles from './FollowListModal.module.css';

type FollowListModalProps = {
    isOpen: boolean;
    defaultTab: 'followers' | 'following';
    followers: UserNameAndPfp[];
    following: UserNameAndPfp[];
    followLoading: boolean;
    onClose: () => void;
    onOpenFollowersTab?: () => void;
    onOpenFollowingTab?: () => void;
    onSelectUser: (userId: number) => void;
};

export default function FollowListModal({
    isOpen,
    defaultTab,
    followers,
    following,
    followLoading,
    onClose,
    onOpenFollowersTab,
    onOpenFollowingTab,
    onSelectUser,
}: FollowListModalProps) {
    const [activeTab, setActiveTab] = useState<'followers' | 'following'>(defaultTab);

    useEffect(() => {
        if (!isOpen) return;
        setActiveTab(defaultTab);
    }, [defaultTab, isOpen]);

    function openTab(tab: 'followers' | 'following') {
        setActiveTab(tab);
        if (tab === 'followers') {
            onOpenFollowersTab?.();
            return;
        }
        onOpenFollowingTab?.();
    }

    if (!isOpen) return null;

    const followModalUsers = activeTab === 'followers' ? followers : following;

    return (
        <div className={styles.modalOverlay} onMouseDown={onClose}>
            <div className={styles.modalCard} onMouseDown={(event) => event.stopPropagation()}>
                <div className={styles.followModalTabs}>
                    <button
                        className={`${styles.followModalTab} ${activeTab === 'followers' ? styles.followModalTabActive : ''}`}
                        type="button"
                        onClick={() => openTab('followers')}
                    >
                        Followers
                    </button>
                    <button
                        className={`${styles.followModalTab} ${activeTab === 'following' ? styles.followModalTabActive : ''}`}
                        type="button"
                        onClick={() => openTab('following')}
                    >
                        Following
                    </button>
                </div>

                {followLoading && <p className={styles.muted}>Loading...</p>}
                {!followLoading && followModalUsers.length === 0 && (
                    <p className={styles.muted}>
                        {activeTab === 'followers' ? 'No followers to show.' : 'Not following anyone yet.'}
                    </p>
                )}

                <div className={styles.followModalList}>
                    {followModalUsers.map((u) => (
                        <button
                            key={`${activeTab}-${u.userId}`}
                            className={styles.followModalUserRow}
                            type="button"
                            onClick={() => onSelectUser(u.userId)}
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
            </div>
        </div>
    );
}
