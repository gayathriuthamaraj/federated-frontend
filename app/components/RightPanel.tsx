"use client";

import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';

interface SuggestedUser {
    identity: { user_id: string };
    profile: { display_name: string; user_id: string };
}

interface TrendingTag {
    tag: string;
    post_count: number;
    servers?: string[];
}

export default function RightPanel() {
    const { identity } = useAuth();
    const [suggested, setSuggested] = useState<SuggestedUser[]>([]);
    const [trends, setTrends] = useState<TrendingTag[]>([]);

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

    useEffect(() => {
        if (!identity) return;
        fetch(`${identity.home_server}/hashtags/trending/global?window=24h&limit=5`)
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (d?.hashtags) setTrends(d.hashtags.slice(0, 5)); })
            .catch(() => {});
    }, [identity]);

    const serverHost = identity?.home_server
        ?.replace(/^https?:\/\//, '')
        ?.replace(/\/$/, '') || 'local';

    return (
        <div className="space-y-4">
            {/* Trending now */}
            {trends.length > 0 && (
                <div
                    className="rounded-2xl overflow-hidden animate-fade-up"
                    style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
                >
                    <div className="px-4 py-3.5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
                        <div className="flex items-center gap-2">
                            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" style={{ color: "var(--amber)" }}>
                                <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6h-6z" />
                            </svg>
                            <h2 className="font-bold text-[14px]" style={{ color: "var(--text)" }}>Trending now</h2>
                        </div>
                        <Link href="/trends" className="text-xs font-medium transition-colors" style={{ color: "var(--amber)" }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "0.7"}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
                        >
                            See all →
                        </Link>
                    </div>
                    <div>
                        {trends.map((t, i) => (
                            <Link
                                key={t.tag}
                                href={`/explore?tab=hashtag&tag=${encodeURIComponent(t.tag)}`}
                                className="flex items-center justify-between px-4 py-2.5 transition-all duration-200 group animate-fade-up"
                                style={{ animationDelay: `${i * 60}ms`, borderBottom: i < trends.length - 1 ? "1px solid var(--border)" : "none" }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ""}
                            >
                                <div>
                                    <div className="text-[10px] font-semibold tracking-wider uppercase" style={{ color: "var(--text-ghost)" }}>
                                        #{i + 1} · Trending
                                    </div>
                                    <div className="font-bold text-sm mt-0.5" style={{ color: "var(--text)" }}>
                                        {t.tag}
                                    </div>
                                    <div className="text-xs mt-0.5" style={{ color: "var(--text-ghost)" }}>
                                        {(t.post_count ?? 0).toLocaleString()} posts
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    {t.servers && t.servers.length > 1 && (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: "var(--amber-faint)", color: "var(--amber)" }}>
                                            {t.servers.length} servers
                                        </span>
                                    )}
                                    <svg className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--amber)" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </Link>
                        ))}
                    </div>
                    <Link href="/trends"
                        className="flex items-center justify-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors"
                        style={{ borderTop: "1px solid var(--border)", color: "var(--amber)" }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--amber-faint)"}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ""}
                    >
                        Show more trends
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>
                </div>
            )}

            {/* Who to follow */}
            {suggested.length > 0 && (
                <div
                    className="rounded-2xl overflow-hidden animate-fade-up delay-100"
                    style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
                >
                    <div className="px-4 py-3.5 flex items-center gap-2" style={{ borderBottom: "1px solid var(--border)" }}>
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" style={{ color: "var(--amber)" }}>
                            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                        </svg>
                        <h2 className="font-bold text-[14px]" style={{ color: "var(--text)" }}>Who to follow</h2>
                    </div>
                    <div>
                        {suggested.map((u, i) => {
                            const userId = u.identity.user_id;
                            const displayName = u.profile.display_name || userId;
                            const name = displayName.split('@')[0];
                            const handle = userId.split('@')[0];
                            const initial = name[0]?.toUpperCase() || '?';
                            return (
                                <Link
                                    key={userId}
                                    href={`/search?user_id=${encodeURIComponent(userId)}`}
                                    className="flex items-center gap-3 px-4 py-2.5 transition-all duration-200 group animate-fade-up"
                                    style={{ animationDelay: `${i * 60 + 100}ms`, borderBottom: i < suggested.length - 1 ? "1px solid var(--border)" : "none" }}
                                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"}
                                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ""}
                                >
                                    <div
                                        className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 transition-all duration-200 group-hover:scale-110"
                                        style={{ background: "linear-gradient(135deg, var(--amber-light), var(--amber))", boxShadow: "0 2px 8px var(--amber-glow)" }}
                                    >
                                        {initial}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-sm truncate leading-5" style={{ color: "var(--text)" }}>{name}</div>
                                        <div className="text-xs truncate" style={{ color: "var(--text-ghost)" }}>@{handle}</div>
                                    </div>
                                    <button
                                        onClick={e => e.preventDefault()}
                                        className="px-3 py-1 rounded-full text-xs font-semibold opacity-0 group-hover:opacity-100 transition-all duration-200"
                                        style={{ background: "var(--amber-faint)", color: "var(--amber)", border: "1px solid var(--amber)", transform: "scale(0.9)" }}
                                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--amber)"; (e.currentTarget as HTMLElement).style.color = "#fff"; (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
                                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--amber-faint)"; (e.currentTarget as HTMLElement).style.color = "var(--amber)"; (e.currentTarget as HTMLElement).style.transform = "scale(0.9)"; }}
                                    >
                                        Follow
                                    </button>
                                </Link>
                            );
                        })}
                    </div>
                    <Link href="/search"
                        className="flex items-center justify-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors"
                        style={{ borderTop: "1px solid var(--border)", color: "var(--amber)" }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--amber-faint)"}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ""}
                    >
                        Discover more people
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>
                </div>
            )}

            {/* Server info */}
            <div className="px-1 animate-fade-up delay-200">
                <div className="text-[11px] space-y-1 leading-relaxed" style={{ color: "var(--text-ghost)" }}>
                    <div className="font-bold tracking-widest mb-1.5 uppercase text-[10px]" style={{ color: "var(--amber)" }}>
                        GOTHAM NETWORK
                    </div>
                    <div>Connected to <span style={{ color: "var(--text-muted)" }}>{serverHost}</span></div>
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                        {[{ href: "/explore?tab=users", label: "People" }, { href: "/search", label: "Search" }, { href: "/profile", label: "Profile" }, { href: "/settings", label: "Settings" }].map(({ href, label }) => (
                            <Link key={href} href={href}
                                className="px-2 py-0.5 rounded-md text-[11px] transition-colors"
                                style={{ background: "var(--bg-raised)", color: "var(--text-muted)" }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--amber)"; (e.currentTarget as HTMLElement).style.background = "var(--amber-faint)"; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; (e.currentTarget as HTMLElement).style.background = "var(--bg-raised)"; }}
                            >
                                {label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
