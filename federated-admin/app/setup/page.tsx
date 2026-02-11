'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import QRScanner from '../components/QRScanner';

export default function SetupPage() {
    const router = useRouter();
    const [scanning, setScanning] = useState(false); // Default to manual for better UX if cam fails
    const [error, setError] = useState<string | null>(null);
    const [manualCode, setManualCode] = useState('');
    const [manualServerUrl, setManualServerUrl] = useState('http://localhost:8082');

    const handleScan = (data: string | null) => {
        if (data) {
            try {
                const parsedData = JSON.parse(data);
                if (!parsedData.server_url || !parsedData.public_key || !parsedData.invite_code) {
                    throw new Error("Invalid QR code format");
                }
                saveAndRedirect(parsedData);
            } catch (err) {
                setError("Invalid QR code. Please ensure this is a valid admin invite.");
            }
        }
    };

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Validate server connection
            const res = await fetch(`${manualServerUrl}/server/info`);
            if (!res.ok) throw new Error("Could not connect to server");

            const serverInfo = await res.json();

            const data = {
                server_url: manualServerUrl,
                server_id: serverInfo.server_id,
                server_name: serverInfo.server_name,
                public_key: serverInfo.public_key,
                invite_code: manualCode,
                pinned_at: new Date().toISOString()
            };

            saveAndRedirect(data);
        } catch (err: any) {
            setError(err.message || "Failed to connect to server");
        }
    };

    const saveAndRedirect = (data: any) => {
        // Pin server
        localStorage.setItem('trusted_server', JSON.stringify({
            server_url: data.server_url,
            server_id: data.server_id,
            server_name: data.server_name,
            public_key: data.public_key,
            pinned_at: new Date().toISOString()
        }));

        // Store invite code
        if (data.invite_code) {
            sessionStorage.setItem('invite_code', data.invite_code);
        }

        router.push('/login');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        Setup Admin Access
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Scan your admin invite QR code or enter details manually.
                    </p>
                </div>

                <div className="mt-8 space-y-6">
                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                            <div className="flex">
                                <div className="ml-3">
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {scanning ? (
                        <div className="space-y-4">
                            <QRScanner onScan={handleScan} />
                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={() => setScanning(false)}
                                    className="text-indigo-600 hover:text-indigo-500 font-medium text-sm"
                                >
                                    Switch to Manual Entry
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form className="space-y-6" onSubmit={handleManualSubmit}>
                            <div>
                                <label htmlFor="server-url" className="block text-sm font-medium text-gray-700">
                                    Server URL
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="server-url"
                                        name="server-url"
                                        type="url"
                                        required
                                        value={manualServerUrl}
                                        onChange={(e) => setManualServerUrl(e.target.value)}
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        placeholder="https://example.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="invite-code" className="block text-sm font-medium text-gray-700">
                                    Invite Code
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="invite-code"
                                        name="invite-code"
                                        type="text"
                                        required
                                        value={manualCode}
                                        onChange={(e) => setManualCode(e.target.value)}
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        placeholder="Enter invite code"
                                    />
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Connect
                                </button>
                            </div>

                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={() => setScanning(true)}
                                    className="text-indigo-600 hover:text-indigo-500 font-medium text-sm"
                                >
                                    Switch to QR Scan
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
