"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../components/AdminLayout';
import { getAllUsers, getAdminAccountLinks, AdminAccountLink } from '../api/admin';
import { Search } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface UserData {
    identity: { user_id: string; home_server: string };
    profile: { display_name: string; bio?: string };
}

// ── Graph helpers ─────────────────────────────────────────────────────────────

interface GraphNode {
    id: string;
    isCenter: boolean;
    x: number;
    y: number;
    status: 'center' | 'confirmed' | 'pending';
}

interface GraphEdge {
    fromId: string;
    toId: string;
    status: string;
    linkId: string;
}

function buildAdminGraph(focusUserId: string | null, links: AdminAccountLink[]) {
    const W = 620, H = 380, CX = 310, CY = 190, R = 145;
    const nodes = new Map<string, GraphNode>();
    const edges: GraphEdge[] = [];

    if (links.length === 0) {
        if (focusUserId) {
            nodes.set(focusUserId, { id: focusUserId, isCenter: true, x: CX, y: CY, status: 'center' });
        }
        return { nodes: Array.from(nodes.values()), edges, W, H };
    }

    // Collect all unique node IDs
    const allIds = new Set<string>();
    links.forEach(l => { allIds.add(l.requester_id); allIds.add(l.target_id); });

    // Place focus node (or allIds[0] as center if no focus)
    const centerId = focusUserId && allIds.has(focusUserId) ? focusUserId : (focusUserId || Array.from(allIds)[0]);
    nodes.set(centerId, { id: centerId, isCenter: true, x: CX, y: CY, status: 'center' });

    // Place peers radially
    const peers = Array.from(allIds).filter(id => id !== centerId);
    peers.forEach((id, i) => {
        const angle = (2 * Math.PI * i) / Math.max(1, peers.length) - Math.PI / 2;
        nodes.set(id, { id, isCenter: false, x: CX + R * Math.cos(angle), y: CY + R * Math.sin(angle), status: 'confirmed' });
    });

    // Edges
    links.forEach(l => {
        edges.push({ fromId: l.requester_id, toId: l.target_id, status: l.status, linkId: l.id });
    });

    return { nodes: Array.from(nodes.values()), edges, W, H };
}

function shortId(userId: string): string {
    return (userId.split('@')[0] || userId).slice(0, 14);
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function AccountGraphPage() {
    const router = useRouter();
    const [users, setUsers] = useState<UserData[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [links, setLinks] = useState<AdminAccountLink[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [loadingGraph, setLoadingGraph] = useState(false);
    const [viewMode, setViewMode] = useState<'user' | 'all'>('user');
    const [error, setError] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) { router.push('/login'); return; }
        loadUsers();
    }, [router]);

    useEffect(() => {
        setFilteredUsers(
            searchTerm
                ? users.filter(u =>
                    u.profile.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    u.identity.user_id.toLowerCase().includes(searchTerm.toLowerCase())
                )
                : users
        );
    }, [searchTerm, users]);

    const loadUsers = async () => {
        try {
            const data = await getAllUsers();
            setUsers(data.users || []);
            setFilteredUsers(data.users || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load users');
        } finally {
            setLoadingUsers(false);
        }
    };

    const loadGraph = useCallback(async (userId: string | null) => {
        setLoadingGraph(true);
        setError('');
        try {
            const data = await getAdminAccountLinks(userId || '');
            setLinks(data.links || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load graph');
            setLinks([]);
        } finally {
            setLoadingGraph(false);
        }
    }, []);

    const handleSelectUser = (userId: string) => {
        setSelectedUserId(userId);
        setViewMode('user');
        loadGraph(userId);
    };

    const handleShowAll = () => {
        setSelectedUserId(null);
        setViewMode('all');
        loadGraph(null);
    };

    const graph = buildAdminGraph(selectedUserId, links);

    const confirmed = links.filter(l => l.status === 'confirmed');
    const pending = links.filter(l => l.status === 'pending');

    return (
        <AdminLayout>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <h1 className="term-header" style={{ fontSize: '1.4rem', marginBottom: 4 }}>
                            ACCOUNT GRAPH
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            Identity link graph — select a user or view the full server graph
                        </p>
                    </div>
                    <button
                        onClick={handleShowAll}
                        style={{
                            padding: '8px 18px',
                            background: viewMode === 'all' ? 'var(--yellow)' : 'transparent',
                            color: viewMode === 'all' ? 'var(--bg)' : 'var(--yellow)',
                            border: '1px solid var(--yellow)',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontFamily: 'var(--font-mono)',
                            letterSpacing: '0.08em',
                        }}
                    >
                        SHOW ALL LINKS
                    </button>
                </div>

                {error && (
                    <div style={{ padding: '10px 14px', background: 'rgba(255,50,50,0.1)', border: '1px solid rgba(255,50,50,0.3)', borderRadius: 4, color: '#ff6060', fontSize: '0.8rem' }}>
                        {error}
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 20, alignItems: 'start' }}>

                    {/* ── Left: user list ─────────────────────────────────── */}
                    <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden', maxHeight: 520, display: 'flex', flexDirection: 'column' }}>
                        {/* Search */}
                        <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', position: 'relative' }}>
                            <Search size={13} style={{ position: 'absolute', left: 22, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-ghost)' }} />
                            <input
                                type="text"
                                placeholder="filter users…"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%',
                                    paddingLeft: 24,
                                    paddingRight: 8,
                                    paddingTop: 5,
                                    paddingBottom: 5,
                                    background: 'var(--bg)',
                                    border: '1px solid var(--border-dim)',
                                    borderRadius: 3,
                                    color: 'var(--text)',
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '0.75rem',
                                    outline: 'none',
                                }}
                            />
                        </div>
                        {/* List */}
                        <div style={{ overflowY: 'auto', flex: 1 }}>
                            {loadingUsers ? (
                                <div style={{ padding: 16, color: 'var(--text-ghost)', fontSize: '0.75rem' }}>Loading…</div>
                            ) : filteredUsers.length === 0 ? (
                                <div style={{ padding: 16, color: 'var(--text-ghost)', fontSize: '0.75rem' }}>No users found</div>
                            ) : (
                                filteredUsers.map(u => {
                                    const uid = u.identity.user_id;
                                    const active = selectedUserId === uid && viewMode === 'user';
                                    return (
                                        <button
                                            key={uid}
                                            onClick={() => handleSelectUser(uid)}
                                            style={{
                                                width: '100%',
                                                padding: '10px 14px',
                                                textAlign: 'left',
                                                background: active ? 'rgba(245,197,24,0.12)' : 'transparent',
                                                borderLeft: active ? '2px solid var(--yellow)' : '2px solid transparent',
                                                borderBottom: '1px solid var(--border-dim)',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: 2,
                                            }}
                                        >
                                            <span style={{ color: active ? 'var(--yellow)' : 'var(--text)', fontSize: '0.8rem', fontWeight: 600 }}>
                                                {u.profile.display_name || uid.split('@')[0]}
                                            </span>
                                            <span style={{ color: 'var(--text-ghost)', fontSize: '0.68rem' }}>{uid}</span>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* ── Right: SVG graph + link list ───────────────────── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                        {/* Status bar */}
                        <div style={{ padding: '8px 14px', background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 4, fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                            <span>
                                {viewMode === 'all' ? '[ ALL USERS ]' : selectedUserId ? `[ ${selectedUserId} ]` : '[ SELECT A USER ]'}
                            </span>
                            <span>Confirmed: <span style={{ color: 'var(--yellow)' }}>{confirmed.length}</span></span>
                            <span>Pending: <span style={{ color: 'var(--text-muted)' }}>{pending.length}</span></span>
                            <span>Total: <span style={{ color: 'var(--green)' }}>{links.length}</span></span>
                        </div>

                        {/* SVG graph */}
                        <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 4, padding: 16, minHeight: 220 }}>
                            {loadingGraph ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--text-ghost)', fontSize: '0.8rem' }}>
                                    <span style={{ color: 'var(--green)' }}>⟳</span>&nbsp;Loading graph…
                                </div>
                            ) : !selectedUserId && viewMode === 'user' ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--text-ghost)', fontSize: '0.8rem' }}>
                                    ← Select a user to view their link graph
                                </div>
                            ) : (
                                <>
                                    <svg viewBox={`0 0 ${graph.W} ${graph.H}`} width="100%" style={{ maxHeight: 380, minHeight: 180 }}>
                                        {/* Edges */}
                                        {graph.edges.map(edge => {
                                            const from = graph.nodes.find(n => n.id === edge.fromId);
                                            const to = graph.nodes.find(n => n.id === edge.toId);
                                            if (!from || !to) return null;
                                            const isConfirmed = edge.status === 'confirmed';
                                            return (
                                                <line
                                                    key={edge.linkId}
                                                    x1={from.x} y1={from.y}
                                                    x2={to.x} y2={to.y}
                                                    stroke={isConfirmed ? '#F5C518' : '#666'}
                                                    strokeWidth={2}
                                                    strokeDasharray={isConfirmed ? undefined : '6 4'}
                                                    strokeOpacity={0.7}
                                                />
                                            );
                                        })}
                                        {/* Nodes */}
                                        {graph.nodes.map(node => {
                                            const stroke = node.status === 'center' ? '#F5C518' : node.status === 'confirmed' ? '#F5C518' : '#888';
                                            const r = node.isCenter ? 32 : 26;
                                            return (
                                                <g key={node.id} transform={`translate(${node.x},${node.y})`}>
                                                    <circle r={r} fill={node.isCenter ? '#1a1a0f' : '#111'} stroke={stroke} strokeWidth={node.isCenter ? 3 : 2} />
                                                    <text textAnchor="middle" dominantBaseline="central" fontSize={r * 0.48} fill={stroke} fontWeight="bold">
                                                        {shortId(node.id).slice(0, 2).toUpperCase()}
                                                    </text>
                                                    <text y={r + 14} textAnchor="middle" fontSize={9} fill="#aaa">
                                                        {shortId(node.id)}
                                                    </text>
                                                </g>
                                            );
                                        })}
                                    </svg>
                                    {/* Legend */}
                                    <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: '0.7rem', color: 'var(--text-ghost)' }}>
                                        <span>─── confirmed</span>
                                        <span style={{ opacity: 0.6 }}>- - - pending</span>
                                    </div>
                                    {links.length === 0 && (
                                        <div style={{ textAlign: 'center', color: 'var(--text-ghost)', fontSize: '0.8rem', marginTop: 8 }}>
                                            No account links for this user
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Link table */}
                        {links.length > 0 && (
                            <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                                <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', fontSize: '0.7rem', color: 'var(--text-ghost)', letterSpacing: '0.1em' }}>
                                    LINK REGISTRY — {links.length} record{links.length !== 1 ? 's' : ''}
                                </div>
                                <div style={{ overflowX: 'auto', maxHeight: 280, overflowY: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid var(--border-dim)', color: 'var(--text-ghost)' }}>
                                                {['REQUESTER', 'TARGET', 'STATUS', 'CREATED'].map(h => (
                                                    <th key={h} style={{ padding: '8px 14px', textAlign: 'left', letterSpacing: '0.08em', fontWeight: 500 }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {links.map(l => (
                                                <tr key={l.id} style={{ borderBottom: '1px solid var(--border-dim)' }}>
                                                    <td style={{ padding: '8px 14px', color: 'var(--text)' }}>{l.requester_id}</td>
                                                    <td style={{ padding: '8px 14px', color: 'var(--text)' }}>{l.target_id}</td>
                                                    <td style={{ padding: '8px 14px' }}>
                                                        <span style={{
                                                            padding: '2px 8px',
                                                            borderRadius: 3,
                                                            fontSize: '0.68rem',
                                                            background: l.status === 'confirmed' ? 'rgba(245,197,24,0.15)' : l.status === 'pending' ? 'rgba(100,100,100,0.15)' : 'rgba(255,80,80,0.1)',
                                                            color: l.status === 'confirmed' ? 'var(--yellow)' : l.status === 'pending' ? 'var(--text-muted)' : '#f66',
                                                            letterSpacing: '0.06em',
                                                        }}>
                                                            {l.status.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '8px 14px', color: 'var(--text-ghost)' }}>
                                                        {new Date(l.created_at).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
