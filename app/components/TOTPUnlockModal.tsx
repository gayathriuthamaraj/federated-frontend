"use client";

import { useState } from "react";
import OTPInput from "./OTPInput";
import {
    getEncryptedPrivateKey,
    decryptPrivateKeyWithTOTPSecret,
} from "../utils/crypto";

interface TOTPUnlockModalProps {
    homeServer: string;
    accessToken: string;
    /** Called with the decrypted hex private key on success */
    onUnlocked: (privateKeyHex: string) => void;
    onCancel: () => void;
}

/**
 * Modal that prompts the user for their 6-digit authenticator code,
 * calls /totp/verify to receive the raw TOTP secret, then decrypts
 * the locally-stored private key.  The decrypted key is passed to
 * onUnlocked() and is never persisted.
 */
export default function TOTPUnlockModal({
    homeServer,
    accessToken,
    onUnlocked,
    onCancel,
}: TOTPUnlockModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleOTP(otp: string) {
        setError("");
        setLoading(true);
        try {
            // 1. Verify OTP with server → get raw TOTP secret
            const res = await fetch(`${homeServer}/totp/verify`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ otp_code: otp }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Invalid code");

            // 2. Retrieve encrypted key blob from localStorage
            const encryptedKey = getEncryptedPrivateKey();
            if (!encryptedKey) throw new Error(
                "No encrypted key found – please set up the authenticator app in Settings first."
            );

            // 3. Decrypt in-memory (key never re-stored)
            const privateKeyHex = await decryptPrivateKeyWithTOTPSecret(
                encryptedKey,
                data.totp_secret
            );

            onUnlocked(privateKeyHex);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Verification failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        /* Backdrop */
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
        >
            <div className="w-full max-w-sm rounded-xl bg-bat-dark border border-bat-gray/20 p-6 shadow-2xl">
                {/* Header */}
                <div className="mb-4">
                    <h2 className="text-lg font-bold text-bat-gray">
                        Unlock Private Key
                    </h2>
                    <p className="mt-1 text-sm text-bat-gray/60">
                        Enter the 6-digit code from your authenticator app to unlock
                        your signing key.
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-4 rounded-md bg-red-900/20 border border-red-500/40 px-3 py-2 text-sm text-red-400">
                        {error}
                    </div>
                )}

                {/* OTP input */}
                <div className="flex flex-col items-center gap-4">
                    {loading ? (
                        <p className="text-sm text-bat-gray/60">Verifying…</p>
                    ) : (
                        <OTPInput onComplete={handleOTP} length={6} />
                    )}
                </div>

                {/* Cancel */}
                <button
                    onClick={onCancel}
                    className="mt-6 w-full rounded-md border border-bat-gray/20 py-2 text-sm text-bat-gray/60 hover:text-bat-gray hover:border-bat-gray/40 transition-colors"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}
