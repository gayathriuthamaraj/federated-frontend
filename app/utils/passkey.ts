/**
 * Browser-side WebAuthn (Passkey) utilities.
 *
 * The go-webauthn library sends/receives credentials encoded as base64url strings.
 * The browser WebAuthn API uses ArrayBuffers.  This file handles both directions.
 */

// ── Base64URL encoding helpers ─────────────────────────────────────────────

export function base64urlToBuffer(b64url: string): ArrayBuffer {
    const base64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
}

export function bufferToBase64url(buf: ArrayBuffer | null | undefined): string {
    if (!buf) return "";
    const bytes = new Uint8Array(buf);
    let str = "";
    for (const b of bytes) str += String.fromCharCode(b);
    return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

// ── Convert server options → browser-ready format ─────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function prepareCreationOptions(raw: any): PublicKeyCredentialCreationOptions {
    const pk = raw.publicKey;
    return {
        ...pk,
        challenge: base64urlToBuffer(pk.challenge),
        user: {
            ...pk.user,
            id: base64urlToBuffer(pk.user.id),
        },
        excludeCredentials: (pk.excludeCredentials || []).map(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (c: any) => ({ ...c, id: base64urlToBuffer(c.id) })
        ),
    };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function prepareAssertionOptions(raw: any): PublicKeyCredentialRequestOptions {
    const pk = raw.publicKey;
    return {
        ...pk,
        challenge: base64urlToBuffer(pk.challenge),
        allowCredentials: (pk.allowCredentials || []).map(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (c: any) => ({ ...c, id: base64urlToBuffer(c.id) })
        ),
    };
}

// ── Serialize browser credential → JSON for the server ────────────────────

function serializeCreationCredential(cred: PublicKeyCredential): unknown {
    const resp = cred.response as AuthenticatorAttestationResponse;
    return {
        id: cred.id,
        rawId: bufferToBase64url(cred.rawId),
        response: {
            clientDataJSON: bufferToBase64url(resp.clientDataJSON),
            attestationObject: bufferToBase64url(resp.attestationObject),
        },
        type: cred.type,
    };
}

function serializeAssertionCredential(cred: PublicKeyCredential): unknown {
    const resp = cred.response as AuthenticatorAssertionResponse;
    return {
        id: cred.id,
        rawId: bufferToBase64url(cred.rawId),
        response: {
            clientDataJSON: bufferToBase64url(resp.clientDataJSON),
            authenticatorData: bufferToBase64url(resp.authenticatorData),
            signature: bufferToBase64url(resp.signature),
            userHandle: resp.userHandle ? bufferToBase64url(resp.userHandle) : null,
        },
        type: cred.type,
    };
}

// ── High-level API ─────────────────────────────────────────────────────────

/**
 * Register a new passkey for an already-authenticated user.
 *
 * @param serverURL  — base URL of the identity server (e.g. "http://localhost:8080")
 * @param token      — user's JWT access token
 * @returns          — resolves on success, rejects with Error on failure
 */
export async function registerPasskey(serverURL: string, token: string): Promise<void> {
    if (!window.PublicKeyCredential) {
        throw new Error("Passkeys are not supported by this browser.");
    }

    // 1. Begin registration — get challenge from server
    const beginRes = await fetch(`${serverURL}/passkey/register/begin`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
    });
    const beginData = await beginRes.json();
    if (!beginRes.ok) throw new Error(beginData.error ?? "Failed to begin passkey registration");

    const sessionId: string = beginData.session_id;
    const creationOptions = prepareCreationOptions(beginData.options);

    // 2. Create credential on device
    const credential = await navigator.credentials.create({ publicKey: creationOptions }) as PublicKeyCredential | null;
    if (!credential) throw new Error("Passkey creation was cancelled or failed.");

    // 3. Send to server to complete
    const completeRes = await fetch(
        `${serverURL}/passkey/register/complete?session_id=${sessionId}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(serializeCreationCredential(credential)),
        }
    );
    const completeData = await completeRes.json();
    if (!completeRes.ok) throw new Error(completeData.error ?? "Failed to complete passkey registration");
}

/**
 * Log in with a passkey.
 *
 * @param serverURL — base URL of the identity server
 * @param userId    — user ID to authenticate (e.g. "alice@server_a")
 * @returns         — { user_id, home_server, access_token, refresh_token }
 */
export async function loginWithPasskey(
    serverURL: string,
    userId: string
): Promise<{ user_id: string; home_server: string; access_token: string; refresh_token: string }> {
    if (!window.PublicKeyCredential) {
        throw new Error("Passkeys are not supported by this browser.");
    }

    // 1. Begin login
    const beginRes = await fetch(`${serverURL}/passkey/login/begin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
    });
    const beginData = await beginRes.json();
    if (!beginRes.ok) throw new Error(beginData.error ?? "Failed to begin passkey login");

    const sessionId: string = beginData.session_id;
    const assertionOptions = prepareAssertionOptions(beginData.options);

    // 2. Get credential from device
    const credential = await navigator.credentials.get({ publicKey: assertionOptions }) as PublicKeyCredential | null;
    if (!credential) throw new Error("Passkey authentication was cancelled.");

    // 3. Verify on server
    const completeRes = await fetch(
        `${serverURL}/passkey/login/complete?session_id=${sessionId}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(serializeAssertionCredential(credential)),
        }
    );
    const completeData = await completeRes.json();
    if (!completeRes.ok) throw new Error(completeData.error ?? "Passkey verification failed");

    return completeData;
}

/**
 * Recover account via TOTP + recovery key, then re-enroll a new passkey.
 *
 * @param serverURL   — base URL of the identity server
 * @param userId      — e.g. "alice@server_a"
 * @param totpCode    — 6-digit authenticator code
 * @param recoveryKey — recovery key issued at registration
 * @returns           — { user_id, home_server, access_token, refresh_token, new_recovery_key }
 */
export async function recoverWithPasskey(
    serverURL: string,
    userId: string,
    totpCode: string,
    recoveryKey: string
): Promise<{
    user_id: string;
    home_server: string;
    access_token: string;
    refresh_token: string;
    new_recovery_key: string;
}> {
    if (!window.PublicKeyCredential) {
        throw new Error("Passkeys are not supported by this browser.");
    }

    // 1. Verify both factors, get registration challenge
    const beginRes = await fetch(`${serverURL}/passkey/recover/begin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, totp_code: totpCode, recovery_key: recoveryKey }),
    });
    const beginData = await beginRes.json();
    if (!beginRes.ok) throw new Error(beginData.error ?? "Recovery verification failed");

    const sessionId: string = beginData.session_id;
    const creationOptions = prepareCreationOptions(beginData.options);

    // 2. Create new passkey on device
    const credential = await navigator.credentials.create({ publicKey: creationOptions }) as PublicKeyCredential | null;
    if (!credential) throw new Error("Passkey creation was cancelled.");

    // 3. Complete recovery — revokes old passkeys, stores new one, rotates recovery key
    const completeRes = await fetch(
        `${serverURL}/passkey/recover/complete?session_id=${sessionId}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(serializeCreationCredential(credential)),
        }
    );
    const completeData = await completeRes.json();
    if (!completeRes.ok) throw new Error(completeData.error ?? "Recovery completion failed");

    return completeData;
}

/** Check if passkeys are supported in this browser. */
export function isPasskeySupported(): boolean {
    return typeof window !== "undefined" && !!window.PublicKeyCredential;
}
