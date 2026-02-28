"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
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

function FollowersContent() {
    const { identity, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [followers, setFollowers] = useState<UserDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);
    const abortRef = useRef<AbortController | null>(null);

    // user_id from URL param — if provided, show that user's followers (read-only)
    const paramUserId = searchParams.get('user_id');

    useEffect(() => {
        if (!authLoading && !identity) {
            router.push('/login');
        }
    }, [identity, authLoading, router]);

    const fetchFollowers = useCallback(async () => {
        if (!identity) return;
        const targetUserId = paramUserId || identity.user_id;
        // Cancel any in-flight request
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        const url = `${identity.home_server}/followers?user_id=${encodeURIComponent(targetUserId)}`;
        try {
            const res = await fetch(url, { signal: controller.signal });
            if (res.ok) {
                const data = await res.json();
                setFollowers(data.followers || []);
            }
        } catch (err: unknown) {
            if (err instanceof DOMException && err.name === 'AbortError') return;
            console.error(`Failed to fetch followers from ${url}:`, err);
        } finally {
            setLoading(false);
        }
    }, [identity, paramUserId]);

    // Cleanup on unmount
    useEffect(() => () => { abortRef.current?.abort(); }, []);

    // Fetch on mount / manual refresh (guard: wait for auth to finish loading)
    useEffect(() => {
        if (!authLoading && identity) fetchFollowers();
    }, [identity, authLoading, refreshKey, fetchFollowers]);

    // Poll every 15 seconds
    useEffect(() => {
        if (!identity) return;
        const interval = setInterval(fetchFollowers, 15000);
        return () => clearInterval(interval);
    }, [identity, fetchFollowers]);

    // Re-fetch when the tab becomes visible again
    useEffect(() => {
        const onVisible = () => {
            if (document.visibilityState === 'visible' && identity) fetchFollowers();
        };
        document.addEventListener('visibilitychange', onVisible);
        return () => document.removeEventListener('visibilitychange', onVisible);
    }, [identity, fetchFollowers]);

    const isOwnProfile = !paramUserId || paramUserId === identity?.user_id;

    const handleRemoveFollower = async (userId: string) => {
        if (!identity || !isOwnProfile) return;

        if (!confirm(`Remove ${userId} from followers?`)) return;

        try {
            
            const res = await fetch(`${identity.home_server}/follower/remove`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: identity.user_id,
                    follower_id: userId
                })
            });

            if (res.ok) {
                
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
                <h1 className="text-3xl font-bold text-bat-gray mb-2">
                    {isOwnProfile ? 'Followers' : `${(paramUserId || '').split('@')[0]}'s Followers`}
                </h1>
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
                            {isOwnProfile && (
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
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function FollowersPage() {
    return (
        <Suspense fallback={<div className="max-w-3xl mx-auto p-6 text-bat-gray">Loading...</div>}>
            <FollowersContent />
        </Suspense>
    );
}
