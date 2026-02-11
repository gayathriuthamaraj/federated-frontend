"use client";

import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

function RegisterForm() {
    const { login, loginWithoutRedirect } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [error, setError] = useState('');
    const [recoveryKey, setRecoveryKey] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Parse invite code from URL
    useEffect(() => {
        const code = searchParams.get('invite');
        if (code) {
            setInviteCode(code);
        } else {
            // Also check session storage (if admin setup flow set it, though less likely for user reg)
            const stored = sessionStorage.getItem('invite_code');
            if (stored) setInviteCode(stored);
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (!username || !email || !inviteCode) {
            setError('Please fill in all required fields, including invite code');
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
                    invite_code: inviteCode
                }),
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(errorText || 'Registration failed');
            }

            const data = await res.json();

            console.log('[Register] Registration successful, data:', data);

            // Set identity without redirecting (so we can show recovery key)
            loginWithoutRedirect(data.user_id, data.home_server);

            // Clear invite from storage if used
            sessionStorage.removeItem('invite_code');

            // Set recovery key to show it
            if (data.recovery_key) {
                console.log('[Register] Recovery key received, showing recovery screen');
                setRecoveryKey(data.recovery_key);
            } else {
                // Fallback if no key
                console.log('[Register] No recovery key, redirecting to setup');
                router.push('/profile/setup');
            }

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Registration failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ... copy key logic ...
    const [hasCopied, setHasCopied] = useState(false);
    const [confirmed, setConfirmed] = useState(false);

    // Set flag when recovery key is shown to prevent AuthContext redirect
    useEffect(() => {
        if (recoveryKey) {
            sessionStorage.setItem('showing_recovery_key', 'true');
        } else {
            sessionStorage.removeItem('showing_recovery_key');
        }
    }, [recoveryKey]);

    const handleCopyKey = () => {
        navigator.clipboard.writeText(recoveryKey || '');
        setHasCopied(true);
    };

    const handleDone = () => {
        setConfirmed(true);
        // Clear the flag before navigating
        sessionStorage.removeItem('showing_recovery_key');
        router.push('/profile/setup');
    };

    if (recoveryKey) {
        return (
            // ... recovery key UI ...
            <div className="flex items-center justify-center min-h-screen bg-bat-black p-4">
                <div className="w-full max-w-md bg-bat-dark rounded-lg shadow-2xl p-8 border border-bat-gray/10 text-center">
                    <h1 className="text-3xl font-bold text-bat-yellow mb-2">Account Created!</h1>
                    <div className="h-0.5 w-16 bg-bat-yellow mx-auto rounded-full opacity-50 mb-6"></div>

                    <div className="bg-red-900/20 border border-red-500/50 rounded-md p-4 mb-4">
                        <p className="text-red-400 text-sm font-bold">⚠️ CRITICAL</p>
                        <p className="text-red-400 text-xs mt-1">
                            Save this recovery key NOW. You cannot view it again!
                        </p>
                    </div>

                    <p className="text-bat-gray mb-4">
                        Your Identity Recovery Key is needed to restore your account if you lose access or move servers.
                    </p>

                    <div className="bg-black/50 p-4 rounded border border-bat-yellow/30 font-mono text-sm text-bat-yellow break-all mb-3 select-all">
                        {recoveryKey}
                    </div>

                    <button
                        onClick={handleCopyKey}
                        className="
                            w-full py-3 px-4 mb-4 rounded-md font-bold text-base
                            bg-bat-black text-bat-gray
                            border-2 border-bat-gray/30
                            hover:border-bat-yellow hover:text-bat-yellow
                            transition-all duration-200
                        "
                    >
                        {hasCopied ? '✓ Copied to Clipboard!' : '📋 Copy Recovery Key'}
                    </button>

                    {hasCopied && (
                        <button
                            onClick={handleDone}
                            className="
                                w-full py-3 px-4 rounded-md font-bold text-lg
                                bg-bat-yellow text-bat-black
                                hover:bg-yellow-400
                                transform active:scale-[0.98]
                                transition-all duration-200
                                shadow-[0_0_15px_rgba(245,197,24,0.3)]
                                animate-pulse
                            "
                        >
                            I've Saved It - Continue to Setup
                        </button>
                    )}

                    {!hasCopied && (
                        <p className="text-sm text-bat-gray/60 mt-2">
                            Click the button above to copy your recovery key
                        </p>
                    )}

                    {hasCopied && (
                        <p className="text-sm text-green-400 mt-3">
                            ✓ Key copied! Click "Continue" when you've saved it safely.
                        </p>
                    )}
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
                            htmlFor="invite"
                            className="block text-sm font-medium text-bat-gray mb-1"
                        >
                            Invite Code
                        </label>
                        <input
                            type="text"
                            id="invite"
                            value={inviteCode}
                            onChange={(e) => setInviteCode(e.target.value)}
                            className="
                w-full px-4 py-3 rounded-md
                bg-bat-black text-white
                border border-bat-gray/20
                focus:border-bat-yellow focus:ring-1 focus:ring-bat-yellow
                outline-none transition-all duration-200
                placeholder-gray-600
              "
                            placeholder="Enter invite code"
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

export default function RegisterPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-bat-black flex items-center justify-center text-white">Loading...</div>}>
            <RegisterForm />
        </Suspense>
    );
}
