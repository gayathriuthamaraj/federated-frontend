function getApiBase(): string {
    return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
}

function getModerationBase(): string {
    return process.env.NEXT_PUBLIC_MODERATION_URL || 'http://localhost:8090';
}

function getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('mod_token');
}

export interface PendingPost {
    id: string;
    author: string;
    content: string;
    image_url?: string;
    created_at: string;
}

export interface ModeratorRecord {
    user_id: string;
    username: string;
    assigned_by: string;
    assigned_at: string;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function moderatorLogin(username: string, password: string): Promise<{ token: string; role: string; message: string }> {
    const res = await fetch(`${getApiBase()}/moderator/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
        const txt = await res.text();
        try { throw new Error(JSON.parse(txt).error || txt); } catch { throw new Error(txt || 'Login failed'); }
    }
    return res.json();
}

// ── Queue ─────────────────────────────────────────────────────────────────────

export async function getPendingPosts(): Promise<{ posts: PendingPost[]; count: number }> {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    const res = await fetch(`${getApiBase()}/moderation/pending`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) {
        const body = await res.text();
        let msg = body;
        try { msg = JSON.parse(body).error || body; } catch { /* use raw body */ }
        throw new Error(msg || 'Failed to fetch pending posts');
    }
    return res.json();
}

export async function approvePost(contentId: string): Promise<void> {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    const res = await fetch(`${getApiBase()}/moderation/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ content_id: contentId }),
    });
    if (!res.ok) throw new Error(await res.text());
}

export async function rejectPost(contentId: string): Promise<void> {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    const res = await fetch(`${getApiBase()}/moderation/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ content_id: contentId }),
    });
    if (!res.ok) throw new Error(await res.text());
}

// ── Admin: Moderator Management ───────────────────────────────────────────────

export async function listModerators(adminToken: string): Promise<{ moderators: ModeratorRecord[]; count: number }> {
    const res = await fetch(`${getApiBase()}/admin/moderators/list`, {
        headers: { 'Authorization': `Bearer ${adminToken}` },
    });
    if (!res.ok) throw new Error('Failed to list moderators');
    return res.json();
}

export async function assignModerator(adminToken: string, username: string): Promise<{ message: string }> {
    const res = await fetch(`${getApiBase()}/admin/moderators/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
        body: JSON.stringify({ username }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function removeModerator(adminToken: string, username: string): Promise<{ message: string }> {
    const res = await fetch(`${getApiBase()}/admin/moderators/remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
        body: JSON.stringify({ username }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

// ── Reports ───────────────────────────────────────────────────────────────────

export interface Report {
    id: number;
    reporter_id: string;
    target_ref: string;
    target_server: string;
    reason: string;
    status: 'pending' | 'resolved';
    created_at: string;
    resolved_at?: string;
    resolved_by?: string;
}

export async function listReports(): Promise<Report[]> {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    const res = await fetch(`${getModerationBase()}/moderation/reports`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) {
        const body = await res.text();
        let msg = body;
        try { msg = JSON.parse(body).error || body; } catch { /* use raw */ }
        throw new Error(msg || 'Failed to fetch reports');
    }
    const data = await res.json();
    return Array.isArray(data) ? data : (data.reports || []);
}

export async function resolveReport(id: number, resolvedBy: string): Promise<void> {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    const res = await fetch(
        `${getModerationBase()}/moderation/resolve?id=${encodeURIComponent(id)}&resolved_by=${encodeURIComponent(resolvedBy)}`,
        { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } },
    );
    if (!res.ok) throw new Error(await res.text());
}

export async function blockServer(domain: string, reason: string, adminId: string): Promise<void> {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    const res = await fetch(`${getModerationBase()}/servers/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ domain, reason, admin_id: adminId }),
    });
    if (!res.ok) throw new Error(await res.text());
}
