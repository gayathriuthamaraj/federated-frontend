"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { moderatorLogin } from '../api/moderator';
import { Loader2, LogIn } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [serverUrl, setServerUrl] = useState('http://localhost:8080');
    const [moderationUrl, setModerationUrl] = useState('http://localhost:8090');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            // Persist the backend URL so all API calls use it
            localStorage.setItem('mod_backend', serverUrl.replace(/\/$/, ''));
            localStorage.setItem('mod_moderation_backend', moderationUrl.replace(/\/$/, ''));
            const data = await moderatorLogin(username, password);
            localStorage.setItem('mod_token', data.token);
            localStorage.setItem('mod_username', username);
            router.push('/queue');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-wrap">
            <div className="login-box">
                {/* Header */}
                <div style={{ marginBottom: 28 }}>
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-ghost)', letterSpacing: '0.15em', marginBottom: 6 }}>
                        ┌─[ FEDINET ]──────────────┐
                    </div>
                    <div className="term-header" style={{ fontSize: '1.2rem' }}>MODERATOR CONSOLE</div>
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-ghost)', marginTop: 2 }}>
                        └──────────────────────────┘
                    </div>
                    <div style={{ marginTop: 10, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Sign in with your account credentials.<br />
                        <span style={{ color: 'var(--text-ghost)' }}>Only moderator-role accounts can access this console.</span>
                    </div>
                </div>

                <form className="login-form" onSubmit={handleLogin}>
                    {error && <div className="error-msg">ERR › {error}</div>}

                    <div className="form-group">
                        <label className="form-label">// SERVER URL</label>
                        <input
                            id="mod-server"
                            className="input"
                            type="url"
                            value={serverUrl}
                            onChange={e => setServerUrl(e.target.value)}
                            placeholder="http://localhost:8080"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">// MODERATION SERVICE URL</label>
                        <input
                            id="mod-moderation-server"
                            className="input"
                            type="url"
                            value={moderationUrl}
                            onChange={e => setModerationUrl(e.target.value)}
                            placeholder="http://localhost:8090"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">// USERNAME</label>
                        <input
                            id="mod-username"
                            className="input"
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            placeholder="alice"
                            autoComplete="username"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">// PASSWORD</label>
                        <input
                            id="mod-password"
                            className="input"
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                            autoComplete="current-password"
                            required
                        />
                    </div>

                    <button
                        id="mod-login-btn"
                        type="submit"
                        disabled={loading}
                        className="btn btn-green"
                        style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
                    >
                        {loading
                            ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> AUTHENTICATING...</>
                            : <><LogIn size={13} /> AUTHENTICATE</>}
                    </button>
                </form>

                <div style={{ marginTop: 24, fontSize: '0.62rem', color: 'var(--text-ghost)', textAlign: 'center' }}>
                    Contact your admin if you need moderator access.
                </div>
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=JetBrains+Mono:wght@300;400;500&display=swap');
                body { font-family: 'JetBrains Mono', monospace; }                @keyframes spin { to { transform: rotate(360deg); } }            `}</style>
        </div>
    );
}
