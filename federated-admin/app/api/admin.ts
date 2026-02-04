const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

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

// Get authentication token from localStorage
function getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('admin_token');
}

// Admin login
export async function adminLogin(data: AdminLoginData): Promise<{ token: string; message: string }> {
    const response = await fetch(`${API_BASE_URL}/admin/login`, {
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

// Get server configuration
export async function getServerConfig(): Promise<ServerConfig> {
    const token = getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}/admin/config/server`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch server config');
    }

    return response.json();
}

// Update server name
export async function updateServerName(serverName: string): Promise<{ message: string; server_name: string }> {
    const token = getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}/admin/config/server`, {
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

// Test database connection
export async function testDatabaseConnection(connectionString: string): Promise<{ status: string; message: string }> {
    const token = getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}/admin/config/test-db`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ connection_string: connectionString }),
    });

    const data = await response.json();
    return data;
}

// Start database migration
export async function startDatabaseMigration(connectionString: string): Promise<{ migration_id: string; status: string; message: string }> {
    const token = getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}/admin/migrate/start`, {
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

// Get migration status
export async function getMigrationStatus(migrationId: string): Promise<MigrationStatus> {
    const token = getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}/admin/migrate/status?migration_id=${migrationId}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch migration status');
    }

    return response.json();
}

// Get all users
export async function getAllUsers(): Promise<{ users: any[]; count: number }> {
    const token = getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}/admin/users/list`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch users');
    }

    return response.json();
}

// Get server statistics
export async function getServerStats(): Promise<ServerStats> {
    const token = getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}/admin/stats`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch server stats');
    }

    return response.json();
}
