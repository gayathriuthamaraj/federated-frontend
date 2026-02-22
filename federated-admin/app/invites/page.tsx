"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../components/AdminLayout';
import { getInvites, generateInvite, revokeInvite, fetchInviteQR, Invite } from '../api/admin';
import { QrCode, Trash2 } from 'lucide-react';

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

    useEffect(() => {
        loadInvites();
    }, []);

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
            await generateInvite({
                invite_type: inviteType,
                max_uses: maxUses,
                expires_in: expiresIn
            });
            await loadInvites();

            setInviteType('user');
            setMaxUses(0);
            setExpiresIn(24);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate invite');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleRevoke = async (code: string) => {
        if (!confirm('Are you sure you want to revoke this invite?')) return;
        try {
            await revokeInvite(code);
            await loadInvites();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to revoke invite');
        }
    };

    const handleShowQR = async (invite: Invite) => {
        try {
            const url = await fetchInviteQR(invite.invite_code);
            setQrCode(url);
            setSelectedInvite(invite);
        } catch (err) {
            setError("Failed to load QR code");
        }
    };

    const closeQR = () => {
        setQrCode(null);
        setSelectedInvite(null);
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Invite Management</h1>
                    <p className="text-gray-400">Manage access to your server</p>
                </div>

                {error && (
                    <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
                        <p className="text-red-400">{error}</p>
                    </div>
                )}

                { }
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                    <h2 className="text-xl font-bold text-white mb-4">Generate New Invite</h2>
                    <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Max Uses (0 for unlimited)</label>
                            <input
                                type="number"
                                min="0"
                                value={maxUses}
                                onChange={(e) => setMaxUses(parseInt(e.target.value) || 0)}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Expires In (Hours)</label>
                            <input
                                type="number"
                                value={expiresIn}
                                onChange={(e) => setExpiresIn(parseInt(e.target.value))}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isGenerating}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            {isGenerating ? 'Generating...' : 'Generate Invite'}
                        </button>
                    </form>
                </div>

                { }
                <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-700/50 text-gray-400 text-sm">
                            <tr>
                                <th className="p-4">Code</th>
                                <th className="p-4">Type</th>
                                <th className="p-4">Uses</th>
                                <th className="p-4">Expires At</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-400">Loading invites...</td>
                                </tr>
                            ) : invites.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-400">No invites found.</td>
                                </tr>
                            ) : (
                                invites.map((invite) => (
                                    <tr key={invite.id} className="hover:bg-gray-700/30 transition-colors">
                                        <td className="p-4 font-mono text-white">{invite.invite_code}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs ${invite.invite_type === 'admin' ? 'bg-purple-900/30 text-purple-400' : 'bg-green-900/30 text-green-400'
                                                }`}>
                                                {invite.invite_type.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-300">
                                            {invite.current_uses} / {invite.max_uses === -1 || invite.max_uses === 0 ? '∞' : invite.max_uses}
                                        </td>
                                        <td className="p-4 text-gray-300">
                                            {invite.expires_at ? new Date(invite.expires_at).toLocaleString() : 'Never'}
                                        </td>
                                        <td className="p-4">
                                            {invite.revoked ? (
                                                <span className="text-red-400 text-sm">Revoked</span>
                                            ) : (
                                                <span className="text-green-400 text-sm">Active</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right space-x-2">
                                            {!invite.revoked && (
                                                <>
                                                    <button
                                                        onClick={() => handleShowQR(invite)}
                                                        className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                                                    >
                                                        <QrCode className="w-4 h-4" />
                                                        Show QR
                                                    </button>
                                                    <button
                                                        onClick={() => handleRevoke(invite.invite_code)}
                                                        className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                        Revoke
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                { }
                {qrCode && selectedInvite && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={closeQR}>
                        <div className="bg-white rounded-xl p-8 max-w-sm w-full space-y-4 text-center" onClick={e => e.stopPropagation()}>
                            <h3 className="text-xl font-bold text-gray-900">
                                {selectedInvite.invite_type === 'admin' ? 'Admin Invite' : 'User Invite'}
                            </h3>
                            <div className="bg-white p-2 rounded-lg inline-block border-2 border-gray-100">
                                <img src={qrCode} alt="Invite QR Code" className="w-64 h-64" />
                            </div>
                            <p className="font-mono text-lg font-bold text-gray-800 tracking-wider">
                                {selectedInvite.invite_code}
                            </p>
                            <p className="text-sm text-gray-500">
                                Scan this code with the mobile app or admin panel setup page to join this server.
                            </p>
                            <button
                                onClick={closeQR}
                                className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
