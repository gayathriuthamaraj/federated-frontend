"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { KNOWN_SERVERS, findServerById, pinServer, getPinnedServer } from '../utils/servers';

export default function LoginPage() {
    const { login } = useAuth();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [serverId, setServerId] = useState<string>('');

    // Populate from localStorage only after mount (avoids SSR/hydration mismatch)
    useEffect(() => {
        const pinned = getPinnedServer();
        if (pinned?.server_id) setServerId(pinned.server_id);
        else if (KNOWN_SERVERS.length > 0) setServerId(KNOWN_SERVERS[0].id);
    }, []);

    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
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
            <div className="w-full max-w-md bg-bat-dark rounded-xl shadow-2xl p-8 border border-bat-gray/10 animate-scale-in">
                <div className="mb-8 text-center">
                    <div className="flex items-center justify-center gap-2 mb-3">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-bat-yellow">
                            <path d="M2.5 12C2.5 12 5 12 5 12C5 12 3.5 8 7 5C9 8 10 9 12 9C14 9 15 8 17 5C20.5 8 19 12 19 12C19 12 21.5 12 21.5 12C21.5 12 21.5 16 17 17C15 18 12 20 12 20C12 20 9 18 7 17C2.5 16 2.5 12 2.5 12Z" fill="currentColor" />
                        </svg>
                        <span className="text-xl font-bold tracking-widest text-bat-yellow italic">GOTHAM</span>
                    </div>
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
                            value={serverId}
                            onChange={(e) => {
                                const id = e.target.value;
                                setServerId(id);
                                const srv = findServerById(id);
                                if (srv) pinServer(srv);
                            }}
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
                            {KNOWN_SERVERS.map((srv) => (
                                <option key={srv.id} value={srv.id}>
                                    {srv.name} &mdash; {srv.id} (:{srv.port})
                                </option>
                            ))}
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

                {/* Social network links */}
                <div className="mt-8 pt-6 border-t border-bat-gray/10">
                    <p className="text-xs text-bat-gray/40 text-center mb-3">Find us on</p>
                    <div className="flex items-center justify-center gap-5">
                        <a
                            href="https://joinmastodon.org"
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Mastodon / Fediverse"
                            className="text-bat-gray/40 hover:text-bat-yellow transition-colors duration-200"
                        >
                            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                                <path d="M23.193 7.88c-.33-2.335-2.45-4.18-4.93-4.56-2.12-.33-4.25-.5-6.37-.5-2.12 0-4.25.17-6.37.5C3.04 3.71.92 5.55.6 7.88c-.26 1.84-.4 3.69-.4 5.54 0 1.85.14 3.7.4 5.54.33 2.35 2.45 4.18 4.93 4.56 2.12.33 4.25.5 6.37.5 2.12 0 4.25-.17 6.37-.5 2.48-.38 4.6-2.21 4.93-4.56.26-1.84.4-3.69.4-5.54 0-1.85-.14-3.7-.4-5.54z"/>
                            </svg>
                        </a>
                        <a
                            href="https://github.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            title="GitHub"
                            className="text-bat-gray/40 hover:text-bat-yellow transition-colors duration-200"
                        >
                            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                            </svg>
                        </a>
                        <a
                            href="https://x.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            title="X (Twitter)"
                            className="text-bat-gray/40 hover:text-bat-yellow transition-colors duration-200"
                        >
                            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
                        </a>
                        <a
                            href="https://discord.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Discord"
                            className="text-bat-gray/40 hover:text-bat-yellow transition-colors duration-200"
                        >
                            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                            </svg>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
