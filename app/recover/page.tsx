"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RecoverPage() {
    const router = useRouter();
    const [userId, setUserId] = useState('');
    const [recoveryKey, setRecoveryKey] = useState('');
    const [newCredentials, setNewCredentials] = useState<{ private_key: string, recovery_key: string } | null>(null);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const response = await fetch('http://localhost:8082/identity/recover', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: userId,
                    recovery_key: recoveryKey,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Recovery failed');
            }

            const data = await response.json();
            // Expected: { message, new_private_key, new_recovery_key, user_id }
            setNewCredentials({
                private_key: data.new_private_key,
                recovery_key: data.new_recovery_key
            });

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Recovery failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (newCredentials) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-bat-black p-4">
                <div className="w-full max-w-lg bg-bat-dark rounded-lg shadow-2xl p-8 border border-bat-gray/10 text-center">
                    <h1 className="text-3xl font-bold text-bat-yellow mb-2">Account Recovered!</h1>
                    <div className="h-0.5 w-16 bg-bat-yellow mx-auto rounded-full opacity-50 mb-6"></div>

                    <p className="text-bat-gray mb-6 text-sm">
                        Your account has been successfully recovered. We have rotated your keys for security.
                        <br /><br />
                        <strong className="text-red-400">IMPORTANT:</strong> Save these new credentials immediately. The old ones are now invalid.
                    </p>

                    <div className="text-left mb-4">
                        <label className="text-xs text-bat-gray uppercase font-bold">New Private Key</label>
                        <div className="bg-black/50 p-3 rounded border border-bat-gray/30 font-mono text-xs text-green-400 break-all">
                            {newCredentials.private_key}
                        </div>
                    </div>

                    <div className="text-left mb-6">
                        <label className="text-xs text-bat-gray uppercase font-bold">New Recovery Key</label>
                        <div className="bg-black/50 p-3 rounded border border-bat-gray/30 font-mono text-xs text-bat-yellow break-all">
                            {newCredentials.recovery_key}
                        </div>
                    </div>

                    <button
                        onClick={() => router.push('/login')}
                        className="
                            w-full py-3 px-4 rounded-md font-bold text-lg
                            bg-bat-yellow text-bat-black
                            hover:bg-yellow-400
                            transform active:scale-[0.98]
                            transition-all duration-200
                        "
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-bat-black p-4">
            <div className="w-full max-w-md bg-bat-dark rounded-lg shadow-2xl p-8 border border-bat-gray/10">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-bat-gray mb-2">Recover Account</h1>
                    <div className="h-0.5 w-16 bg-bat-yellow mx-auto rounded-full opacity-50"></div>
                    <p className="text-bat-gray/60 text-sm mt-2">Use your recovery key to restore access</p>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                    {error && (
                        <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-md">
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-bat-gray mb-1">User ID / Handle</label>
                        <input
                            type="text"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            className="w-full px-4 py-3 rounded-md bg-bat-black text-white border border-bat-gray/20 focus:border-bat-yellow outline-none"
                            placeholder="username@server"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-bat-gray mb-1">Recovery Key</label>
                        <input
                            type="text"
                            value={recoveryKey}
                            onChange={(e) => setRecoveryKey(e.target.value)}
                            className="w-full px-4 py-3 rounded-md bg-bat-black text-white border border-bat-gray/20 focus:border-bat-yellow outline-none font-mono"
                            placeholder="Enter your recovery key"
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
                            disabled:opacity-50
                            transition-all duration-200
                        "
                    >
                        {isSubmitting ? 'Recovering...' : 'Recover Account'}
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
