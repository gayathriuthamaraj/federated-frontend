'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { Server, Globe, Link as LinkIcon, Clock, AlertCircle, Plus, X, Trash2, Wifi } from 'lucide-react';

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
            const data = JSON.parse(trusted);
            return data.server_url || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
        } catch (e) {
            return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
        }
    }
    return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
}

export default function TrustedServersPage() {
    const [servers, setServers] = useState<TrustedServer[]>([]);
    const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [testingConnection, setTestingConnection] = useState<string | null>(null);

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
        // Always set server info from localStorage (safe fallback)
        try {
            const trusted = localStorage.getItem('trusted_server');
            if (trusted) {
                const data = JSON.parse(trusted);
                setServerInfo({
                    server_id: data.server_id || 'server-a',
                    server_name: data.server_name || 'Server A',
                    public_key: '',
                    endpoint: data.server_url || 'http://localhost:8080'
                });
            } else {
                setServerInfo({
                    server_id: 'server-a',
                    server_name: 'Server A',
                    public_key: '',
                    endpoint: 'http://localhost:8080'
                });
            }
        } catch (err) {
            console.error('Error loading server info:', err);
            setServerInfo({
                server_id: 'server-a',
                server_name: 'Server A',
                public_key: '',
                endpoint: 'http://localhost:8080'
            });
        }
    };

    const fetchTrustedServers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('admin_token');
            const baseUrl = getApiBaseUrl();

            const response = await fetch(`${baseUrl}/admin/trusted-servers/list`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error('Failed to fetch servers');

            const data = await response.json();
            setServers(data || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load servers');
        } finally {
            setLoading(false);
        }
    };

    const testConnection = async (endpoint: string, serverId: string) => {
        setTestingConnection(serverId);
        try {
            const token = localStorage.getItem('admin_token');
            const baseUrl = getApiBaseUrl();

            const response = await fetch(`${baseUrl}/admin/trusted-servers/test`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ endpoint }),
            });

            if (response.ok) {
                alert(`✅ Successfully connected to ${serverId}!`);
            } else {
                const text = await response.text();
                let errorMsg = response.statusText;
                try { errorMsg = JSON.parse(text).error || response.statusText; } catch { errorMsg = text || response.statusText; }
                alert(`⚠️ Helper connected but remote server returned error: ${errorMsg}`);
            }
        } catch (err) {
            alert(`❌ Failed to connect to ${serverId}: ${err instanceof Error ? err.message : 'Timeout'}`);
        } finally {
            setTestingConnection(null);
        }
    };

    const handleAddServer = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const token = localStorage.getItem('admin_token');
            const baseUrl = getApiBaseUrl();

            const response = await fetch(`${baseUrl}/admin/trusted-servers/add`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const text = await response.text();
                let errorMsg = 'Failed to add server';
                try { errorMsg = JSON.parse(text).error || text || 'Failed to add server'; } catch { errorMsg = text || 'Failed to add server'; }
                throw new Error(errorMsg);
            }

            // Reset form and refresh list
            setFormData({ server_id: '', server_name: '', public_key: '', endpoint: '' });
            setShowAddForm(false);
            fetchTrustedServers();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add server');
        }
    };

    const handleRemoveServer = async (server_id: string) => {
        if (!confirm(`Are you sure you want to remove this trusted server?`)) return;

        try {
            const token = localStorage.getItem('admin_token');
            const baseUrl = getApiBaseUrl();

            const response = await fetch(`${baseUrl}/admin/trusted-servers/remove?server_id=${encodeURIComponent(server_id)}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error('Failed to remove server');

            fetchTrustedServers();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to remove server');
        }
    };

    if (loading && !serverInfo) return (
        <AdminLayout>
            <div style={{ color: 'var(--text-ghost)', display: 'flex', alignItems: 'center', gap: 10, padding: '40px 0' }}>
                <span style={{ color: 'var(--green)' }}>⟳</span> LOADING FEDERATION NETWORK...
            </div>
        </AdminLayout>
    );

    const F = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.65rem', color: 'var(--text-ghost)', letterSpacing: '0.1em' }}>{label}</label>
            {children}
            {hint && <span style={{ fontSize: '0.62rem', color: 'var(--text-ghost)' }}>{hint}</span>}
        </div>
    );

    return (
        <AdminLayout>
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

                {/* Current node info */}
                {serverInfo && (
                    <div className="term-panel" style={{ padding: '14px 18px' }}>
                        <div style={{ color: 'var(--text-ghost)', fontSize: '0.65rem', letterSpacing: '0.12em', marginBottom: 10 }}>// LOCAL NODE</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div>
                                <div style={{ fontSize: '0.62rem', color: 'var(--text-ghost)', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <Globe size={10} /> SERVER ID
                                </div>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--cyan)' }}>{serverInfo.server_id}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.62rem', color: 'var(--text-ghost)', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <LinkIcon size={10} /> ENDPOINT
                                </div>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {serverInfo.endpoint}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div style={{ padding: '8px 12px', background: 'rgba(255,23,68,0.06)', border: '1px solid var(--red-dim)', fontSize: '0.75rem', color: 'var(--red)' }}>
                        <span style={{ opacity: 0.5 }}>ERR &gt; </span>{error}
                    </div>
                )}

                {/* Add form */}
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
                            <F label="ENDPOINT URL  *" hint="Docker: container name  •  Localhost: external port (e.g. http://localhost:9080)">
                                <input type="url" required className="term-input" placeholder="http://server_b_identity:8082"
                                    value={formData.endpoint} onChange={e => setFormData({ ...formData, endpoint: e.target.value })} />
                            </F>
                            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                                <button type="submit" className="term-btn solid">▶ REGISTER NODE</button>
                                <button type="button" className="term-btn" onClick={() => setShowAddForm(false)}><X size={12} /> CANCEL</button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Servers table */}
                <div className="term-panel" style={{ overflow: 'hidden' }}>
                    <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-ghost)', letterSpacing: '0.12em' }}>// TRUSTED NODES</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-ghost)' }}>{servers.length} PEER{servers.length !== 1 ? 'S' : ''}</span>
                    </div>

                    <table className="term-table">
                        <thead>
                            <tr>
                                <th>NODE</th>
                                <th>ENDPOINT</th>
                                <th>PUBLIC KEY</th>
                                <th>TRUSTED SINCE</th>
                                <th style={{ textAlign: 'right' }}>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-ghost)' }}>⟳ LOADING...</td></tr>
                            ) : servers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '48px 16px' }}>
                                        <div style={{ color: 'var(--text-ghost)', fontSize: '0.8rem', marginBottom: 12 }}>no trusted nodes registered</div>
                                        <button onClick={() => setShowAddForm(true)} className="term-btn solid">
                                            <Plus size={12} /> ADD FIRST NODE
                                        </button>
                                    </td>
                                </tr>
                            ) : (
                                servers.map(server => (
                                    <tr key={server.id}>
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
                                            <code style={{ fontSize: '0.68rem', background: 'var(--bg)', padding: '2px 8px', color: 'var(--text-ghost)', border: '1px solid var(--border)' }}>
                                                {server.public_key ? `${server.public_key.substring(0, 20)}…` : '—'}
                                            </code>
                                        </td>
                                        <td>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                                                <Clock size={11} />{new Date(server.trusted_at).toLocaleDateString()}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <span style={{ display: 'inline-flex', gap: 10, alignItems: 'center' }}>
                                                <button onClick={() => testConnection(server.endpoint, server.server_id)}
                                                    disabled={testingConnection === server.server_id}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cyan)', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4, opacity: testingConnection === server.server_id ? 0.5 : 1 }}>
                                                    <Wifi size={12} /> {testingConnection === server.server_id ? 'TESTING…' : 'TEST'}
                                                </button>
                                                <button onClick={() => handleRemoveServer(server.server_id)}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <Trash2 size={12} /> REMOVE
                                                </button>
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Help */}
                <div style={{ padding: '14px 16px', background: 'rgba(255,171,0,0.04)', border: '1px solid var(--amber)', fontSize: '0.72rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--amber)', marginBottom: 10, fontWeight: 600, letterSpacing: '0.08em' }}>
                        <AlertCircle size={13} /> FEDERATION SETUP GUIDE
                    </div>
                    <ol style={{ margin: 0, paddingLeft: 18, color: 'var(--text-muted)', lineHeight: 1.8, listStyle: 'decimal' }}>
                        <li><span style={{ color: 'var(--text-dim)' }}>Docker:</span> use container names — <code style={{ color: 'var(--cyan)', background: 'var(--bg)', padding: '1px 6px' }}>http://server_b_identity:8082</code></li>
                        <li><span style={{ color: 'var(--text-dim)' }}>Localhost:</span> use external ports — <code style={{ color: 'var(--cyan)', background: 'var(--bg)', padding: '1px 6px' }}>http://localhost:9080</code></li>
                        <li>Obtain remote public key from their admin panel</li>
                        <li><span style={{ color: 'var(--amber)' }}>Both servers must add each other</span> for bidirectional federation</li>
                        <li>Use TEST button to verify after adding a node</li>
                    </ol>
                </div>

            </div>
        </AdminLayout>
    );
}
