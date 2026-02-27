'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import {
    Globe, Link as LinkIcon, Clock, AlertCircle, Plus, X,
    Trash2, Wifi, Copy, Check, ChevronDown, ChevronUp, Eye, Shield,
} from 'lucide-react';

type NodeStatus = 'online' | 'offline' | 'unverified' | 'testing';

interface TrustedServer {
    id: string;
    server_id: string;
    server_name: string;
    public_key: string;
    endpoint: string;
    trusted_at: string;
}

interface ServerInfo {
    server_id: string;
    server_name: string;
    public_key: string;
    endpoint: string;
}

function getApiBaseUrl(): string {
    if (typeof window === 'undefined') return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
    const trusted = localStorage.getItem('trusted_server');
    if (trusted) {
        try {
            const d = JSON.parse(trusted);
            return d.server_url || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
        } catch { /* fall through */ }
    }
    return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
}

function keyFingerprint(key: string): string {
    if (!key) return '--------';
    const clean = key.replace(/[^a-fA-F0-9]/g, '');
    return (clean.substring(0, 8) || key.substring(0, 8)).toLowerCase();
}

const STATUS_LABEL: Record<NodeStatus, string> = {
    online: 'ONLINE',
    offline: 'OFFLINE',
    unverified: 'UNVERIFIED',
    testing: 'TESTING...',
};

const STATUS_COLOR: Record<NodeStatus, string> = {
    online: 'var(--green)',
    offline: 'var(--red)',
    unverified: 'var(--amber)',
    testing: 'var(--cyan)',
};

export default function TrustedServersPage() {
    const [servers, setServers] = useState<TrustedServer[]>([]);
    const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [showGuide, setShowGuide] = useState(false);
    const [nodeStatus, setNodeStatus] = useState<Record<string, NodeStatus>>({});
    const [keyModal, setKeyModal] = useState<{ name: string; key: string } | null>(null);
    const [copied, setCopied] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        server_id: '',
        server_name: '',
        public_key: '',
        endpoint: '',
    });

    useEffect(() => {
        fetchCurrentServerInfo();
        fetchTrustedServers();
    }, []);

    const fetchCurrentServerInfo = async () => {
        const baseUrl = getApiBaseUrl();
        const token = localStorage.getItem('admin_token');

        try {
            const res = await fetch(`${baseUrl}/server-info`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                const d = await res.json();
                setServerInfo({
                    server_id: d.server_id || d.id || 'unknown',
                    server_name: d.server_name || d.name || 'Local Node',
                    public_key: d.public_key || d.master_public_key || '',
                    endpoint: baseUrl,
                });
                return;
            }
        } catch { /* fall through */ }

        try {
            const res = await fetch(`${baseUrl}/admin/config/server`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                const d = await res.json();
                setServerInfo({
                    server_id: d.server_id || d.id || 'unknown',
                    server_name: d.server_name || 'Local Node',
                    public_key: d.public_key || '',
                    endpoint: baseUrl,
                });
                return;
            }
        } catch { /* fall through */ }

        try {
            const trusted = localStorage.getItem('trusted_server');
            if (trusted) {
                const d = JSON.parse(trusted);
                setServerInfo({
                    server_id: d.server_id || d.id || 'unknown',
                    server_name: d.server_name || 'Local Node',
                    public_key: d.public_key || '',
                    endpoint: d.server_url || baseUrl,
                });
                return;
            }
        } catch { /* ignore */ }

        setServerInfo({
            server_id: 'unknown',
            server_name: 'Local Node',
            public_key: '',
            endpoint: baseUrl,
        });
    };

    const fetchTrustedServers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('admin_token');
            const baseUrl = getApiBaseUrl();
            const res = await fetch(`${baseUrl}/admin/trusted-servers/list`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to fetch servers');
            const data = await res.json();
            const list: TrustedServer[] = data || [];
            setServers(list);
            const init: Record<string, NodeStatus> = {};
            list.forEach(s => { init[s.server_id] = 'unverified'; });
            setNodeStatus(init);
            if (list.length === 0) setShowGuide(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load servers');
        } finally {
            setLoading(false);
        }
    };

    const testConnection = async (endpoint: string, serverId: string) => {
        setNodeStatus(prev => ({ ...prev, [serverId]: 'testing' }));
        try {
            const token = localStorage.getItem('admin_token');
            const baseUrl = getApiBaseUrl();
            const res = await fetch(`${baseUrl}/admin/trusted-servers/test`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ endpoint }),
            });
            setNodeStatus(prev => ({ ...prev, [serverId]: res.ok ? 'online' : 'offline' }));
        } catch {
            setNodeStatus(prev => ({ ...prev, [serverId]: 'offline' }));
        }
    };

    const handleAddServer = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const token = localStorage.getItem('admin_token');
            const baseUrl = getApiBaseUrl();
            const res = await fetch(`${baseUrl}/admin/trusted-servers/add`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (!res.ok) {
                const text = await res.text();
                let msg = 'Failed to add server';
                try { msg = JSON.parse(text).error || text || msg; } catch { msg = text || msg; }
                throw new Error(msg);
            }
            setFormData({ server_id: '', server_name: '', public_key: '', endpoint: '' });
            setShowAddForm(false);
            fetchTrustedServers();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add server');
        }
    };

    const handleRemoveServer = async (server_id: string) => {
        if (!confirm('Remove this trusted server?')) return;
        try {
            const token = localStorage.getItem('admin_token');
            const baseUrl = getApiBaseUrl();
            const res = await fetch(`${baseUrl}/admin/trusted-servers/remove?server_id=${encodeURIComponent(server_id)}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to remove server');
            fetchTrustedServers();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to remove server');
        }
    };

    const copyToClipboard = useCallback(async (text: string, key: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(key);
            setTimeout(() => setCopied(null), 2000);
        } catch { /* ignore */ }
    }, []);

    const F = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.65rem', color: 'var(--text-ghost)', letterSpacing: '0.1em' }}>{label}</label>
            {children}
            {hint && <span style={{ fontSize: '0.62rem', color: 'var(--text-ghost)' }}>{hint}</span>}
        </div>
    );

    if (loading && !serverInfo) return (
        <AdminLayout>
            <div style={{ color: 'var(--text-ghost)', display: 'flex', alignItems: 'center', gap: 10, padding: '40px 0' }}>
                <span style={{ color: 'var(--green)' }}>loading federation network...</span>
            </div>
        </AdminLayout>
    );

    return (
        <AdminLayout>
            <style>{`
                @keyframes pulse-dot {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50%       { opacity: .45; transform: scale(1.35); }
                }
                @keyframes glow-border {
                    0%, 100% { box-shadow: 0 0 0 0 var(--green-glow); }
                    50%       { box-shadow: 0 0 14px 3px var(--green-glow); }
                }
                .peer-row { transition: background 0.15s ease; }
                .peer-row:hover { background: var(--bg-hover) !important; }
                .status-pulse { animation: pulse-dot 2s ease-in-out infinite; }
                .status-pulse-fast { animation: pulse-dot 0.6s ease-in-out infinite; }
                .local-node-card { animation: glow-border 3.5s ease-in-out infinite; }
                .key-chip:hover { border-color: var(--green-dim) !important; cursor: pointer; }
                .copy-btn { opacity: 0; transition: opacity 0.15s; }
                .key-cell:hover .copy-btn { opacity: 1; }
                .action-btn { transition: opacity 0.15s, color 0.15s; }
                .action-btn:hover { opacity: 0.8; }
            `}</style>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ color: 'var(--text-ghost)', fontSize: '0.65rem', letterSpacing: '0.15em', marginBottom: 4 }}>// FEDERATION MESH</div>
                        <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: 'var(--green)', letterSpacing: '0.1em', textShadow: '0 0 8px var(--green-glow)' }}>
                            TRUSTED NODES
                        </h1>
                    </div>
                    <button onClick={() => setShowAddForm(!showAddForm)} className="term-btn solid" style={{ gap: 8 }}>
                        {showAddForm ? <><X size={13} /> CANCEL</> : <><Plus size={13} /> ADD NODE</>}
                    </button>
                </div>

                {/* Local Node Card */}
                {serverInfo && (
                    <div className="term-panel local-node-card" style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                            <Shield size={12} style={{ color: 'var(--green)' }} />
                            <span style={{ color: 'var(--text-ghost)', fontSize: '0.65rem', letterSpacing: '0.12em' }}>// LOCAL NODE</span>
                            <span style={{
                                marginLeft: 'auto', fontSize: '0.6rem', letterSpacing: '0.1em',
                                color: 'var(--green)', background: 'var(--green-faint)',
                                border: '1px solid var(--green-dim)', padding: '2px 8px',
                            }}>* ACTIVE</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
                            <div>
                                <div style={{ fontSize: '0.62rem', color: 'var(--text-ghost)', marginBottom: 4, display: 'flex', gap: 5, alignItems: 'center' }}>
                                    <Globe size={10} /> SERVER ID
                                </div>
                                {serverInfo.server_id !== 'unknown' ? (
                                    <>
                                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--cyan)', fontWeight: 600 }}>
                                            {serverInfo.server_id}
                                        </div>
                                        <div style={{ fontSize: '0.62rem', color: 'var(--text-ghost)', marginTop: 2 }}>local</div>
                                    </>
                                ) : (
                                    <>
                                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-ghost)' }}>
                                            ID: <span style={{ color: 'var(--amber)' }}>
                                                {keyFingerprint(serverInfo.public_key) !== '--------'
                                                    ? keyFingerprint(serverInfo.public_key)
                                                    : '00000000'}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '0.6rem', color: 'var(--amber)', marginTop: 2 }}>ID not returned by server</div>
                                    </>
                                )}
                            </div>

                            <div>
                                <div style={{ fontSize: '0.62rem', color: 'var(--text-ghost)', marginBottom: 4 }}>SERVER NAME</div>
                                <div style={{ fontSize: '0.82rem', color: 'var(--text)', fontWeight: 600 }}>{serverInfo.server_name}</div>
                            </div>

                            <div>
                                <div style={{ fontSize: '0.62rem', color: 'var(--text-ghost)', marginBottom: 4 }}>PUBLIC KEY</div>
                                {serverInfo.public_key ? (
                                    <div className="key-cell" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <code
                                            className="key-chip"
                                            title="Click to view full key"
                                            onClick={() => setKeyModal({ name: serverInfo.server_name + ' (local)', key: serverInfo.public_key })}
                                            style={{
                                                fontSize: '0.68rem', background: 'var(--bg)',
                                                padding: '3px 8px', color: 'var(--text-muted)',
                                                border: '1px solid var(--border)', transition: 'border-color 0.15s',
                                            }}>
                                            {serverInfo.public_key.substring(0, 20)}...
                                        </code>
                                        <button
                                            className="copy-btn"
                                            title="Copy public key"
                                            onClick={() => copyToClipboard(serverInfo.public_key, 'local')}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied === 'local' ? 'var(--green)' : 'var(--text-ghost)', padding: 2 }}>
                                            {copied === 'local' ? <Check size={12} /> : <Copy size={12} />}
                                        </button>
                                    </div>
                                ) : (
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-ghost)' }}>not available</span>
                                )}
                            </div>
                        </div>

                        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <LinkIcon size={10} style={{ color: 'var(--text-ghost)' }} />
                            <span style={{ fontSize: '0.62rem', color: 'var(--text-ghost)' }}>ENDPOINT</span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--green-dim)', marginLeft: 8 }}>{serverInfo.endpoint}</span>
                        </div>
                    </div>
                )}

                {error && (
                    <div style={{ padding: '8px 12px', background: 'rgba(255,23,68,0.06)', border: '1px solid var(--red-dim)', fontSize: '0.75rem', color: 'var(--red)' }}>
                        <span style={{ opacity: 0.5 }}>ERR &gt; </span>{error}
                    </div>
                )}

                {/* Add Node Form */}
                {showAddForm && (
                    <div className="term-panel" style={{ padding: '18px 20px' }}>
                        <div style={{ color: 'var(--text-ghost)', fontSize: '0.65rem', letterSpacing: '0.12em', marginBottom: 14 }}>// REGISTER TRUSTED NODE</div>
                        <form onSubmit={handleAddServer} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                <F label="SERVER ID  *" hint="unique identifier">
                                    <input type="text" required className="term-input" placeholder="server-b"
                                        value={formData.server_id} onChange={e => setFormData({ ...formData, server_id: e.target.value })} />
                                </F>
                                <F label="SERVER NAME  *" hint="display name">
                                    <input type="text" required className="term-input" placeholder="Server B"
                                        value={formData.server_name} onChange={e => setFormData({ ...formData, server_name: e.target.value })} />
                                </F>
                            </div>
                            <F label="ENDPOINT URL  *" hint="Docker: container name  *  Localhost: external port (e.g. http://localhost:9080)">
                                <input type="url" required className="term-input" placeholder="http://server_b_identity:8082"
                                    value={formData.endpoint} onChange={e => setFormData({ ...formData, endpoint: e.target.value })} />
                            </F>
                            <F label="PUBLIC KEY" hint="optional -- paste remote server public key for verification">
                                <input type="text" className="term-input" placeholder="(optional)"
                                    value={formData.public_key} onChange={e => setFormData({ ...formData, public_key: e.target.value })} />
                            </F>
                            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                                <button type="submit" className="term-btn solid">REGISTER NODE</button>
                                <button type="button" className="term-btn" onClick={() => setShowAddForm(false)}><X size={12} /> CANCEL</button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Peers Table */}
                <div className="term-panel" style={{ overflow: 'hidden' }}>
                    <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-ghost)', letterSpacing: '0.12em' }}>// TRUSTED NODES</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-ghost)' }}>{servers.length} PEER{servers.length !== 1 ? 'S' : ''}</span>
                    </div>

                    <table className="term-table">
                        <thead>
                            <tr>
                                <th>STATUS</th>
                                <th>NODE</th>
                                <th>ENDPOINT</th>
                                <th>PUBLIC KEY</th>
                                <th>SINCE</th>
                                <th style={{ textAlign: 'right' }}>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-ghost)' }}>loading...</td></tr>
                            ) : servers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '48px 16px' }}>
                                        <div style={{ color: 'var(--text-ghost)', fontSize: '0.8rem', marginBottom: 12 }}>no trusted nodes registered</div>
                                        <button onClick={() => setShowAddForm(true)} className="term-btn solid">
                                            <Plus size={12} /> ADD FIRST NODE
                                        </button>
                                    </td>
                                </tr>
                            ) : (
                                servers.map(server => {
                                    const status: NodeStatus = nodeStatus[server.server_id] || 'unverified';
                                    const col = STATUS_COLOR[status];
                                    return (
                                        <tr key={server.id} className="peer-row">
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                                    <span
                                                        className={status === 'testing' ? 'status-pulse-fast' : status === 'online' ? 'status-pulse' : undefined}
                                                        style={{
                                                            display: 'inline-block', width: 7, height: 7,
                                                            borderRadius: '50%', background: col,
                                                            boxShadow: status === 'online' ? `0 0 6px ${col}` : 'none',
                                                            flexShrink: 0,
                                                        }} />
                                                    <span style={{ fontSize: '0.65rem', color: col, letterSpacing: '0.06em' }}>
                                                        {STATUS_LABEL[status]}
                                                    </span>
                                                </div>
                                            </td>

                                            <td>
                                                <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.8rem' }}>{server.server_name}</div>
                                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--cyan)', marginTop: 2 }}>{server.server_id}</div>
                                            </td>

                                            <td>
                                                <a href={server.endpoint} target="_blank" rel="noopener noreferrer"
                                                    style={{ color: 'var(--green-dim)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <LinkIcon size={10} />{server.endpoint}
                                                </a>
                                            </td>

                                            <td>
                                                <div className="key-cell" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <code
                                                        className="key-chip"
                                                        title="Click to view full key"
                                                        onClick={() => server.public_key && setKeyModal({ name: server.server_name, key: server.public_key })}
                                                        style={{
                                                            fontSize: '0.68rem', background: 'var(--bg)',
                                                            padding: '2px 8px', color: 'var(--text-ghost)',
                                                            border: '1px solid var(--border)', transition: 'border-color 0.15s',
                                                            cursor: server.public_key ? 'pointer' : 'default',
                                                        }}>
                                                        {server.public_key ? `${server.public_key.substring(0, 20)}...` : '--'}
                                                    </code>
                                                    {server.public_key && (
                                                        <button
                                                            className="copy-btn"
                                                            title="Copy public key"
                                                            onClick={() => copyToClipboard(server.public_key, server.server_id)}
                                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied === server.server_id ? 'var(--green)' : 'var(--text-ghost)', padding: 2 }}>
                                                            {copied === server.server_id ? <Check size={12} /> : <Copy size={12} />}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>

                                            <td>
                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                                                    <Clock size={11} />{new Date(server.trusted_at).toLocaleDateString()}
                                                </span>
                                            </td>

                                            <td style={{ textAlign: 'right' }}>
                                                <span style={{ display: 'inline-flex', gap: 12, alignItems: 'center' }}>
                                                    <button
                                                        className="action-btn"
                                                        onClick={() => testConnection(server.endpoint, server.server_id)}
                                                        disabled={status === 'testing'}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cyan)', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        <Wifi size={12} /> TEST
                                                    </button>
                                                    <button
                                                        className="action-btn"
                                                        onClick={() => setKeyModal({ name: server.server_name, key: server.public_key || '(no key stored)' })}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-ghost)', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        <Eye size={12} /> KEY
                                                    </button>
                                                    <button
                                                        className="action-btn"
                                                        onClick={() => handleRemoveServer(server.server_id)}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        <Trash2 size={12} /> REMOVE
                                                    </button>
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Federation Setup Guide (collapsible) */}
                <div style={{ border: '1px solid var(--amber)', background: 'rgba(255,171,0,0.04)' }}>
                    <button
                        onClick={() => setShowGuide(v => !v)}
                        style={{
                            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--amber)', fontSize: '0.72rem', fontFamily: 'var(--font-mono)',
                            letterSpacing: '0.08em',
                        }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <AlertCircle size={13} /> FEDERATION SETUP GUIDE
                        </span>
                        {showGuide ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    {showGuide && (
                        <ol style={{ margin: 0, padding: '0 16px 14px 32px', color: 'var(--text-muted)', lineHeight: 1.9, listStyle: 'decimal', fontSize: '0.72rem' }}>
                            <li><span style={{ color: 'var(--text-dim)' }}>Docker:</span> use container names -- <code style={{ color: 'var(--cyan)', background: 'var(--bg)', padding: '1px 6px' }}>http://server_b_identity:8082</code></li>
                            <li><span style={{ color: 'var(--text-dim)' }}>Localhost:</span> use external ports -- <code style={{ color: 'var(--cyan)', background: 'var(--bg)', padding: '1px 6px' }}>http://localhost:9080</code></li>
                            <li>Get the remote server public key from their admin panel under LOCAL NODE</li>
                            <li><span style={{ color: 'var(--amber)' }}>Both servers must add each other</span> -- federation is bidirectional</li>
                            <li>Use TEST after adding to verify connectivity and update status</li>
                        </ol>
                    )}
                </div>

            </div>

            {/* Public Key Modal */}
            {keyModal && (
                <div
                    onClick={() => setKeyModal(null)}
                    style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 100, backdropFilter: 'blur(4px)',
                    }}>
                    <div
                        className="term-panel"
                        onClick={e => e.stopPropagation()}
                        style={{ padding: '24px', maxWidth: 560, width: '100%', margin: '0 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                            <div>
                                <div style={{ fontSize: '0.62rem', color: 'var(--text-ghost)', letterSpacing: '0.12em', marginBottom: 3 }}>// PUBLIC KEY</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text)', fontWeight: 600 }}>{keyModal.name}</div>
                            </div>
                            <button onClick={() => setKeyModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-ghost)' }}>
                                <X size={16} />
                            </button>
                        </div>
                        <div style={{
                            background: 'var(--bg)', border: '1px solid var(--border-lit)',
                            padding: '12px 14px', marginBottom: 14,
                            fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-dim)',
                            wordBreak: 'break-all', lineHeight: 1.8, maxHeight: 200, overflowY: 'auto',
                        }}>
                            {keyModal.key}
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button
                                className="term-btn solid"
                                onClick={() => copyToClipboard(keyModal.key, '__modal__')}
                                style={{ flex: 1, gap: 6 }}>
                                {copied === '__modal__' ? <><Check size={12} /> COPIED</> : <><Copy size={12} /> COPY FULL KEY</>}
                            </button>
                            <button className="term-btn" onClick={() => setKeyModal(null)} style={{ flex: 1 }}>
                                <X size={12} /> CLOSE
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
