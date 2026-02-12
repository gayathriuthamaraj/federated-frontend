"use client";

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import OTPInput from '../components/OTPInput';

export default function LoginPage() {
    const { login } = useAuth();

    // Step 1: username/password
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    // Step 2: OTP verification
    const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
    const [sessionId, setSessionId] = useState('');
    const [email, setEmail] = useState('');
    const [emailHint, setEmailHint] = useState('');

    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCredentialsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const res = await fetch('http://localhost:8082/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    password: password,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Login failed');
            }

            // Check if OTP is required
            if (data.requires_otp) {
                setSessionId(data.session_id);
                setEmail(username); // We'll use username as email identifier
                setEmailHint(data.email_hint || '');
                setStep('otp');
            } else {
                // Old flow - direct login (shouldn't happen with new backend)
                login(data.user_id, data.home_server, data.access_token || '', data.refresh_token || '');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOTPComplete = async (otp: string) => {
        setError('');
        setIsSubmitting(true);

        try {
            const res = await fetch('http://localhost:8082/verify-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    otp: otp,
                    session_id: sessionId,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Invalid OTP');
            }

            // Login successful with tokens
            login(data.user_id, data.home_server, data.access_token, data.refresh_token);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'OTP verification failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResendOTP = async () => {
        setError('');
        try {
            const res = await fetch('http://localhost:8082/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    password: password,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to resend OTP');
            }

            setSessionId(data.session_id);
            setEmailHint(data.email_hint || '');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to resend OTP');
        }
    };

    if (step === 'otp') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-bat-black p-4">
                <div className="w-full max-w-md bg-bat-dark rounded-lg shadow-2xl p-8 border border-bat-gray/10">
                    <div className="mb-8 text-center">
                        <h1 className="text-3xl font-bold text-bat-gray mb-2">Verify OTP</h1>
                        <div className="h-0.5 w-16 bg-bat-yellow mx-auto rounded-full opacity-50 mb-4"></div>
                        <p className="text-sm text-gray-400">
                            Enter the 6-digit code sent to<br />
                            <span className="text-bat-yellow font-mono">{emailHint}</span>
                        </p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 rounded-md bg-red-900/20 border border-red-500/50 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col items-center gap-6">
                        <OTPInput
                            onComplete={handleOTPComplete}
                            onResend={handleResendOTP}
                        />

                        <button
                            onClick={() => setStep('credentials')}
                            className="text-sm text-gray-500 hover:text-bat-yellow transition-colors"
                        >
                            ← Back to login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-bat-black p-4">
            <div className="w-full max-w-md bg-bat-dark rounded-lg shadow-2xl p-8 border border-bat-gray/10">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-bat-gray mb-2">Sign in</h1>
                    <div className="h-0.5 w-16 bg-bat-yellow mx-auto rounded-full opacity-50"></div>
                </div>

                <form className="space-y-6" onSubmit={handleCredentialsSubmit}>
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
                        {isSubmitting ? 'Sending OTP...' : 'Continue'}
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
