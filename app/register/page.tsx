"use client";

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';


export default function RegisterPage() {
    const { login } = useAuth();
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [recoveryKey, setRecoveryKey] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (!username || !email) {
            setError('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);

        try {
            const res = await fetch('http://localhost:8082/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    password: password,
                }),
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(errorText || 'Registration failed');
            }

            const data = await res.json();

            // Log the user in
            login(data.user_id, data.home_server);

            // Set recovery key to show it
            if (data.recovery_key) {
                setRecoveryKey(data.recovery_key);
            } else {
                // Fallback if no key (should happen with new backend)
                router.push('/profile/setup');
            }

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Registration failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (recoveryKey) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-bat-black p-4">
                <div className="w-full max-w-md bg-bat-dark rounded-lg shadow-2xl p-8 border border-bat-gray/10 text-center">
                    <h1 className="text-3xl font-bold text-bat-yellow mb-2">Account Created!</h1>
                    <div className="h-0.5 w-16 bg-bat-yellow mx-auto rounded-full opacity-50 mb-6"></div>

                    <p className="text-bat-gray mb-4">
                        Please save your Identity Recovery Key. You will need this to restore your account if you lose access or move servers.
                    </p>

                    <div className="bg-black/50 p-4 rounded border border-bat-yellow/30 font-mono text-sm text-bat-yellow break-all mb-6">
                        {recoveryKey}
                    </div>

                    <button
                        onClick={() => router.push('/profile/setup')}
                        className="
                            w-full py-3 px-4 rounded-md font-bold text-lg
                            bg-bat-yellow text-bat-black
                            hover:bg-yellow-400
                            transform active:scale-[0.98]
                            transition-all duration-200
                            shadow-[0_0_15px_rgba(245,197,24,0.3)]
                        "
                    >
                        I've Saved It, Continue
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-bat-black p-4">
            <div className="w-full max-w-md bg-bat-dark rounded-lg shadow-2xl p-8 border border-bat-gray/10">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-bat-gray mb-2">Create Account</h1>
                    <div className="h-0.5 w-16 bg-bat-yellow mx-auto rounded-full opacity-50"></div>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                    {error && (
                        <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-md">
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    <div>

                        <label
                            htmlFor="username"
                            className="block text-sm font-medium text-bat-gray mb-1"
                        >
                            Username
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
                            placeholder="Choose a username"
                            required
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="email"
                            className="block text-sm font-medium text-bat-gray mb-1"
                        >
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="
                w-full px-4 py-3 rounded-md
                bg-bat-black text-white
                border border-bat-gray/20
                focus:border-bat-yellow focus:ring-1 focus:ring-bat-yellow
                outline-none transition-all duration-200
                placeholder-gray-600
              "
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-bat-gray mb-1"
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
                            placeholder="Create a password"
                            required
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="confirm-password"
                            className="block text-sm font-medium text-bat-gray mb-1"
                        >
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            id="confirm-password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="
                w-full px-4 py-3 rounded-md
                bg-bat-black text-white
                border border-bat-gray/20
                focus:border-bat-yellow focus:ring-1 focus:ring-bat-yellow
                outline-none transition-all duration-200
                placeholder-gray-600
              "
                            placeholder="Confirm your password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="
              w-full py-3 px-4 mt-2 rounded-md font-bold text-lg
              bg-bat-yellow text-bat-black
              hover:bg-yellow-400
              disabled:opacity-50 disabled:cursor-not-allowed
              transform active:scale-[0.98]
              transition-all duration-200
              shadow-[0_0_15px_rgba(245,197,24,0.3)]
            "
                    >
                        {isSubmitting ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-500">
                        Already have an account?{' '}
                        <Link
                            href="/login"
                            className="text-bat-yellow hover:text-white transition-colors duration-200 font-medium"
                        >
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
