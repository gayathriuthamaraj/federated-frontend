"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../components/AdminLayout';
import {
    listModerators, assignModerator, removeModerator, ModeratorRecord,
    getModerationStatus, toggleModeration, assignBadge, BadgeType,
} from '../api/admin';
import { Shield, UserPlus, UserMinus, RefreshCw, ToggleLeft, ToggleRight, Award } from 'lucide-react';

export default function ModeratorsPage() {
    const router = useRouter();
    const [moderators, setModerators] = useState<ModeratorRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [assigning, setAssigning] = useState(false);
    const [removing, setRemoving] = useState<string | null>(null);
    const [newUsername, setNewUsername] = useState('');

    // Moderation toggle
    const [moderationEnabled, setModerationEnabled] = useState(true);
    const [togglingMod, setTogglingMod] = useState(false);

    // Badge assignment
    const [badgeUserId, setBadgeUserId] = useState('');
    const [badgeValue, setBadgeValue] = useState<BadgeType>('');
    const [assigningBadge, setAssigningBadge] = useState(false);

    const getAdminToken = () => localStorage.getItem('admin_token') || '';

    useEffect(() => {
        const token = getAdminToken();
        if (!token) { router.push('/login'); return; }
        load();
        loadModerationStatus();
    }, []);

    const load = async () => {
        setIsLoading(true);
        setError('');
        try {
            const data = await listModerators();
            setModerators(data.moderators ?? []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load moderators');
        } finally {
            setIsLoading(false);
        }
    };

    const loadModerationStatus = async () => {
        try {
            const data = await getModerationStatus();
            setModerationEnabled(data.moderation_enabled);
        } catch { /* non-critical */ }
    };

    const handleToggleModeration = async () => {
        setTogglingMod(true);
        setError('');
        setSuccess('');
        try {
            const next = !moderationEnabled;
            await toggleModeration(next);
            setModerationEnabled(next);
            setSuccess(`✓ Moderation feature ${next ? 'enabled' : 'disabled'}. Moderator list is preserved.`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to toggle moderation');
        } finally {
            setTogglingMod(false);
        }
    };

    const handleAssignBadge = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!badgeUserId.trim()) return;
        setAssigningBadge(true);
        setError('');
        setSuccess('');
        try {
            await assignBadge(badgeUserId.trim(), badgeValue);
            setSuccess(`✓ Badge "${badgeValue}" assigned to ${badgeUserId.trim()}`);
            setBadgeUserId('');
            await load();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to assign badge');
        } finally {
            setAssigningBadge(false);
        }
    };

    const handleAssign = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUsername.trim()) return;
        setAssigning(true);
        setError('');
        setSuccess('');
        try {
            await assignModerator(newUsername.trim());
            setSuccess(`✓ ${newUsername.trim()} is now a moderator`);
            setNewUsername('');
            await load();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to assign moderator');
        } finally {
            setAssigning(false);
        }
    };

    const handleRemove = async (username: string) => {
        setRemoving(username);
        setError('');
        setSuccess('');
        try {
            await removeModerator(username);
            setSuccess(`✓ ${username} removed from moderators`);
            await load();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to remove moderator');
        } finally {
            setRemoving(null);
        }
    };

    if (isLoading) {
        return (
            <AdminLayout>
                <div style={{ color: 'var(--text-ghost)', display: 'flex', alignItems: 'center', gap: 10, padding: '40px 0' }}>
                    <span style={{ color: 'var(--green)' }}>⟳</span> LOADING MODERATORS...
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
                            // MODERATOR MANAGEMENT
                        </div>
                        <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: 'var(--green)', letterSpacing: '0.1em', textShadow: '0 0 8px var(--green-glow)', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Shield size={22} /> MODERATORS
                        </h1>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ padding: '10px 20px', background: 'var(--bg-panel)', border: '1px solid var(--border-lit)', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--purple)', lineHeight: 1 }}>
                                {moderators.length}
                            </div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-ghost)', letterSpacing: '0.1em', marginTop: 4 }}>ACTIVE</div>
                        </div>
                        <button onClick={load} className="term-btn" style={{ gap: 6 }}>
                            <RefreshCw size={13} /> REFRESH
                        </button>
                    </div>
                </div>

                {/* Feedback */}
                {error && (
                    <div style={{ padding: '8px 12px', background: 'rgba(255,23,68,0.06)', border: '1px solid var(--red-dim)', fontSize: '0.75rem', color: 'var(--red)', fontFamily: 'var(--font-mono)' }}>
                        <span style={{ opacity: 0.5 }}>ERR &gt; </span>{error}
                    </div>
                )}
                {success && (
                    <div style={{ padding: '8px 12px', background: 'rgba(0,230,118,0.06)', border: '1px solid rgba(0,230,118,0.3)', fontSize: '0.75rem', color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>
                        {success}
                    </div>
                )}

                {/* Moderation feature toggle */}
                <div className="term-panel" style={{ padding: '18px 20px' }}>
                    <div style={{ color: 'var(--text-ghost)', fontSize: '0.65rem', letterSpacing: '0.12em', marginBottom: 14 }}>
                        // MODERATION FEATURE TOGGLE
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                        <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                                AI Content Moderation
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-ghost)' }}>
                                {moderationEnabled
                                    ? 'Posts and replies are scanned before publishing. Flagged content is held for review.'
                                    : 'Moderation is OFF. All posts publish immediately. Moderator list is preserved for when you re-enable.'}
                            </div>
                        </div>
                        <button
                            id="mod-toggle-btn"
                            onClick={handleToggleModeration}
                            disabled={togglingMod}
                            className={`term-btn${moderationEnabled ? '' : ' danger'}`}
                            style={{ gap: 8, minWidth: 140, justifyContent: 'center' }}
                        >
                            {moderationEnabled
                                ? <><ToggleRight size={16} /> ENABLED</>
                                : <><ToggleLeft size={16} /> DISABLED</>}
                        </button>
                    </div>
                </div>

                {/* Badge assignment */}
                <div className="term-panel" style={{ padding: '18px 20px' }}>
                    <div style={{ color: 'var(--text-ghost)', fontSize: '0.65rem', letterSpacing: '0.12em', marginBottom: 14 }}>
                        // ASSIGN USER BADGE
                    </div>
                    <form onSubmit={handleAssignBadge} style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 180, position: 'relative' }}>
                            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-ghost)', fontSize: '0.75rem', pointerEvents: 'none' }}>
                                $&nbsp;user_id&nbsp;
                            </span>
                            <input
                                type="text"
                                value={badgeUserId}
                                onChange={e => setBadgeUserId(e.target.value)}
                                placeholder="alice@server_a"
                                className="term-input"
                                style={{ paddingLeft: 90 }}
                                required
                            />
                        </div>
                        <div style={{ flex: 1, minWidth: 160, position: 'relative' }}>
                            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-ghost)', fontSize: '0.75rem', pointerEvents: 'none' }}>
                                $&nbsp;badge&nbsp;
                            </span>
                            <input
                                type="text"
                                value={badgeValue}
                                onChange={e => setBadgeValue(e.target.value)}
                                placeholder="e.g. trustworthy member"
                                className="term-input"
                                style={{ paddingLeft: 72 }}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={assigningBadge || !badgeUserId.trim() || !badgeValue.trim()}
                            className="term-btn"
                            style={{ gap: 6, whiteSpace: 'nowrap' }}
                        >
                            <Award size={13} />
                            {assigningBadge ? 'ASSIGNING...' : 'ASSIGN BADGE'}
                        </button>
                    </form>
                    <div style={{ marginTop: 8, fontSize: '0.65rem', color: 'var(--text-ghost)' }}>
                        Badges are custom labels shown on the user's public profile (e.g. "trustworthy member", "leader").
                        Moderator access is managed separately above.
                    </div>
                </div>

                {/* Assign new moderator */}
                <div className="term-panel" style={{ padding: '18px 20px' }}>
                    <div style={{ color: 'var(--text-ghost)', fontSize: '0.65rem', letterSpacing: '0.12em', marginBottom: 14 }}>
                        // ASSIGN MODERATOR ROLE
                    </div>
                    <form onSubmit={handleAssign} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-ghost)', fontSize: '0.75rem', pointerEvents: 'none' }}>
                                $&nbsp;assign-mod&nbsp;
                            </span>
                            <input
                                id="mod-username-input"
                                type="text"
                                value={newUsername}
                                onChange={e => setNewUsername(e.target.value)}
                                placeholder="username (e.g. alice)"
                                className="term-input"
                                style={{ paddingLeft: 110 }}
                                required
                            />
                        </div>
                        <button
                            id="assign-mod-btn"
                            type="submit"
                            disabled={assigning || !newUsername.trim()}
                            className="term-btn"
                            style={{ gap: 6, whiteSpace: 'nowrap' }}
                        >
                            <UserPlus size={13} />
                            {assigning ? 'ASSIGNING...' : 'ASSIGN'}
                        </button>
                    </form>
                    <div style={{ marginTop: 8, fontSize: '0.65rem', color: 'var(--text-ghost)' }}>
                        The user must already have a registered account on this server.
                    </div>
                </div>

                {/* Moderator list */}
                <div className="term-panel" style={{ overflow: 'hidden' }}>
                    <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)', fontSize: '0.6rem', color: 'var(--text-ghost)', letterSpacing: '0.12em', display: 'flex', gap: 24 }}>
                        <span style={{ flex: '0 0 200px' }}>USERNAME</span>
                        <span style={{ flex: 1 }}>USER ID</span>
                        <span style={{ flex: '0 0 130px' }}>ASSIGNED BY</span>
                        <span style={{ flex: '0 0 110px' }}>ASSIGNED AT</span>
                        <span style={{ flex: '0 0 80px', textAlign: 'right' }}>ACTION</span>
                    </div>

                    {moderators.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-ghost)', fontSize: '0.8rem' }}>
                            No moderators assigned yet. Use the form above to assign one.
                        </div>
                    ) : (
                        moderators.map((mod, i) => (
                            <div
                                key={mod.user_id}
                                style={{
                                    display: 'flex', gap: 24, alignItems: 'center',
                                    padding: '12px 16px',
                                    borderBottom: i < moderators.length - 1 ? '1px solid var(--border)' : 'none',
                                    transition: 'background 0.1s',
                                }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}
                            >
                                <div style={{ flex: '0 0 200px', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Shield size={12} style={{ color: 'var(--purple)', flexShrink: 0 }} />
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 600 }}>
                                        {mod.username}
                                    </span>
                                </div>
                                <div style={{ flex: 1, fontSize: '0.7rem', color: 'var(--text-ghost)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {mod.user_id}
                                </div>
                                <div style={{ flex: '0 0 130px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                    {mod.assigned_by}
                                </div>
                                <div style={{ flex: '0 0 110px', fontSize: '0.68rem', color: 'var(--text-ghost)' }}>
                                    {new Date(mod.assigned_at).toLocaleDateString()}
                                </div>
                                <div style={{ flex: '0 0 80px', textAlign: 'right' }}>
                                    <button
                                        id={`remove-mod-${mod.username}`}
                                        onClick={() => handleRemove(mod.username)}
                                        disabled={removing === mod.username}
                                        className="term-btn danger"
                                        style={{ padding: '3px 8px', fontSize: '0.65rem', gap: 4 }}
                                        title={`Remove ${mod.username} from moderators`}
                                    >
                                        <UserMinus size={11} />
                                        {removing === mod.username ? '...' : 'REMOVE'}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

            </div>
        </AdminLayout>
    );
}
