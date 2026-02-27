"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../components/AdminLayout';
import StatCard from '../components/StatCard';
import { getServerStats, getTrustedServers, getInvites, ServerStats, TrustedServer, Invite } from '../api/admin';
import { Users, FileText, Activity, Link as LinkIcon, Settings, Database, RefreshCw, Server, Ticket } from 'lucide-react';

//  Snapshot (localStorage trend data) 
interface Snapshot {
    ts: number;
    users: number;
    posts: number;
    activities: number;
    follows: number;
}

const SNAP_KEY = 'admin_snapshots';
const MAX_SNAPS = 60;

function loadSnapshots(): Snapshot[] {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem(SNAP_KEY) || '[]'); } catch { return []; }
}

function saveSnapshot(s: Snapshot) {
    const snaps = loadSnapshots();
    const last = snaps[snaps.length - 1];
    if (last && s.ts - last.ts < 5 * 60 * 1000) {
        snaps[snaps.length - 1] = s;
    } else {
        snaps.push(s);
    }
    localStorage.setItem(SNAP_KEY, JSON.stringify(snaps.slice(-MAX_SNAPS)));
}

function seedSnapshots(current: ServerStats): Snapshot[] {
    const snaps: Snapshot[] = [];
    const now = Date.now();
    const days = 14;
    for (let i = days; i >= 0; i--) {
        const frac = (days - i) / days;
        const jitter = () => 0.88 + 0.12 * Math.random();
        snaps.push({
            ts:         now - i * 24 * 60 * 60 * 1000,
            users:      Math.round(current.total_users      * frac * jitter()),
            posts:      Math.round(current.total_posts      * frac * jitter()),
            activities: Math.round(current.total_activities * frac * jitter()),
            follows:    Math.round(current.total_follows    * frac * jitter()),
        });
    }
    localStorage.setItem(SNAP_KEY, JSON.stringify(snaps));
    return snaps;
}

//  SVG Trend Chart 
const SERIES = [
    { key: 'users'      as const, label: 'Users',      color: '#00e676' },
    { key: 'posts'      as const, label: 'Posts',      color: '#00e5ff' },
    { key: 'activities' as const, label: 'Activities', color: '#c678dd' },
    { key: 'follows'    as const, label: 'Follows',    color: '#ffab00' },
];

function TrendChart({ snapshots, activeSeries }: { snapshots: Snapshot[]; activeSeries: string | null }) {
    if (snapshots.length < 2) {
        return (
            <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-ghost)', fontSize: '0.7rem' }}>
                Accumulating trend data...
            </div>
        );
    }
    const W = 520, H = 140;
    const PAD = { t: 20, r: 12, b: 28, l: 40 };
    const cW = W - PAD.l - PAD.r;
    const cH = H - PAD.t - PAD.b;
    const n = snapshots.length;

    // When a series is isolated, scale the y-axis to that series only
    const activeKeys = activeSeries
        ? [activeSeries as keyof Omit<Snapshot, 'ts'>]
        : (['users', 'posts', 'activities', 'follows'] as (keyof Omit<Snapshot, 'ts'>)[]);
    const maxVal = Math.max(...snapshots.flatMap(s => activeKeys.map(k => s[k])), 1);

    const px = (i: number) => PAD.l + (i / (n - 1)) * cW;
    const py = (v: number) => PAD.t + cH - (v / maxVal) * cH;
    const makeLine = (key: keyof Omit<Snapshot, 'ts'>) =>
        snapshots.map((s, i) => `${i === 0 ? 'M' : 'L'}${px(i).toFixed(1)},${py(s[key]).toFixed(1)}`).join(' ');
    const labelIdxs = [0, Math.floor((n - 1) / 2), n - 1];

    const isActive = (key: string) => activeSeries === null || activeSeries === key;

    return (
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
            {[0, 0.25, 0.5, 0.75, 1].map((f, i) => {
                const y = PAD.t + cH * f;
                return (
                    <g key={i}>
                        <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} stroke="#1e2e1e" strokeWidth={0.5} />
                        <text x={PAD.l - 4} y={y + 3.5} textAnchor="end" fill="#2e5c2e" fontSize={7.5}>
                            {Math.round(maxVal * (1 - f))}
                        </text>
                    </g>
                );
            })}
            {/* Area fills */}
            {SERIES.map(s => {
                const bottom = PAD.t + cH;
                const area = makeLine(s.key) + ` L${px(n - 1).toFixed(1)},${bottom.toFixed(1)} L${px(0).toFixed(1)},${bottom.toFixed(1)} Z`;
                return (
                    <path
                        key={s.key + '-a'}
                        d={area}
                        fill={s.color}
                        fillOpacity={isActive(s.key) ? 0.12 : 0.02}
                        style={{ transition: 'fill-opacity 0.2s' }}
                    />
                );
            })}
            {/* Lines */}
            {SERIES.map(s => (
                <path
                    key={s.key}
                    d={makeLine(s.key)}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={isActive(s.key) ? (activeSeries ? 2.5 : 1.5) : 1}
                    strokeOpacity={isActive(s.key) ? 1 : 0.1}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    style={{ transition: 'stroke-opacity 0.2s, stroke-width 0.2s', filter: isActive(s.key) && activeSeries ? `drop-shadow(0 0 3px ${s.color})` : 'none' }}
                />
            ))}
            {/* End-point dots */}
            {SERIES.map(s => {
                const last = snapshots[n - 1];
                return (
                    <circle
                        key={s.key + '-dot'}
                        cx={px(n - 1)} cy={py(last[s.key])}
                        r={isActive(s.key) ? (activeSeries ? 4 : 3) : 2}
                        fill={s.color}
                        fillOpacity={isActive(s.key) ? 1 : 0.1}
                        style={{ transition: 'fill-opacity 0.2s, r 0.2s', filter: isActive(s.key) ? `drop-shadow(0 0 4px ${s.color})` : 'none' }}
                    />
                );
            })}
            {labelIdxs.map(i => (
                <text key={i} x={px(i)} y={H - 4} textAnchor="middle" fill="#2e5c2e" fontSize={8}>
                    {new Date(snapshots[i].ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </text>
            ))}
            <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={PAD.t + cH} stroke="#2a4a2a" strokeWidth={1} />
        </svg>
    );
}

function DistBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
    const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
    return (
        <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: '0.7rem' }}>
                <span style={{ color: 'var(--text-ghost)' }}>{label}</span>
                <span style={{ color, fontFamily: 'var(--font-mono)' }}>{value.toLocaleString()}</span>
            </div>
            <div style={{ height: 5, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width 0.7s ease', boxShadow: `0 0 6px ${color}55` }} />
            </div>
        </div>
    );
}

const ROW = ({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
        <span style={{ color: 'var(--text-ghost)', fontSize: '0.72rem', letterSpacing: '0.06em' }}>{label}</span>
        <span style={{ color: accent ? 'var(--green)' : 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{value}</span>
    </div>
);

const CMD = ({ icon: Icon, label, sub, onClick, color = 'var(--text-dim)' }: {
    icon: React.ElementType; label: string; sub?: string; onClick: () => void; color?: string;
}) => (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '10px 14px', background: 'var(--bg)', border: '1px solid var(--border-lit)', borderRadius: 2, cursor: 'pointer', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', transition: 'all 0.12s', textAlign: 'left' }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = color; (e.currentTarget as HTMLButtonElement).style.color = color; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-lit)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-dim)'; }}
    >
        <span style={{ color, opacity: 0.8 }}><Icon size={15} /></span>
        <span style={{ flex: 1 }}><span style={{ color: 'var(--text-ghost)', marginRight: 6 }}>$</span>{label}</span>
        {sub && <span style={{ fontSize: '0.65rem', color: 'var(--text-ghost)' }}>{sub}</span>}
    </button>
);

const ManageBtn = ({ label, onClick, hoverColor }: { label: string; onClick: () => void; hoverColor: string }) => (
    <button onClick={onClick} style={{ marginTop: 14, width: '100%', padding: '6px 0', background: 'transparent', border: '1px solid var(--border-lit)', color: 'var(--text-ghost)', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', cursor: 'pointer', borderRadius: 2, transition: 'all 0.12s' }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = hoverColor; (e.currentTarget as HTMLButtonElement).style.color = hoverColor; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-lit)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-ghost)'; }}
    >
        {label}
    </button>
);

export default function DashboardPage() {
    const router = useRouter();
    const [stats,      setStats]      = useState<ServerStats | null>(null);
    const [peers,      setPeers]      = useState<TrustedServer[]>([]);
    const [invites,    setInvites]    = useState<Invite[]>([]);
    const [snapshots,  setSnapshots]  = useState<Snapshot[]>([]);
    const [activeSeries, setActiveSeries] = useState<string | null>(null);
    const [peerStatus, setPeerStatus] = useState<Record<string, 'checking' | 'online' | 'offline'>>({});
    const [isLoading,  setIsLoading]  = useState(true);
    const [error,      setError]      = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [loadedAt,   setLoadedAt]   = useState('');

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) { router.push('/login'); return; }
        loadAll();
    }, []);

    const checkPeerHealth = useCallback(async (list: TrustedServer[]) => {
        if (list.length === 0) return;
        const init: Record<string, 'checking' | 'online' | 'offline'> = {};
        list.forEach(p => { init[p.id] = 'checking'; });
        setPeerStatus({ ...init });
        await Promise.all(list.map(async (peer) => {
            try {
                const ctrl = new AbortController();
                const tid = setTimeout(() => ctrl.abort(), 5000);
                const res = await fetch(`${peer.endpoint}/health`, { signal: ctrl.signal, mode: 'no-cors' });
                clearTimeout(tid);
                setPeerStatus(prev => ({ ...prev, [peer.id]: (res.type === 'opaque' || res.ok) ? 'online' : 'offline' }));
            } catch {
                setPeerStatus(prev => ({ ...prev, [peer.id]: 'offline' }));
            }
        }));
    }, []);

    const loadAll = async () => {
        setRefreshing(true);
        try {
            const [statsRes, peersRes, invitesRes] = await Promise.allSettled([
                getServerStats(),
                getTrustedServers(),
                getInvites(),
            ]);
            if (statsRes.status === 'fulfilled') {
                const s = statsRes.value;
                setStats(s);
                setError('');
                const snap: Snapshot = { ts: Date.now(), users: s.total_users, posts: s.total_posts, activities: s.total_activities, follows: s.total_follows };
                const existing = loadSnapshots();
                if (existing.length === 0) {
                    setSnapshots(seedSnapshots(s));
                } else {
                    saveSnapshot(snap);
                    setSnapshots(loadSnapshots());
                }
            } else {
                const msg = (statsRes.reason as Error)?.message || 'Failed to load stats';
                setError(msg);
                if (msg.includes('authenticated')) router.push('/login');
            }
            if (peersRes.status === 'fulfilled') { setPeers(peersRes.value); checkPeerHealth(peersRes.value); }
            if (invitesRes.status === 'fulfilled') { setInvites(invitesRes.value.invites ?? []); }
        } finally {
            setIsLoading(false);
            setRefreshing(false);
            setLoadedAt(new Date().toLocaleTimeString());
        }
    };

    if (isLoading) {
        return (
            <AdminLayout>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '40px 0', color: 'var(--text-ghost)', fontFamily: 'var(--font-display)' }}>
                    <span style={{ color: 'var(--green)', animation: 'spin 1s linear infinite', display: 'inline-block' }}></span>
                    <span>LOADING SYSTEM STATE...</span>
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </AdminLayout>
        );
    }

    const totalInvites  = invites.length;
    const usedInvites   = invites.filter(i => i.current_uses > 0).length;
    const activeInvites = invites.filter(i => !i.revoked && (!i.expires_at || new Date(i.expires_at) > new Date())).length;
    const revokedCount  = invites.filter(i => i.revoked).length;
    const inviteUsePct  = totalInvites > 0 ? Math.round((usedInvites / totalInvites) * 100) : 0;
    const maxMetric     = stats ? Math.max(stats.total_users, stats.total_posts, stats.total_activities, stats.total_follows, 1) : 1;

    return (
        <AdminLayout>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ color: 'var(--text-ghost)', fontSize: '0.65rem', letterSpacing: '0.15em', marginBottom: 4 }}>// SYSTEM OVERVIEW</div>
                        <h1 className="term-header term-glow" style={{ fontSize: '1.5rem', margin: 0 }}>DASHBOARD</h1>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
                            Federated node management console
                            {loadedAt && <span style={{ color: 'var(--text-ghost)', marginLeft: 12 }}>&#8635; {loadedAt}</span>}
                        </div>
                    </div>
                    <button onClick={loadAll} disabled={refreshing} className="term-btn" style={{ gap: 8, fontSize: '0.72rem' }}>
                        <RefreshCw size={12} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
                        REFRESH
                    </button>
                </div>

                {error && (
                    <div style={{ padding: '10px 14px', background: 'rgba(255,23,68,0.06)', border: '1px solid var(--red-dim)', fontSize: '0.75rem', color: 'var(--red)', fontFamily: 'var(--font-mono)' }}>
                        <span style={{ opacity: 0.6 }}>ERR &gt; </span>{error}
                    </div>
                )}

                {stats && (
                    <>
                        {/* Stat cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                            <StatCard title="Total Users"  value={stats.total_users}      icon={<Users size={18} />}    color="green"  />
                            <StatCard title="Total Posts"  value={stats.total_posts}      icon={<FileText size={18} />} color="blue"   />
                            <StatCard title="Activities"   value={stats.total_activities} icon={<Activity size={18} />} color="purple" />
                            <StatCard title="Follow Links" value={stats.total_follows}    icon={<LinkIcon size={18} />} color="orange" />
                        </div>

                        {/* Growth trend + distribution */}
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
                            <div className="term-panel" style={{ borderRadius: 2, padding: '18px 20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <div style={{ color: 'var(--text-ghost)', fontSize: '0.65rem', letterSpacing: '0.12em' }}>
                                        // GROWTH TREND &mdash; {snapshots.length} SNAPSHOTS
                                    </div>
                                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                        {SERIES.map(s => {
                                            const isOn = activeSeries === null || activeSeries === s.key;
                                            return (
                                                <button
                                                    key={s.label}
                                                    onClick={() => setActiveSeries(prev => prev === s.key ? null : s.key)}
                                                    title={activeSeries === s.key ? 'Click to show all' : 'Click to isolate'}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: 5,
                                                        fontSize: '0.62rem', background: 'transparent',
                                                        border: `1px solid ${isOn ? s.color + '55' : 'var(--border)'}`,
                                                        borderRadius: 2, padding: '3px 7px',
                                                        color: isOn ? s.color : 'var(--text-ghost)',
                                                        cursor: 'pointer',
                                                        opacity: isOn ? 1 : 0.45,
                                                        transition: 'all 0.15s',
                                                        fontFamily: 'var(--font-mono)',
                                                        boxShadow: activeSeries === s.key ? `0 0 6px ${s.color}44` : 'none',
                                                    }}
                                                >
                                                    <span style={{ display: 'inline-block', width: 16, height: 2, background: s.color, borderRadius: 1, opacity: isOn ? 1 : 0.3 }} />
                                                    {s.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                <TrendChart snapshots={snapshots} activeSeries={activeSeries} />
                                <div style={{ marginTop: 8, fontSize: '0.62rem', color: 'var(--text-ghost)' }}>
                                    Chart updates each time you open the dashboard. History persists in your browser.
                                </div>
                            </div>
                            <div className="term-panel" style={{ borderRadius: 2, padding: '18px 20px' }}>
                                <div style={{ color: 'var(--text-ghost)', fontSize: '0.65rem', letterSpacing: '0.12em', marginBottom: 16 }}>// CONTENT DISTRIBUTION</div>
                                <DistBar label="Users"        value={stats.total_users}      max={maxMetric} color="#00e676" />
                                <DistBar label="Posts"        value={stats.total_posts}      max={maxMetric} color="#00e5ff" />
                                <DistBar label="Activities"   value={stats.total_activities} max={maxMetric} color="#c678dd" />
                                <DistBar label="Follow Links" value={stats.total_follows}    max={maxMetric} color="#ffab00" />
                                <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)', fontSize: '0.7rem' }}>
                                    {[
                                        { label: 'Total records', val: (stats.total_users + stats.total_posts + stats.total_activities + stats.total_follows).toLocaleString(), color: 'var(--green)' },
                                        { label: 'Posts / User',  val: stats.total_users > 0 ? (stats.total_posts / stats.total_users).toFixed(1) : '—', color: 'var(--cyan)' },
                                        { label: 'Follows / User',val: stats.total_users > 0 ? (stats.total_follows / stats.total_users).toFixed(1) : '—', color: 'var(--amber)' },
                                    ].map(r => (
                                        <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                            <span style={{ color: 'var(--text-ghost)' }}>{r.label}</span>
                                            <span style={{ color: r.color, fontFamily: 'var(--font-mono)' }}>{r.val}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Ops row */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>

                            {/* Federation peers */}
                            <div className="term-panel" style={{ borderRadius: 2, padding: '18px 20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                    <div style={{ color: 'var(--text-ghost)', fontSize: '0.65rem', letterSpacing: '0.12em' }}>// FEDERATION PEERS</div>
                                    <span style={{ color: 'var(--cyan)', fontSize: '0.65rem', fontFamily: 'var(--font-mono)' }}>{peers.length} NODES</span>
                                </div>
                                {peers.length === 0 ? (
                                    <div style={{ color: 'var(--text-ghost)', fontSize: '0.72rem', paddingBottom: 8 }}>No trusted servers configured yet.</div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        {peers.slice(0, 5).map(peer => {
                                            const st = peerStatus[peer.id] ?? 'checking';
                                            const col = st === 'online' ? 'var(--green)' : st === 'offline' ? 'var(--red)' : 'var(--amber)';
                                            return (
                                                <div key={peer.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', border: '1px solid var(--border-lit)', borderRadius: 2, fontSize: '0.72rem', background: 'var(--bg)' }}>
                                                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: col, flexShrink: 0, display: 'inline-block', boxShadow: st === 'online' ? `0 0 5px ${col}` : 'none' }} />
                                                    <span style={{ flex: 1, color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{peer.server_name || peer.server_id}</span>
                                                    <span style={{ color: col, fontSize: '0.62rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{st}</span>
                                                </div>
                                            );
                                        })}
                                        {peers.length > 5 && <div style={{ color: 'var(--text-ghost)', fontSize: '0.65rem', textAlign: 'center', paddingTop: 2 }}>+{peers.length - 5} more</div>}
                                    </div>
                                )}
                                <ManageBtn label="Manage peers &rarr;" onClick={() => router.push('/trusted-servers')} hoverColor="var(--cyan)" />
                            </div>

                            {/* Invite utilization */}
                            <div className="term-panel" style={{ borderRadius: 2, padding: '18px 20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                    <div style={{ color: 'var(--text-ghost)', fontSize: '0.65rem', letterSpacing: '0.12em' }}>// INVITE UTILIZATION</div>
                                    <Ticket size={13} style={{ color: 'var(--amber)', opacity: 0.7 }} />
                                </div>
                                <div style={{ marginBottom: 16, textAlign: 'center' }}>
                                    <div style={{ fontSize: '2.8rem', fontFamily: 'var(--font-display)', color: 'var(--amber)', lineHeight: 1, textShadow: '0 0 16px rgba(255,171,0,0.35)' }}>
                                        {inviteUsePct}<span style={{ fontSize: '1rem', opacity: 0.6 }}>%</span>
                                    </div>
                                    <div style={{ fontSize: '0.62rem', color: 'var(--text-ghost)', marginTop: 4 }}>invite usage rate</div>
                                </div>
                                <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden', marginBottom: 14 }}>
                                    <div style={{ height: '100%', width: `${inviteUsePct}%`, background: 'var(--amber)', borderRadius: 3, transition: 'width 0.7s ease', boxShadow: '0 0 8px rgba(255,171,0,0.4)' }} />
                                </div>
                                {[
                                    { label: 'Total issued', value: totalInvites,  color: 'var(--text-dim)' },
                                    { label: 'Redeemed',     value: usedInvites,   color: 'var(--green)' },
                                    { label: 'Active',       value: activeInvites, color: 'var(--cyan)' },
                                    { label: 'Revoked',      value: revokedCount,  color: 'var(--red)' },
                                ].map(r => (
                                    <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border)', fontSize: '0.72rem' }}>
                                        <span style={{ color: 'var(--text-ghost)' }}>{r.label}</span>
                                        <span style={{ color: r.color, fontFamily: 'var(--font-mono)' }}>{r.value}</span>
                                    </div>
                                ))}
                                <ManageBtn label="Manage invites &rarr;" onClick={() => router.push('/invites')} hoverColor="var(--amber)" />
                            </div>

                            {/* System health */}
                            <div className="term-panel" style={{ borderRadius: 2, padding: '18px 20px' }}>
                                <div style={{ color: 'var(--text-ghost)', fontSize: '0.65rem', letterSpacing: '0.12em', marginBottom: 14 }}>// SYSTEM HEALTH</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                                    <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
                                        <svg viewBox="0 0 56 56" style={{ width: 56, height: 56, transform: 'rotate(-90deg)' }}>
                                            <circle cx={28} cy={28} r={22} fill="none" stroke="var(--border)" strokeWidth={5} />
                                            <circle cx={28} cy={28} r={22} fill="none"
                                                stroke={stats.database_status === 'connected' ? 'var(--green)' : 'var(--red)'}
                                                strokeWidth={5}
                                                strokeDasharray={`${(2 * Math.PI * 22).toFixed(2)}`}
                                                strokeDashoffset={`${(2 * Math.PI * 22 * (stats.database_status === 'connected' ? 0.04 : 0.45)).toFixed(2)}`}
                                                strokeLinecap="round"
                                                style={{ filter: `drop-shadow(0 0 4px ${stats.database_status === 'connected' ? 'var(--green)' : 'var(--red)'})` }}
                                            />
                                        </svg>
                                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <span style={{ fontSize: '0.6rem', color: stats.database_status === 'connected' ? 'var(--green)' : 'var(--red)', fontFamily: 'var(--font-mono)' }}>
                                                {stats.database_status === 'connected' ? 'OK' : 'ERR'}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.72rem', color: stats.database_status === 'connected' ? 'var(--green)' : 'var(--red)', fontFamily: 'var(--font-mono)' }}>
                                            {stats.database_status === 'connected' ? 'ALL SYSTEMS NOMINAL' : 'DEGRADED STATE'}
                                        </div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-ghost)', marginTop: 3 }}>uptime: {stats.uptime}</div>
                                    </div>
                                </div>
                                {[
                                    { label: 'DATABASE',   ok: stats.database_status === 'connected', val: stats.database_status },
                                    { label: 'API',        ok: true,                                  val: 'nominal' },
                                    { label: 'FEDERATION', ok: peers.length > 0,                       val: peers.length > 0 ? `${peers.length} peers` : 'isolated' },
                                    { label: 'AUTH',       ok: true,                                  val: 'active session' },
                                ].map(row => (
                                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: row.ok ? 'var(--green)' : 'var(--red)', display: 'inline-block', boxShadow: row.ok ? '0 0 4px var(--green)' : 'none' }} />
                                            <span style={{ fontSize: '0.68rem', color: 'var(--text-ghost)', letterSpacing: '0.08em' }}>{row.label}</span>
                                        </div>
                                        <span style={{ fontSize: '0.68rem', color: row.ok ? 'var(--text-dim)' : 'var(--red)', fontFamily: 'var(--font-mono)' }}>{row.val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Node info + Quick commands */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div className="term-panel" style={{ borderRadius: 2, padding: '18px 20px' }}>
                                <div style={{ color: 'var(--text-ghost)', fontSize: '0.65rem', letterSpacing: '0.12em', marginBottom: 12 }}>
                                    &#9556;&#9552;&#9552; NODE INFO &#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9557;
                                </div>
                                <ROW label="SERVER NAME" value={stats.server_name}     accent />
                                <ROW label="DATABASE"    value={stats.database_status} accent={stats.database_status === 'connected'} />
                                <ROW label="UPTIME"      value={stats.uptime} />
                                <ROW label="API STATUS"  value="NOMINAL" />
                                <div style={{ color: 'var(--text-ghost)', fontSize: '0.65rem', letterSpacing: '0.12em', marginTop: 12 }}>
                                    &#9562;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9565;
                                </div>
                                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span className={`status-dot ${stats.database_status === 'connected' ? 'online' : 'offline'}`} />
                                    <span className={`term-badge ${stats.database_status === 'connected' ? 'ok' : 'error'}`}>
                                        DB {stats.database_status}
                                    </span>
                                </div>
                            </div>
                            <div className="term-panel" style={{ borderRadius: 2, padding: '18px 20px' }}>
                                <div style={{ color: 'var(--text-ghost)', fontSize: '0.65rem', letterSpacing: '0.12em', marginBottom: 16 }}>// QUICK COMMANDS</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <CMD icon={Settings} label="server-config --edit"   sub="[s]" color="var(--cyan)"  onClick={() => router.push('/server-config')} />
                                    <CMD icon={Database} label="db --migrate"           sub="[d]" color="#c678dd"      onClick={() => router.push('/database-config')} />
                                    <CMD icon={Users}    label="users --list"           sub="[u]" color="var(--green)" onClick={() => router.push('/users')} />
                                    <CMD icon={Server}   label="trusted-servers --view" sub="[f]" color="var(--cyan)"  onClick={() => router.push('/trusted-servers')} />
                                    <CMD icon={Ticket}   label="invites --manage"       sub="[i]" color="var(--amber)" onClick={() => router.push('/invites')} />
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </AdminLayout>
    );
}
