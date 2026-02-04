"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../components/AdminLayout';
import StatCard from '../components/StatCard';
import { getServerStats, ServerStats } from '../api/admin';

export default function DashboardPage() {
    const router = useRouter();
    const [stats, setStats] = useState<ServerStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            router.push('/login');
            return;
        }

        loadStats();
    }, [router]);

    const loadStats = async () => {
        try {
            const data = await getServerStats();
            setStats(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load stats');
            if (err instanceof Error && err.message.includes('authenticated')) {
                router.push('/login');
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-gray-400">Loading dashboard...</div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
                    <p className="text-gray-400">Overview of your federated server</p>
                </div>

                {error && (
                    <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
                        <p className="text-red-400">{error}</p>
                    </div>
                )}

                {stats && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard
                                title="Total Users"
                                value={stats.total_users}
                                icon="👥"
                                color="blue"
                            />
                            <StatCard
                                title="Total Posts"
                                value={stats.total_posts}
                                icon="📝"
                                color="green"
                            />
                            <StatCard
                                title="Activities"
                                value={stats.total_activities}
                                icon="⚡"
                                color="purple"
                            />
                            <StatCard
                                title="Follows"
                                value={stats.total_follows}
                                icon="🔗"
                                color="orange"
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                                <h2 className="text-xl font-bold text-white mb-4">Server Information</h2>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center pb-3 border-b border-gray-700">
                                        <span className="text-gray-400">Server Name:</span>
                                        <span className="text-white font-mono">{stats.server_name}</span>
                                    </div>
                                    <div className="flex justify-between items-center pb-3 border-b border-gray-700">
                                        <span className="text-gray-400">Database Status:</span>
                                        <span className={`px-3 py-1 rounded-full text-sm ${stats.database_status === 'connected'
                                                ? 'bg-green-900/30 text-green-400'
                                                : 'bg-red-900/30 text-red-400'
                                            }`}>
                                            {stats.database_status}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400">Uptime:</span>
                                        <span className="text-white">{stats.uptime}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                                <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
                                <div className="space-y-3">
                                    <button
                                        onClick={() => router.push('/server-config')}
                                        className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-left flex items-center gap-3"
                                    >
                                        <span>⚙️</span>
                                        <span>Configure Server</span>
                                    </button>
                                    <button
                                        onClick={() => router.push('/database-config')}
                                        className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-left flex items-center gap-3"
                                    >
                                        <span>🗄️</span>
                                        <span>Database Migration</span>
                                    </button>
                                    <button
                                        onClick={() => router.push('/users')}
                                        className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-left flex items-center gap-3"
                                    >
                                        <span>👥</span>
                                        <span>View Users</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </AdminLayout>
    );
}
