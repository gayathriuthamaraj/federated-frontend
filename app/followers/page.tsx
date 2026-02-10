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
    const [refreshKey, setRefreshKey] = useState(0);

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
    }, [identity, refreshKey]); // Refetch when refreshKey changes

    const handleRemoveFollower = async (userId: string) => {
        if (!identity) return;

        if (!confirm(`Remove ${userId} from followers?`)) return;

        try {
            // Note: You'll need to implement a backend endpoint for this
            const res = await fetch(`${identity.home_server}/follower/remove`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: identity.user_id,
                    follower_id: userId
                })
            });

            if (res.ok) {
                // Refresh the list
                setRefreshKey(prev => prev + 1);
            }
        } catch (err) {
            console.error('Failed to remove follower:', err);
        }
    };

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
                <p className="text-bat-gray/60 mt-2">{followers.length} {followers.length === 1 ? 'follower' : 'followers'}</p>
            </div>

            {followers.length === 0 ? (
                <div className="text-center py-12 text-bat-gray">
                    <p className="text-lg">No followers yet</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {followers.map(follower => (
                        <div key={follower.identity.user_id} className="flex items-center gap-3">
                            <div className="flex-1">
                                <UserCard
                                    user={{
                                        userId: follower.identity.user_id,
                                        username: follower.identity.user_id.split('@')[0],
                                        displayName: follower.profile.display_name,
                                        avatarUrl: follower.profile.avatar_url || '',
                                        bio: follower.profile.bio || '',
                                    }}
                                    showFollowButton={false}
                                />
                            </div>
                            <button
                                onClick={() => handleRemoveFollower(follower.identity.user_id)}
                                className="
                                    px-4 py-2 rounded-md font-medium text-sm
                                    bg-bat-black text-bat-gray
                                    border border-bat-gray/30
                                    hover:border-red-500 hover:text-red-500
                                    transition-all duration-200
                                "
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
