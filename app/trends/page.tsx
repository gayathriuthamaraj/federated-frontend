"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

interface TrendingTag {
    tag: string;
    post_count: number;
    servers?: string[];
}

type TimeWindow = '24h' | '7d' | '30d' | 'all';

const WINDOWS: { label: string; value: TimeWindow }[] = [
    { label: '24h', value: '24h' },
    { label: '7 days', value: '7d' },
    { label: '30 days', value: '30d' },
    { label: 'All time', value: 'all' },
];

export default function TrendsPage() {
    const router = useRouter();
    const { identity } = useAuth();
    const [timeWindow, setTimeWindow] = useState<TimeWindow>('24h');
    const [trends, setTrends] = useState<TrendingTag[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!identity) return;
        setLoading(true);
        fetch(`${identity.home_server}/hashtags/trending/global?window=${timeWindow}&limit=25`)
            .then(r => r.ok ? r.json() : null)
            .then(d => { setTrends(d?.hashtags ?? []); setLoading(false); })
            .catch(() => { setTrends([]); setLoading(false); });
    }, [identity, timeWindow]);

    return (
        <div className="min-h-screen bg-bat-black text-gray-100">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-bat-black/90 backdrop-blur border-b border-bat-dark/60 px-4 py-3">
                <button
                    onClick={() => router.back()}
                    className="text-bat-gray/50 hover:text-bat-yellow transition-colors mb-2 flex items-center gap-1 text-sm"
                >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                        <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                    </svg>
                    Back
                </button>
                <h1 className="text-xl font-bold text-gray-100">Trends</h1>
                <p className="text-[13px] text-bat-gray/45 mt-0.5">What&apos;s happening globally</p>
            </div>

            {/* Time window tabs */}
            <div className="flex gap-1 px-4 pt-4 pb-2">
                {WINDOWS.map(w => (
                    <button
                        key={w.value}
                        onClick={() => setTimeWindow(w.value)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                            timeWindow === w.value
                                ? 'bg-bat-yellow text-bat-black'
                                : 'bg-bat-dark/40 text-bat-gray/60 hover:bg-bat-dark/70 hover:text-gray-200'
                        }`}
                    >
                        {w.label}
                    </button>
                ))}
            </div>

            {/* Trends list */}
            <div className="px-4 pb-8">
                {loading ? (
                    <div className="space-y-3 mt-4">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="bg-bat-dark/30 rounded-xl p-4 animate-pulse">
                                <div className="h-3 bg-bat-dark/60 rounded w-1/4 mb-2" />
                                <div className="h-5 bg-bat-dark/60 rounded w-1/3 mb-1.5" />
                                <div className="h-3 bg-bat-dark/60 rounded w-1/5" />
                            </div>
                        ))}
                    </div>
                ) : trends.length === 0 ? (
                    <div className="mt-12 text-center text-bat-gray/40">
                        <svg viewBox="0 0 24 24" className="w-10 h-10 fill-current mx-auto mb-3 opacity-40">
                            <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6h-6z" />
                        </svg>
                        <p className="text-sm">No trends found for this period.</p>
                    </div>
                ) : (
                    <div className="mt-2 divide-y divide-bat-dark/40">
                        {trends.map((t, i) => (
                            <button
                                key={t.tag}
                                onClick={() => router.push(`/explore?tab=hashtag&tag=${encodeURIComponent(t.tag)}`)}
                                className="w-full text-left flex items-start gap-4 py-4 hover:bg-bat-dark/20 transition-colors rounded-lg px-2 -mx-2"
                            >
                                <span className="text-bat-yellow/40 font-bold text-lg w-7 shrink-0 pt-0.5 text-right">{i + 1}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[11px] text-bat-gray/35 mb-0.5">
                                        Trending · {timeWindow === 'all' ? 'All time' : `Last ${timeWindow}`}
                                    </div>
                                    <div className="font-bold text-bat-yellow text-base truncate">{t.tag}</div>
                                    <div className="text-bat-gray/45 text-xs mt-0.5">
                                        {t.post_count.toLocaleString()} post{t.post_count !== 1 ? 's' : ''}
                                        {t.servers && t.servers.length > 1 && (
                                            <span className="ml-2 text-bat-yellow/40">
                                                · {t.servers.length} servers
                                            </span>
                                        )}
                                    </div>
                                    {t.servers && t.servers.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1.5">
                                            {t.servers.slice(0, 4).map(s => (
                                                <span key={s} className="text-[10px] bg-bat-dark/60 text-bat-gray/50 px-1.5 py-0.5 rounded-full border border-bat-dark">
                                                    {s}
                                                </span>
                                            ))}
                                            {t.servers.length > 4 && (
                                                <span className="text-[10px] text-bat-gray/40">+{t.servers.length - 4} more</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current text-bat-gray/25 shrink-0 mt-1">
                                    <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
                                </svg>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
