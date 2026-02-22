'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

interface TrustedServer {
    id: string;
    server_id: string;
    server_name: string;
    public_key: string;
    endpoint: string;
    trusted_at: string;
}

export default function FederationPage() {
    const { identity, isLoading: authLoading } = useAuth();
    const router = useRouter();

    const [servers, setServers] = useState<TrustedServer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [testingId, setTestingId] = useState<string | null>(null);
    const [hasAdminToken, setHasAdminToken] = useState(false);

    const [formData, setFormData] = useState({
        server_id: '',
        server_name: '',
        public_key: '',
        endpoint: '',
    });

    useEffect(() => {
        if (!authLoading && !identity) {
            router.push('/login');
        }
    }, [identity, authLoading, router]);

    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
        setHasAdminToken(!!token);
        if (token && identity) fetchServers();
        else setLoading(false);
    }, [identity]);

    const fetchServers = async () => {
        if (!identity) return;
        setLoading(true);
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`${identity.home_server}/admin/trusted-servers/list`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Unauthorized — check your admin token');
            const data = await res.json();
            setServers(data || []);
            setError('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load servers');
        } finally {
            setLoading(false);
        }
    };

    const testConnection = async (endpoint: string, serverId: string) => {
        if (!identity) return;
        setTestingId(serverId);
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`${identity.home_server}/admin/trusted-servers/test`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ endpoint }),
            });
            if (res.ok) {
                alert(`✅ Connected to ${serverId}`);
            } else {
                const data = await res.json();
                alert(`⚠️ Server responded with error: ${data.error || res.statusText}`);
            }
        } catch {
            alert(`❌ Could not reach ${serverId}`);
        } finally {
            setTestingId(null);
        }
    };

    const handleAddServer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!identity) return;
        setError('');
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`${identity.home_server}/admin/trusted-servers/add`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to add server');
            }
            setFormData({ server_id: '', server_name: '', public_key: '', endpoint: '' });
            setShowAddForm(false);
            fetchServers();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add server');
        }
    };

    const handleRemoveServer = async (serverId: string) => {
        if (!identity) return;
        if (!confirm(`Remove ${serverId} from trusted servers?`)) return;
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(
                `${identity.home_server}/admin/trusted-servers/remove?server_id=${encodeURIComponent(serverId)}`,
                { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }
            );
            if (!res.ok) throw new Error('Failed to remove server');
            fetchServers();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to remove server');
        }
    };

    if (authLoading) {
        return (
            <div className="max-w-3xl mx-auto p-6 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bat-yellow"></div>
            </div>
        );
    }

    if (!hasAdminToken) {
        return (
            <div className="max-w-3xl mx-auto p-6">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-bat-gray mb-2">Federation Network</h1>
                    <div className="h-0.5 w-16 bg-bat-yellow rounded-full opacity-50"></div>
                </div>
                <div className="bg-bat-dark/40 border border-bat-yellow/20 rounded-lg p-8 text-center space-y-4">
                    <p className="text-bat-gray text-lg">Admin access required to manage federation.</p>
                    <p className="text-bat-gray/60 text-sm">
                        Sign in to the admin panel to get an admin token, then return here.
                    </p>
                    <a
                        href="http://localhost:3001/login"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-6 py-2 rounded-md bg-bat-yellow text-bat-black font-bold text-sm hover:bg-yellow-400 transition-colors"
                    >
                        Open Admin Panel
                    </a>
                    <p className="text-bat-gray/40 text-xs">
                        After signing in, refresh this page.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="mb-2">
                <h1 className="text-3xl font-bold text-bat-gray mb-2">Federation Network</h1>
                <div className="h-0.5 w-16 bg-bat-yellow rounded-full opacity-50"></div>
                {identity && (
                    <p className="text-bat-gray/60 mt-2 text-sm">
                        Server: <span className="font-mono text-bat-yellow/80">{identity.home_server}</span>
                    </p>
                )}
            </div>

            {error && (
                <div className="bg-red-900/20 border border-red-500/40 rounded-lg p-4">
                    <p className="text-red-400 text-sm">{error}</p>
                </div>
            )}

            {/* Trusted servers list */}
            <div className="bg-bat-dark/40 border border-bat-yellow/10 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-bat-yellow/10">
                    <div>
                        <h2 className="text-lg font-bold text-bat-gray">Trusted Servers</h2>
                        {!loading && (
                            <p className="text-bat-gray/50 text-xs mt-0.5">
                                {servers.length} server{servers.length !== 1 ? 's' : ''} in federation
                            </p>
                        )}
                    </div>
                    <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="px-4 py-1.5 rounded-md text-sm font-bold bg-bat-yellow text-bat-black hover:bg-yellow-400 transition-colors"
                    >
                        {showAddForm ? 'Cancel' : '+ Add Server'}
                    </button>
                </div>

                {/* Add server form */}
                {showAddForm && (
                    <form onSubmit={handleAddServer} className="p-6 border-b border-bat-yellow/10 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-bat-gray/70 mb-1">Server ID *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="server-b"
                                    value={formData.server_id}
                                    onChange={e => setFormData({ ...formData, server_id: e.target.value })}
                                    className="w-full px-3 py-2 rounded-md bg-bat-black border border-bat-gray/30 text-bat-gray text-sm focus:outline-none focus:border-bat-yellow/60"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-bat-gray/70 mb-1">Server Name *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Server B"
                                    value={formData.server_name}
                                    onChange={e => setFormData({ ...formData, server_name: e.target.value })}
                                    className="w-full px-3 py-2 rounded-md bg-bat-black border border-bat-gray/30 text-bat-gray text-sm focus:outline-none focus:border-bat-yellow/60"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-bat-gray/70 mb-1">Endpoint *</label>
                                <input
                                    type="url"
                                    required
                                    placeholder="http://server-b:8082"
                                    value={formData.endpoint}
                                    onChange={e => setFormData({ ...formData, endpoint: e.target.value })}
                                    className="w-full px-3 py-2 rounded-md bg-bat-black border border-bat-gray/30 text-bat-gray text-sm focus:outline-none focus:border-bat-yellow/60"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-bat-gray/70 mb-1">Public Key</label>
                                <input
                                    type="text"
                                    placeholder="(optional)"
                                    value={formData.public_key}
                                    onChange={e => setFormData({ ...formData, public_key: e.target.value })}
                                    className="w-full px-3 py-2 rounded-md bg-bat-black border border-bat-gray/30 text-bat-gray text-sm focus:outline-none focus:border-bat-yellow/60"
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="px-6 py-2 rounded-md bg-bat-yellow text-bat-black font-bold text-sm hover:bg-yellow-400 transition-colors"
                        >
                            Add Server
                        </button>
                    </form>
                )}

                {/* Server list */}
                {loading ? (
                    <div className="p-8 flex justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-bat-yellow"></div>
                    </div>
                ) : servers.length === 0 ? (
                    <div className="p-8 text-center text-bat-gray/50 text-sm">
                        No trusted servers configured.
                    </div>
                ) : (
                    <ul className="divide-y divide-bat-yellow/10">
                        {servers.map(server => (
                            <li key={server.server_id} className="px-6 py-4 flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <p className="font-bold text-bat-gray text-sm">{server.server_name}</p>
                                    <p className="font-mono text-bat-gray/60 text-xs truncate mt-0.5">{server.endpoint}</p>
                                    <p className="text-bat-gray/40 text-xs mt-0.5">
                                        ID: {server.server_id} &middot; trusted {new Date(server.trusted_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <button
                                        onClick={() => testConnection(server.endpoint, server.server_id)}
                                        disabled={testingId === server.server_id}
                                        className="px-3 py-1.5 rounded-md text-xs font-medium border border-bat-yellow/30 text-bat-yellow hover:bg-bat-yellow/10 transition-colors disabled:opacity-40"
                                    >
                                        {testingId === server.server_id ? 'Testing…' : 'Test'}
                                    </button>
                                    <button
                                        onClick={() => handleRemoveServer(server.server_id)}
                                        className="px-3 py-1.5 rounded-md text-xs font-medium border border-bat-gray/30 text-bat-gray/70 hover:border-red-500 hover:text-red-400 transition-colors"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
