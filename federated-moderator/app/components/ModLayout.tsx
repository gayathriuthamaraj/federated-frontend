"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import { ShieldCheck, List, LogOut } from 'lucide-react';

const NAV = [
    { href: '/queue', label: 'REVIEW QUEUE', icon: List, cmd: 'queue' },
];

export default function ModLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [time, setTime] = useState('');
    const [user, setUser] = useState('');

    useEffect(() => {
        setUser(localStorage.getItem('mod_username') || 'moderator');
        const tick = () => setTime(new Date().toISOString().replace('T', ' ').slice(0, 19));
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('mod_token');
        localStorage.removeItem('mod_username');
        router.push('/login');
    };

    return (
        <div className="layout">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="logo-area">
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-ghost)', letterSpacing: '0.12em', marginBottom: 4 }}>
                        ┌─[ FEDINET ]──────────┐
                    </div>
                    <div className="logo-title">MOD CONSOLE</div>
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-ghost)', marginTop: 2 }}>
                        └──────────────────────┘
                    </div>
                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="dot dot-green" />
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>SYSTEM ONLINE</span>
                    </div>
                </div>

                <div className="clock-bar">{time || '----.--.-- --:--:--'}</div>

                <nav className="nav">
                    <div className="nav-label">// NAVIGATION</div>
                    {NAV.map(({ href, label, icon: Icon, cmd }) => {
                        const active = pathname === href;
                        return (
                            <Link key={href} href={href} className={`nav-item${active ? ' active' : ''}`}>
                                <span style={{ opacity: 0.7 }}>{active ? '▶' : '·'}</span>
                                <Icon size={14} />
                                <span style={{ flex: 1 }}>{label}</span>
                                {active && <span style={{ fontSize: '0.6rem', color: 'var(--text-ghost)' }}>[{cmd}]</span>}
                            </Link>
                        );
                    })}
                </nav>

                <div className="sidebar-footer">
                    <div style={{
                        padding: '8px 10px', background: 'var(--bg)',
                        border: '1px solid var(--border-lit)', borderRadius: 2, marginBottom: 8, fontSize: '0.7rem',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <ShieldCheck size={12} style={{ color: 'var(--cyan)' }} />
                            <span style={{ color: 'var(--text-ghost)', fontSize: '0.65rem' }}>LOGGED IN AS</span>
                        </div>
                        <div style={{ color: 'var(--green)', marginTop: 3, fontSize: '0.75rem' }}>{user}</div>
                        <div style={{ color: 'var(--cyan)', fontSize: '0.62rem', marginTop: 2 }}>ROLE: MODERATOR</div>
                    </div>
                    <button onClick={handleLogout} className="btn btn-red" style={{ width: '100%', justifyContent: 'center', fontSize: '0.72rem' }}>
                        <LogOut size={12} /> TERMINATE SESSION
                    </button>
                </div>
            </aside>

            {/* Main */}
            <main className="main">
                <div className="topbar">
                    <span style={{ color: 'var(--cyan)' }}>{user}</span>
                    <span>@mod-console</span>
                    <span style={{ color: 'var(--text-ghost)' }}>:</span>
                    <span style={{ color: 'var(--green)' }}>{pathname}</span>
                    <span style={{ display: 'inline-block', width: 8, height: 14, background: 'var(--green)', opacity: 0.8, animation: 'blink 1s step-end infinite', marginLeft: 2 }} />
                </div>
                <div className="content">{children}</div>
            </main>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=JetBrains+Mono:wght@300;400;500&display=swap');
                @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
            `}</style>
        </div>
    );
}
