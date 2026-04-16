'use client';

import { useParams } from 'next/navigation';

import ProfilePageClient from '@/components/ProfilePage/ProfilePageClient';

export default function PublicProfilePage() {
    const params = useParams();
    const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id;
    const profileUserId = rawId ? Number(rawId) : null;

    return <ProfilePageClient routeMode="public" profileUserId={profileUserId} />;
}
