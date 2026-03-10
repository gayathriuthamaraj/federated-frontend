"use client";

import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';

interface Permissions {
    allow_ephemeral_posts: boolean;
    allow_image_uploads: boolean;
    allow_direct_messages: boolean;
    allow_reposts: boolean;
    allow_replies: boolean;
}

const PERMISSION_META: { key: keyof Permissions; label: string; description: string }[] = [
    {
        key: 'allow_ephemeral_posts',
        label: 'Self-Deleting (Ephemeral) Posts',
        description: 'Allow users to set a timer on their posts so they automatically disappear after a chosen duration (1 h → 7 d).',
    },
    {
        key: 'allow_image_uploads',
        label: 'Image Uploads',
        description: 'Allow users to attach images when composing posts or sending messages.',
    },
    {
        key: 'allow_direct_messages',
        label: 'Direct Messages',
        description: 'Allow users to send private messages to each other.',
    },
    {
        key: 'allow_reposts',
        label: 'Reposts / Boosts',
        description: 'Allow users to repost (boost) content from others on their timeline.',
    },
    {
        key: 'allow_replies',
        label: 'Replies / Comments',
        description: 'Allow users to reply to posts and participate in threaded conversations.',
    },
];

function getApiBase(): string {
    if (typeof window === 'undefined') return 'http://localhost:8080';
    try {
        const d = JSON.parse(localStorage.getItem('trusted_server') || '{}');
        return d.server_url || 'http://localhost:8080';
    } catch { return 'http://localhost:8080'; }
}

export default function SettingsPage() {
    const [perms, setPerms] = useState<Permissions | null>(null);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        fetch(`${getApiBase()}/admin/settings/permissions`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.json())
            .then(setPerms)
            .catch(() => setStatus({ ok: false, msg: 'Failed to load permissions' }));
    }, []);

    const toggle = (key: keyof Permissions) => {
        if (!perms) return;
        setPerms({ ...perms, [key]: !perms[key] });
    };

    const save = async () => {
        if (!perms) return;
        setSaving(true);
        setStatus(null);
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`${getApiBase()}/admin/settings/permissions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(perms),
            });
            if (res.ok) {
                const updated = await res.json();
                setPerms(updated);
                setStatus({ ok: true, msg: 'Permissions saved successfully.' });
            } else {
                const err = await res.json().catch(() => ({ error: 'Unknown error' }));
                setStatus({ ok: false, msg: err.error || 'Failed to save' });
            }
        } catch {
            setStatus({ ok: false, msg: 'Network error' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <AdminLayout>
            <div className="max-w-2xl">
                {/* Header */}
                <div style={{ marginBottom: 28 }}>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-ghost)', letterSpacing: '0.12em', marginBottom: 4 }}>
                        {'// SYSTEM CONFIGURATION'}
                    </div>
                    <h1 className="term-header term-glow" style={{ fontSize: '1.4rem', letterSpacing: '0.12em' }}>
                        SERVER SETTINGS
                    </h1>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
                        Toggle server-wide feature permissions for all users.
                    </p>
                </div>

                {/* Permissions card */}
                <div className="term-panel" style={{ padding: '0 0 4px' }}>
                    <div style={{
                        borderBottom: '1px solid var(--border)',
                        padding: '10px 16px',
                        fontSize: '0.65rem',
                        color: 'var(--text-ghost)',
                        letterSpacing: '0.1em',
                    }}>
                        ┌─[ USER PERMISSIONS ]
                    </div>

                    {!perms ? (
                        <div style={{ padding: 24, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Loading permissions...
                        </div>
                    ) : (
                        <div style={{ padding: '8px 0' }}>
                            {PERMISSION_META.map(({ key, label, description }) => (
                                <div
                                    key={key}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 16,
                                        padding: '14px 20px',
                                        borderBottom: '1px solid var(--border)',
                                        cursor: 'pointer',
                                    }}
                                    onClick={() => toggle(key)}
                                >
                                    {/* Toggle */}
                                    <div
                                        style={{
                                            position: 'relative',
                                            width: 40,
                                            height: 22,
                                            borderRadius: 11,
                                            background: perms[key] ? 'var(--green)' : 'var(--border-lit)',
                                            transition: 'background 0.2s',
                                            flexShrink: 0,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <div style={{
                                            position: 'absolute',
                                            top: 3,
                                            left: perms[key] ? 21 : 3,
                                            width: 16,
                                            height: 16,
                                            borderRadius: '50%',
                                            background: '#fff',
                                            transition: 'left 0.2s',
                                        }} />
                                    </div>

                                    {/* Text */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            fontSize: '0.8rem',
                                            color: perms[key] ? 'var(--green)' : 'var(--text-muted)',
                                            fontWeight: 600,
                                            letterSpacing: '0.05em',
                                        }}>
                                            {label}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-ghost)', marginTop: 2 }}>
                                            {description}
                                        </div>
                                    </div>

                                    {/* Status badge */}
                                    <span style={{
                                        fontSize: '0.6rem',
                                        padding: '2px 8px',
                                        borderRadius: 2,
                                        background: perms[key] ? 'rgba(0,255,136,0.12)' : 'rgba(255,60,60,0.1)',
                                        color: perms[key] ? 'var(--green)' : '#ff6b6b',
                                        border: `1px solid ${perms[key] ? 'rgba(0,255,136,0.25)' : 'rgba(255,60,60,0.25)'}`,
                                        letterSpacing: '0.1em',
                                        flexShrink: 0,
                                    }}>
                                        {perms[key] ? 'ENABLED' : 'DISABLED'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Status message */}
                {status && (
                    <div style={{
                        marginTop: 12,
                        padding: '8px 14px',
                        borderRadius: 2,
                        fontSize: '0.75rem',
                        background: status.ok ? 'rgba(0,255,136,0.08)' : 'rgba(255,60,60,0.08)',
                        color: status.ok ? 'var(--green)' : '#ff6b6b',
                        border: `1px solid ${status.ok ? 'rgba(0,255,136,0.2)' : 'rgba(255,60,60,0.2)'}`,
                    }}>
                        {status.ok ? '✓ ' : '✗ '}{status.msg}
                    </div>
                )}

                {/* Save button */}
                <div style={{ marginTop: 20 }}>
                    <button
                        onClick={save}
                        disabled={saving || !perms}
                        className="term-btn"
                        style={{ minWidth: 160 }}
                    >
                        {saving ? 'SAVING...' : 'SAVE CHANGES'}
                    </button>
                </div>
            </div>
        </AdminLayout>
    );
}
