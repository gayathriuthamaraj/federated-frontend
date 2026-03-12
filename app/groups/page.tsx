"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import {
    listGroups,
    createGroup,
    getGroupMessages,
    sendGroupMessage,
    getGroupMembers,
    addGroupMember,
    leaveGroup,
    joinGroup,
    updateGroupJoinPolicy,
    listPublicGroups,
    Group,
    GroupMessage,
    GroupMember,
} from '../utils/groups';

type JoinPolicy = 'anyone' | 'followers' | 'invite_only';
const JOIN_POLICY_LABELS: Record<JoinPolicy, string> = {
    anyone: 'Anyone',
    followers: 'Followers only',
    invite_only: 'Invite only',
};

export default function GroupsPage() {
    const { identity, isLoading: authLoading } = useAuth();
    const router = useRouter();

    const [groups, setGroups]               = useState<Group[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [messages, setMessages]           = useState<GroupMessage[]>([]);
    const [members, setMembers]             = useState<GroupMember[]>([]);
    const [newMessage, setNewMessage]       = useState('');
    const [loading, setLoading]             = useState(true);
    const [sending, setSending]             = useState(false);
    const [error, setError]                 = useState('');

    // New-group modal state
    const [showCreate, setShowCreate]           = useState(false);
    const [newGroupName, setNewGroupName]       = useState('');
    const [newGroupPolicy, setNewGroupPolicy]   = useState<JoinPolicy>('invite_only');
    const [creating, setCreating]               = useState(false);

    // Add-member modal
    const [showAddMember, setShowAddMember] = useState(false);
    const [addMemberId, setAddMemberId]     = useState('');
    const [addingMember, setAddingMember]   = useState(false);

    // Leave / policy panel
    const [leavingGroup, setLeavingGroup]   = useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [showPolicyEdit, setShowPolicyEdit]     = useState(false);
    const [policyValue, setPolicyValue]           = useState<JoinPolicy>('invite_only');
    const [savingPolicy, setSavingPolicy]         = useState(false);

    // Discover public groups tab
    const [showDiscover, setShowDiscover]   = useState(false);
    const [publicGroups, setPublicGroups]   = useState<Group[]>([]);
    const [loadingPublic, setLoadingPublic] = useState(false);
    const [joiningId, setJoiningId]         = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const pollRef        = useRef<ReturnType<typeof setInterval> | null>(null);
    const groupsPollRef  = useRef<ReturnType<typeof setInterval> | null>(null);

    // ── Auth guard ────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!authLoading && !identity) router.push('/login');
    }, [identity, authLoading, router]);

    // ── Load groups ───────────────────────────────────────────────────────────
    const loadGroups = useCallback(async () => {
        try {
            const data = await listGroups();
            setGroups(data);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load groups');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadGroups();
        // Poll for newly-added groups every 30 s (receiving side fix)
        groupsPollRef.current = setInterval(loadGroups, 30_000);
        return () => { if (groupsPollRef.current) clearInterval(groupsPollRef.current); };
    }, [loadGroups]);

    // ── Load messages + members when group is selected ────────────────────────
    const loadMessages = useCallback(async (groupId: string) => {
        try {
            const msgs = await getGroupMessages(groupId, 50);
            setMessages(msgs.reverse()); // newest last
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        if (!selectedGroup) return;
        loadMessages(selectedGroup.id);
        getGroupMembers(selectedGroup.id).then(setMembers).catch(() => {});
        setPolicyValue((selectedGroup.join_policy as JoinPolicy) ?? 'invite_only');

        // Poll for new messages every 5 s
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = setInterval(() => loadMessages(selectedGroup.id), 5000);
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, [selectedGroup, loadMessages]);

    // ── Auto-scroll to bottom on new messages ─────────────────────────────────
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ── Send message ──────────────────────────────────────────────────────────
    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedGroup || !newMessage.trim() || sending) return;
        setSending(true);
        try {
            await sendGroupMessage(selectedGroup.id, newMessage.trim());
            setNewMessage('');
            await loadMessages(selectedGroup.id);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to send message');
        } finally {
            setSending(false);
        }
    };

    // ── Create group ──────────────────────────────────────────────────────────
    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGroupName.trim() || creating) return;
        setCreating(true);
        try {
            const g = await createGroup(newGroupName.trim());
            // Apply the chosen join policy right after creation
            if (newGroupPolicy !== 'invite_only') {
                try { await updateGroupJoinPolicy(g.id, newGroupPolicy); } catch { /* non-fatal */ }
            }
            setGroups(prev => [{ ...g, join_policy: newGroupPolicy }, ...prev]);
            setNewGroupName('');
            setNewGroupPolicy('invite_only');
            setShowCreate(false);
            setSelectedGroup({ ...g, join_policy: newGroupPolicy });
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to create group');
        } finally {
            setCreating(false);
        }
    };

    // ── Add member ────────────────────────────────────────────────────────────
    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedGroup || !addMemberId.trim() || addingMember) return;
        setAddingMember(true);
        try {
            await addGroupMember(selectedGroup.id, addMemberId.trim());
            const updated = await getGroupMembers(selectedGroup.id);
            setMembers(updated);
            setAddMemberId('');
            setShowAddMember(false);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to add member');
        } finally {
            setAddingMember(false);
        }
    };

    // ── Leave group ───────────────────────────────────────────────────────────
    const handleLeaveGroup = async () => {
        if (!selectedGroup || leavingGroup) return;
        setLeavingGroup(true);
        try {
            await leaveGroup(selectedGroup.id);
            setGroups(prev => prev.filter(g => g.id !== selectedGroup.id));
            setSelectedGroup(null);
            setMessages([]);
            setMembers([]);
            setShowLeaveConfirm(false);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to leave group');
        } finally {
            setLeavingGroup(false);
        }
    };

    // ── Update join policy ────────────────────────────────────────────────────
    const handleSavePolicy = async () => {
        if (!selectedGroup || savingPolicy) return;
        setSavingPolicy(true);
        try {
            await updateGroupJoinPolicy(selectedGroup.id, policyValue);
            setGroups(prev => prev.map(g => g.id === selectedGroup.id ? { ...g, join_policy: policyValue } : g));
            setSelectedGroup(prev => prev ? { ...prev, join_policy: policyValue } : prev);
            setShowPolicyEdit(false);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to update policy');
        } finally {
            setSavingPolicy(false);
        }
    };

    // ── Discover public groups ────────────────────────────────────────────────
    const handleOpenDiscover = async () => {
        setShowDiscover(true);
        setLoadingPublic(true);
        try {
            const data = await listPublicGroups();
            setPublicGroups(data);
        } catch { /* ignore */ } finally {
            setLoadingPublic(false);
        }
    };

    const handleJoinPublicGroup = async (groupId: string) => {
        setJoiningId(groupId);
        try {
            await joinGroup(groupId);
            setPublicGroups(prev => prev.filter(g => g.id !== groupId));
            await loadGroups();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to join group');
        } finally {
            setJoiningId(null);
        }
    };

    const isAdmin = selectedGroup
        ? members.some(m => m.user_id === identity?.user_id && m.role === 'admin')
        : false;


    if (authLoading || (!identity && !authLoading)) return null;

    return (
        <div className="flex h-full bg-bat-black text-bat-gray">

            {/* ── Group list (left panel) ─────────────────────────────────── */}
            <div className="w-72 border-r border-bat-gray/10 flex flex-col bg-bat-dark/30 shrink-0">
                {/* Header */}
                <div className="p-4 border-b border-bat-gray/10 flex items-center justify-between">
                    <h2 className="text-bat-yellow font-semibold tracking-wide text-sm">GROUP CHATS</h2>
                    <div className="flex gap-1.5">
                        <button
                            onClick={handleOpenDiscover}
                            title="Discover open groups"
                            className="text-xs px-2 py-1 border border-bat-gray/20 text-bat-gray/60 hover:bg-bat-gray/10 hover:text-bat-gray transition-colors rounded"
                        >
                            Discover
                        </button>
                        <button
                            onClick={() => setShowCreate(true)}
                            className="text-xs px-2 py-1 border border-bat-yellow/40 text-bat-yellow/70 hover:bg-bat-yellow/10 hover:text-bat-yellow transition-colors rounded"
                        >
                            + NEW
                        </button>
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto">
                    {loading && (
                        <div className="p-4 text-bat-gray/40 text-xs">Loading groups...</div>
                    )}
                    {!loading && groups.length === 0 && (
                        <div className="p-4 text-bat-gray/40 text-xs">
                            No groups yet.{' '}
                            <button className="text-bat-yellow underline" onClick={() => setShowCreate(true)}>
                                Create one
                            </button>
                        </div>
                    )}
                    {groups.map((g, idx) => (
                        <button
                            key={g.id || g.name || String(idx)}
                            onClick={() => { setSelectedGroup(g); setShowPolicyEdit(false); }}
                            className={`w-full text-left px-4 py-3 border-b border-bat-gray/5 transition-colors ${
                                selectedGroup?.id === g.id
                                    ? 'bg-bat-yellow/10 border-bat-yellow/20'
                                    : 'hover:bg-bat-gray/5'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-bat-yellow/20 flex items-center justify-center text-bat-yellow font-bold text-sm shrink-0">
                                    {g.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <div className="text-sm font-medium text-bat-gray truncate">{g.name}</div>
                                    <div className="text-xs text-bat-gray/40 truncate">
                                        {JOIN_POLICY_LABELS[(g.join_policy as JoinPolicy) ?? 'invite_only']}
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Main chat area ──────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col min-w-0">
                {selectedGroup ? (
                    <>
                        {/* Chat header */}
                        <div className="p-4 border-b border-bat-gray/10 flex flex-col gap-2 shrink-0">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-bat-yellow tracking-wide">{selectedGroup.name}</h3>
                                    <p className="text-xs text-bat-gray/40">
                                        {members.length} member{members.length !== 1 ? 's' : ''} · encrypted ·{' '}
                                        <span className="text-bat-gray/60">
                                            {JOIN_POLICY_LABELS[(selectedGroup.join_policy as JoinPolicy) ?? 'invite_only']}
                                        </span>
                                    </p>
                                </div>
                                <div className="flex gap-1.5 flex-wrap justify-end">
                                    {isAdmin && (
                                        <>
                                            <button
                                                onClick={() => setShowAddMember(true)}
                                                className="text-xs px-2 py-1 border border-bat-gray/20 text-bat-gray/60 hover:bg-bat-gray/10 hover:text-bat-gray transition-colors rounded"
                                            >
                                                + Add Member
                                            </button>
                                            <button
                                                onClick={() => setShowPolicyEdit(v => !v)}
                                                className={`text-xs px-2 py-1 border rounded transition-colors ${showPolicyEdit ? 'border-bat-yellow/60 text-bat-yellow bg-bat-yellow/10' : 'border-bat-gray/20 text-bat-gray/60 hover:bg-bat-gray/10'}`}
                                            >
                                                Policy
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => setShowLeaveConfirm(true)}
                                        className="text-xs px-2 py-1 border border-red-500/30 text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-colors rounded"
                                    >
                                        Leave
                                    </button>
                                </div>
                            </div>
                            {/* Join policy editor (admin only) */}
                            {showPolicyEdit && isAdmin && (
                                <div className="flex items-center gap-2 flex-wrap">
                                    {(['anyone', 'followers', 'invite_only'] as JoinPolicy[]).map(p => (
                                        <button
                                            key={p}
                                            onClick={() => setPolicyValue(p)}
                                            className={`text-xs px-2 py-1 rounded border transition-colors ${policyValue === p ? 'border-bat-yellow/60 bg-bat-yellow/10 text-bat-yellow' : 'border-bat-gray/20 text-bat-gray/50 hover:border-bat-gray/40'}`}
                                        >
                                            {JOIN_POLICY_LABELS[p]}
                                        </button>
                                    ))}
                                    <button
                                        onClick={handleSavePolicy}
                                        disabled={savingPolicy}
                                        className="text-xs px-3 py-1 bg-bat-yellow/20 border border-bat-yellow/40 text-bat-yellow rounded hover:bg-bat-yellow/30 disabled:opacity-40 transition-colors"
                                    >
                                        {savingPolicy ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {messages.length === 0 && (
                                <div className="text-center text-bat-gray/30 text-sm py-10">
                                    No messages yet. Say hello!
                                </div>
                            )}
                            {messages.map(msg => {
                                const isMine = msg.sender_id === identity?.user_id;
                                return (
                                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-xs lg:max-w-md rounded-lg px-4 py-2 ${
                                            isMine
                                                ? 'bg-bat-yellow/20 text-bat-gray rounded-br-sm'
                                                : 'bg-bat-gray/10 text-bat-gray rounded-bl-sm'
                                        }`}>
                                            {!isMine && (
                                                <div className="text-xs text-bat-yellow/60 mb-1">{msg.sender_id.split('@')[0]}</div>
                                            )}
                                            <p className="text-sm break-words whitespace-pre-wrap">{msg.content}</p>
                                            <div className="text-xs text-bat-gray/30 mt-1 text-right">
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSend} className="p-4 border-t border-bat-gray/10 flex gap-2 flex-shrink-0">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={e => setNewMessage(e.target.value)}
                                placeholder="Type an encrypted message..."
                                disabled={sending}
                                className="flex-1 bg-bat-gray/10 border border-bat-gray/20 rounded-lg px-4 py-2 text-sm text-bat-gray placeholder-bat-gray/30 focus:outline-none focus:border-bat-yellow/40"
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim() || sending}
                                className="px-4 py-2 bg-bat-yellow/20 border border-bat-yellow/40 text-bat-yellow text-sm rounded-lg hover:bg-bat-yellow/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                {sending ? '...' : 'Send'}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-bat-gray/20">
                        <div className="text-center">
                            <svg className="w-16 h-16 mx-auto mb-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth={1}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                            <p className="text-sm">Select a group to start chatting</p>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Create Group Modal ──────────────────────────────────────── */}
            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className="bg-bat-dark border border-bat-gray/20 rounded-xl p-6 w-full max-w-sm shadow-2xl">
                        <h3 className="text-bat-yellow font-semibold mb-4 tracking-wide">CREATE GROUP</h3>
                        <form onSubmit={handleCreateGroup}>
                            <input
                                type="text"
                                placeholder="Group name"
                                value={newGroupName}
                                onChange={e => setNewGroupName(e.target.value)}
                                maxLength={60}
                                className="w-full bg-bat-gray/10 border border-bat-gray/20 rounded px-4 py-2 text-sm text-bat-gray mb-3 focus:outline-none focus:border-bat-yellow/40"
                            />
                            {/* Join policy */}
                            <p className="text-xs text-bat-gray/50 mb-1.5">Who can join?</p>
                            <div className="flex gap-1.5 mb-4 flex-wrap">
                                {(['invite_only', 'followers', 'anyone'] as JoinPolicy[]).map(p => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setNewGroupPolicy(p)}
                                        className={`text-xs px-2.5 py-1 rounded border transition-colors ${newGroupPolicy === p ? 'border-bat-yellow/60 bg-bat-yellow/10 text-bat-yellow' : 'border-bat-gray/20 text-bat-gray/50 hover:border-bat-gray/40'}`}
                                    >
                                        {JOIN_POLICY_LABELS[p]}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={!newGroupName.trim() || creating}
                                    className="flex-1 py-2 bg-bat-yellow/20 border border-bat-yellow/40 text-bat-yellow text-sm rounded hover:bg-bat-yellow/30 disabled:opacity-40 transition-colors"
                                >
                                    {creating ? 'Creating...' : 'Create'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setShowCreate(false); setNewGroupName(''); setNewGroupPolicy('invite_only'); }}
                                    className="flex-1 py-2 border border-bat-gray/20 text-bat-gray/50 text-sm rounded hover:bg-bat-gray/10 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Leave Confirmation Modal ────────────────────────────────── */}
            {showLeaveConfirm && selectedGroup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className="bg-bat-dark border border-bat-gray/20 rounded-xl p-6 w-full max-w-sm shadow-2xl">
                        <h3 className="text-red-400 font-semibold mb-2 tracking-wide">LEAVE GROUP?</h3>
                        <p className="text-bat-gray/60 text-sm mb-4">
                            You will leave <span className="text-bat-gray font-medium">{selectedGroup.name}</span>.
                            You&apos;ll need to be re-added to rejoin.
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={handleLeaveGroup}
                                disabled={leavingGroup}
                                className="flex-1 py-2 bg-red-500/20 border border-red-500/40 text-red-400 text-sm rounded hover:bg-red-500/30 disabled:opacity-40 transition-colors"
                            >
                                {leavingGroup ? 'Leaving...' : 'Leave Group'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowLeaveConfirm(false)}
                                className="flex-1 py-2 border border-bat-gray/20 text-bat-gray/50 text-sm rounded hover:bg-bat-gray/10 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Discover Groups Modal ──────────────────────────────────── */}
            {showDiscover && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className="bg-bat-dark border border-bat-gray/20 rounded-xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-bat-yellow font-semibold tracking-wide">DISCOVER GROUPS</h3>
                            <button onClick={() => setShowDiscover(false)} className="text-bat-gray/50 hover:text-bat-gray text-lg leading-none">✕</button>
                        </div>
                        {loadingPublic && <p className="text-bat-gray/40 text-sm text-center py-8">Loading...</p>}
                        {!loadingPublic && publicGroups.length === 0 && (
                            <p className="text-bat-gray/40 text-sm text-center py-8">No open groups found.</p>
                        )}
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                            {publicGroups.map(g => (
                                <div key={g.id} className="flex items-center justify-between p-3 rounded-lg bg-bat-gray/5 border border-bat-gray/10">
                                    <div>
                                        <p className="text-sm font-medium text-bat-gray">{g.name}</p>
                                        <p className="text-xs text-bat-gray/40">
                                            {g.member_count ?? 0} members &middot; {JOIN_POLICY_LABELS[(g.join_policy as JoinPolicy) ?? 'anyone']}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleJoinPublicGroup(g.id)}
                                        disabled={joiningId === g.id}
                                        className="text-xs px-3 py-1 bg-bat-yellow/20 border border-bat-yellow/40 text-bat-yellow rounded hover:bg-bat-yellow/30 disabled:opacity-40 transition-colors"
                                    >
                                        {joiningId === g.id ? '...' : 'Join'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Add Member Modal ────────────────────────────────────────── */}
            {showAddMember && selectedGroup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className="bg-bat-dark border border-bat-gray/20 rounded-xl p-6 w-full max-w-sm shadow-2xl">
                        <h3 className="text-bat-yellow font-semibold mb-1 tracking-wide">ADD MEMBER</h3>
                        <p className="text-xs text-bat-gray/40 mb-4">Enter the user&apos;s full ID (e.g. alice@server_a)</p>
                        <form onSubmit={handleAddMember}>
                            <input
                                type="text"
                                placeholder="user@server_id"
                                value={addMemberId}
                                onChange={e => setAddMemberId(e.target.value)}
                                className="w-full bg-bat-gray/10 border border-bat-gray/20 rounded px-4 py-2 text-sm text-bat-gray mb-4 focus:outline-none focus:border-bat-yellow/40"
                            />
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={!addMemberId.trim() || addingMember}
                                    className="flex-1 py-2 bg-bat-yellow/20 border border-bat-yellow/40 text-bat-yellow text-sm rounded hover:bg-bat-yellow/30 disabled:opacity-40 transition-colors"
                                >
                                    {addingMember ? 'Adding...' : 'Add'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setShowAddMember(false); setAddMemberId(''); }}
                                    className="flex-1 py-2 border border-bat-gray/20 text-bat-gray/50 text-sm rounded hover:bg-bat-gray/10 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Global error toast ──────────────────────────────────────── */}
            {error && (
                <div
                    className="fixed bottom-4 right-4 z-50 px-4 py-2 bg-red-900/80 border border-red-500/60 text-red-300 text-xs rounded shadow-lg cursor-pointer"
                    onClick={() => setError('')}
                >
                    {error}  ✕
                </div>
            )}
        </div>
    );
}
