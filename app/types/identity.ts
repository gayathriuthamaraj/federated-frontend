// types/identity.ts

/**
 * Federated Identity object
 * This represents the boundary model received from the backend.
 * Frontend NEVER assumes more than what is defined here.
 */
export interface Identity {
    /** Globally unique identifier: user@server */
    user_id: string

    /** Authoritative home server (URL or domain) */
    home_server: string

    /** Public key used for verification (string-encoded for now) */
    public_key: string

    /** Whether this identity allows cross-server discovery */
    allow_discovery: boolean
}
