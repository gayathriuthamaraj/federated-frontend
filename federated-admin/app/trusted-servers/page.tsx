'use client';

import { useState, useEffect } from 'react';

interface TrustedServer {
    id: string;
    server_id: string;
    server_name: string;
    public_key: string;
    endpoint: string;
    trusted_at: string;
}

export default function TrustedServersPage() {
    const [servers, setServers] = useState<TrustedServer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);

    const [formData, setFormData] = useState({
        server_id: '',
        server_name: '',
        public_key: '',
        endpoint: '',
    });

    useEffect(() => {
        fetchTrustedServers();
    }, []);

    const fetchTrustedServers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('admin_token');
            const response = await fetch('http://localhost:8082/admin/trusted-servers/list', {
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

    const handleAddServer = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const token = localStorage.getItem('admin_token');
            const response = await fetch('http://localhost:8082/admin/trusted-servers/add', {
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
            const response = await fetch(`http://localhost:8082/admin/trusted-servers/remove?server_id=${encodeURIComponent(server_id)}`, {
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

    if (loading) return <div className="p-6">Loading trusted servers...</div>;

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Trusted Federation Servers</h1>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                >
                    {showAddForm ? 'Cancel' : '+ Add Server'}
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            {showAddForm && (
                <form onSubmit={handleAddServer} className="bg-white p-6 rounded-lg shadow space-y-4">
                    <h2 className="text-lg font-semibold">Add Trusted Server</h2>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Server ID
                        </label>
                        <input
                            type="text"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="server-b"
                            value={formData.server_id}
                            onChange={(e) => setFormData({ ...formData, server_id: e.target.value })}
                        />
                        <p className="text-xs text-gray-500 mt-1">Unique identifier for the server</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Server Name
                        </label>
                        <input
                            type="text"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="Server B"
                            value={formData.server_name}
                            onChange={(e) => setFormData({ ...formData, server_name: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Public Key (Ed25519)
                        </label>
                        <textarea
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                            placeholder="302a300506032b65700321..."
                            rows={3}
                            value={formData.public_key}
                            onChange={(e) => setFormData({ ...formData, public_key: e.target.value })}
                        />
                        <p className="text-xs text-gray-500 mt-1">Server's Ed25519 public key for verification</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Endpoint URL
                        </label>
                        <input
                            type="url"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="http://localhost:8083"
                            value={formData.endpoint}
                            onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
                        />
                        <p className="text-xs text-gray-500 mt-1">Server's federation endpoint</p>
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="submit"
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
                        >
                            Add Trusted Server
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowAddForm(false)}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Server Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Server ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Public Key</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Endpoint</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trusted Since</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {servers.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                    No trusted servers configured. Add a server to enable federation.
                                </td>
                            </tr>
                        ) : (
                            servers.map((server) => (
                                <tr key={server.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium">{server.server_name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{server.server_id}</td>
                                    <td className="px-6 py-4">
                                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                            {server.public_key.substring(0, 20)}...
                                        </code>
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <a href={server.endpoint} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                            {server.endpoint}
                                        </a>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {new Date(server.trusted_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleRemoveServer(server.server_id)}
                                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                                        >
                                            Remove
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">📘 How to Add a Server</h3>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Get the server's public key from <code className="bg-blue-100 px-1">/server/info</code> endpoint</li>
                    <li>Enter the server ID, name, public key, and endpoint URL</li>
                    <li>Server will be able to federate and verify signatures</li>
                    <li>Messages from this server will be trusted and verified</li>
                </ol>
            </div>
        </div>
    );
}
