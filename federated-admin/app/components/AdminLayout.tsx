"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useState, useEffect } from 'react';
import { LayoutDashboard, Server, Ticket, Users, LogOut, Globe } from 'lucide-react';

interface AdminLayoutProps {
    children: ReactNode;
}

const NAV = [
    { href: '/dashboard',       label: 'DASHBOARD',       icon: LayoutDashboard, cmd: 'dash'   },
    { href: '/server-config',   label: 'SERVER CONFIG',   icon: Server,          cmd: 'config' },
    { href: '/invites',          label: 'INVITES',         icon: Ticket,          cmd: 'inv'    },
    { href: '/users',            label: 'USERS',           icon: Users,           cmd: 'users'  },
    { href: '/trusted-servers',  label: 'TRUSTED SERVERS', icon: Globe,           cmd: 'trust'  },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
    const pathname = usePathname();
    const router   = useRouter();
    const [serverInfo, setServerInfo] = useState({ name: 'UNKNOWN', url: '' });
    const [time, setTime]             = useState('');

    useEffect(() => {
        const trusted = localStorage.getItem('trusted_server');
        if (trusted) {
            try {
                const d = JSON.parse(trusted);
                setServerInfo({ name: (d.server_name || 'UNKNOWN').toUpperCase(), url: d.server_url || '' });
            } catch {}
        }
    }, []);

    // Live clock
    useEffect(() => {
        const tick = () => setTime(new Date().toISOString().replace('T', ' ').slice(0, 19));
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        router.push('/login');
    };

    return (
        <div className="min-h-screen flex" style={{ background: 'var(--bg)', fontFamily: 'var(--font-mono)' }}>

            {/* ── Sidebar ───────────────────────────────────────────────── */}
            <aside style={{
                width: 240,
                background: 'var(--bg-panel)',
                borderRight: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0,
            }}>

                {/* Logo area */}
                <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{
                        fontSize: '0.65rem', color: 'var(--text-ghost)',
                        letterSpacing: '0.12em', marginBottom: 4,
                    }}>
                        ┌─[ FEDINET ]──────────┐
                    </div>
                    <div className="term-glow term-header" style={{ fontSize: '1.1rem', letterSpacing: '0.15em' }}>
                        ADMIN CONSOLE
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-ghost)', letterSpacing: '0.12em', marginTop: 2 }}>
                        └──────────────────────┘
                    </div>
                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="status-dot online" />
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>SYSTEM ONLINE</span>
                    </div>
                </div>

                {/* Clock */}
                <div style={{
                    padding: '8px 16px',
                    borderBottom: '1px solid var(--border)',
                    fontSize: '0.65rem',
                    color: 'var(--text-ghost)',
                    fontFamily: 'var(--font-display)',
                    letterSpacing: '0.08em',
                }}>
                    {time || '----.--.-- --:--:--'}
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-ghost)', padding: '4px 8px', letterSpacing: '0.12em', marginBottom: 4 }}>
                        // NAVIGATION
                    </div>
                    {NAV.map(({ href, label, icon: Icon, cmd }) => {
                        const active = pathname === href;
                        return (
                            <Link key={href} href={href} className={`nav-item${active ? ' active' : ''}`}>
                                <span className="nav-prompt">{active ? '▶' : '·'}</span>
                                <Icon size={14} style={{ flexShrink: 0 }} />
                                <span style={{ flex: 1, fontSize: '0.75rem' }}>{label}</span>
                                {active && <span style={{ fontSize: '0.6rem', color: 'var(--text-ghost)' }}>[{cmd}]</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Server info + logout */}
                <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
                    <div style={{
                        padding: '8px 10px',
                        background: 'var(--bg)',
                        border: '1px solid var(--border-lit)',
                        borderRadius: 2,
                        marginBottom: 8,
                        fontSize: '0.7rem',
                    }}>
                        <div style={{ color: 'var(--text-ghost)', fontSize: '0.65rem', marginBottom: 4 }}>CONNECTED NODE</div>
                        <div style={{ color: 'var(--green)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {serverInfo.name}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {serverInfo.url || '—'}
                        </div>
                    </div>
                    <button onClick={handleLogout} className="term-btn danger" style={{ width: '100%' }}>
                        <LogOut size={13} />
                        <span>TERMINATE SESSION</span>
                    </button>
                </div>
            </aside>

            {/* ── Main content ──────────────────────────────────────────── */}
            <main style={{ flex: 1, overflow: 'auto' }}>
                {/* Top bar */}
                <div style={{
                    padding: '10px 28px',
                    borderBottom: '1px solid var(--border)',
                    background: 'var(--bg-panel)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: '0.7rem',
                    color: 'var(--text-ghost)',
                }}>
                    <span style={{ color: 'var(--green)' }}>admin@fedinet</span>
                    <span>:</span>
                    <span style={{ color: 'var(--cyan)' }}>{pathname}</span>
                    <span className="term-cursor" style={{ color: 'var(--green)' }}></span>
                </div>

                <div style={{ padding: '28px' }}>
                    {children}
                </div>
            </main>
        </div>
    );
}

