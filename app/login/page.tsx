"use client";

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, we would validate credentials here.
        // For this UI-only task, we simulate a successful login.
        // Defaulting home server to localhost:8080 as per requirements.
        if (username) {
            login(username, "http://localhost:8080");
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
                        />
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
                        />
                    </div>

                    <button
                        type="submit"
                        className="
              w-full py-3 px-4 rounded-md font-bold text-lg
              bg-bat-yellow text-bat-black
              hover:bg-yellow-400
              transform active:scale-[0.98]
              transition-all duration-200
              shadow-[0_0_15px_rgba(245,197,24,0.3)]
            "
                    >
                        Sign in
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
