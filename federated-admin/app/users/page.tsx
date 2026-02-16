"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../components/AdminLayout';
import { getAllUsers, deleteUser } from '../api/admin';
import { MapPin, Trash2 } from 'lucide-react';

interface UserData {
    identity: {
        id: string;
        user_id: string;
        home_server: string;
        allow_discovery: boolean;
        created_at: string;
    };
    profile: {
        user_id: string;
        display_name: string;
        bio?: string;
        location?: string;
        created_at: string;
    };
}

export default function UsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState<UserData[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            router.push('/login');
            return;
        }

        loadUsers();
    }, [router]);

    useEffect(() => {
        if (searchTerm) {
            setFilteredUsers(
                users.filter(user =>
                    user.profile.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    user.identity.user_id.toLowerCase().includes(searchTerm.toLowerCase())
                )
            );
        } else {
            setFilteredUsers(users);
        }
    }, [searchTerm, users]);

    const loadUsers = async () => {
        try {
            const data = await getAllUsers();
            setUsers(data.users || []);
            setFilteredUsers(data.users || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load users');
            if (err instanceof Error && err.message.includes('authenticated')) {
                router.push('/login');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteUser = async (userId: string, username: string) => {
        if (!confirm(`Are you sure you want to delete user ${username}? This action cannot be undone.`)) {
            return;
        }

        try {
            await deleteUser(userId);
            // Refresh list
            loadUsers();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to delete user');
        }
    };

    if (isLoading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-gray-400">Loading users...</div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Users</h1>
                        <p className="text-gray-400">Manage all users on your server</p>
                    </div>
                    <div className="text-right">
                        <p className="text-3xl font-bold text-white">{users.length}</p>
                        <p className="text-sm text-gray-400">Total Users</p>
                    </div>
                </div>

                {error && (
                    <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
                        <p className="text-red-400">{error}</p>
                    </div>
                )}

                {/* Search */}
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search users by name or username..."
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                    />
                </div>

                {/* Users List */}
                <div className="bg-gray-800 border border-gray-700 rounded-lg divide-y divide-gray-700">
                    {filteredUsers.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">
                            {searchTerm ? 'No users found matching your search' : 'No users yet'}
                        </div>
                    ) : (
                        filteredUsers.map((user) => (
                            <div key={user.identity.id} className="p-6 hover:bg-gray-750 transition-colors">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-bold text-white">
                                                {user.profile.display_name}
                                            </h3>
                                            <span className={`px-2 py-1 rounded-full text-xs ${user.identity.allow_discovery
                                                ? 'bg-green-900/30 text-green-400'
                                                : 'bg-gray-900/30 text-gray-400'
                                                }`}>
                                                {user.identity.allow_discovery ? 'Discoverable' : 'Private'}
                                            </span>
                                        </div>
                                        <p className="text-gray-400 text-sm font-mono mb-2">
                                            {user.identity.user_id}@{user.identity.home_server}
                                        </p>
                                        {user.profile.bio && (
                                            <p className="text-gray-300 text-sm mb-2">{user.profile.bio}</p>
                                        )}
                                        {user.profile.location && (
                                            <p className="text-gray-400 text-sm flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                {user.profile.location}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <div className="text-sm text-gray-400">
                                            <p>Joined: {new Date(user.profile.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteUser(user.identity.user_id, user.profile.display_name)}
                                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-md transition-colors flex items-center gap-2 text-sm"
                                            title="Delete User"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            <span>Delete</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
