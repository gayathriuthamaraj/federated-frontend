"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../components/AdminLayout';
import { getAllUsers } from '../api/admin';
import { Users, Search, MapPin } from 'lucide-react';

interface UserData {
    identity: {
        id: string;
        user_id: string;
        home_server: string;
        allow_discovery: boolean;
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
                            </div>
                        ))
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
