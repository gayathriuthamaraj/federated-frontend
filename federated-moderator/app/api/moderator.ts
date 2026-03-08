function getApiBase(): string {
    if (typeof window === 'undefined') return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
    return localStorage.getItem('mod_backend') || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
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
        body: JSON.stringify({ user_id: username, password }),
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
        let errMsg = `HTTP ${res.status}`;
        try { const j = await res.json(); errMsg = j.error || errMsg; } catch { const t = await res.text().catch(() => ''); if (t) errMsg = t; }
        throw new Error(errMsg);
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
        body: JSON.stringify({ user_id: username }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function removeModerator(adminToken: string, username: string): Promise<{ message: string }> {
    const res = await fetch(`${getApiBase()}/admin/moderators/remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
        body: JSON.stringify({ user_id: username }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}
