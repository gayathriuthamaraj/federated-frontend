"use client";

import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';

interface SuggestedUser {
    identity: { user_id: string };
    profile: { display_name: string; user_id: string };
}

export default function RightPanel() {
    const { identity } = useAuth();
    const [suggested, setSuggested] = useState<SuggestedUser[]>([]);

    useEffect(() => {
        if (!identity) return;
        fetch(`${identity.home_server}/users/suggested?limit=5`)
            .then(r => r.ok ? r.json() : null)
            .then(d => {
                if (d?.users) {
                    setSuggested(d.users.filter((u: SuggestedUser) => u?.identity?.user_id).slice(0, 5));
                }
            })
            .catch(() => {});
    }, [identity]);

    const serverHost = identity?.home_server
        ?.replace(/^https?:\/\//, '')
        ?.replace(/\/$/, '') || 'local';

    return (
        <div className="space-y-5">
            {/* Who to follow */}
            {suggested.length > 0 && (
                <div className="bg-bat-dark/35 rounded-2xl border border-bat-dark overflow-hidden">
                    <div className="px-4 py-3">
                        <h2 className="font-bold text-gray-100 text-[15px]">Who to follow</h2>
                    </div>
                    <div className="divide-y divide-bat-dark/60">
                        {suggested.map(u => {
                            const userId = u.identity.user_id;
                            const displayName = u.profile.display_name || userId;
                            const name = displayName.split('@')[0];
                            const handle = userId.split('@')[0];
                            const initial = name[0]?.toUpperCase() || '?';
                            return (
                                <Link
                                    key={userId}
                                    href={`/profile?user_id=${encodeURIComponent(userId)}`}
                                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-bat-dark/60 transition-colors group"
                                >
                                    <div className="w-9 h-9 rounded-full bg-bat-yellow/15 border border-bat-yellow/20 flex items-center justify-center text-bat-yellow font-bold text-sm shrink-0 group-hover:border-bat-yellow/40 transition-colors">
                                        {initial}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-gray-200 text-sm truncate leading-5">{name}</div>
                                        <div className="text-bat-gray/45 text-xs truncate">@{handle}</div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                    <Link
                        href="/search"
                        className="block px-4 py-3 text-bat-blue text-sm hover:bg-bat-dark/60 transition-colors border-t border-bat-dark/60"
                    >
                        Show more
                    </Link>
                </div>
            )}

            {/* Server info chip */}
            <div className="px-2">
                <div className="text-[11px] text-bat-gray/25 space-y-1 leading-relaxed">
                    <div className="font-bold text-bat-yellow/40 tracking-wider mb-1.5">GOTHAM NETWORK</div>
                    <div>Connected to <span className="text-bat-gray/40">{serverHost}</span></div>
                    <div className="mt-2">
                        <Link href="/explore?tab=users" className="hover:text-bat-gray/50 transition-colors">People</Link>
                        {' · '}
                        <Link href="/search" className="hover:text-bat-gray/50 transition-colors">Search</Link>
                        {' · '}
                        <Link href="/profile" className="hover:text-bat-gray/50 transition-colors">Profile</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
