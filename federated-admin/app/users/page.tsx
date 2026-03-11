"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../components/AdminLayout';
import { getAllUsers, assignBadge, revokeBadge } from '../api/admin';
import { Users, Search, MapPin } from 'lucide-react';

const BADGE_COLORS: Record<string, string> = {
    admin:     'var(--red)',
    moderator: 'var(--amber)',
    verified:  'var(--cyan)',
    user:      'var(--text-ghost)',
};

interface UserData {
    identity: {
        id: string;
        user_id: string;
        home_server: string;
        allow_discovery: boolean;
        badge?: string;
        created_at: string;
    };
    profile: {
        user_id: string;
        display_name: string;
        bio?: string;
        location?: string;
        created_at: string;
    };
}

export default function UsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState<UserData[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [badgeAction, setBadgeAction] = useState<{ userId: string; mode: 'assign' | 'revoke' } | null>(null);
    const [badgeInput, setBadgeInput] = useState('');
    const [badgeError, setBadgeError] = useState('');
    const [badgeLoading, setBadgeLoading] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) { router.push('/login'); return; }
        loadUsers();
    }, [router]);

    useEffect(() => {
        setFilteredUsers(
            searchTerm
                ? users.filter(u =>
                    u.profile.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    u.identity.user_id.toLowerCase().includes(searchTerm.toLowerCase())
                )
                : users
        );
    }, [searchTerm, users]);

    const loadUsers = async () => {
        try {
            const data = await getAllUsers();
            setUsers(data.users || []);
            setFilteredUsers(data.users || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load users');
            if (err instanceof Error && err.message.includes('authenticated')) router.push('/login');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBadgeSubmit = async () => {
        if (!badgeAction) return;
        setBadgeLoading(true);
        setBadgeError('');
        try {
            if (badgeAction.mode === 'assign') {
                if (!badgeInput.trim()) { setBadgeError('Badge value is required'); setBadgeLoading(false); return; }
                await assignBadge(badgeAction.userId, badgeInput.trim());
            } else {
                await revokeBadge(badgeAction.userId);
            }
            setBadgeAction(null);
            setBadgeInput('');
            loadUsers();
        } catch (err) {
            setBadgeError(err instanceof Error ? err.message : 'Action failed');
        } finally {
            setBadgeLoading(false);
        }
    };

    if (isLoading) {
        return (
            <AdminLayout>
                <div style={{ color: 'var(--text-ghost)', display: 'flex', alignItems: 'center', gap: 10, padding: '40px 0' }}>
                    <span style={{ color: 'var(--green)' }}>⟳</span> LOADING USER REGISTRY...
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ color: 'var(--text-ghost)', fontSize: '0.65rem', letterSpacing: '0.15em', marginBottom: 4 }}>
                            // USER REGISTRY
                        </div>
                        <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: 'var(--green)', letterSpacing: '0.1em', textShadow: '0 0 8px var(--green-glow)' }}>
                            USERS
                        </h1>
                    </div>
                    <div style={{
                        padding: '10px 20px', background: 'var(--bg-panel)',
                        border: '1px solid var(--border-lit)', textAlign: 'center',
                    }}>
                        <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--cyan)', lineHeight: 1 }}>
                            {users.length}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-ghost)', letterSpacing: '0.1em', marginTop: 4 }}>REGISTERED</div>
                    </div>
                </div>

                {error && (
                    <div style={{ padding: '8px 12px', background: 'rgba(255,23,68,0.06)', border: '1px solid var(--red-dim)', fontSize: '0.75rem', color: 'var(--red)' }}>
                        <span style={{ opacity: 0.5 }}>ERR &gt; </span>{error}
                    </div>
                )}

                {/* Search */}
                <div className="term-panel" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Search size={14} style={{ color: 'var(--text-ghost)', flexShrink: 0 }} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="filter by name or user_id..."
                        className="term-input"
                        style={{ border: 'none', background: 'transparent', padding: '0', boxShadow: 'none' }}
                    />
                    {searchTerm && (
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-ghost)', whiteSpace: 'nowrap' }}>
                            {filteredUsers.length} match{filteredUsers.length !== 1 ? 'es' : ''}
                        </span>
                    )}
                </div>

                {/* User list */}
                <div className="term-panel" style={{ overflow: 'hidden' }}>
                    <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)', fontSize: '0.6rem', color: 'var(--text-ghost)', letterSpacing: '0.12em', display: 'flex', gap: 24 }}>
                        <span style={{ flex: '0 0 180px' }}>IDENTIFIER</span>
                        <span style={{ flex: '0 0 140px' }}>DISPLAY NAME</span>
                        <span style={{ flex: 1 }}>BIO / LOCATION</span>
                        <span style={{ flex: '0 0 100px', textAlign: 'right' }}>JOINED</span>
                        <span style={{ flex: '0 0 90px', textAlign: 'right' }}>STATUS</span>
                        <span style={{ flex: '0 0 100px', textAlign: 'right' }}>BADGE</span>
                        <span style={{ flex: '0 0 140px', textAlign: 'right' }}>ACTIONS</span>
                    </div>

                    {filteredUsers.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-ghost)', fontSize: '0.8rem' }}>
                            {searchTerm ? `no results for "${searchTerm}"` : 'no users registered'}
                        </div>
                    ) : (
                        filteredUsers.map((user, i) => (
                            <div key={user.identity.id} style={{
                                display: 'flex', gap: 24, alignItems: 'center',
                                padding: '12px 16px',
                                borderBottom: i < filteredUsers.length - 1 ? '1px solid var(--border)' : 'none',
                                transition: 'background 0.1s',
                            }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}
                            >
                                <div style={{ flex: '0 0 180px', fontSize: '0.75rem', color: 'var(--cyan)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {user.identity.user_id}
                                </div>
                                <div style={{ flex: '0 0 140px', fontSize: '0.8rem', color: 'var(--text)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {user.profile.display_name}
                                </div>
                                <div style={{ flex: 1, fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden' }}>
                                    {user.profile.bio && <span style={{ marginRight: 10 }}>{user.profile.bio}</span>}
                                    {user.profile.location && (
                                        <span style={{ color: 'var(--text-ghost)', fontSize: '0.68rem' }}>
                                            <MapPin size={10} style={{ display: 'inline', marginRight: 3 }} />
                                            {user.profile.location}
                                        </span>
                                    )}
                                </div>
                                <div style={{ flex: '0 0 100px', textAlign: 'right', fontSize: '0.68rem', color: 'var(--text-ghost)' }}>
                                    {new Date(user.profile.created_at).toLocaleDateString()}
                                </div>
                                <div style={{ flex: '0 0 90px', textAlign: 'right' }}>
                                    <span className={`term-badge ${user.identity.allow_discovery ? 'ok' : ''}`}
                                        style={!user.identity.allow_discovery ? { background: 'var(--bg)', color: 'var(--text-ghost)', border: '1px solid var(--border-lit)' } : {}}>
                                        {user.identity.allow_discovery ? 'PUBLIC' : 'PRIVATE'}
                                    </span>
                                </div>
                                <div style={{ flex: '0 0 100px', textAlign: 'right' }}>
                                    <span style={{
                                        fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em',
                                        color: BADGE_COLORS[user.identity.badge ?? 'user'] ?? 'var(--text-ghost)',
                                    }}>
                                        {(user.identity.badge ?? 'user').toUpperCase()}
                                    </span>
                                </div>
                                <div style={{ flex: '0 0 140px', textAlign: 'right', display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                    <button
                                        onClick={() => { setBadgeAction({ userId: user.identity.user_id, mode: 'assign' }); setBadgeInput(''); setBadgeError(''); }}
                                        style={{ fontSize: '0.62rem', padding: '3px 8px', background: 'var(--bg-raised)', border: '1px solid var(--cyan)', color: 'var(--cyan)', fontFamily: 'var(--font-mono)', cursor: 'pointer', letterSpacing: '0.06em' }}
                                    >
                                        ASSIGN
                                    </button>
                                    {(user.identity.badge && user.identity.badge !== 'user') && (
                                        <button
                                            onClick={() => { setBadgeAction({ userId: user.identity.user_id, mode: 'revoke' }); setBadgeError(''); }}
                                            style={{ fontSize: '0.62rem', padding: '3px 8px', background: 'var(--bg-raised)', border: '1px solid var(--red)', color: 'var(--red)', fontFamily: 'var(--font-mono)', cursor: 'pointer', letterSpacing: '0.06em' }}
                                        >
                                            REVOKE
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Badge assign / revoke modal */}
            {badgeAction && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                }}>
                    <div className="term-panel" style={{ padding: 24, minWidth: 340 }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-ghost)', letterSpacing: '0.12em', marginBottom: 8 }}>
                            {badgeAction.mode === 'assign' ? '// ASSIGN BADGE' : '// REVOKE BADGE'}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--cyan)', fontFamily: 'var(--font-mono)', marginBottom: 16 }}>
                            {badgeAction.userId}
                        </div>
                        {badgeAction.mode === 'assign' && (
                            <div style={{ marginBottom: 16 }}>
                                <select
                                    value={badgeInput}
                                    onChange={e => setBadgeInput(e.target.value)}
                                    style={{
                                        width: '100%', background: 'var(--bg-raised)',
                                        border: '1px solid var(--border)', color: 'var(--text)',
                                        padding: '6px 10px', fontSize: '0.75rem',
                                        fontFamily: 'var(--font-mono)', outline: 'none',
                                    }}
                                >
                                    <option value="">Select badge…</option>
                                    <option value="verified">verified</option>
                                    <option value="moderator">moderator</option>
                                    <option value="admin">admin</option>
                                </select>
                            </div>
                        )}
                        {badgeAction.mode === 'revoke' && (
                            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                                This will reset the user&apos;s badge to <strong style={{ color: 'var(--text)' }}>user</strong> (default).
                            </p>
                        )}
                        {badgeError && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--red)', marginBottom: 12 }}>{badgeError}</div>
                        )}
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => { setBadgeAction(null); setBadgeInput(''); setBadgeError(''); }}
                                style={{ fontSize: '0.7rem', padding: '5px 14px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', cursor: 'pointer' }}
                            >
                                CANCEL
                            </button>
                            <button
                                onClick={handleBadgeSubmit}
                                disabled={badgeLoading}
                                style={{
                                    fontSize: '0.7rem', padding: '5px 14px', fontFamily: 'var(--font-mono)', cursor: 'pointer',
                                    ...(badgeAction.mode === 'assign'
                                        ? { background: 'var(--green-faint)', border: '1px solid var(--green)', color: 'var(--green)' }
                                        : { background: 'rgba(255,23,68,0.08)', border: '1px solid var(--red)', color: 'var(--red)' }),
                                }}
                            >
                                {badgeLoading ? '...' : (badgeAction.mode === 'assign' ? 'ASSIGN' : 'REVOKE')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
