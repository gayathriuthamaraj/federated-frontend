"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adminLogin, getServerConfig } from '../api/admin';

const BOOT_SEQ = [
    '> FEDINET OS v2.0 — STARTING...',
    '> loading kernel modules............  [OK]',
    '> mounting federation volumes.......  [OK]',
    '> initialising crypto subsystem.....  [OK]',
    '> connecting to node database.......  [OK]',
    '> launching admin interface.........  [READY]',
    '> AUTHENTICATION REQUIRED',
];

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername]             = useState('');
    const [password, setPassword]             = useState('');
    const [error, setError]                   = useState('');
    const [isLoading, setIsLoading]           = useState(false);
    const [serverName, setServerName]         = useState('Server A');
    const [selectedServerKey, setSelectedServerKey] = useState('Server A');
    const [bootLines, setBootLines]           = useState<string[]>([]);

    useEffect(() => {
        localStorage.removeItem('admin_token');

        let i = 0;
        const id = setInterval(() => {
            if (i < BOOT_SEQ.length) {
                const line = BOOT_SEQ[i];
                if (line !== undefined) setBootLines(prev => [...prev, line]);
                i++;
            } else {
                clearInterval(id);
            }
        }, 160);

        const trustedServer = localStorage.getItem('trusted_server');
        if (trustedServer) {
            try {
                const data = JSON.parse(trustedServer);
                setServerName(data.server_name || 'Server A');
                if (data.server_url === 'http://localhost:8080') setSelectedServerKey('Server A');
                else if (data.server_url === 'http://localhost:9080') setSelectedServerKey('Server B');
                else setSelectedServerKey('Custom');
            } catch {}
        } else {
            handleServerChange('Server A');
        }

        return () => clearInterval(id);
    }, []);

    const handleServerChange = (newServer: string) => {
        setSelectedServerKey(newServer);
        if (newServer === 'Custom') { router.push('/setup'); return; }
        const url = newServer === 'Server B' ? 'http://localhost:9080' : 'http://localhost:8080';
        localStorage.setItem('trusted_server', JSON.stringify({
            server_name: newServer, server_url: url,
            server_id: 'unknown', public_key: '', pinned_at: new Date().toISOString(),
        }));
        setServerName(newServer);
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
                localStorage.setItem('trusted_server', JSON.stringify({
                    server_name: config.server_name,
                    server_url: selectedServerKey === 'Server B' ? 'http://localhost:9080' : 'http://localhost:8080',
                    server_id: 'unknown', public_key: '', pinned_at: new Date().toISOString(),
                }));
            }
            router.push('/dashboard');
        } catch (err) {
            localStorage.removeItem('admin_token');
            setError(err instanceof Error ? err.message : 'Authentication failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            fontFamily: 'var(--font-mono)',
        }}>
            <div style={{ width: '100%', maxWidth: 480 }}>

                {/* Boot log */}
                <div style={{
                    marginBottom: 24, padding: '14px 16px',
                    background: 'var(--bg-panel)',
                    border: '1px solid var(--border)',
                    borderRadius: 2,
                    fontSize: '0.72rem',
                    lineHeight: 1.8,
                }}>
                    {bootLines.filter(Boolean).map((line, i) => (
                        <div key={i} style={{
                            color: line.includes('[OK]') ? 'var(--text-dim)'
                                : line.includes('[READY]') ? 'var(--green)'
                                : line.includes('REQUIRED') ? 'var(--amber)'
                                : 'var(--text-ghost)',
                        }}>
                            {line}
                        </div>
                    ))}
                    {bootLines.length > 0 && bootLines.length < BOOT_SEQ.length && (
                        <span style={{ color: 'var(--text-ghost)' }}>█</span>
                    )}
                </div>

                {/* Login terminal window */}
                <div className="term-panel" style={{ borderRadius: 2, overflow: 'hidden' }}>

                    {/* Window chrome */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 14px',
                        background: 'var(--bg-raised)',
                        borderBottom: '1px solid var(--border)',
                    }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--red-dim)' }} />
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--amber)' }} />
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--green-dim)' }} />
                        <span style={{ flex: 1, textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-ghost)', letterSpacing: '0.1em' }}>
                            fedinet — admin login
                        </span>
                    </div>

                    <div style={{ padding: '24px 28px' }}>

                        {/* Header */}
                        <div style={{ marginBottom: 24 }}>
                            <div className="term-glow term-header" style={{ fontSize: '1.25rem', marginBottom: 4 }}>
                                ADMIN LOGIN
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-ghost)' }}>
                                Federated network administrator console — restricted access
                            </div>
                        </div>

                        {error && (
                            <div style={{
                                marginBottom: 16, padding: '8px 12px',
                                background: 'rgba(255,23,68,0.06)',
                                border: '1px solid var(--red-dim)',
                                fontSize: '0.72rem', color: 'var(--red)',
                            }}>
                                <span style={{ opacity: 0.5 }}>AUTH_ERR &gt; </span>{error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                            {/* Server selector */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-ghost)', letterSpacing: '0.1em', marginBottom: 6 }}>
                                    TARGET NODE
                                </label>
                                <select
                                    value={selectedServerKey}
                                    onChange={(e) => handleServerChange(e.target.value)}
                                    className="term-input"
                                    style={{ cursor: 'pointer' }}
                                >
                                    <option value="Server A">server_a  ::  localhost:8080</option>
                                    <option value="Server B">server_b  ::  localhost:9080</option>
                                    <option value="Custom">custom    ::  [configure...]</option>
                                </select>
                            </div>

                            {/* Username */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-ghost)', letterSpacing: '0.1em', marginBottom: 6 }}>
                                    IDENTIFIER
                                </label>
                                <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                                    <span style={{
                                        position: 'absolute', left: 10,
                                        color: 'var(--green)', fontSize: '0.8rem', pointerEvents: 'none',
                                    }}>$</span>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="term-input"
                                        style={{ paddingLeft: 26 }}
                                        placeholder="admin_username"
                                        autoComplete="username"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-ghost)', letterSpacing: '0.1em', marginBottom: 6 }}>
                                    PASSPHRASE
                                </label>
                                <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                                    <span style={{
                                        position: 'absolute', left: 10,
                                        color: 'var(--green)', fontSize: '0.8rem', pointerEvents: 'none',
                                    }}>*</span>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="term-input"
                                        style={{ paddingLeft: 26 }}
                                        placeholder="••••••••"
                                        autoComplete="current-password"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="term-btn solid"
                                style={{ width: '100%', padding: '10px', marginTop: 4, fontSize: '0.8rem', letterSpacing: '0.1em' }}
                            >
                                {isLoading
                                    ? <><span style={{ animation: 'blink 1s step-end infinite' }}>█</span>&nbsp;AUTHENTICATING...</>
                                    : <>&#x25B6;&nbsp;AUTHENTICATE</>
                                }
                            </button>
                        </form>

                        {/* Footer */}
                        <div style={{
                            marginTop: 20, paddingTop: 16,
                            borderTop: '1px solid var(--border)',
                            fontSize: '0.65rem', color: 'var(--text-ghost)',
                            textAlign: 'center', letterSpacing: '0.06em',
                        }}>
                            RESTRICTED ACCESS — UNAUTHORISED ATTEMPTS ARE LOGGED
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


