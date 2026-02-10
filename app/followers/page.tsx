"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import UserCard from '../components/UserCard';

interface UserDocument {
    identity: {
        user_id: string;
        home_server: string;
    };
    profile: {
        user_id: string;
        display_name: string;
        avatar_url?: string;
        bio?: string;
    };
}

export default function FollowersPage() {
    const { identity, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [followers, setFollowers] = useState<UserDocument[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !identity) {
            router.push('/login');
        }
    }, [identity, authLoading, router]);

    useEffect(() => {
        async function fetchFollowers() {
            if (!identity) return;

            try {
                const res = await fetch(
                    `${identity.home_server}/followers?user_id=${encodeURIComponent(identity.user_id)}`
                );

                if (res.ok) {
                    const data = await res.json();
                    setFollowers(data.followers || []);
                }
            } catch (err) {
                console.error('Failed to fetch followers:', err);
            } finally {
                setLoading(false);
            }
        }

        if (identity) fetchFollowers();
    }, [identity]);

    if (authLoading || loading) {
        return (
            <div className="max-w-3xl mx-auto p-6">
                <div className="text-center text-bat-gray">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-bat-yellow"></div>
                    <p className="mt-2">Loading followers...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-bat-gray mb-2">Followers</h1>
                <div className="h-0.5 w-16 bg-bat-yellow rounded-full opacity-50"></div>
            </div>

            {followers.length === 0 ? (
                <div className="text-center py-12 text-bat-gray">
                    <p className="text-lg">No followers yet</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {followers.map(follower => (
                        <UserCard
                            key={follower.identity.user_id}
                            user={{
                                userId: follower.identity.user_id,
                                username: follower.identity.user_id.split('@')[0],
                                displayName: follower.profile.display_name,
                                avatarUrl: follower.profile.avatar_url || '',
                                bio: follower.profile.bio || '',
                            }}
                            showFollowButton={false}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
