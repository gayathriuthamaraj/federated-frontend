"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { KNOWN_SERVERS, findServerById, pinServer } from '../utils/servers';

export default function AddAccountPage() {
    const router = useRouter();
    const { identity, isLoading, addSession, sessions } = useAuth();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [serverId, setServerId] = useState<string>('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (KNOWN_SERVERS.length > 0) setServerId(KNOWN_SERVERS[0].id);
    }, []);

    // Not logged in at all — redirect to regular login
    useEffect(() => {
        if (!isLoading && !identity) router.replace('/login');
    }, [isLoading, identity, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsSubmitting(true);

        const chosenServer = findServerById(serverId);
        if (!chosenServer) {
            setError('Please select a server.');
            setIsSubmitting(false);
            return;
        }
        pinServer(chosenServer);

        try {
            const response = await fetch(`${chosenServer.url}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Login failed');

            const newUserId: string = data.user_id;
            const newHomeServer: string = data.home_server || chosenServer.url;
            const accessToken: string = data.access_token || '';
            const refreshToken: string = data.refresh_token || '';

            // Prevent adding the account that's already active
            if (newUserId === identity?.user_id) {
                setError('This account is already active.');
                setIsSubmitting(false);
                return;
            }

            // Prevent adding an account that's already in the switcher
            const alreadyInSessions = sessions.some(s => s.user_id === newUserId);
            if (alreadyInSessions) {
                setError(`${newUserId} is already saved. You can switch to it from the sidebar.`);
                setIsSubmitting(false);
                return;
            }

            // Add to sessions WITHOUT changing the currently active identity
            addSession(newUserId, newHomeServer, accessToken, refreshToken);
            setSuccess(`Added @${newUserId.split('@')[0]}! Switch to it from the sidebar.`);
            setUsername('');
            setPassword('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-bat-black">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bat-yellow" />
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-bat-black p-4">
            <div className="w-full max-w-md bg-bat-dark rounded-xl shadow-2xl p-8 border border-bat-gray/10 animate-scale-in">
                {/* Header */}
                <div className="mb-8 text-center">
                    <div className="flex items-center justify-center gap-2 mb-3">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-bat-yellow">
                            <path d="M2.5 12C2.5 12 5 12 5 12C5 12 3.5 8 7 5C9 8 10 9 12 9C14 9 15 8 17 5C20.5 8 19 12 19 12C19 12 21.5 12 21.5 12C21.5 12 21.5 16 17 17C15 18 12 20 12 20C12 20 9 18 7 17C2.5 16 2.5 12 2.5 12Z" fill="currentColor" />
                        </svg>
                        <span className="text-xl font-bold tracking-widest text-bat-yellow italic">GOTHAM</span>
                    </div>
                    <h1 className="text-3xl font-bold text-bat-gray mb-1">Add account</h1>
                    <p className="text-bat-gray/50 text-sm">
                        Sign in to another account — you&apos;ll be able to switch between them from the sidebar
                    </p>
                    <div className="h-0.5 w-16 bg-bat-yellow mx-auto rounded-full opacity-50 mt-3" />
                </div>

                {/* Currently signed in banner */}
                {identity && (
                    <div className="mb-5 px-4 py-2.5 rounded-lg bg-bat-yellow/10 border border-bat-yellow/20 flex items-center gap-2 text-sm text-bat-gray/70">
                        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-current text-bat-yellow" aria-hidden="true">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                        <span>Currently signed in as <span className="text-bat-yellow font-semibold">{identity.user_id}</span></span>
                    </div>
                )}

                <form className="space-y-5" onSubmit={handleSubmit}>
                    {error && (
                        <div className="p-3 rounded-md bg-red-900/20 border border-red-500/50 text-red-400 text-sm">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="p-3 rounded-md bg-green-900/20 border border-green-500/40 text-green-400 text-sm flex items-center gap-2">
                            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-current" aria-hidden="true">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                            </svg>
                            {success}
                        </div>
                    )}

                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-bat-gray mb-2">
                            Username
                        </label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-3 rounded-md bg-bat-black text-white border border-bat-gray/20 focus:border-bat-yellow focus:ring-1 focus:ring-bat-yellow outline-none transition-all duration-200 placeholder-gray-600"
                            placeholder="Enter username"
                            required
                            disabled={isSubmitting}
                            autoComplete="username"
                        />
                    </div>

                    <div>
                        <label htmlFor="server" className="block text-sm font-medium text-bat-gray mb-2">
                            Home Server
                        </label>
                        <select
                            id="server"
                            value={serverId}
                            onChange={(e) => {
                                const id = e.target.value;
                                setServerId(id);
                                const srv = findServerById(id);
                                if (srv) pinServer(srv);
                            }}
                            className="w-full px-4 py-3 rounded-md bg-bat-black text-white border border-bat-gray/20 focus:border-bat-yellow focus:ring-1 focus:ring-bat-yellow outline-none transition-all duration-200"
                            required
                            disabled={isSubmitting}
                        >
                            <option value="">Select a server</option>
                            {KNOWN_SERVERS.map((srv) => (
                                <option key={srv.id} value={srv.id}>
                                    {srv.name} — {srv.id} (:{srv.port})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-bat-gray mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-md bg-bat-black text-white border border-bat-gray/20 focus:border-bat-yellow focus:ring-1 focus:ring-bat-yellow outline-none transition-all duration-200 placeholder-gray-600"
                            placeholder="••••••••"
                            required
                            disabled={isSubmitting}
                            autoComplete="current-password"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 px-4 rounded-md font-bold text-lg bg-bat-yellow text-bat-black hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98] transition-all duration-200 shadow-[0_0_15px_rgba(245,197,24,0.3)]"
                    >
                        {isSubmitting ? 'Signing in…' : 'Add account'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <Link
                        href="/feed"
                        className="text-sm text-bat-gray/50 hover:text-bat-yellow transition-colors"
                    >
                        ← Back to feed
                    </Link>
                </div>
            </div>
        </div>
    );
}
