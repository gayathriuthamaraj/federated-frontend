"use client";

import { useEffect, useState, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { getAdminLogs, AdminLogEntry } from '../api/admin';

const PAGE_SIZE = 50;

const ACTION_COLORS: Record<string, string> = {
    BADGE_ASSIGNED:        'var(--cyan)',
    BADGE_REVOKED:         'var(--red)',
    MODERATOR_ASSIGNED:    'var(--green)',
    MODERATOR_REMOVED:     'var(--amber)',
    MODERATION_TOGGLED:    'var(--amber)',
    SETTINGS_UPDATED:      'var(--green)',
};

export default function AdminLogsPage() {
    const [logs, setLogs]               = useState<AdminLogEntry[]>([]);
    const [count, setCount]             = useState(0);
    const [offset, setOffset]           = useState(0);
    const [actorFilter, setActorFilter] = useState('');
    const [loading, setLoading]         = useState(false);
    const [error, setError]             = useState('');

    const load = useCallback(async (off: number, actor: string) => {
        setLoading(true);
        setError('');
        try {
            const data = await getAdminLogs({
                limit:  PAGE_SIZE,
                offset: off,
                actor:  actor || undefined,
            });
            setLogs(data.logs ?? []);
            setCount(data.count ?? 0);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load admin logs');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(offset, actorFilter); }, [offset, actorFilter, load]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setOffset(0);
        load(0, actorFilter);
    };

    const totalPages  = Math.ceil(count / PAGE_SIZE);
    const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

    return (
        <AdminLayout>
            <div>
                {/* Header */}
                <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-ghost)', letterSpacing: '0.12em', marginBottom: 4 }}>
                        {'// ADMINISTRATION'}
                    </div>
                    <h1 className="term-header term-glow" style={{ fontSize: '1.4rem', letterSpacing: '0.12em' }}>
                        ADMIN ACTIVITY LOG
                    </h1>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
                        All administrator actions — badge assignments, revocations, moderator changes, and settings updates.
                    </p>
                </div>

                {/* Filter bar */}
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                    <input
                        type="text"
                        placeholder="Filter by admin actor..."
                        value={actorFilter}
                        onChange={e => setActorFilter(e.target.value)}
                        style={{
                            flex: 1,
                            background: 'var(--bg-raised)',
                            border: '1px solid var(--border)',
                            color: 'var(--text)',
                            padding: '6px 10px',
                            fontSize: '0.75rem',
                            fontFamily: 'var(--font-mono)',
                            outline: 'none',
                        }}
                    />
                    <button
                        type="submit"
                        style={{
                            background: 'var(--green-faint)',
                            border: '1px solid var(--green)',
                            color: 'var(--green)',
                            padding: '6px 16px',
                            fontSize: '0.72rem',
                            fontFamily: 'var(--font-mono)',
                            cursor: 'pointer',
                            letterSpacing: '0.1em',
                        }}
                    >
                        SEARCH
                    </button>
                    {actorFilter && (
                        <button
                            type="button"
                            onClick={() => { setActorFilter(''); setOffset(0); }}
                            style={{
                                background: 'transparent',
                                border: '1px solid var(--border)',
                                color: 'var(--text-muted)',
                                padding: '6px 12px',
                                fontSize: '0.72rem',
                                fontFamily: 'var(--font-mono)',
                                cursor: 'pointer',
                            }}
                        >
                            CLEAR
                        </button>
                    )}
                </form>

                {/* Stats */}
                <div style={{ fontSize: '0.65rem', color: 'var(--text-ghost)', marginBottom: 12 }}>
                    {count > 0
                        ? `Showing ${offset + 1}–${Math.min(offset + PAGE_SIZE, count)} of ${count} events`
                        : 'No admin activity recorded yet'}
                </div>

                {/* Error */}
                {error && (
                    <div style={{ padding: '8px 12px', background: '#1a0000', border: '1px solid var(--red)', color: 'var(--red)', fontSize: '0.75rem', marginBottom: 16 }}>
                        {error}
                    </div>
                )}

                {/* Table */}
                <div className="term-panel" style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                {['TIME', 'ACTION', 'ACTOR', 'TARGET', 'DETAIL'].map(h => (
                                    <th key={h} style={{
                                        padding: '8px 12px',
                                        textAlign: 'left',
                                        fontSize: '0.62rem',
                                        letterSpacing: '0.1em',
                                        color: 'var(--text-ghost)',
                                        fontWeight: 600,
                                        whiteSpace: 'nowrap',
                                    }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading && (
                                <tr>
                                    <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-ghost)' }}>
                                        Loading...
                                    </td>
                                </tr>
                            )}
                            {!loading && logs.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-ghost)' }}>
                                        No admin activity recorded yet.
                                    </td>
                                </tr>
                            )}
                            {!loading && logs.map(entry => (
                                <tr
                                    key={entry.id}
                                    style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                >
                                    <td style={{ padding: '7px 12px', color: 'var(--text-ghost)', whiteSpace: 'nowrap' }}>
                                        {new Date(entry.created_at).toISOString().replace('T', ' ').slice(0, 19)}
                                    </td>
                                    <td style={{ padding: '7px 12px', whiteSpace: 'nowrap' }}>
                                        <span style={{
                                            color: ACTION_COLORS[entry.action] ?? 'var(--text)',
                                            fontWeight: 600,
                                            fontSize: '0.68rem',
                                            letterSpacing: '0.08em',
                                        }}>
                                            {entry.action}
                                        </span>
                                    </td>
                                    <td style={{ padding: '7px 12px', color: 'var(--cyan)', fontFamily: 'var(--font-mono)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {entry.actor || '—'}
                                    </td>
                                    <td style={{ padding: '7px 12px', color: 'var(--text-dim)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {entry.target_id || '—'}
                                    </td>
                                    <td style={{ padding: '7px 12px', color: 'var(--text-dim)', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {entry.detail || '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 16, alignItems: 'center', fontSize: '0.72rem' }}>
                        <button
                            onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                            disabled={offset === 0}
                            style={{
                                background: 'var(--bg-raised)',
                                border: '1px solid var(--border)',
                                color: offset === 0 ? 'var(--text-ghost)' : 'var(--text)',
                                padding: '5px 12px',
                                fontFamily: 'var(--font-mono)',
                                cursor: offset === 0 ? 'default' : 'pointer',
                                fontSize: '0.7rem',
                            }}
                        >
                            ← PREV
                        </button>
                        <span style={{ color: 'var(--text-muted)' }}>
                            Page {currentPage} / {totalPages}
                        </span>
                        <button
                            onClick={() => setOffset(offset + PAGE_SIZE)}
                            disabled={offset + PAGE_SIZE >= count}
                            style={{
                                background: 'var(--bg-raised)',
                                border: '1px solid var(--border)',
                                color: offset + PAGE_SIZE >= count ? 'var(--text-ghost)' : 'var(--text)',
                                padding: '5px 12px',
                                fontFamily: 'var(--font-mono)',
                                cursor: offset + PAGE_SIZE >= count ? 'default' : 'pointer',
                                fontSize: '0.7rem',
                            }}
                        >
                            NEXT →
                        </button>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
