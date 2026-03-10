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

        return bufferToHex(combined.buffer);
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

// ---------------------------------------------------------------------------
// TOTP-backed private key protection
// ---------------------------------------------------------------------------
// The TOTP secret (base32 string from the authenticator app) is used as key
// material to derive an AES-256 key via HKDF-SHA-256.  The Ed25519 private
// key is encrypted with that AES key and stored in localStorage.
// Decryption requires a valid OTP code; the server verifies the code and
// returns the raw TOTP secret only on success.
// ---------------------------------------------------------------------------

const TOTP_KEY_STORAGE = 'client_private_key_enc';
const TOTP_PUBKEY_STORAGE = 'client_public_key';

/**
 * Derive a 256-bit AES-GCM key from a base32 TOTP secret using HKDF-SHA-256.
 */
async function deriveAESKeyFromTOTPSecret(totpSecretBase32: string): Promise<CryptoKey> {
    // Decode base32 → raw bytes
    const secretBytes = base32ToBytes(totpSecretBase32);

    // Import as raw key material
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        secretBytes.buffer as ArrayBuffer,
        { name: 'HKDF' },
        false,
        ['deriveKey']
    );

    // Derive AES-256-GCM key
    return crypto.subtle.deriveKey(
        {
            name: 'HKDF',
            hash: 'SHA-256',
            salt: new TextEncoder().encode('fedinet-private-key-v1'),
            info: new TextEncoder().encode('client-ed25519-private-key'),
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Encrypt the Ed25519 private key with a key derived from the TOTP secret.
 * Returns a hex string (IV ++ ciphertext) safe to persist in localStorage.
 */
export async function encryptPrivateKeyWithTOTPSecret(
    privateKeyHex: string,
    totpSecretBase32: string
): Promise<string> {
    const aesKey = await deriveAESKeyFromTOTPSecret(totpSecretBase32);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const plaintext = hexToBuffer(privateKeyHex);

    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        aesKey,
        plaintext
    );

    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.length);
    return bufferToHex(combined.buffer);
}

/**
 * Decrypt the Ed25519 private key using the TOTP secret returned by the server
 * after successful OTP verification.
 */
export async function decryptPrivateKeyWithTOTPSecret(
    encryptedHex: string,
    totpSecretBase32: string
): Promise<string> {
    const aesKey = await deriveAESKeyFromTOTPSecret(totpSecretBase32);
    const combined = new Uint8Array(hexToBuffer(encryptedHex));
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    const plaintext = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        aesKey,
        ciphertext
    );
    return bufferToHex(plaintext);
}

/**
 * Store the TOTP-encrypted private key and public key in localStorage.
 * Call this after TOTP setup is confirmed.
 */
export function storeTOTPProtectedKeyPair(publicKeyHex: string, encryptedPrivateKeyHex: string): void {
    localStorage.setItem(TOTP_PUBKEY_STORAGE, publicKeyHex);
    localStorage.setItem(TOTP_KEY_STORAGE, encryptedPrivateKeyHex);
}

/** Returns the encrypted private key blob from localStorage, or null. */
export function getEncryptedPrivateKey(): string | null {
    return localStorage.getItem(TOTP_KEY_STORAGE);
}

/** Returns the stored public key from localStorage, or null. */
export function getStoredPublicKey(): string | null {
    return localStorage.getItem(TOTP_PUBKEY_STORAGE);
}

/** Remove the TOTP-protected key pair (e.g. on logout or TOTP disable). */
export function clearTOTPProtectedKeyPair(): void {
    localStorage.removeItem(TOTP_KEY_STORAGE);
    localStorage.removeItem(TOTP_PUBKEY_STORAGE);
}

// ---------------------------------------------------------------------------
// Minimal base32 decoder (RFC 4648, no padding required)
// Handles the upper-case base32 alphabet used by TOTP secrets.
// ---------------------------------------------------------------------------
function base32ToBytes(base32: string): Uint8Array {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const cleaned = base32.toUpperCase().replace(/=+$/, '');
    let bits = 0;
    let value = 0;
    const output: number[] = [];

    for (const char of cleaned) {
        const idx = alphabet.indexOf(char);
        if (idx === -1) continue; // skip padding / whitespace
        value = (value << 5) | idx;
        bits += 5;
        if (bits >= 8) {
            output.push((value >>> (bits - 8)) & 0xff);
            bits -= 8;
        }
    }
    return new Uint8Array(output);
}
