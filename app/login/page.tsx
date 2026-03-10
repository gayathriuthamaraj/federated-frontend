"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { KNOWN_SERVERS, findServerById, pinServer, getPinnedServer } from '../utils/servers';
import OTPInput from '../components/OTPInput';
import { loginWithPasskey, isPasskeySupported } from '../utils/passkey';

export default function LoginPage() {
    const { login } = useAuth();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [serverId, setServerId] = useState<string>('');

    // TOTP second-factor state
    const [totpRequired, setTotpRequired] = useState(false);
    const [partialToken, setPartialToken] = useState('');
    const [chosenServerURL, setChosenServerURL] = useState('');

    // Backup code login state
    const [useBackupCode, setUseBackupCode] = useState(false);
    const [backupCodeInput, setBackupCodeInput] = useState('');
    const [lowCodesWarning, setLowCodesWarning] = useState(false);

    // Passkey login state
    const [passkeyLoading, setPasskeyLoading] = useState(false);

    // Toggle password visibility
    const [showPassword, setShowPassword] = useState(false);

    // Increment to force-reset OTPInput boxes after a failed attempt
    const [otpResetKey, setOtpResetKey] = useState(0);

    // Populate from localStorage only after mount (avoids SSR/hydration mismatch)
    useEffect(() => {
        const pinned = getPinnedServer();
        if (pinned?.server_id) setServerId(pinned.server_id);
        else if (KNOWN_SERVERS.length > 0) setServerId(KNOWN_SERVERS[0].id);
    }, []);

    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ── Step 1: password authentication ──────────────────────────────────────
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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            // TOTP second factor required
            if (data.totp_required) {
                setPartialToken(data.partial_token);
                setChosenServerURL(chosenServer.url);
                setTotpRequired(true);
                return;
            }

            login(data.user_id, data.home_server, data.access_token || '', data.refresh_token || '');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Step 2: TOTP verification ─────────────────────────────────────────────
    const handleTOTPComplete = async (otp: string) => {
        setError('');
        setIsSubmitting(true);
        try {
            const response = await fetch(`${chosenServerURL}/login/totp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ partial_token: partialToken, otp_code: otp }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Invalid authenticator code');
            }

            login(data.user_id, data.home_server, data.access_token || '', data.refresh_token || '');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Verification failed');
            setOtpResetKey(k => k + 1); // clear boxes so user can re-enter
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Step 2b: backup code login ────────────────────────────────────────────
    const handleBackupCodeLogin = async () => {
        if (!backupCodeInput.trim()) return;
        setError('');
        setIsSubmitting(true);
        try {
            const response = await fetch(`${chosenServerURL}/login/totp/backup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ partial_token: partialToken, backup_code: backupCodeInput.trim().toUpperCase() }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Invalid backup code');
            }
            if (typeof data.backup_codes_remaining === 'number' && data.backup_codes_remaining < 3) {
                setLowCodesWarning(true);
            }
            login(data.user_id, data.home_server, data.access_token || '', data.refresh_token || '');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Backup code login failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Passkey login ─────────────────────────────────────────────────────────
    const handlePasskeyLogin = async () => {
        if (!username) {
            setError('Enter your username first, then click Sign in with passkey.');
            return;
        }
        const chosenServer = findServerById(serverId);
        if (!chosenServer) {
            setError('Please select a server.');
            return;
        }
        pinServer(chosenServer);
        setError('');
        setPasskeyLoading(true);
        try {
            const data = await loginWithPasskey(chosenServer.url, username);
            login(data.user_id, data.home_server, data.access_token, data.refresh_token);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Passkey login failed');
        } finally {
            setPasskeyLoading(false);
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
                    <h1 className="text-3xl font-bold text-bat-gray mb-2">
                        {totpRequired ? 'Two-Factor Auth' : 'Sign in'}
                    </h1>
                    <div className="h-0.5 w-16 bg-bat-yellow mx-auto rounded-full opacity-50"></div>
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-md bg-red-900/20 border border-red-500/50 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {/* ── TOTP step ──────────────────────────────────────────── */}
                {totpRequired ? (
                    <div className="space-y-4">
                        {lowCodesWarning && (
                            <div className="p-3 rounded-md bg-yellow-900/20 border border-yellow-500/40 text-yellow-400 text-sm">
                                ⚠ You have fewer than 3 backup codes remaining. Go to Settings to regenerate them.
                            </div>
                        )}

                        {!useBackupCode ? (
                            <>
                                <p className="text-sm text-bat-gray/80 text-center">
                                    Open your authenticator app and enter the 6-digit code for{' '}
                                    <span className="text-bat-yellow font-semibold">{username}</span>.
                                </p>
                                <OTPInput onComplete={handleTOTPComplete} length={6} resetKey={otpResetKey} />
                                {isSubmitting && (
                                    <p className="text-sm text-bat-gray/60 text-center">Verifying…</p>
                                )}
                                <button
                                    onClick={() => { setUseBackupCode(true); setError(''); }}
                                    className="w-full text-sm text-bat-gray/50 hover:text-bat-yellow transition-colors text-center"
                                >
                                    Lost your authenticator? Use a backup code →
                                </button>
                            </>
                        ) : (
                            <>
                                <p className="text-sm text-bat-gray/80 text-center">
                                    Enter one of your backup recovery codes for{' '}
                                    <span className="text-bat-yellow font-semibold">{username}</span>.
                                </p>
                                <input
                                    type="text"
                                    value={backupCodeInput}
                                    onChange={e => setBackupCodeInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleBackupCodeLogin()}
                                    placeholder="XXXX-XXXX"
                                    className="w-full px-4 py-3 rounded-md bg-bat-black text-white border border-bat-gray/20 focus:border-bat-yellow focus:ring-1 focus:ring-bat-yellow outline-none transition-all duration-200 font-mono text-center tracking-widest placeholder-gray-600 uppercase"
                                    autoComplete="off"
                                    spellCheck={false}
                                    disabled={isSubmitting}
                                />
                                <button
                                    onClick={handleBackupCodeLogin}
                                    disabled={isSubmitting || !backupCodeInput.trim()}
                                    className="w-full py-3 bg-bat-yellow text-bat-black font-bold rounded-md hover:bg-yellow-400 disabled:opacity-50 transition-colors"
                                >
                                    {isSubmitting ? 'Verifying…' : 'Use backup code'}
                                </button>
                                <button
                                    onClick={() => { setUseBackupCode(false); setError(''); }}
                                    className="w-full text-sm text-bat-gray/50 hover:text-bat-yellow transition-colors"
                                >
                                    ← Back to authenticator code
                                </button>
                            </>
                        )}

                        <button
                            onClick={() => { setTotpRequired(false); setUseBackupCode(false); setBackupCodeInput(''); setError(''); }}
                            className="w-full text-sm text-bat-gray/50 hover:text-bat-yellow transition-colors"
                        >
                            ← Back to sign in
                        </button>
                    </div>
                ) : (
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

                        <div className="relative">
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-bat-gray mb-2"
                            >
                                Password
                            </label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="
                  w-full px-4 py-3 pr-12 rounded-md
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
                            <button
                                type="button"
                                onClick={() => setShowPassword(v => !v)}
                                className="absolute right-3 top-9 text-bat-gray/40 hover:text-bat-yellow transition-colors"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                tabIndex={-1}
                            >
                                {showPassword ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
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

                        {/* Passkey login */}
                        {isPasskeySupported() && (
                            <div className="space-y-2 pt-2">
                                {/* OR divider */}
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 h-px bg-bat-gray/10" />
                                    <span className="text-xs text-bat-gray/30 font-medium">or</span>
                                    <div className="flex-1 h-px bg-bat-gray/10" />
                                </div>

                                <button
                                    type="button"
                                    onClick={handlePasskeyLogin}
                                    disabled={passkeyLoading || isSubmitting}
                                    className="
                      w-full py-3 px-4 rounded-md font-semibold text-sm
                      bg-transparent text-bat-gray border border-bat-gray/20
                      hover:border-bat-yellow/60 hover:text-bat-yellow hover:bg-bat-yellow/5
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition-all duration-200 flex items-center justify-center gap-2
                    "
                                >
                                    {passkeyLoading ? (
                                        <>
                                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                            </svg>
                                            Verifying with your device…
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0-1.104-.896-2-2-2s-2 .896-2 2 .896 2 2 2 2-.896 2-2zM6.343 6.343A8 8 0 1017.657 17.657 8 8 0 006.343 6.343z" />
                                            </svg>
                                            Sign in with passkey
                                        </>
                                    )}
                                </button>
                                <p className="text-xs text-bat-gray/35 text-center leading-relaxed">
                                    Uses your device’s biometrics or security key (Face ID, fingerprint, Windows Hello).
                                    No password needed — enter your username above first.
                                </p>
                            </div>
                        )}
                    </form>
                )}

                <div className="mt-6 text-center space-y-2">
                    <p className="text-sm text-gray-500">
                        Don't have an account?{' '}
                        <Link
                            href="/register"
                            className="text-bat-yellow hover:text-white transition-colors duration-200 font-medium"
                        >
                            Create an account
                        </Link>
                    </p>
                    <p className="text-sm text-gray-500">
                        Lost your passkey?{' '}
                        <Link
                            href="/recover"
                            className="text-bat-gray/70 hover:text-bat-yellow transition-colors duration-200"
                        >
                            Recover account
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
