"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { moderatorLogin } from '../api/moderator';

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        // Clear any stale token before attempting login
        localStorage.removeItem('mod_token');
        try {
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
                        <label className="form-label">// USERNAME</label>
                        <input
                            id="mod-username"
                            className="input"
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            placeholder="alice@yourserver"
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
                        {loading ? '⠴ AUTHENTICATING...' : '▶ AUTHENTICATE'}
                    </button>
                </form>

                <div style={{ marginTop: 24, fontSize: '0.62rem', color: 'var(--text-ghost)', textAlign: 'center' }}>
                    Contact your admin if you need moderator access.
                </div>
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=JetBrains+Mono:wght@300;400;500&display=swap');
                body { font-family: 'JetBrains Mono', monospace; }
            `}</style>
        </div>
    );
}
