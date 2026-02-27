"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../components/AdminLayout';
import StatCard from '../components/StatCard';
import { getServerStats, ServerStats } from '../api/admin';
import { Users, FileText, Activity, Link as LinkIcon, Settings, Database, RefreshCw } from 'lucide-react';

const ROW = ({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) => (
    <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '8px 0', borderBottom: '1px solid var(--border)',
    }}>
        <span style={{ color: 'var(--text-ghost)', fontSize: '0.72rem', letterSpacing: '0.06em' }}>{label}</span>
        <span style={{
            color: accent ? 'var(--green)' : 'var(--text-dim)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
        }}>{value}</span>
    </div>
);

const CMD = ({ icon: Icon, label, sub, onClick, color = 'var(--text-dim)' }: {
    icon: any; label: string; sub?: string; onClick: () => void; color?: string;
}) => (
    <button onClick={onClick} style={{
        display: 'flex', alignItems: 'center', gap: 12,
        width: '100%', padding: '10px 14px', background: 'var(--bg)',
        border: '1px solid var(--border-lit)', borderRadius: 2,
        cursor: 'pointer', color: 'var(--text-dim)',
        fontFamily: 'var(--font-mono)', fontSize: '0.75rem',
        transition: 'all 0.12s',
        textAlign: 'left',
    }}
        onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = color;
            (e.currentTarget as HTMLButtonElement).style.color = color;
        }}
        onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-lit)';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-dim)';
        }}
    >
        <span style={{ color, opacity: 0.8 }}><Icon size={15} /></span>
        <span style={{ flex: 1 }}>
            <span style={{ color: 'var(--text-ghost)', marginRight: 6 }}>$</span>
            {label}
        </span>
        {sub && <span style={{ fontSize: '0.65rem', color: 'var(--text-ghost)' }}>{sub}</span>}
    </button>
);

export default function DashboardPage() {
    const router = useRouter();
    const [stats, setStats] = useState<ServerStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) { router.push('/login'); return; }
        loadStats();
    }, [router]);

    const loadStats = async () => {
        setRefreshing(true);
        try {
            const data = await getServerStats();
            setStats(data);
            setError('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load stats');
            if (err instanceof Error && err.message.includes('authenticated')) router.push('/login');
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    if (isLoading) {
        return (
            <AdminLayout>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '40px 0', color: 'var(--text-ghost)', fontFamily: 'var(--font-display)' }}>
                    <span style={{ color: 'var(--green)' }}>⟳</span>
                    <span>LOADING SYSTEM STATE...</span>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                {/* ── Page header ─────────────────────────────────────── */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ color: 'var(--text-ghost)', fontSize: '0.65rem', letterSpacing: '0.15em', marginBottom: 4 }}>
                            // SYSTEM OVERVIEW
                        </div>
                        <h1 className="term-header term-glow" style={{ fontSize: '1.5rem', margin: 0 }}>
                            DASHBOARD
                        </h1>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
                            Federated node management console
                        </div>
                    </div>
                    <button
                        onClick={loadStats}
                        disabled={refreshing}
                        className="term-btn"
                        style={{ gap: 8, fontSize: '0.72rem' }}
                    >
                        <RefreshCw size={12} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
                        REFRESH
                    </button>
                </div>

                {error && (
                    <div style={{
                        padding: '10px 14px', background: 'rgba(255,23,68,0.06)',
                        border: '1px solid var(--red-dim)',
                        fontSize: '0.75rem', color: 'var(--red)',
                        fontFamily: 'var(--font-mono)',
                    }}>
                        <span style={{ opacity: 0.6 }}>ERR &gt; </span>{error}
                    </div>
                )}

                {stats && (
                    <>
                        {/* ── Stat grid ───────────────────────────────── */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                            <StatCard title="Total Users"      value={stats.total_users}      icon={<Users size={18} />}    color="green"  />
                            <StatCard title="Total Posts"      value={stats.total_posts}      icon={<FileText size={18} />} color="blue"   />
                            <StatCard title="Activities"       value={stats.total_activities} icon={<Activity size={18} />} color="purple" />
                            <StatCard title="Follow Links"     value={stats.total_follows}    icon={<LinkIcon size={18} />} color="orange" />
                        </div>

                        {/* ── Info + Actions row ──────────────────────── */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

                            {/* Server info panel */}
                            <div className="term-panel" style={{ borderRadius: 2, padding: '18px 20px' }}>
                                <div style={{ color: 'var(--text-ghost)', fontSize: '0.65rem', letterSpacing: '0.12em', marginBottom: 12 }}>
                                    ╔══ NODE INFO ═══════════════════════╗
                                </div>

                                <ROW label="SERVER NAME"      value={stats.server_name}      accent />
                                <ROW label="DATABASE"         value={stats.database_status}  accent={stats.database_status === 'connected'} />
                                <ROW label="UPTIME"           value={stats.uptime} />
                                <ROW label="API STATUS"       value="NOMINAL" />

                                <div style={{ color: 'var(--text-ghost)', fontSize: '0.65rem', letterSpacing: '0.12em', marginTop: 12 }}>
                                    ╚════════════════════════════════════╝
                                </div>

                                {/* DB status badge */}
                                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span className={`status-dot ${stats.database_status === 'connected' ? 'online' : 'offline'}`} />
                                    <span className={`term-badge ${stats.database_status === 'connected' ? 'ok' : 'error'}`}>
                                        DB {stats.database_status}
                                    </span>
                                </div>
                            </div>

                            {/* Quick actions as terminal commands */}
                            <div className="term-panel" style={{ borderRadius: 2, padding: '18px 20px' }}>
                                <div style={{ color: 'var(--text-ghost)', fontSize: '0.65rem', letterSpacing: '0.12em', marginBottom: 16 }}>
                                    // QUICK COMMANDS
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <CMD
                                        icon={Settings}
                                        label="server-config --edit"
                                        sub="[s]"
                                        color="var(--cyan)"
                                        onClick={() => router.push('/server-config')}
                                    />
                                    <CMD
                                        icon={Database}
                                        label="db --migrate"
                                        sub="[d]"
                                        color="#c678dd"
                                        onClick={() => router.push('/database-config')}
                                    />
                                    <CMD
                                        icon={Users}
                                        label="users --list"
                                        sub="[u]"
                                        color="var(--green)"
                                        onClick={() => router.push('/users')}
                                    />
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Spin animation */}
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </AdminLayout>
    );
}

