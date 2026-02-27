
function getApiBaseUrl(): string {
    if (typeof window === 'undefined') return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

    const trustedServer = localStorage.getItem('trusted_server');
    if (trustedServer) {
        try {
            const data = JSON.parse(trustedServer);
            return data.server_url || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
        } catch (e) {
            return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
        }
    }
    return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
}

export interface AdminLoginData {
    username: string;
    password: string;
}

export interface ServerConfig {
    server_name: string;
    updated_at: string;
    updated_by: string;
}

export interface MigrationStatus {
    id: string;
    from_db: string;
    to_db: string;
    status: string;
    tables_migrated: Record<string, string>;
    error_message?: string;
    started_at: string;
    completed_at?: string;
}

export interface ServerStats {
    total_users: number;
    total_posts: number;
    total_activities: number;
    total_follows: number;
    server_name: string;
    database_status: string;
    uptime: string;
}


function getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('admin_token');
}


export async function adminLogin(data: AdminLoginData): Promise<{ token: string; message: string }> {
    const response = await fetch(`${getApiBaseUrl()}/admin/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Login failed');
    }

    return response.json();
}


export async function getServerConfig(): Promise<ServerConfig> {
    const token = getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${getApiBaseUrl()}/admin/config/server`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch server config');
    }

    return response.json();
}


export async function updateServerName(serverName: string): Promise<{ message: string; server_name: string }> {
    const token = getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${getApiBaseUrl()}/admin/config/server`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ server_name: serverName }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to update server name');
    }

    return response.json();
}


export async function testDatabaseConnection(connectionString: string): Promise<{ status: string; message: string }> {
    const token = getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${getApiBaseUrl()}/admin/config/test-db`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ connection_string: connectionString }),
    });

    if (!response.ok) {
        const text = await response.text();
        let errorMsg = 'Database connection test failed';
        try { errorMsg = JSON.parse(text).error || text || errorMsg; } catch { errorMsg = text || errorMsg; }
        throw new Error(errorMsg);
    }
    const data = await response.json();
    return data;
}


export async function startDatabaseMigration(connectionString: string): Promise<{ migration_id: string; status: string; message: string }> {
    const token = getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${getApiBaseUrl()}/admin/migrate/start`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ new_connection_string: connectionString }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to start migration');
    }

    return response.json();
}


export async function getMigrationStatus(migrationId: string): Promise<MigrationStatus> {
    const token = getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${getApiBaseUrl()}/admin/migrate/status?migration_id=${migrationId}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch migration status');
    }

    return response.json();
}


export async function getAllUsers(): Promise<{ users: any[]; count: number }> {
    const token = getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${getApiBaseUrl()}/admin/users/list`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch users');
    }

    return response.json();
}


export async function getServerStats(): Promise<ServerStats> {
    const token = getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${getApiBaseUrl()}/admin/stats`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch server stats');
    }

    return response.json();
}





export interface Invite {
    id: string;
    invite_code: string;
    invite_type: 'user' | 'admin';
    created_by: string;
    max_uses: number;
    current_uses: number;
    expires_at?: string;
    revoked: boolean;
    created_at: string;
}

export interface GenerateInviteRequest {
    invite_type: 'user' | 'admin';
    max_uses: number;
    expires_in: number;
}

export async function getInvites(): Promise<{ invites: Invite[] }> {
    const token = getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${getApiBaseUrl()}/admin/invites/list`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) throw new Error('Failed to fetch invites');
    return response.json();
}

export async function generateInvite(data: GenerateInviteRequest): Promise<Invite> {
    const token = getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${getApiBaseUrl()}/admin/invites/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error(await response.text());
    return response.json();
}

export interface TrustedServer {
    id: string;
    server_id: string;
    server_name: string;
    public_key: string;
    endpoint: string;
    trusted_at: string;
}

export async function getTrustedServers(): Promise<TrustedServer[]> {
    const token = getAuthToken();
    if (!token) throw new Error('Not authenticated');
    const response = await fetch(`${getApiBaseUrl()}/admin/trusted-servers/list`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch trusted servers');
    const data = await response.json();
    return Array.isArray(data) ? data : (data.servers ?? []);
}

export async function revokeInvite(inviteCode: string): Promise<void> {
    const token = getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${getApiBaseUrl()}/admin/invites/revoke`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ invite_code: inviteCode }),
    });

    if (!response.ok) throw new Error(await response.text());
}

export async function fetchInviteQR(code: string): Promise<string> {
    const token = getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${getApiBaseUrl()}/admin/invites/qr?code=${code}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) throw new Error('Failed to fetch QR code');
    const blob = await response.blob();
    return URL.createObjectURL(blob);
}
