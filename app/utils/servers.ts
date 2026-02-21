/**
 * Known federated servers.
 * Update these entries (and SERVER_ID / SERVER_NAME in .env) when you add a
 * new server to the federation.
 */
export interface ServerConfig {
    /** Stable machine identifier – matches SERVER_ID in the backend .env */
    id: string;
    /** Human-readable label shown in dropdowns */
    name: string;
    /** Base URL used for all API requests to this server */
    url: string;
    /** Public display port (for labels only) */
    port: number;
}

export const KNOWN_SERVERS: ServerConfig[] = [
    {
        id: 'server_a',
        name: 'Server A',
        url: 'http://localhost:8080',
        port: 8080,
    },
    {
        id: 'server_b',
        name: 'Server B',
        url: 'http://localhost:9080',
        port: 9080,
    },
];

export interface TrustedServerEntry {
    server_id: string;
    server_name: string;
    server_url: string;
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

/** Read back whatever server is currently pinned (or undefined). */
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

/** Look up a ServerConfig by its id string. */
export function findServerById(id: string): ServerConfig | undefined {
    return KNOWN_SERVERS.find((s) => s.id === id);
}
