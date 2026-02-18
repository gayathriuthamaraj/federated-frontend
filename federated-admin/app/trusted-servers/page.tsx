'use client';

import { useState, useEffect } from 'react';
import { Server, Globe, Key, Link as LinkIcon, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

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
    if (typeof window === 'undefined') return 'http://localhost:8082';

    const trusted = localStorage.getItem('trusted_server');
    if (trusted) {
        try {
            const data = JSON.parse(trusted);
            return data.server_url || 'http://localhost:8082';
        } catch (e) {
            return 'http://localhost:8082';
        }
    }
    return 'http://localhost:8082';
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
                const data = await response.json();
                alert(`⚠️ Helper connected but remote server returned error: ${data.error || response.statusText}`);
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
                const data = await response.json();
                throw new Error(data.error || 'Failed to add server');
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
        <div className="p-6 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading federation network...</span>
        </div>
    );

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Network Info Header */}
            {serverInfo && (
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="bg-white/20 p-3 rounded-lg">
                                <Server className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">Federation Network</h1>
                                <p className="text-blue-100 mt-1">Current Server: {serverInfo.server_name}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center space-x-2 bg-white/20 px-3 py-1 rounded-full">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                <span className="text-sm">Online</span>
                            </div>
                        </div>
                    </div>

                    {/* Server Details */}
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white/10 rounded-lg p-4">
                            <div className="flex items-center space-x-2 mb-2">
                                <Globe className="w-4 h-4" />
                                <span className="text-sm font-medium">Server ID</span>
                            </div>
                            <p className="font-mono text-sm">{serverInfo.server_id}</p>
                        </div>
                        <div className="bg-white/10 rounded-lg p-4">
                            <div className="flex items-center space-x-2 mb-2">
                                <LinkIcon className="w-4 h-4" />
                                <span className="text-sm font-medium">Endpoint</span>
                            </div>
                            <p className="font-mono text-sm truncate">{serverInfo.endpoint}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Trusted Servers Section */}
            <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Trusted Federation Servers</h2>
                            <p className="text-sm text-gray-600 mt-1">
                                {servers.length} server{servers.length !== 1 ? 's' : ''} in federation network
                            </p>
                        </div>
                        <button
                            onClick={() => setShowAddForm(!showAddForm)}
                            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            <Server className="w-4 h-4" />
                            <span>{showAddForm ? 'Cancel' : 'Add Server'}</span>
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mx-6 mt-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
                        <div className="flex items-center">
                            <XCircle className="w-5 h-5 text-red-500 mr-2" />
                            <p className="text-red-700">{error}</p>
                        </div>
                    </div>
                )}

                {showAddForm && (
                    <form onSubmit={handleAddServer} className="p-6 border-b border-gray-200 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Server ID *
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="server-b"
                                    value={formData.server_id}
                                    onChange={(e) => setFormData({ ...formData, server_id: e.target.value })}
                                />
                                <p className="text-xs text-gray-500 mt-1">Unique identifier for the server</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Server Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Server B"
                                    value={formData.server_name}
                                    onChange={(e) => setFormData({ ...formData, server_name: e.target.value })}
                                />
                                <p className="text-xs text-gray-500 mt-1">Display name for the server</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Endpoint URL *
                            </label>
                            <input
                                type="url"
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                                placeholder="http://server_b_identity:8082 (Docker) or http://localhost:9080"
                                value={formData.endpoint}
                                onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
                            />
                            <p className="text-xs text-gray-500 mt-1">Server's federation endpoint (Docker: use container name, Localhost: use external port)</p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="submit"
                                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
                            >
                                <CheckCircle className="w-4 h-4" />
                                <span>Add Trusted Server</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowAddForm(false)}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}

                {/* Servers Table */}
                <div className="overflow-x-auto">
                    {servers.length === 0 ? (
                        <div className="p-12 text-center">
                            <Server className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Trusted Servers</h3>
                            <p className="text-gray-600 mb-4">Add a trusted server to enable federation.</p>
                            <button
                                onClick={() => setShowAddForm(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                            >
                                Add Your First Server
                            </button>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-50 border-y border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Server
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Endpoint
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Public Key
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Added
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {servers.map((server) => (
                                    <tr key={server.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                                    <Server className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">{server.server_name}</div>
                                                    <div className="text-sm text-gray-500 font-mono">{server.server_id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <a
                                                href={server.endpoint}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800 font-mono text-sm flex items-center space-x-1"
                                            >
                                                <LinkIcon className="w-3 h-3" />
                                                <span>{server.endpoint}</span>
                                            </a>
                                        </td>
                                        <td className="px-6 py-4">
                                            <code className="text-xs bg-gray-100 px-3 py-1 rounded-md text-gray-700">
                                                {server.public_key.substring(0, 24)}...
                                            </code>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                                                <Clock className="w-4 h-4" />
                                                <span>{new Date(server.trusted_at).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => testConnection(server.endpoint, server.server_id)}
                                                    disabled={testingConnection === server.server_id}
                                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50"
                                                >
                                                    {testingConnection === server.server_id ? 'Testing...' : 'Test'}
                                                </button>
                                                <span className="text-gray-300">|</span>
                                                <button
                                                    onClick={() => handleRemoveServer(server.server_id)}
                                                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Help Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-blue-900 mb-2">Setting Up Federation</h3>
                        <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                            <li>
                                <strong>For Docker environments:</strong> Use internal Docker network names like{' '}
                                <code className="bg-blue-100 px-2 py-0.5 rounded">http://server_b_identity:8082</code>
                            </li>
                            <li>
                                <strong>For localhost testing:</strong> Use external ports like{' '}
                                <code className="bg-blue-100 px-2 py-0.5 rounded">http://localhost:9080</code>
                            </li>
                            <li>Get the remote server's public key from their admin panel</li>
                            <li><strong>Important:</strong> Both servers must add each other to their trusted lists for bidirectional federation</li>
                            <li>Use the "Test" button to verify connectivity after adding a server</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
}
