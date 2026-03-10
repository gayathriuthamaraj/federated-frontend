"use client";
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ModLayout from '../components/ModLayout';
import { listReports, resolveReport, Report } from '../api/moderator';
import { Flag, CheckCircle, RefreshCw, AlertTriangle, Clock, Filter } from 'lucide-react';

type ResolveState = 'idle' | 'resolving' | 'done';

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

function ReportCard({ report, username, onResolved }: {
    report: Report;
    username: string;
    onResolved: (id: number) => void;
}) {
    const [state, setState] = useState<ResolveState>('idle');
    const [error, setError] = useState('');
    const isPending = report.status === 'pending';

    const handle = async () => {
        if (!isPending || state !== 'idle') return;
        setState('resolving');
        setError('');
        try {
            await resolveReport(report.id, username);
            setState('done');
            setTimeout(() => onResolved(report.id), 800);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to resolve');
            setState('idle');
        }
    };

    const isDone = state === 'done';

    return (
        <div className="post-card" style={isDone ? { borderColor: 'var(--green)', opacity: 0.55 } : {}}>

            {/* Header row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span className={`dot ${isPending ? 'dot-amber' : 'dot-green'}`} />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-ghost)' }}>REPORT</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: 'var(--cyan)' }}>#{report.id}</span>
                    <span className={`badge ${isPending ? 'badge-amber' : 'badge-green'}`}>
                        {isPending ? 'PENDING' : 'RESOLVED'}
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                    <Clock size={11} style={{ color: 'var(--text-ghost)' }} />
                    <span className="time">{timeAgo(report.created_at)}</span>
                </div>
            </div>

            {/* Reporter */}
            <div style={{ display: 'flex', gap: 8, fontSize: '0.73rem' }}>
                <span style={{ color: 'var(--text-ghost)', minWidth: 90 }}>REPORTER</span>
                <span className="author">@{report.reporter_id.split('@')[0]}</span>
                {report.reporter_id.includes('@') && (
                    <span style={{ color: 'var(--text-ghost)', fontSize: '0.65rem', marginLeft: 2 }}>
                        [{report.reporter_id.split('@')[1]}]
                    </span>
                )}
            </div>

            {/* Target */}
            <div style={{ display: 'flex', gap: 8, fontSize: '0.73rem', flexWrap: 'wrap' }}>
                <span style={{ color: 'var(--text-ghost)', minWidth: 90 }}>TARGET REF</span>
                <span style={{ color: 'var(--amber)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {report.target_ref}
                </span>
                {report.target_server && (
                    <span style={{ color: 'var(--text-ghost)', fontSize: '0.65rem' }}>
                        via {report.target_server}
                    </span>
                )}
            </div>

            {/* Reason */}
            <div style={{ display: 'flex', gap: 8, fontSize: '0.73rem' }}>
                <span style={{ color: 'var(--text-ghost)', minWidth: 90 }}>REASON</span>
                <span className="body" style={{ fontSize: '0.8rem' }}>{report.reason}</span>
            </div>

            {/* Resolved info */}
            {!isPending && report.resolved_by && (
                <div style={{ display: 'flex', gap: 8, fontSize: '0.7rem' }}>
                    <span style={{ color: 'var(--text-ghost)', minWidth: 90 }}>RESOLVED BY</span>
                    <span style={{ color: 'var(--green)' }}>@{report.resolved_by}</span>
                    {report.resolved_at && (
                        <span style={{ color: 'var(--text-ghost)', fontSize: '0.65rem' }}>
                            · {timeAgo(report.resolved_at)}
                        </span>
                    )}
                </div>
            )}

            {error && (
                <div className="error-msg" style={{ fontSize: '0.68rem', padding: '5px 10px' }}>
                    ERR › {error}
                </div>
            )}

            {/* Action */}
            {isPending && (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    {isDone ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'var(--green)', fontFamily: 'monospace', letterSpacing: '0.06em' }}>
                            <CheckCircle size={12} /> RESOLVED
                        </span>
                    ) : (
                        <button
                            className="btn btn-green"
                            onClick={handle}
                            disabled={state !== 'idle'}
                            style={{ fontSize: '0.7rem', padding: '6px 14px' }}
                        >
                            <CheckCircle size={13} />
                            {state === 'resolving' ? 'RESOLVING…' : 'MARK RESOLVED'}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

type FilterMode = 'pending' | 'all';

export default function ReportsPage() {
    const router = useRouter();
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [loadedAt, setLoadedAt] = useState('');
    const [filter, setFilter] = useState<FilterMode>('pending');
    const [username, setUsername] = useState('');

    const load = useCallback(async (showSpinner = false) => {
        if (showSpinner) setRefreshing(true);
        try {
            const data = await listReports();
            setReports(data);
            setError('');
            setLoadedAt(new Date().toLocaleTimeString());
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to load reports';
            setError(msg);
            if (msg.toLowerCase().includes('authenticated') || msg.includes('403')) {
                router.push('/login');
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [router]);

    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('mod_token') : null;
        if (!token) { router.push('/login'); return; }
        setUsername(localStorage.getItem('mod_username') || 'unknown');
        load();
        const interval = setInterval(() => load(), 60000);
        return () => clearInterval(interval);
    }, [load, router]);

    const handleResolved = useCallback((id: number) => {
        setReports(prev => prev.map(r => r.id === id ? { ...r, status: 'resolved' as const } : r));
    }, []);

    const displayed = filter === 'pending'
        ? reports.filter(r => r.status === 'pending')
        : reports;

    const pendingCount = reports.filter(r => r.status === 'pending').length;
    const resolvedCount = reports.filter(r => r.status === 'resolved').length;

    return (
        <ModLayout>
            {/* Page header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <Flag size={16} style={{ color: 'var(--amber)' }} />
                        <h1 className="term-header" style={{ fontSize: '0.95rem' }}>REPORTS DASHBOARD</h1>
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-ghost)' }}>
                        User-submitted abuse reports · auto-refresh 60s
                        {loadedAt && <span style={{ marginLeft: 10 }}>· last updated {loadedAt}</span>}
                    </div>
                </div>

                <button
                    className="btn btn-ghost"
                    onClick={() => load(true)}
                    disabled={refreshing}
                    style={{ fontSize: '0.7rem', padding: '6px 14px' }}
                >
                    <RefreshCw size={13} style={refreshing ? { animation: 'spin 1s linear infinite' } : {}} />
                    {refreshing ? 'REFRESHING…' : 'REFRESH'}
                </button>
            </div>

            {/* Stats bar */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                {[
                    { label: 'PENDING', value: pendingCount, color: 'var(--amber)', dotClass: 'dot-amber' },
                    { label: 'RESOLVED', value: resolvedCount, color: 'var(--green)', dotClass: 'dot-green' },
                    { label: 'TOTAL', value: reports.length, color: 'var(--cyan)', dotClass: 'dot-green' },
                ].map(({ label, value, color, dotClass }) => (
                    <div key={label} className="panel" style={{ padding: '12px 20px', minWidth: 110 }}>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-ghost)', letterSpacing: '0.1em', marginBottom: 6 }}>{label}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className={`dot ${dotClass}`} />
                            <span style={{ fontSize: '1.4rem', color, fontFamily: 'var(--font-display)', lineHeight: 1 }}>{loading ? '—' : value}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter tabs */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 20, alignItems: 'center' }}>
                <Filter size={12} style={{ color: 'var(--text-ghost)' }} />
                <span style={{ fontSize: '0.65rem', color: 'var(--text-ghost)', marginRight: 4 }}>SHOW:</span>
                {(['pending', 'all'] as FilterMode[]).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`btn ${filter === f ? 'btn-green' : 'btn-ghost'}`}
                        style={{ fontSize: '0.68rem', padding: '4px 12px' }}
                    >
                        {f === 'pending' ? `PENDING (${pendingCount})` : `ALL (${reports.length})`}
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-ghost)' }}>
                    <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
                    <div style={{ fontSize: '0.75rem', letterSpacing: '0.1em' }}>LOADING REPORTS…</div>
                </div>
            ) : error ? (
                <div className="panel" style={{ borderColor: 'rgba(255,23,68,0.3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--red)', marginBottom: 8 }}>
                        <AlertTriangle size={15} />
                        <span style={{ fontSize: '0.75rem', letterSpacing: '0.08em' }}>FETCH ERROR</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{error}</div>
                    <button className="btn btn-ghost" onClick={() => load(true)} style={{ marginTop: 12, fontSize: '0.68rem' }}>
                        RETRY
                    </button>
                </div>
            ) : displayed.length === 0 ? (
                <div className="panel" style={{ textAlign: 'center', padding: '48px 20px' }}>
                    <CheckCircle size={28} style={{ color: 'var(--green)', opacity: 0.5, marginBottom: 12 }} />
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
                        {filter === 'pending' ? 'NO PENDING REPORTS' : 'NO REPORTS YET'}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-ghost)', marginTop: 8 }}>
                        {filter === 'pending'
                            ? 'All reports have been resolved. Good work.'
                            : 'No reports have been submitted yet.'}
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {displayed.map(report => (
                        <ReportCard
                            key={report.id}
                            report={report}
                            username={username}
                            onResolved={handleResolved}
                        />
                    ))}
                </div>
            )}

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </ModLayout>
    );
}
