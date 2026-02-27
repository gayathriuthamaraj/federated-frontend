/**
 * Client-side cryptography utilities for hybrid encryption
 * 
 * Architecture:
 * - Ed25519 for asymmetric signatures (client generates keypair)
 * - AES-256-GCM for symmetric encryption (server provides session key)
 * - Trust-first: client sends public key to server on registration
 */

export interface ClientKeyPair {
    publicKey: string;   // hex-encoded Ed25519 public key
    privateKey: string;  // hex-encoded Ed25519 private key
}

export interface SessionKey {
    encryptedKey: string;
    signature: string;
    version: number;
    expiresAt: string;
}

/**
 * Generate Ed25519 key pair for client
 * Uses Web Crypto API for secure key generation
 */
export async function generateClientKeyPair(): Promise<ClientKeyPair> {
    try {
        // Generate Ed25519 key pair
        const keyPair = await crypto.subtle.generateKey(
            {
                name: 'Ed25519',
            },
            true, // extractable
            ['sign', 'verify']
        );

        // Export keys
        const publicKeyBuffer = await crypto.subtle.exportKey('raw', keyPair.publicKey);
        const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

        // Convert to hex
        const publicKey = bufferToHex(publicKeyBuffer);
        const privateKey = bufferToHex(privateKeyBuffer);

        return { publicKey, privateKey };
    } catch (error) {
        console.error('Ed25519 key generation failed:', error);
        throw new Error('Failed to generate client key pair');
    }
}

/**
 * Sign data with client's private Ed25519 key
 */
export async function signData(data: string, privateKeyHex: string): Promise<string> {
    try {
        const privateKeyBuffer = hexToBuffer(privateKeyHex);
        const dataBuffer = new TextEncoder().encode(data);

        // Import private key
        const privateKey = await crypto.subtle.importKey(
            'pkcs8',
            privateKeyBuffer,
            {
                name: 'Ed25519',
            },
            false,
            ['sign']
        );

        // Sign
        const signature = await crypto.subtle.sign(
            {
                name: 'Ed25519',
            },
            privateKey,
            dataBuffer
        );

        return bufferToHex(signature);
    } catch (error) {
        console.error('Signing failed:', error);
        throw new Error('Failed to sign data');
    }
}

/**
 * Verify signature with public Ed25519 key
 */
export async function verifySignature(
    data: string,
    signatureHex: string,
    publicKeyHex: string
): Promise<boolean> {
    try {
        const publicKeyBuffer = hexToBuffer(publicKeyHex);
        const signatureBuffer = hexToBuffer(signatureHex);
        const dataBuffer = new TextEncoder().encode(data);

        // Import public key
        const publicKey = await crypto.subtle.importKey(
            'raw',
            publicKeyBuffer,
            {
                name: 'Ed25519',
            },
            false,
            ['verify']
        );

        // Verify
        return await crypto.subtle.verify(
            {
                name: 'Ed25519',
            },
            publicKey,
            signatureBuffer,
            dataBuffer
        );
    } catch (error) {
        console.error('Verification failed:', error);
        return false;
    }
}

/**
 * Encrypt data with AES-256-GCM session key
 */
export async function encryptWithSessionKey(data: string, sessionKeyHex: string): Promise<string> {
    try {
        const keyBuffer = hexToBuffer(sessionKeyHex);
        const dataBuffer = new TextEncoder().encode(data);

        // Import AES key
        const key = await crypto.subtle.importKey(
            'raw',
            keyBuffer,
            { name: 'AES-GCM' },
            false,
            ['encrypt']
        );

        // Generate IV
        const iv = crypto.getRandomValues(new Uint8Array(12));

        // Encrypt
        const encrypted = await crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv: iv,
            },
            key,
            dataBuffer
        );

        // Combine IV + ciphertext
        const combined = new Uint8Array(iv.length + encrypted.byteLength);
        combined.set(iv, 0);
        combined.set(new Uint8Array(encrypted), iv.length);

        return bufferToHex(combined);
    } catch (error) {
        console.error('Encryption failed:', error);
        throw new Error('Failed to encrypt data');
    }
}

/**
 * Decrypt data with AES-256-GCM session key
 */
export async function decryptWithSessionKey(encryptedHex: string, sessionKeyHex: string): Promise<string> {
    try {
        const keyBuffer = hexToBuffer(sessionKeyHex);
        const combined = hexToBuffer(encryptedHex);

        // Extract IV and ciphertext
        const iv = combined.slice(0, 12);
        const ciphertext = combined.slice(12);

        // Import AES key
        const key = await crypto.subtle.importKey(
            'raw',
            keyBuffer,
            { name: 'AES-GCM' },
            false,
            ['decrypt']
        );

        // Decrypt
        const decrypted = await crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: iv,
            },
            key,
            ciphertext
        );

        return new TextDecoder().decode(decrypted);
    } catch (error) {
        console.error('Decryption failed:', error);
        throw new Error('Failed to decrypt data');
    }
}

/**
 * Store client key pair securely in localStorage
 * Note: In production, consider using IndexedDB or a more secure storage method
 */
export function storeClientKeyPair(keyPair: ClientKeyPair): void {
    try {
        localStorage.setItem('client_keypair', JSON.stringify(keyPair));
    } catch (error) {
        console.error('Failed to store key pair:', error);
    }
}

/**
 * Retrieve client key pair from localStorage
 */
export function getClientKeyPair(): ClientKeyPair | null {
    try {
        const stored = localStorage.getItem('client_keypair');
        if (!stored) return null;
        return JSON.parse(stored) as ClientKeyPair;
    } catch (error) {
        console.error('Failed to retrieve key pair:', error);
        return null;
    }
}

/**
 * Store session key from server
 */
export function storeSessionKey(sessionKey: SessionKey): void {
    try {
        localStorage.setItem('session_key', JSON.stringify(sessionKey));
    } catch (error) {
        console.error('Failed to store session key:', error);
    }
}

/**
 * Retrieve session key
 */
export function getSessionKey(): SessionKey | null {
    try {
        const stored = localStorage.getItem('session_key');
        if (!stored) return null;
        const sessionKey = JSON.parse(stored) as SessionKey;

        // Check if expired
        if (new Date(sessionKey.expiresAt) < new Date()) {
            console.warn('Session key expired');
            return null;
        }

        return sessionKey;
    } catch (error) {
        console.error('Failed to retrieve session key:', error);
        return null;
    }
}

// Helper functions
function bufferToHex(buffer: ArrayBuffer): string {
    return Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

function hexToBuffer(hex: string): ArrayBuffer {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes.buffer;
}
