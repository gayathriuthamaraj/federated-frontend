"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import OTPInput from '../components/OTPInput';
import { KNOWN_SERVERS, findServerById, getPinnedServer } from '../utils/servers';
import { recoverWithPasskey, isPasskeySupported } from '../utils/passkey';
import { useAuth } from '../context/AuthContext';

export default function RecoverPage() {
    const router = useRouter();
    const { login } = useAuth();

    const [step, setStep] = useState<'form' | 'recovered'>('form');

    // Form fields
    const [username, setUsername] = useState('');
    const [serverId, setServerId] = useState('');
    const [totpCode, setTotpCode] = useState('');
    const [recoveryKey, setRecoveryKey] = useState('');

    // Result
    const [newRecoveryKey, setNewRecoveryKey] = useState('');

    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const pinned = getPinnedServer();
        if (pinned?.server_id) setServerId(pinned.server_id);
        else if (KNOWN_SERVERS.length > 0) setServerId(KNOWN_SERVERS[0].id);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!isPasskeySupported()) {
            setError('Your browser does not support passkeys. Try a different browser or device.');
            return;
        }

        const server = findServerById(serverId);
        if (!server) {
            setError('Please select a server.');
            return;
        }

        if (totpCode.length !== 6) {
            setError('Enter the 6-digit code from your authenticator app.');
            return;
        }

        setIsSubmitting(true);
        try {
            const data = await recoverWithPasskey(server.url, username, totpCode, recoveryKey);

            // Log in with the new tokens
            login(data.user_id, data.home_server, data.access_token, data.refresh_token);

            setNewRecoveryKey(data.new_recovery_key ?? '');
            setStep('recovered');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Recovery failed. Check your details and try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(newRecoveryKey).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };


    // ── Step 2: Success screen ───────────────────────────────────────────────
    if (step === 'recovered') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-bat-black p-4">
                <div className="w-full max-w-lg bg-bat-dark rounded-lg shadow-2xl p-8 border border-bat-gray/10 text-center">
                    <h1 className="text-3xl font-bold text-bat-yellow mb-2">Access Restored!</h1>
                    <div className="h-0.5 w-16 bg-bat-yellow mx-auto rounded-full opacity-50 mb-6"></div>

                    <p className="text-bat-gray text-sm mb-6">
                        Your passkey has been re-enrolled and you are now signed in.
                        <br /><br />
                        <strong className="text-red-400">Save your new recovery key below.</strong>{' '}
                        The old one is now invalid.
                    </p>

                    {newRecoveryKey && (
                        <div className="text-left mb-6">
                            <label className="block text-xs text-bat-gray uppercase font-bold mb-1">New Recovery Key</label>
                            <div className="relative bg-black/50 p-3 rounded border border-bat-yellow/40 font-mono text-xs text-bat-yellow break-all">
                                {newRecoveryKey}
                                <button
                                    onClick={handleCopy}
                                    className="absolute top-2 right-2 px-2 py-0.5 rounded text-xs bg-bat-yellow/10 hover:bg-bat-yellow/20 text-bat-yellow transition-colors"
                                >
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                            <p className="text-xs text-bat-gray/50 mt-1">
                                Store this somewhere safe — it cannot be shown again.
                            </p>
                        </div>
                    )}

                    <button
                        onClick={() => router.push('/feed')}
                        className="
                            w-full py-3 px-4 rounded-md font-bold text-lg
                            bg-bat-yellow text-bat-black
                            hover:bg-yellow-400
                            transform active:scale-[0.98]
                            transition-all duration-200
                        "
                    >
                        Go to Feed
                    </button>
                </div>
            </div>
        );
    }

    // ── Step 1: Recovery form ────────────────────────────────────────────────
    return (
        <div className="flex items-center justify-center min-h-screen bg-bat-black p-4">
            <div className="w-full max-w-md bg-bat-dark rounded-lg shadow-2xl p-8 border border-bat-gray/10">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-bat-gray mb-2">Recover Account</h1>
                    <div className="h-0.5 w-16 bg-bat-yellow mx-auto rounded-full opacity-50"></div>
                    <p className="text-bat-gray/60 text-sm mt-2">
                        Re-enroll your passkey using your authenticator app and recovery key
                    </p>
                </div>

                {!isPasskeySupported() && (
                    <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-500/40 rounded text-yellow-400 text-xs">
                        ⚠ Passkeys are not supported in this browser. Use Chrome, Safari, Edge, or Firefox on a supported platform.
                    </div>
                )}

                <form className="space-y-4" onSubmit={handleSubmit}>
                    {error && (
                        <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-md">
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-bat-gray mb-1">Server</label>
                        <select
                            value={serverId}
                            onChange={(e) => setServerId(e.target.value)}
                            className="w-full px-4 py-3 rounded-md bg-bat-black text-white border border-bat-gray/20 focus:border-bat-yellow outline-none"
                        >
                            {KNOWN_SERVERS.map((srv) => (
                                <option key={srv.id} value={srv.id}>{srv.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-bat-gray mb-1">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-3 rounded-md bg-bat-black text-white border border-bat-gray/20 focus:border-bat-yellow outline-none"
                            placeholder="your_username"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-bat-gray mb-1">
                            Authenticator Code
                        </label>
                        <OTPInput
                            length={6}
                            value={totpCode}
                            onChange={setTotpCode}
                        />
                        <p className="text-xs text-bat-gray/50 mt-1">
                            6-digit code from your authenticator app
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-bat-gray mb-1">Recovery Key</label>
                        <input
                            type="text"
                            value={recoveryKey}
                            onChange={(e) => setRecoveryKey(e.target.value)}
                            className="w-full px-4 py-3 rounded-md bg-bat-black text-white border border-bat-gray/20 focus:border-bat-yellow outline-none font-mono text-sm"
                            placeholder="Enter your recovery key"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting || !isPasskeySupported()}
                        className="
                            w-full py-3 px-4 mt-2 rounded-md font-bold text-lg
                            bg-bat-yellow text-bat-black
                            hover:bg-yellow-400
                            disabled:opacity-50
                            transition-all duration-200
                        "
                    >
                        {isSubmitting ? 'Verifying & re-enrolling passkey…' : 'Recover Account'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <Link href="/login" className="text-bat-yellow hover:text-white text-sm">
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}

