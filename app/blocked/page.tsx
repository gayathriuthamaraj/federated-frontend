"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import BlockButton from '../components/BlockButton';
import Link from 'next/link';

interface UserBlock {
    id: number;
    blocker_user_id: string;
    blocked_user_id: string;
    reason?: string;
    created_at: string;
    expires_at?: string;
    is_active: boolean;
}

export default function BlockedUsersPage() {
    const { identity, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [blocks, setBlocks] = useState<UserBlock[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !identity) router.push('/login');
    }, [identity, authLoading, router]);

    const fetchBlocked = useCallback(async () => {
        if (!identity) return;
        setLoading(true);
        try {
            const res = await fetch(
                `${identity.home_server}/users/blocked?blocker_user_id=${encodeURIComponent(identity.user_id)}`
            );
            if (res.ok) {
                const data = await res.json();
                setBlocks(data.blocked_users ?? []);
            }
        } catch (err) {
            console.error('Failed to fetch blocked users:', err);
        } finally {
            setLoading(false);
        }
    }, [identity]);

    useEffect(() => {
        if (identity) fetchBlocked();
    }, [identity, fetchBlocked]);

    const handleUnblocked = (blockedUserID: string) => {
        setBlocks(prev => prev.filter(b => b.blocked_user_id !== blockedUserID));
    };

    if (authLoading || !identity) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-bat-black">
                <div className="w-8 h-8 border-2 border-bat-yellow/40 border-t-bat-yellow rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bat-black text-bat-gray">
            {/* Header */}
            <div className="sticky top-0 z-20 border-b border-bat-dark/60 bg-bat-black/90 backdrop-blur-sm px-4 py-3 flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 rounded-full hover:bg-white/5 transition-colors text-bat-gray/60 hover:text-bat-gray"
                    aria-label="Go back"
                >
                    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                        <path d="M7.414 13l5.043 5.04-1.414 1.42L3.586 12l7.457-7.46 1.414 1.42L7.414 11H21v2H7.414z" />
                    </svg>
                </button>
                <div>
                    <h1 className="font-bold text-lg text-bat-gray leading-tight">Blocked Accounts</h1>
                    <p className="text-bat-gray/50 text-xs">@{identity.user_id.split('@')[0]}</p>
                </div>
            </div>

            <div className="max-w-xl mx-auto">
                {loading && (
                    <div className="flex justify-center py-16">
                        <div className="w-8 h-8 border-2 border-bat-yellow/40 border-t-bat-yellow rounded-full animate-spin" />
                    </div>
                )}

                {!loading && blocks.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center px-8">
                        <div className="w-16 h-16 rounded-full bg-bat-dark flex items-center justify-center">
                            <svg viewBox="0 0 24 24" className="h-8 w-8 fill-current text-bat-gray/30">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-4.42 3.58-8 8-8 1.85 0 3.55.63 4.9 1.69L5.69 16.9C4.63 15.55 4 13.85 4 12zm8 8c-1.85 0-3.55-.63-4.9-1.69L18.31 7.1C19.37 8.45 20 10.15 20 12c0 4.42-3.58 8-8 8z" />
                            </svg>
                        </div>
                        <p className="text-bat-gray/50 text-sm">You haven&apos;t blocked anyone yet.</p>
                    </div>
                )}

                {!loading && blocks.length > 0 && (
                    <ul className="divide-y divide-bat-dark/40">
                        {blocks.map(block => (
                            <li
                                key={block.id}
                                className="flex items-center gap-4 px-4 py-4 hover:bg-white/[0.018] transition-colors"
                            >
                                {/* Avatar placeholder */}
                                <Link
                                    href={`/search?user_id=${encodeURIComponent(block.blocked_user_id)}`}
                                    className="flex h-11 w-11 shrink-0 rounded-full bg-bat-dark border border-bat-yellow/20 items-center justify-center text-bat-yellow font-bold text-lg select-none hover:scale-105 hover:border-bat-yellow/50 transition-all"
                                >
                                    {block.blocked_user_id.split('@')[0][0].toUpperCase()}
                                </Link>

                                {/* User info */}
                                <div className="flex-1 min-w-0">
                                    <Link
                                        href={`/search?user_id=${encodeURIComponent(block.blocked_user_id)}`}
                                        className="font-semibold text-bat-gray text-sm hover:underline truncate block"
                                    >
                                        {block.blocked_user_id.split('@')[0]}
                                    </Link>
                                    <p className="text-bat-gray/50 text-xs truncate">{block.blocked_user_id}</p>
                                    {block.reason && (
                                        <p className="text-bat-gray/40 text-xs mt-0.5 truncate">
                                            Reason: {block.reason}
                                        </p>
                                    )}
                                    <p className="text-bat-gray/30 text-xs mt-0.5">
                                        Blocked {new Date(block.created_at).toLocaleDateString(undefined, {
                                            month: 'short', day: 'numeric', year: 'numeric'
                                        })}
                                    </p>
                                </div>

                                {/* Unblock button */}
                                <BlockButton
                                    targetUser={block.blocked_user_id}
                                    isBlocked={true}
                                    onSuccess={blocked => {
                                        if (!blocked) handleUnblocked(block.blocked_user_id);
                                    }}
                                />
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
