"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../components/AdminLayout';
import { getServerConfig, updateServerName, ServerConfig } from '../api/admin';
import { AlertTriangle } from 'lucide-react';

export default function ServerConfigPage() {
    const router = useRouter();
    const [config, setConfig] = useState<ServerConfig | null>(null);
    const [newServerName, setNewServerName] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showConfirmation, setShowConfirmation] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            router.push('/login');
            return;
        }

        loadConfig();
    }, [router]);

    const loadConfig = async () => {
        try {
            const data = await getServerConfig();
            setConfig(data);
            setNewServerName(data.server_name);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load config');
            if (err instanceof Error && err.message.includes('authenticated')) {
                router.push('/login');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!newServerName.trim()) {
            setError('Server name cannot be empty');
            return;
        }

        setIsSaving(true);
        setError('');
        setSuccess('');

        try {
            await updateServerName(newServerName);
            setSuccess('Server name updated successfully! All users have been notified.');
            setShowConfirmation(false);
            loadConfig();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update server name');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-gray-400">Loading configuration...</div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="max-w-3xl space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Server Configuration</h1>
                    <p className="text-gray-400">Manage your server name and notify all users</p>
                </div>

                {error && (
                    <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
                        <p className="text-red-400">{error}</p>
                    </div>
                )}

                {success && (
                    <div className="p-4 bg-green-900/20 border border-green-500/50 rounded-lg">
                        <p className="text-green-400">{success}</p>
                    </div>
                )}

                {config && (
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-6">
                        <div>
                            <h2 className="text-xl font-bold text-white mb-4">Current Configuration</h2>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center pb-3 border-b border-gray-700">
                                    <span className="text-gray-400">Server Name:</span>
                                    <span className="text-white font-mono">{config.server_name}</span>
                                </div>
                                <div className="flex justify-between items-center pb-3 border-b border-gray-700">
                                    <span className="text-gray-400">Last Updated:</span>
                                    <span className="text-white">{new Date(config.updated_at).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">Updated By:</span>
                                    <span className="text-white">{config.updated_by}</span>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-700 pt-6">
                            <h2 className="text-xl font-bold text-white mb-4">Update Server Name</h2>

                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="serverName" className="block text-sm font-medium text-gray-300 mb-2">
                                        New Server Name
                                    </label>
                                    <input
                                        type="text"
                                        id="serverName"
                                        value={newServerName}
                                        onChange={(e) => setNewServerName(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                                        placeholder="e.g., myserver.com or localhost"
                                    />
                                </div>

                                <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-4">
                                    <h3 className="text-sm font-bold text-blue-400 mb-2">Preview</h3>
                                    <p className="text-gray-300">Usernames will be displayed as:</p>
                                    <p className="text-white font-mono mt-1">
                                        username@{newServerName || '...'}
                                    </p>
                                </div>

                                <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-4">
                                    <div className="flex items-center gap-2 text-yellow-400 font-bold mb-2">
                                        <AlertTriangle className="w-5 h-5" />
                                        <span>Important</span>
                                    </div>
                                    <p className="text-yellow-300 text-sm">
                                        All users will receive a notification about this change.
                                    </p>
                                </div>

                                <button
                                    onClick={() => setShowConfirmation(true)}
                                    disabled={isSaving || newServerName === config.server_name}
                                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors"
                                >
                                    {isSaving ? 'Saving...' : 'Update Server Name'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {}
                {showConfirmation && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full">
                            <h3 className="text-xl font-bold text-white mb-4">Confirm Server Name Change</h3>
                            <p className="text-gray-300 mb-2">
                                Are you sure you want to change the server name to:
                            </p>
                            <p className="text-white font-mono text-lg mb-4 p-3 bg-gray-700 rounded">
                                {newServerName}
                            </p>
                            <p className="text-yellow-400 text-sm mb-6">
                                All users will be notified of this change.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowConfirmation(false)}
                                    className="flex-1 py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-lg transition-colors"
                                >
                                    {isSaving ? 'Updating...' : 'Confirm'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
