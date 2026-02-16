"use client";

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';


export default function RegisterPage() {
    const { loginWithoutRedirect } = useAuth();

    // Step 1: Collect initial registration data
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [inviteCode, setInviteCode] = useState('');

    // Step 2: Success
    const [step, setStep] = useState<'registration' | 'success'>('registration');

    // Step 3: Success
    const [recoveryKey, setRecoveryKey] = useState('');
    const [userId, setUserId] = useState('');

    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleRegistrationSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
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
            const res = await fetch('http://localhost:8082/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    email: email, // Backend ignores email for now but we send it
                    password: password,
                    invite_code: inviteCode,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Registration failed');
            }

            // Registration successful!
            setRecoveryKey(data.recovery_key);
            setUserId(data.user_id);

            // Login user without redirect (to show recovery key)
            // Backend register returns home_server but might not return tokens if it expects OTP - 
            // BUT wait, looking at backend code: RegisterHandler returns user_id, home_server, recovery_key.
            // It DOES NOT return access_token/refresh_token.
            // So we can't fully login yet without a separate login call?
            // Actually, based on backend `RegisterHandler`:
            // It returns: user_id, home_server, recovery_key.
            // It does NOT login the user given the stateless nature?
            // Wait, `loginWithoutRedirect` expects tokens.
            // If backend doesn't return them on register, we might need to Auto-Login?
            // or just show recovery key and ask user to login.
            // Let's check `loginWithoutRedirect` usage in previous code:
            // "loginWithoutRedirect(data.user_id, data.home_server, data.access_token, data.refresh_token);"
            // The old code expected access_token/refresh_token from `complete-registration`.
            // The `register` endpoint only returns user_id, home_server, recovery_key.
            // So we should probably try to Login automatically or just show success and ask to login.
            // Auto-login would require sending password again to /login.

            // Let's attempt auto-login
            const loginRes = await fetch('http://localhost:8082/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (loginRes.ok) {
                const loginData = await loginRes.json();
                loginWithoutRedirect(loginData.user_id, loginData.home_server, loginData.access_token || '', loginData.refresh_token || '');
                // Mark that we're showing recovery key
                sessionStorage.setItem('showing_recovery_key', 'true');
                setStep('success');
            } else {
                // Fallback if auto-login fails: just show success but maybe redirect to login on continue?
                // But we want to show recovery key.
                // We can set step to success anyway, but user won't be "logged in" in context.
                // That's fine, "Continue" button on success screen redirects to /profile.
                // If not logged in, auth guard will redirect to /login.
                setStep('success');
            }

        } catch (err) {
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
        // If we failed auto-login, this will just hit auth guard and go to login.
        window.location.href = '/profile/edit';
    };

    // Step 3: Success - Show recovery key
    if (step === 'success') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-bat-black p-4">
                <div className="w-full max-w-lg bg-bat-dark rounded-lg shadow-2xl p-8 border border-bat-gray/10">
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
                        Continue to Setup Profile
                    </button>
                </div>
            </div>
        );
    }



    // Step 1: Registration Form
    return (
        <div className="flex items-center justify-center min-h-screen bg-bat-black p-4">
            <div className="w-full max-w-md bg-bat-dark rounded-lg shadow-2xl p-8 border border-bat-gray/10">
                <div className="mb-8 text-center">
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
                        <p className="mt-1 text-xs text-gray-500">Used for OTP verification</p>
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
            </div>
        </div>
    );
}
