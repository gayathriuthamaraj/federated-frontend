"use client";

import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { getEncryptionPolicy, updateEncryptionPolicy, EncryptionPolicy } from '../api/admin';

export default function EncryptionPage() {
    const [policy, setPolicy]   = useState<EncryptionPolicy | null>(null);
    const [dmAtRest, setDmAtRest]       = useState(false);
    const [requireGroups, setRequireGroups] = useState(true);
    const [saving, setSaving]   = useState(false);
    const [status, setStatus]   = useState<{ ok: boolean; msg: string } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getEncryptionPolicy()
            .then(p => {
                setPolicy(p);
                setDmAtRest(p.dm_encryption_at_rest);
                setRequireGroups(p.require_encrypted_groups);
            })
            .catch(e => setStatus({ ok: false, msg: e.message }))
            .finally(() => setLoading(false));
    }, []);

    const save = async () => {
        setSaving(true);
        setStatus(null);
        try {
            await updateEncryptionPolicy(dmAtRest, requireGroups);
            const updated = await getEncryptionPolicy();
            setPolicy(updated);
            setDmAtRest(updated.dm_encryption_at_rest);
            setRequireGroups(updated.require_encrypted_groups);
            setStatus({ ok: true, msg: 'Encryption policy updated.' });
        } catch (e) {
            setStatus({ ok: false, msg: e instanceof Error ? e.message : 'Failed to save' });
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
                        {'// SECURITY POLICY'}
                    </div>
                    <h1 className="term-header term-glow" style={{ fontSize: '1.4rem', letterSpacing: '0.12em' }}>
                        ENCRYPTION POLICY
                    </h1>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
                        Control server-wide encryption enforcement for direct messages and group chats.
                    </p>
                </div>

                {loading && (
                    <div style={{ color: 'var(--text-ghost)', fontSize: '0.75rem' }}>Loading policy...</div>
                )}

                {!loading && (
                    <>
                        {/* Status banner */}
                        {status && (
                            <div style={{
                                padding: '8px 12px',
                                marginBottom: 20,
                                border: `1px solid ${status.ok ? 'var(--green)' : 'var(--red)'}`,
                                background: status.ok ? 'var(--green-faint)' : '#1a0000',
                                color: status.ok ? 'var(--green)' : 'var(--red)',
                                fontSize: '0.75rem',
                            }}>
                                {status.msg}
                            </div>
                        )}

                        {/* Policy card */}
                        <div className="term-panel" style={{ padding: 0 }}>
                            <div style={{
                                borderBottom: '1px solid var(--border)',
                                padding: '10px 16px',
                                fontSize: '0.65rem',
                                color: 'var(--text-ghost)',
                                letterSpacing: '0.1em',
                            }}>
                                ┌─[ENCRYPTION_CONFIG]
                            </div>

                            {/* DM Encryption toggle */}
                            <div style={{
                                padding: '16px',
                                borderBottom: '1px solid var(--border)',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 16,
                            }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text)', marginBottom: 4, letterSpacing: '0.05em' }}>
                                        DM Encryption At Rest
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                                        When enabled, all direct messages are AES-256-GCM encrypted before being stored in the database.
                                        Messages are decrypted on read using the server master key.
                                    </div>
                                </div>
                                <button
                                    onClick={() => setDmAtRest(v => !v)}
                                    style={{
                                        flexShrink: 0,
                                        minWidth: 56,
                                        padding: '4px 12px',
                                        border: `1px solid ${dmAtRest ? 'var(--green)' : 'var(--border)'}`,
                                        background: dmAtRest ? 'var(--green-faint)' : 'var(--bg-raised)',
                                        color: dmAtRest ? 'var(--green)' : 'var(--text-muted)',
                                        fontSize: '0.68rem',
                                        fontFamily: 'var(--font-mono)',
                                        letterSpacing: '0.1em',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    {dmAtRest ? '● ON' : '○ OFF'}
                                </button>
                            </div>

                            {/* Encrypted Groups toggle */}
                            <div style={{
                                padding: '16px',
                                borderBottom: '1px solid var(--border)',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 16,
                            }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text)', marginBottom: 4, letterSpacing: '0.05em' }}>
                                        Require Encrypted Groups
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                                        When enabled, all group messages must be encrypted with the group&apos;s per-group AES-256 key.
                                        New groups inherit the server&apos;s master key wrapping.
                                    </div>
                                </div>
                                <button
                                    onClick={() => setRequireGroups(v => !v)}
                                    style={{
                                        flexShrink: 0,
                                        minWidth: 56,
                                        padding: '4px 12px',
                                        border: `1px solid ${requireGroups ? 'var(--green)' : 'var(--border)'}`,
                                        background: requireGroups ? 'var(--green-faint)' : 'var(--bg-raised)',
                                        color: requireGroups ? 'var(--green)' : 'var(--text-muted)',
                                        fontSize: '0.68rem',
                                        fontFamily: 'var(--font-mono)',
                                        letterSpacing: '0.1em',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    {requireGroups ? '● ON' : '○ OFF'}
                                </button>
                            </div>

                            {/* Current values info */}
                            {policy && (
                                <div style={{
                                    padding: '10px 16px',
                                    borderBottom: '1px solid var(--border)',
                                    fontSize: '0.65rem',
                                    color: 'var(--text-ghost)',
                                }}>
                                    Last updated by <span style={{ color: 'var(--cyan)' }}>{policy.updated_by || '—'}</span>
                                    {' at '}
                                    {new Date(policy.updated_at).toISOString().replace('T', ' ').slice(0, 19)}
                                </div>
                            )}

                            {/* Save button */}
                            <div style={{ padding: '14px 16px' }}>
                                <button
                                    onClick={save}
                                    disabled={saving}
                                    style={{
                                        background: saving ? 'var(--bg-raised)' : 'var(--green-faint)',
                                        border: '1px solid var(--green)',
                                        color: saving ? 'var(--text-ghost)' : 'var(--green)',
                                        padding: '7px 22px',
                                        fontSize: '0.72rem',
                                        fontFamily: 'var(--font-mono)',
                                        letterSpacing: '0.1em',
                                        cursor: saving ? 'default' : 'pointer',
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    {saving ? 'SAVING...' : 'SAVE POLICY'}
                                </button>
                            </div>
                        </div>

                        {/* Info box */}
                        <div style={{
                            marginTop: 20,
                            padding: '12px 16px',
                            border: '1px solid var(--border)',
                            background: 'var(--bg-raised)',
                            fontSize: '0.68rem',
                            color: 'var(--text-ghost)',
                            lineHeight: 1.7,
                        }}>
                            <div style={{ color: 'var(--amber)', marginBottom: 6, fontSize: '0.65rem', letterSpacing: '0.1em' }}>
                                ⚠ IMPORTANT NOTES
                            </div>
                            <ul style={{ margin: 0, paddingLeft: 16 }}>
                                <li>Enabling DM encryption at rest will only encrypt <em>new</em> messages. Existing plaintext messages remain as-is.</li>
                                <li>The server master key (<code>SERVER_MASTER_KEY</code> env var) must not change once encryption is enabled, or messages will become unreadable.</li>
                                <li>All changes to this policy are recorded in the Privacy Audit Log.</li>
                            </ul>
                        </div>
                    </>
                )}
            </div>
        </AdminLayout>
    );
}
