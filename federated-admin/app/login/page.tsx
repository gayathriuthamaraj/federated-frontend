"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adminLogin, getServerConfig } from '../api/admin';
import { Lock } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [serverName, setServerName] = useState('Server A');
    const [selectedServerKey, setSelectedServerKey] = useState('Server A');

    useEffect(() => {

        localStorage.removeItem('admin_token');


        const trustedServer = localStorage.getItem('trusted_server');
        if (trustedServer) {
            try {
                const data = JSON.parse(trustedServer);
                setServerName(data.server_name || 'Admin Panel');


                if (data.server_url === 'http://localhost:8082') setSelectedServerKey('Server A');
                else if (data.server_url === 'http://localhost:9082') setSelectedServerKey('Server B');
                else setSelectedServerKey('Custom');
            } catch (e) {

            }
        } else {

            handleServerChange('Server A');
        }
    }, []);

    const handleServerChange = (newServer: string) => {
        setSelectedServerKey(newServer);
        if (newServer === 'Custom') {
            router.push('/setup');
            return;
        }

        let url = 'http://localhost:8082';
        let name = newServer;

        if (newServer === 'Server A') {
            url = 'http://localhost:8082';
        } else if (newServer === 'Server B') {
            url = 'http://localhost:9082';
        }

        const config = {
            server_name: name,
            server_url: url,
            server_id: 'unknown',
            public_key: '',
            pinned_at: new Date().toISOString()
        };

        localStorage.setItem('trusted_server', JSON.stringify(config));
        setServerName(name);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {

            const response = await adminLogin({ username, password });


            localStorage.setItem('admin_token', response.token);



            const config = await getServerConfig();



            if (config.server_name && config.server_name !== serverName) {

                const updatedConfig = {
                    server_name: config.server_name,
                    server_url: (selectedServerKey === 'Server B' ? 'http://localhost:9082' :
                        (selectedServerKey === 'Server A' ? 'http://localhost:8082' : 'http://localhost:8082')),
                    server_id: 'unknown',
                    public_key: '',
                    pinned_at: new Date().toISOString()
                };
                localStorage.setItem('trusted_server', JSON.stringify(updatedConfig));
            }


            router.push('/dashboard');
        } catch (err) {

            localStorage.removeItem('admin_token');
            setError(err instanceof Error ? err.message : 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-gray-800 border border-gray-700 rounded-lg p-8">
                <div className="mb-8 text-center flex flex-col items-center">
                    <div className="mb-4 p-3 bg-blue-900/30 rounded-full">
                        <Lock className="w-12 h-12 text-blue-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Admin Login</h1>
                    <p className="text-gray-400">Enter your credentials to access the admin panel</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="serverSelect" className="block text-sm font-medium text-gray-300 mb-2">
                            Select Server
                        </label>
                        <select
                            id="serverSelect"
                            value={selectedServerKey}
                            onChange={(e) => handleServerChange(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                        >
                            <option value="Server A">Server A (Port 8080)</option>
                            <option value="Server B">Server B (Port 9080)</option>
                            <option value="Custom">Custom / external...</option>
                        </select>
                    </div>

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
                        {isLoading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <div className="mt-6 pt-6 border-t border-gray-700 text-center text-gray-400 text-sm">
                    <p>Admin access only. Unauthorized attempts will be logged.</p>
                </div>
            </div>
        </div>
    );
}
