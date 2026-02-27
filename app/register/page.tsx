"use client";

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiPost } from '../utils/api';
import { generateClientKeyPair, storeClientKeyPair, storeSessionKey } from '../utils/crypto';
import { KNOWN_SERVERS, findServerById, pinServer, getPinnedServer } from '../utils/servers';

export default function RegisterPage() {
    const { loginWithoutRedirect } = useAuth();

    // Form State
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [serverId, setServerId] = useState<string>(() => {
        const pinned = getPinnedServer();
        return pinned?.server_id ?? '';
    });

    const [isSuccess, setIsSuccess] = useState(false);

    // Success State Data
    const [recoveryKey, setRecoveryKey] = useState('');
    const [userId, setUserId] = useState('');

    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleRegistrationSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Basic Validation
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            setError('Username can only contain letters, numbers, and underscores');
            return;
        }

        if (!email.includes('@')) {
            setError('Please enter a valid email address');
            return;
        }

        setIsSubmitting(true);

        try {
            // Pin the chosen server so getApiBaseUrl() routes to the right host
            const chosenServer = findServerById(serverId);
            if (!chosenServer) {
                setError('Please select a server before registering.');
                setIsSubmitting(false);
                return;
            }
            pinServer(chosenServer);

            // Generate client Ed25519 key pair
            console.log('Generating client key pair...');
            const clientKeyPair = await generateClientKeyPair();
            console.log('Client public key:', clientKeyPair.publicKey.substring(0, 20) + '...');

            // Send registration request with client public key
            const res = await apiPost('/register', {
                username: username,
                email: email,
                password: password,
                invite_code: inviteCode,
                home_server: chosenServer.name,
                server_id: chosenServer.id,
                client_public_key: clientKeyPair.publicKey,
            }, false);

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Registration failed');
            }

            // Store client key pair securely
            storeClientKeyPair(clientKeyPair);
            console.log('Stored client key pair');

            // Store session key from server if provided
            if (data.session_key_encrypted) {
                storeSessionKey({
                    encryptedKey: data.session_key_encrypted,
                    signature: data.session_key_signature,
                    version: data.session_key_version,
                    expiresAt: data.session_key_expires_at,
                });
                console.log('Stored session key (version', data.session_key_version, ')');
            }

            // Direct Success - No OTP
            setRecoveryKey(data.recovery_key);
            setUserId(data.user_id);

            // Log user in
            loginWithoutRedirect(data.user_id, data.home_server, data.access_token, data.refresh_token);

            // Show success screen
            sessionStorage.setItem('showing_recovery_key', 'true');
            setIsSuccess(true);
        } catch (err) {
            console.error('Registration error:', err);
            setError(err instanceof Error ? err.message : 'Registration failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCopyRecoveryKey = () => {
        navigator.clipboard.writeText(recoveryKey);
    };

    const handleContinue = () => {
        sessionStorage.removeItem('showing_recovery_key');
        window.location.href = '/profile/setup';
    };

    // Success Screen
    if (isSuccess) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-bat-black p-4">
                <div className="w-full max-w-lg bg-bat-dark rounded-xl shadow-2xl p-8 border border-bat-gray/10 animate-scale-in">
                    <div className="mb-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold text-bat-gray mb-2">Registration Successful!</h1>
                        <div className="h-0.5 w-16 bg-bat-yellow mx-auto rounded-full opacity-50 mb-4"></div>
                        <p className="text-sm text-gray-400">
                            Welcome to the network, <span className="text-bat-yellow">{userId}</span>
                        </p>
                    </div>

                    <div className="mb-6 p-4 rounded-md bg-yellow-900/20 border border-yellow-500/50">
                        <div className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-yellow-400 mb-1">Save Your Recovery Key</p>
                                <p className="text-xs text-yellow-200/80">
                                    This key is required to recover your account if you lose access. Store it securely - it will not be shown again.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-bat-gray mb-2">
                            Recovery Key
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={recoveryKey}
                                readOnly
                                className="
                                    flex-1 px-4 py-3 rounded-md font-mono text-sm
                                    bg-bat-black text-bat-yellow
                                    border border-bat-yellow/30
                                    focus:outline-none focus:border-bat-yellow
                                "
                            />
                            <button
                                onClick={handleCopyRecoveryKey}
                                className="
                                    px-4 py-3 rounded-md
                                    bg-bat-yellow/10 text-bat-yellow
                                    border border-bat-yellow/30
                                    hover:bg-bat-yellow/20
                                    transition-colors
                                "
                                title="Copy to clipboard"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleContinue}
                        className="
                            w-full py-3 px-4 rounded-md font-bold text-lg
                            bg-bat-yellow text-bat-black
                            hover:bg-yellow-400
                            transform active:scale-[0.98]
                            transition-all duration-200
                            shadow-[0_0_15px_rgba(245,197,24,0.3)]
                        "
                    >
                        Continue to Profile
                    </button>
                </div>
            </div>
        );
    }

    // Registration Form
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
                    <h1 className="text-3xl font-bold text-bat-gray mb-2">Create Account</h1>
                    <div className="h-0.5 w-16 bg-bat-yellow mx-auto rounded-full opacity-50"></div>
                </div>

                <form className="space-y-6" onSubmit={handleRegistrationSubmit}>
                    {error && (
                        <div className="p-3 rounded-md bg-red-900/20 border border-red-500/50 text-red-400 text-sm">
                            {error}
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
                            placeholder="Choose a username"
                            required
                            disabled={isSubmitting}
                        />
                        <p className="mt-1 text-xs text-gray-500">Alphanumeric and underscores only</p>
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-bat-gray mb-2">
                            Email Address
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-md bg-bat-black text-white border border-bat-gray/20 focus:border-bat-yellow focus:ring-1 focus:ring-bat-yellow outline-none transition-all duration-200 placeholder-gray-600"
                            placeholder="your@email.com"
                            required
                            disabled={isSubmitting}
                        />
                        <p className="mt-1 text-xs text-gray-500">We don't verify this anymore, but it's good for recovery.</p>
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
                        />
                        <p className="mt-1 text-xs text-gray-500">At least 8 characters</p>
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-bat-gray mb-2">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-md bg-bat-black text-white border border-bat-gray/20 focus:border-bat-yellow focus:ring-1 focus:ring-bat-yellow outline-none transition-all duration-200 placeholder-gray-600"
                            placeholder="••••••••"
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    <div>
                        <label htmlFor="inviteCode" className="block text-sm font-medium text-bat-gray mb-2">
                            Invite Code
                        </label>
                        <input
                            type="text"
                            id="inviteCode"
                            value={inviteCode}
                            onChange={(e) => setInviteCode(e.target.value)}
                            className="w-full px-4 py-3 rounded-md bg-bat-black text-white border border-bat-gray/20 focus:border-bat-yellow focus:ring-1 focus:ring-bat-yellow outline-none transition-all duration-200 placeholder-gray-600 font-mono"
                            placeholder="XXXX-XXXX-XXXX"
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    <div>
                        <label htmlFor="serverId" className="block text-sm font-medium text-bat-gray mb-2">
                            Select Server
                        </label>
                        <select
                            id="serverId"
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
                            <option value="">-- Choose a Server --</option>
                            {KNOWN_SERVERS.map((srv) => (
                                <option key={srv.id} value={srv.id}>
                                    {srv.name} &mdash; {srv.id} (:{srv.port})
                                </option>
                            ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500">Select which backend server to register with</p>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 px-4 rounded-md font-bold text-lg bg-bat-yellow text-bat-black hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98] transition-all duration-200 shadow-[0_0_15px_rgba(245,197,24,0.3)]"
                    >
                        {isSubmitting ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-500">
                        Already have an account?{' '}
                        <Link href="/login" className="text-bat-yellow hover:text-white transition-colors duration-200 font-medium">
                            Sign in
                        </Link>
                    </p>
                </div>

                {/* Social links */}
                <div className="mt-8 pt-6 border-t border-bat-gray/10">
                    <p className="text-xs text-bat-gray/40 text-center mb-3">Connect with us</p>
                    <div className="flex items-center justify-center gap-5">
                        <a href="https://joinmastodon.org" target="_blank" rel="noopener noreferrer" title="Mastodon / Fediverse"
                            className="text-bat-gray/40 hover:text-bat-yellow transition-colors duration-200">
                            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                                <path d="M23.193 7.88c-.33-2.335-2.45-4.18-4.93-4.56-2.12-.33-4.25-.5-6.37-.5-2.12 0-4.25.17-6.37.5C3.04 3.71.92 5.55.6 7.88c-.26 1.84-.4 3.69-.4 5.54 0 1.85.14 3.7.4 5.54.33 2.35 2.45 4.18 4.93 4.56 2.12.33 4.25.5 6.37.5 2.12 0 4.25-.17 6.37-.5 2.48-.38 4.6-2.21 4.93-4.56.26-1.84.4-3.69.4-5.54 0-1.85-.14-3.7-.4-5.54z"/>
                            </svg>
                        </a>
                        <a href="https://github.com" target="_blank" rel="noopener noreferrer" title="GitHub"
                            className="text-bat-gray/40 hover:text-bat-yellow transition-colors duration-200">
                            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                            </svg>
                        </a>
                        <a href="https://x.com" target="_blank" rel="noopener noreferrer" title="X (Twitter)"
                            className="text-bat-gray/40 hover:text-bat-yellow transition-colors duration-200">
                            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
                        </a>
                        <a href="https://discord.com" target="_blank" rel="noopener noreferrer" title="Discord"
                            className="text-bat-gray/40 hover:text-bat-yellow transition-colors duration-200">
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
