"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../components/AdminLayout';
import { getInvites, generateInvite, revokeInvite, fetchInviteQR, Invite } from '../api/admin';
import { QrCode, Trash2, Plus, X } from 'lucide-react';

export default function InvitesPage() {
    const router = useRouter();
    const [invites, setInvites] = useState<Invite[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [selectedInvite, setSelectedInvite] = useState<Invite | null>(null);
    const [inviteType, setInviteType] = useState<'user' | 'admin'>('user');
    const [maxUses, setMaxUses] = useState(0);
    const [expiresIn, setExpiresIn] = useState(24);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => { loadInvites(); }, []);

    const loadInvites = async () => {
        setIsLoading(true);
        try {
            const data = await getInvites();
            setInvites(data.invites || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load invites');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsGenerating(true);
        setError('');
        try {
            await generateInvite({ invite_type: inviteType, max_uses: maxUses, expires_in: expiresIn });
            await loadInvites();
            setShowForm(false);
            setInviteType('user'); setMaxUses(0); setExpiresIn(24);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate invite');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleRevoke = async (code: string) => {
        if (!confirm('Revoke this invite code?')) return;
        try { await revokeInvite(code); await loadInvites(); }
        catch (err) { setError(err instanceof Error ? err.message : 'Failed to revoke invite'); }
    };

    const handleShowQR = async (invite: Invite) => {
        try { setQrCode(await fetchInviteQR(invite.invite_code)); setSelectedInvite(invite); }
        catch { setError('Failed to load QR code'); }
    };

    const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.65rem', color: 'var(--text-ghost)', letterSpacing: '0.1em' }}>{label}</label>
            {children}
        </div>
    );

    return (
        <AdminLayout>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ color: 'var(--text-ghost)', fontSize: '0.65rem', letterSpacing: '0.15em', marginBottom: 4 }}>// ACCESS CONTROL</div>
                        <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: 'var(--green)', letterSpacing: '0.1em', textShadow: '0 0 8px var(--green-glow)' }}>INVITES</h1>
                    </div>
                    <button onClick={() => setShowForm(!showForm)} className="term-btn solid" style={{ gap: 8 }}>
                        {showForm ? <><X size={13} /> CANCEL</> : <><Plus size={13} /> GENERATE</>}
                    </button>
                </div>

                {error && (
                    <div style={{ padding: '8px 12px', background: 'rgba(255,23,68,0.06)', border: '1px solid var(--red-dim)', fontSize: '0.75rem', color: 'var(--red)' }}>
                        <span style={{ opacity: 0.5 }}>ERR &gt; </span>{error}
                    </div>
                )}

                {/* Generate form */}
                {showForm && (
                    <div className="term-panel" style={{ padding: '18px 20px' }}>
                        <div style={{ color: 'var(--text-ghost)', fontSize: '0.65rem', letterSpacing: '0.12em', marginBottom: 14 }}>// NEW INVITE TOKEN</div>
                        <form onSubmit={handleGenerate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
                            <F label="ACCESS LEVEL">
                                <select value={inviteType} onChange={e => setInviteType(e.target.value as 'user' | 'admin')} className="term-input">
                                    <option value="user">user</option>
                                    <option value="admin">admin</option>
                                </select>
                            </F>
                            <F label="MAX USES  (0 = unlimited)">
                                <input type="number" min="0" value={maxUses} onChange={e => setMaxUses(parseInt(e.target.value) || 0)} className="term-input" />
                            </F>
                            <F label="EXPIRES IN (hours)">
                                <input type="number" value={expiresIn} onChange={e => setExpiresIn(parseInt(e.target.value))} className="term-input" />
                            </F>
                            <button type="submit" disabled={isGenerating} className="term-btn solid" style={{ alignSelf: 'end', whiteSpace: 'nowrap' }}>
                                {isGenerating ? '...' : '▶ ISSUE TOKEN'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Table */}
                <div className="term-panel" style={{ overflow: 'hidden' }}>
                    <table className="term-table">
                        <thead>
                            <tr>
                                <th>TOKEN CODE</th>
                                <th>TYPE</th>
                                <th>USES</th>
                                <th>EXPIRES</th>
                                <th>STATUS</th>
                                <th style={{ textAlign: 'right' }}>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-ghost)' }}>⟳ LOADING...</td></tr>
                            ) : invites.length === 0 ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-ghost)' }}>no invite tokens found</td></tr>
                            ) : (
                                invites.map(invite => (
                                    <tr key={invite.id}>
                                        <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text)', fontSize: '0.78rem' }}>{invite.invite_code}</td>
                                        <td>
                                            <span className={`term-badge ${invite.invite_type === 'admin' ? 'warn' : 'ok'}`}>
                                                {invite.invite_type.toUpperCase()}
                                            </span>
                                        </td>
                                        <td style={{ color: 'var(--text-dim)' }}>
                                            {invite.current_uses} / {invite.max_uses === -1 || invite.max_uses === 0 ? '∞' : invite.max_uses}
                                        </td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                                            {invite.expires_at ? new Date(invite.expires_at).toLocaleString() : 'never'}
                                        </td>
                                        <td>
                                            <span className={`term-badge ${invite.revoked ? 'error' : 'ok'}`}>
                                                {invite.revoked ? 'REVOKED' : 'ACTIVE'}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            {!invite.revoked && (
                                                <span style={{ display: 'inline-flex', gap: 10 }}>
                                                    <button onClick={() => handleShowQR(invite)}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cyan)', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        <QrCode size={13} /> QR
                                                    </button>
                                                    <button onClick={() => handleRevoke(invite.invite_code)}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        <Trash2 size={13} /> REVOKE
                                                    </button>
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* QR Modal */}
            {qrCode && selectedInvite && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 100, backdropFilter: 'blur(4px)',
                }}>
                    <div className="term-panel" style={{ padding: '28px', maxWidth: 360, width: '100%', textAlign: 'center' }}>
                        <div style={{ marginBottom: 16, fontSize: '0.65rem', color: 'var(--text-ghost)', letterSpacing: '0.12em' }}>
                            // INVITE QR CODE
                        </div>
                        <img src={qrCode} alt="QR" style={{ width: '100%', imageRendering: 'pixelated', border: '4px solid var(--bg-raised)' }} />
                        <div style={{ margin: '14px 0 6px', fontSize: '0.75rem', color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>
                            {selectedInvite.invite_code}
                        </div>
                        <button onClick={() => { setQrCode(null); setSelectedInvite(null); }} className="term-btn" style={{ width: '100%', marginTop: 10 }}>
                            <X size={12} /> CLOSE
                        </button>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

