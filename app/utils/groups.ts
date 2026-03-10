/**
 * Group messaging API helpers for the main frontend.
 * Maps to the /groups/* endpoints added in group_messaging.go.
 */
import { apiGet, apiPost } from './api';

export interface Group {
    id: string;
    name: string;
    created_by: string;
    created_at: string;
}

export interface GroupMember {
    group_id: string;
    user_id: string;
    role: string;
    joined_at: string;
}

export interface GroupMessage {
    id: string;
    group_id: string;
    sender_id: string;
    content: string;           // decrypted on the server before delivery
    created_at: string;
}

// ── Create a group ────────────────────────────────────────────────────────────

export async function createGroup(name: string): Promise<Group> {
    const userRaw = localStorage.getItem('local_identity');
    const user_id = userRaw ? JSON.parse(userRaw).user_id ?? '' : '';
    const res = await apiPost('/groups/create', { name, user_id });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

// ── List groups the current user belongs to ───────────────────────────────────

export async function listGroups(): Promise<Group[]> {
    const userRaw = localStorage.getItem('local_identity');
    const user_id = userRaw ? JSON.parse(userRaw).user_id ?? '' : '';
    const res = await apiGet(`/groups?user_id=${encodeURIComponent(user_id)}`);
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return Array.isArray(data) ? data : (data.groups ?? []);
}

// ── Get group members ─────────────────────────────────────────────────────────

export async function getGroupMembers(groupId: string): Promise<GroupMember[]> {
    const res = await apiGet(`/groups/members?group_id=${encodeURIComponent(groupId)}`);
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return Array.isArray(data) ? data : (data.members ?? []);
}

// ── Add a member ──────────────────────────────────────────────────────────────

export async function addGroupMember(groupId: string, targetUserId: string, role = 'member'): Promise<void> {
    const userRaw = localStorage.getItem('local_identity');
    const requester_id = userRaw ? JSON.parse(userRaw).user_id ?? '' : '';
    const res = await apiPost('/groups/members/add', {
        group_id:      groupId,
        requester_id,
        user_id:       targetUserId,
        role,
    });
    if (!res.ok) throw new Error(await res.text());
}

// ── Remove a member ───────────────────────────────────────────────────────────

export async function removeGroupMember(groupId: string, targetUserId: string): Promise<void> {
    const userRaw = localStorage.getItem('local_identity');
    const requester_id = userRaw ? JSON.parse(userRaw).user_id ?? '' : '';
    const res = await apiPost('/groups/members/remove', {
        group_id:      groupId,
        requester_id,
        user_id:       targetUserId,
    });
    if (!res.ok) throw new Error(await res.text());
}

// ── Send a group message ──────────────────────────────────────────────────────

export async function sendGroupMessage(groupId: string, content: string): Promise<void> {
    const userRaw = localStorage.getItem('local_identity');
    const sender_id = userRaw ? JSON.parse(userRaw).user_id ?? '' : '';
    const res = await apiPost('/groups/message', { group_id: groupId, sender_id, content });
    if (!res.ok) throw new Error(await res.text());
}

// ── Get group messages ────────────────────────────────────────────────────────

export async function getGroupMessages(groupId: string, limit = 50, before?: string): Promise<GroupMessage[]> {
    const qs = new URLSearchParams({ group_id: groupId, limit: String(limit) });
    if (before) qs.set('before', before);
    const res = await apiGet(`/groups/messages?${qs}`);
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return Array.isArray(data) ? data : (data.messages ?? []);
}
