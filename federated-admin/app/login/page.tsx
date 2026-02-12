"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { sendLoginOTP, verifyLoginOTP } from '../api/admin';
import { Lock } from 'lucide-react';
import OTPVerification from '../components/OTPVerification';

export default function LoginPage() {
    const router = useRouter();
    const [step, setStep] = useState<'credentials' | 'otp'>('credentials');

    // Credentials step
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    // OTP step
    const [sessionId, setSessionId] = useState('');
    const [email, setEmail] = useState('');
    const [emailHint, setEmailHint] = useState('');
    const [expiresIn, setExpiresIn] = useState(300);

    // Common
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [serverName, setServerName] = useState('');

    useEffect(() => {
        // Check if server is configured
        const trustedServer = localStorage.getItem('trusted_server');
        if (!trustedServer && !process.env.NEXT_PUBLIC_BACKEND_URL) {
            // If no server pinned and no env set, redirect to setup
            router.push('/setup');
            return;
        }

        if (trustedServer) {
            try {
                const data = JSON.parse(trustedServer);
                setServerName(data.server_name || 'Admin Panel');
            } catch (e) {
                // Ignore parsing errors
            }
        }
    }, [router]);

    const handleCredentialsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await sendLoginOTP(username, password);

            // Store session data for OTP verification
            setSessionId(response.session_id);
            setEmail(username); // Will be used for OTP verification
            setEmailHint(response.email_hint);
            setExpiresIn(response.expires_in);

            // Move to OTP step
            setStep('otp');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOTPVerify = async (otp: string) => {
        // Extract email from the login response or use username
        // The backend expects email for OTP verification
        const response = await verifyLoginOTP(email, otp, sessionId);

        // Store tokens
        localStorage.setItem('admin_token', response.access_token);
        if (response.refresh_token) {
            localStorage.setItem('refresh_token', response.refresh_token);
        }

        // Navigate to dashboard
        router.push('/dashboard');
    };

    const handleResendOTP = async () => {
        setError('');
        setIsLoading(true);

        try {
            const response = await sendLoginOTP(username, password);
            setSessionId(response.session_id);
            setExpiresIn(response.expires_in);
        } catch (err) {
            throw err; // Let OTPVerification component handle the error
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackToCredentials = () => {
        setStep('credentials');
        setSessionId('');
        setEmail('');
        setEmailHint('');
        setError('');
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-gray-800 border border-gray-700 rounded-lg p-8">
                {step === 'credentials' ? (
                    <>
                        <div className="mb-8 text-center flex flex-col items-center">
                            <div className="mb-4 p-3 bg-blue-900/30 rounded-full">
                                <Lock className="w-12 h-12 text-blue-500" />
                            </div>
                            <h1 className="text-3xl font-bold text-white mb-2">{serverName || 'Admin Login'}</h1>
                            <p className="text-gray-400">Enter your credentials to access the admin panel</p>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
                                <p className="text-red-400 text-sm">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleCredentialsSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    id="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                                    placeholder="Enter admin username"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                                    placeholder="Enter password"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors"
                            >
                                {isLoading ? 'Sending OTP...' : 'Continue'}
                            </button>
                        </form>

                        <div className="mt-6 pt-6 border-t border-gray-700 text-center text-gray-400 text-sm">
                            <p>Admin access only. Unauthorized attempts will be logged.</p>
                            <button
                                onClick={() => router.push('/setup')}
                                className="mt-4 text-blue-400 hover:text-blue-300 transition-colors"
                            >
                                Switch Server
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <OTPVerification
                            emailHint={emailHint}
                            expiresIn={expiresIn}
                            onVerify={handleOTPVerify}
                            onResend={handleResendOTP}
                            error={error}
                        />

                        <div className="mt-6 pt-6 border-t border-gray-700 text-center">
                            <button
                                onClick={handleBackToCredentials}
                                className="text-gray-400 hover:text-gray-300 transition-colors text-sm"
                            >
                                ← Back to login
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
