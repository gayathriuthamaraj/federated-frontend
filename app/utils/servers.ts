/**
 * Server configuration driven by environment variables.
 * Set NEXT_PUBLIC_BACKEND_URL in .env.local to point at your backend.
 * Set NEXT_PUBLIC_MODERATION_URL in .env.local to point at your moderation server.
 */
export interface ServerConfig {
    /** Stable machine identifier */
    id: string;
    /** Human-readable label */
    name: string;
    /** Base URL used for all API requests */
    url: string;
}

export interface TrustedServerEntry {
    server_id: string;
    server_name: string;
    server_url: string;
}

/** Returns the single server configured via NEXT_PUBLIC_BACKEND_URL. */
export function getDefaultServer(): ServerConfig {
    const url =
        (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_BACKEND_URL) ||
        'http://localhost:8080';
    return { id: 'default', name: 'Home Server', url };
}

/** Persist the chosen server to localStorage so api.ts can pick it up. */
export function pinServer(server: ServerConfig): void {
    if (typeof window === 'undefined') return;
    const entry: TrustedServerEntry = {
        server_id: server.id,
        server_name: server.name,
        server_url: server.url,
    };
    localStorage.setItem('trusted_server', JSON.stringify(entry));
}

/** Read back whatever server is currently pinned (or null). */
export function getPinnedServer(): TrustedServerEntry | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = localStorage.getItem('trusted_server');
        if (!raw) return null;
        return JSON.parse(raw) as TrustedServerEntry;
    } catch {
        return null;
    }
}
