"use client";

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
    const { login } = useAuth();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [serverName, setServerName] = useState<string>(() => {
        try {
            const pinned = typeof window !== 'undefined' ? localStorage.getItem('trusted_server') : null;
            if (pinned) {
                const parsed = JSON.parse(pinned);
                return parsed.server_name || '';
            }
        } catch (e) {
            // ignore
        }
        return '';
    });

    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        // Set the trusted server based on selection to route API calls correctly
        const serverUrl = serverName === 'server-b' ? 'http://localhost:9082' : 'http://localhost:8082';
        localStorage.setItem('trusted_server', JSON.stringify({
            server_name: serverName,
            server_url: serverUrl
        }));

        try {
            const response = await fetch(`${serverUrl}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    password: password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            // Directly login with the credentials
            login(data.user_id, data.home_server, data.access_token || '', data.refresh_token || '');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-bat-black p-4">
            <div className="w-full max-w-md bg-bat-dark rounded-lg shadow-2xl p-8 border border-bat-gray/10">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-bat-gray mb-2">Sign in</h1>
                    <div className="h-0.5 w-16 bg-bat-yellow mx-auto rounded-full opacity-50"></div>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="p-3 rounded-md bg-red-900/20 border border-red-500/50 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label
                            htmlFor="username"
                            className="block text-sm font-medium text-bat-gray mb-2"
                        >
                            Username or Email
                        </label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="
                w-full px-4 py-3 rounded-md
                bg-bat-black text-white
                border border-bat-gray/20
                focus:border-bat-yellow focus:ring-1 focus:ring-bat-yellow
                outline-none transition-all duration-200
                placeholder-gray-600
              "
                            placeholder="Enter your username"
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="server"
                            className="block text-sm font-medium text-bat-gray mb-2"
                        >
                            Home Server
                        </label>
                        <select
                            id="server"
                            value={serverName}
                            onChange={(e) => setServerName(e.target.value)}
                            className="
                w-full px-4 py-3 rounded-md
                bg-bat-black text-white
                border border-bat-gray/20
                focus:border-bat-yellow focus:ring-1 focus:ring-bat-yellow
                outline-none transition-all duration-200
              "
                            required
                            disabled={isSubmitting}
                        >
                            <option value="">Select a server</option>
                            <option value="server-a">Server A (localhost:8082)</option>
                            <option value="server-b">Server B (localhost:8083)</option>
                        </select>
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-bat-gray mb-2"
                        >
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="
                w-full px-4 py-3 rounded-md
                bg-bat-black text-white
                border border-bat-gray/20
                focus:border-bat-yellow focus:ring-1 focus:ring-bat-yellow
                outline-none transition-all duration-200
                placeholder-gray-600
              "
                            placeholder="••••••••"
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="
              w-full py-3 px-4 rounded-md font-bold text-lg
              bg-bat-yellow text-bat-black
              hover:bg-yellow-400
              disabled:opacity-50 disabled:cursor-not-allowed
              transform active:scale-[0.98]
              transition-all duration-200
              shadow-[0_0_15px_rgba(245,197,24,0.3)]
            "
                    >
                        {isSubmitting ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-500">
                        Don't have an account?{' '}
                        <Link
                            href="/register"
                            className="text-bat-yellow hover:text-white transition-colors duration-200 font-medium"
                        >
                            Create an account
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
