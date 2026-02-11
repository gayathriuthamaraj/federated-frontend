"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adminLogin } from '../api/admin';

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [serverName, setServerName] = useState('');

    useEffect(() => {
        // Check if server is configured
        const trustedServer = localStorage.getItem('trusted_server');
        if (!trustedServer && !process.env.NEXT_PUBLIC_BACKEND_URL) {
            // If no server pinned and no env set, redirect to setup
            router.push('/setup');
            return;
        }

        if (trustedServer) {
            try {
                const data = JSON.parse(trustedServer);
                setServerName(data.server_name || 'Admin Panel');
            } catch (e) {
                // Ignore parsing errors
            }
        }
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await adminLogin({ username, password });
            localStorage.setItem('admin_token', response.token);
            router.push('/dashboard');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-gray-800 border border-gray-700 rounded-lg p-8">
                <div className="mb-8 text-center">
                    <div className="text-5xl mb-4">🔐</div>
                    <h1 className="text-3xl font-bold text-white mb-2">{serverName || 'Admin Login'}</h1>
                    <p className="text-gray-400">Enter your credentials to access the admin panel</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                            Username
                        </label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                            placeholder="Enter admin username"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                            placeholder="Enter password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors"
                    >
                        {isLoading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <div className="mt-6 pt-6 border-t border-gray-700 text-center text-gray-400 text-sm">
                    <p>Admin access only. Unauthorized attempts will be logged.</p>
                    <button
                        onClick={() => router.push('/setup')}
                        className="mt-4 text-blue-400 hover:text-blue-300 transition-colors"
                    >
                        Switch Server
                    </button>
                </div>
            </div>
        </div>
    );
}
