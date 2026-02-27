"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../components/AdminLayout';
import { getServerConfig, updateServerName, ServerConfig } from '../api/admin';
import { Save, AlertTriangle, X } from 'lucide-react';

export default function ServerConfigPage() {
    const router = useRouter();
    const [config, setConfig] = useState<ServerConfig | null>(null);
    const [newServerName, setNewServerName] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showConfirmation, setShowConfirmation] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) { router.push('/login'); return; }
        loadConfig();
    }, [router]);

    const loadConfig = async () => {
        try {
            const data = await getServerConfig();
            setConfig(data);
            setNewServerName(data.server_name);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load config');
            if (err instanceof Error && err.message.includes('authenticated')) router.push('/login');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!newServerName.trim()) { setError('Server name cannot be empty'); return; }
        setIsSaving(true); setError(''); setSuccess('');
        try {
            await updateServerName(newServerName);
            setSuccess('Server name updated — all users notified.');
            setShowConfirmation(false);
            loadConfig();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update');
        } finally { setIsSaving(false); }
    };

    const ROW = ({ label, value }: { label: string; value: string }) => (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--text-ghost)', fontSize: '0.7rem', letterSpacing: '0.08em' }}>{label}</span>
            <span style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{value}</span>
        </div>
    );

    if (isLoading) return (
        <AdminLayout>
            <div style={{ color: 'var(--text-ghost)', display: 'flex', gap: 10, padding: '40px 0' }}>
                <span style={{ color: 'var(--green)' }}>⟳</span> LOADING CONFIG...
            </div>
        </AdminLayout>
    );

    return (
        <AdminLayout>
            <div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Header */}
                <div>
                    <div style={{ color: 'var(--text-ghost)', fontSize: '0.65rem', letterSpacing: '0.15em', marginBottom: 4 }}>// NODE CONFIGURATION</div>
                    <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: 'var(--green)', letterSpacing: '0.1em', textShadow: '0 0 8px var(--green-glow)' }}>SERVER CONFIG</h1>
                </div>

                {error && (
                    <div style={{ padding: '8px 12px', background: 'rgba(255,23,68,0.06)', border: '1px solid var(--red-dim)', fontSize: '0.75rem', color: 'var(--red)' }}>
                        <span style={{ opacity: 0.5 }}>ERR &gt; </span>{error}
                    </div>
                )}
                {success && (
                    <div style={{ padding: '8px 12px', background: 'var(--green-faint)', border: '1px solid var(--green-dim)', fontSize: '0.75rem', color: 'var(--green)' }}>
                        <span style={{ opacity: 0.5 }}>OK &gt; </span>{success}
                    </div>
                )}

                {config && (
                    <>
                        {/* Current config */}
                        <div className="term-panel" style={{ padding: '18px 20px' }}>
                            <div style={{ color: 'var(--text-ghost)', fontSize: '0.65rem', letterSpacing: '0.12em', marginBottom: 12 }}>// CURRENT STATE</div>
                            <ROW label="SERVER NAME" value={config.server_name} />
                            <ROW label="LAST UPDATED" value={new Date(config.updated_at).toLocaleString()} />
                            <ROW label="UPDATED BY" value={config.updated_by} />
                        </div>

                        {/* Update section */}
                        <div className="term-panel" style={{ padding: '18px 20px' }}>
                            <div style={{ color: 'var(--text-ghost)', fontSize: '0.65rem', letterSpacing: '0.12em', marginBottom: 14 }}>// RENAME NODE</div>

                            <div style={{ marginBottom: 12 }}>
                                <label style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-ghost)', letterSpacing: '0.1em', marginBottom: 6 }}>NEW SERVER NAME</label>
                                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                    <span style={{ position: 'absolute', left: 10, color: 'var(--green)', fontSize: '0.8rem', pointerEvents: 'none' }}>$</span>
                                    <input
                                        id="serverName" type="text"
                                        value={newServerName}
                                        onChange={e => setNewServerName(e.target.value)}
                                        className="term-input" style={{ paddingLeft: 26 }}
                                        placeholder="e.g. myserver.example.com"
                                    />
                                </div>
                            </div>

                            {/* Preview */}
                            <div style={{ padding: '10px 14px', background: 'var(--bg)', border: '1px solid var(--border-lit)', marginBottom: 12, fontSize: '0.75rem' }}>
                                <span style={{ color: 'var(--text-ghost)', fontSize: '0.65rem' }}>PREVIEW &gt; </span>
                                <span style={{ color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>username@{newServerName || '...'}</span>
                            </div>

                            {/* Warning */}
                            <div style={{ display: 'flex', gap: 8, padding: '8px 12px', background: 'rgba(255,171,0,0.06)', border: '1px solid var(--amber)', marginBottom: 14, fontSize: '0.72rem', color: 'var(--amber)' }}>
                                <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                                All users will receive a notification about this name change.
                            </div>

                            <button
                                onClick={() => setShowConfirmation(true)}
                                disabled={isSaving || newServerName === config.server_name}
                                className="term-btn solid"
                                style={{ width: '100%', padding: '10px', letterSpacing: '0.08em' }}
                            >
                                <Save size={13} />
                                {isSaving ? 'SAVING...' : 'APPLY CHANGES'}
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Confirm modal */}
            {showConfirmation && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 100, backdropFilter: 'blur(4px)',
                }}>
                    <div className="term-panel" style={{ padding: '28px', maxWidth: 420, width: '100%' }}>
                        <div style={{ color: 'var(--text-ghost)', fontSize: '0.65rem', letterSpacing: '0.12em', marginBottom: 16 }}>// CONFIRM RENAME</div>
                        <div style={{ marginBottom: 12, fontSize: '0.8rem', color: 'var(--text-dim)' }}>Rename node to:</div>
                        <div style={{ padding: '10px 14px', background: 'var(--bg)', border: '1px solid var(--green-dim)', marginBottom: 14, fontFamily: 'var(--font-mono)', color: 'var(--green)', fontSize: '0.9rem' }}>
                            {newServerName}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--amber)', marginBottom: 20 }}>All users will be notified of this change.</div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={() => setShowConfirmation(false)} className="term-btn" style={{ flex: 1 }}>
                                <X size={12} /> CANCEL
                            </button>
                            <button onClick={handleSave} disabled={isSaving} className="term-btn solid" style={{ flex: 1 }}>
                                {isSaving ? '...' : '▶ CONFIRM'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
