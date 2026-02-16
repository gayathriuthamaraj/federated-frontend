"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../components/AdminLayout';
import { testDatabaseConnection, startDatabaseMigration, getMigrationStatus, MigrationStatus } from '../api/admin';
import { Eye, EyeOff, Search, Rocket, CheckCircle, XCircle, AlertTriangle, Play } from 'lucide-react';

export default function DatabaseConfigPage() {
    const router = useRouter();
    const [connectionString, setConnectionString] = useState('');
    const [testResult, setTestResult] = useState<{ status: string; message: string } | null>(null);
    const [isTesting, setIsTesting] = useState(false);
    const [isMigrating, setIsMigrating] = useState(false);
    const [migrationStatus, setMigrationStatus] = useState<MigrationStatus | null>(null);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            router.push('/login');
            return;
        }
    }, [router]);

    
    useEffect(() => {
        if (migrationStatus && migrationStatus.status === 'in_progress') {
            const interval = setInterval(async () => {
                try {
                    const status = await getMigrationStatus(migrationStatus.id);
                    setMigrationStatus(status);

                    if (status.status === 'completed' || status.status === 'failed') {
                        setIsMigrating(false);
                    }
                } catch (err) {
                    console.error('Failed to poll migration status:', err);
                }
            }, 2000);

            return () => clearInterval(interval);
        }
    }, [migrationStatus]);

    const handleTestConnection = async () => {
        if (!connectionString.trim()) {
            setError('Please enter a connection string');
            return;
        }

        setIsTesting(true);
        setError('');
        setTestResult(null);

        try {
            const result = await testDatabaseConnection(connectionString);
            setTestResult(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Test failed');
        } finally {
            setIsTesting(false);
        }
    };

    const handleStartMigration = async () => {
        if (!connectionString.trim()) {
            setError('Please enter a connection string');
            return;
        }

        if (!testResult || testResult.status !== 'success') {
            setError('Please test the connection first');
            return;
        }

        setIsMigrating(true);
        setError('');

        try {
            const result = await startDatabaseMigration(connectionString);
            
            const status = await getMigrationStatus(result.migration_id);
            setMigrationStatus(status);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to start migration');
            setIsMigrating(false);
        }
    };

    const getMigrationProgress = () => {
        if (!migrationStatus || !migrationStatus.tables_migrated) return 0;

        const total = 8; 
        const migrated = Object.keys(migrationStatus.tables_migrated).length;
        return Math.round((migrated / total) * 100);
    };

    return (
        <AdminLayout>
            <div className="max-w-4xl space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Database Configuration</h1>
                    <p className="text-gray-400">Test connections and migrate to a new database</p>
                </div>

                {error && (
                    <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
                        <p className="text-red-400">{error}</p>
                    </div>
                )}

                {}
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-4">
                    <h2 className="text-xl font-bold text-white">Database Connection</h2>

                    <div>
                        <label htmlFor="connectionString" className="block text-sm font-medium text-gray-300 mb-2">
                            PostgreSQL Connection String
                        </label>
                        <div className="relative">
                            <textarea
                                id="connectionString"
                                value={connectionString}
                                onChange={(e) => { setConnectionString(e.target.value); setTestResult(null); }}
                                rows={3}
                                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors font-mono text-sm"
                                placeholder="postgresql://username:password@host:5432/database"
                                style={{ filter: showPassword ? 'none' : 'blur(4px)' }}
                            />
                            <button
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute top-3 right-3 px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded transition-colors flex items-center gap-1"
                            >
                                {showPassword ? (
                                    <>
                                        <EyeOff className="w-4 h-4" />
                                        <span>Hide</span>
                                    </>
                                ) : (
                                    <>
                                        <Eye className="w-4 h-4" />
                                        <span>Show</span>
                                    </>
                                )}
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                            Format: postgresql://user:password@host:port/database
                        </p>
                    </div>

                    <button
                        onClick={handleTestConnection}
                        disabled={isTesting || !connectionString}
                        className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        {isTesting ? (
                            'Testing Connection...'
                        ) : (
                            <>
                                <Search className="w-5 h-5" />
                                <span>Test Connection</span>
                            </>
                        )}
                    </button>

                    {testResult && (
                        <div className={`p-4 rounded-lg border ${testResult.status === 'success'
                            ? 'bg-green-900/20 border-green-500/50'
                            : 'bg-red-900/20 border-red-500/50'
                            }`}>
                            <div className={`flex items-center gap-2 ${testResult.status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                                {testResult.status === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                                <span>{testResult.message}</span>
                            </div>
                        </div>
                    )}
                </div>

                {}
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-4">
                    <h2 className="text-xl font-bold text-white">Database Migration</h2>

                    <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-yellow-400 font-bold mb-2">
                            <AlertTriangle className="w-5 h-5" />
                            <span>Important Information</span>
                        </div>
                        <ul className="text-yellow-300 text-sm space-y-1 list-disc list-inside">
                            <li>Always backup your current database before migrating</li>
                            <li>The server may experience brief downtime during migration</li>
                            <li>All tables and data will be copied to the new database</li>
                            <li>Test the connection before starting migration</li>
                        </ul>
                    </div>

                    {!migrationStatus && (
                        <button
                            onClick={handleStartMigration}
                            disabled={isMigrating || !testResult || testResult.status !== 'success'}
                            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {isMigrating ? (
                                'Starting Migration...'
                            ) : (
                                <>
                                    <Rocket className="w-5 h-5" />
                                    <span>Start Migration</span>
                                </>
                            )}
                        </button>
                    )}

                    {}
                    {migrationStatus && (
                        <div className="space-y-4">
                            <div className="bg-gray-700 rounded-lg p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-white font-bold">Migration Status</span>
                                    <span className={`px-3 py-1 rounded-full text-sm ${migrationStatus.status === 'completed' ? 'bg-green-900/30 text-green-400' :
                                        migrationStatus.status === 'failed' ? 'bg-red-900/30 text-red-400' :
                                            migrationStatus.status === 'in_progress' ? 'bg-blue-900/30 text-blue-400' :
                                                'bg-gray-900/30 text-gray-400'
                                        }`}>
                                        {migrationStatus.status}
                                    </span>
                                </div>

                                {}
                                <div className="w-full bg-gray-600 rounded-full h-4 mb-2">
                                    <div
                                        className={`h-4 rounded-full transition-all duration-500 ${migrationStatus.status === 'completed' ? 'bg-green-600' :
                                            migrationStatus.status === 'failed' ? 'bg-red-600' :
                                                'bg-blue-600'
                                            }`}
                                        style={{ width: `${getMigrationProgress()}%` }}
                                    />
                                </div>
                                <p className="text-gray-400 text-sm">{getMigrationProgress()}% Complete</p>
                            </div>

                            {}
                            {migrationStatus.tables_migrated && Object.keys(migrationStatus.tables_migrated).length > 0 && (
                                <div className="bg-gray-700 rounded-lg p-4">
                                    <h3 className="text-white font-bold mb-3">Tables Migrated</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {Object.entries(migrationStatus.tables_migrated).map(([table, status]) => (
                                            <div key={table} className="flex items-center gap-2">
                                                <span className={status === 'success' ? 'text-green-400' : 'text-red-400'}>
                                                    {status === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                                </span>
                                                <span className="text-gray-300 text-sm">{table}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {migrationStatus.error_message && (
                                <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
                                    <p className="text-red-400 text-sm">{migrationStatus.error_message}</p>
                                </div>
                            )}

                            {migrationStatus.status === 'completed' && (
                                <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-4">
                                    <p className="text-green-400 flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5" />
                                        Migration completed successfully! You may need to restart the server with the new database connection.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
