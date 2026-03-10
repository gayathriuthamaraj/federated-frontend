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
    Group,
    GroupMessage,
    GroupMember,
} from '../utils/groups';

export default function GroupsPage() {
    const { identity, isLoading: authLoading } = useAuth();
    const router = useRouter();

    const [groups, setGroups]             = useState<Group[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [messages, setMessages]         = useState<GroupMessage[]>([]);
    const [members, setMembers]           = useState<GroupMember[]>([]);
    const [newMessage, setNewMessage]     = useState('');
    const [loading, setLoading]           = useState(true);
    const [sending, setSending]           = useState(false);
    const [error, setError]               = useState('');

    // New-group modal state
    const [showCreate, setShowCreate]     = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [creating, setCreating]         = useState(false);

    // Add-member modal
    const [showAddMember, setShowAddMember]   = useState(false);
    const [addMemberId, setAddMemberId]       = useState('');
    const [addingMember, setAddingMember]     = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const pollRef        = useRef<ReturnType<typeof setInterval> | null>(null);

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

    useEffect(() => { loadGroups(); }, [loadGroups]);

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
            setGroups(prev => [g, ...prev]);
            setNewGroupName('');
            setShowCreate(false);
            setSelectedGroup(g);
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

    if (authLoading || (!identity && !authLoading)) return null;

    return (
        <div className="flex h-full bg-bat-black text-bat-gray">

            {/* ── Group list (left panel) ─────────────────────────────────── */}
            <div className="w-72 border-r border-bat-gray/10 flex flex-col bg-bat-dark/30 flex-shrink-0">
                {/* Header */}
                <div className="p-4 border-b border-bat-gray/10 flex items-center justify-between">
                    <h2 className="text-bat-yellow font-semibold tracking-wide text-sm">GROUP CHATS</h2>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="text-xs px-2 py-1 border border-bat-yellow/40 text-bat-yellow/70 hover:bg-bat-yellow/10 hover:text-bat-yellow transition-colors rounded"
                    >
                        + NEW
                    </button>
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
                            onClick={() => setSelectedGroup(g)}
                            className={`w-full text-left px-4 py-3 border-b border-bat-gray/5 transition-colors ${
                                selectedGroup?.id === g.id
                                    ? 'bg-bat-yellow/10 border-bat-yellow/20'
                                    : 'hover:bg-bat-gray/5'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-bat-yellow/20 flex items-center justify-center text-bat-yellow font-bold text-sm flex-shrink-0">
                                    {g.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <div className="text-sm font-medium text-bat-gray truncate">{g.name}</div>
                                    <div className="text-xs text-bat-gray/40 truncate">
                                        {new Date(g.created_at).toLocaleDateString()}
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
                        <div className="p-4 border-b border-bat-gray/10 flex items-center justify-between flex-shrink-0">
                            <div>
                                <h3 className="font-semibold text-bat-yellow tracking-wide">{selectedGroup.name}</h3>
                                <p className="text-xs text-bat-gray/40">{members.length} member{members.length !== 1 ? 's' : ''} · encrypted</p>
                            </div>
                            <button
                                onClick={() => setShowAddMember(true)}
                                className="text-xs px-2 py-1 border border-bat-gray/20 text-bat-gray/60 hover:bg-bat-gray/10 hover:text-bat-gray transition-colors rounded"
                            >
                                + Add Member
                            </button>
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
                                className="w-full bg-bat-gray/10 border border-bat-gray/20 rounded px-4 py-2 text-sm text-bat-gray mb-4 focus:outline-none focus:border-bat-yellow/40"
                            />
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
                                    onClick={() => { setShowCreate(false); setNewGroupName(''); }}
                                    className="flex-1 py-2 border border-bat-gray/20 text-bat-gray/50 text-sm rounded hover:bg-bat-gray/10 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
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
