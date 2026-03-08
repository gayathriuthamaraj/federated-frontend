"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import OTPInput from "../components/OTPInput";
import {
    generateClientKeyPair,
    encryptPrivateKeyWithTOTPSecret,
    storeTOTPProtectedKeyPair,
    clearTOTPProtectedKeyPair,
    getEncryptedPrivateKey,
    getStoredPublicKey,
} from "../utils/crypto";
import { useTOTPUnlock } from "../utils/useTOTPUnlock";

type SetupStep = "idle" | "qr" | "confirm" | "done";

export default function SettingsPage() {
    const { identity } = useAuth();
    const router = useRouter();

    const [totpEnabled, setTotpEnabled] = useState<boolean | null>(null);
    const [setupStep, setSetupStep] = useState<SetupStep>("idle");
    const [qrDataURL, setQrDataURL] = useState<string>("");
    const [totpSecret, setTotpSecret] = useState<string>("");
    const [error, setError] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [unlockResult, setUnlockResult] = useState<"success" | "none" | null>(null);
    // ── auth guard ────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!identity) {
            router.push("/login");
        }
    }, [identity, router]);

    // ── fetch current TOTP status ─────────────────────────────────────────────
    useEffect(() => {
        if (!identity) return;
        const token = localStorage.getItem("access_token") ?? "";
        fetch(`${identity.home_server}/totp/status`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.json())
            .then((d) => setTotpEnabled(d.totp_enabled ?? false))
            .catch(() => setTotpEnabled(false));
    }, [identity]);

    if (!identity) return null;

    const token = () => localStorage.getItem("access_token") ?? "";

    const hasLocalKey = !!getEncryptedPrivateKey();

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { requestPrivateKey, unlockModal } = useTOTPUnlock({
        homeServer: identity.home_server,
        accessToken: token(),
    });

    async function handleTestUnlock() {
        setUnlockResult(null);
        const key = await requestPrivateKey();
        setUnlockResult(key ? "success" : "none");
        // Key stays only in memory for this instant – we don't store it
    }

    // ── Step 1: request a new TOTP secret from the server ────────────────────
    async function handleStartSetup() {
        setError("");
        setLoading(true);
        try {
            const res = await fetch(`${identity!.home_server}/totp/setup`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token()}`,
                },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Setup failed");

            setQrDataURL(data.qr_png);   // data:image/png;base64,…
            setTotpSecret(data.secret);  // raw base32 secret
            setSetupStep("qr");
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Setup failed');
        } finally {
            setLoading(false);
        }
    }

    // ── Step 2: user scans QR and enters the first OTP to confirm ────────────
    async function handleConfirmOTP(otp: string) {
        setError("");
        setLoading(true);
        try {
            // Generate a fresh Ed25519 keypair
            const keyPair = await generateClientKeyPair();

            // Encrypt the private key with the TOTP secret
            const encryptedPrivKey = await encryptPrivateKeyWithTOTPSecret(
                keyPair.privateKey,
                totpSecret
            );

            // Enable TOTP on the server and optionally back up the encrypted key
            const res = await fetch(`${identity!.home_server}/totp/enable`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token()}`,
                },
                body: JSON.stringify({
                    otp_code: otp,
                    client_private_key_enc: encryptedPrivKey,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Invalid OTP code");

            // Persist in localStorage (public key plain, private key encrypted)
            storeTOTPProtectedKeyPair(keyPair.publicKey, encryptedPrivKey);

            setTotpEnabled(true);
            setSetupStep("done");
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Invalid OTP code');
        } finally {
            setLoading(false);
        }
    }

    // ── Disable TOTP ─────────────────────────────────────────────────────────
    async function handleDisable(otp: string) {
        setError("");
        setLoading(true);
        try {
            const res = await fetch(`${identity!.home_server}/totp/disable`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token()}`,
                },
                body: JSON.stringify({ otp_code: otp }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Invalid OTP code");

            clearTOTPProtectedKeyPair();
            setTotpEnabled(false);
            setSetupStep("idle");
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Disable failed');
        } finally {
            setLoading(false);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <>
        <div className="max-w-2xl mx-auto p-6">
            {/* Header */}
            <div className="mb-6 flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="text-bat-gray hover:text-bat-yellow transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>
                <h1 className="text-2xl font-bold text-bat-gray">Settings</h1>
            </div>

            {/* Navigation links */}
            <nav className="mb-8 flex gap-4 border-b border-bat-gray/10 pb-4">
                <span className="text-bat-yellow font-semibold border-b-2 border-bat-yellow pb-1">
                    Security
                </span>
                <Link href="/settings/privacy" className="text-bat-gray hover:text-bat-yellow transition-colors">
                    Privacy
                </Link>
            </nav>

            {/* ── Authenticator-App Key Protection ────────────────────────── */}
            <section className="bg-bat-dark rounded-lg border border-bat-gray/10 p-6 mb-6">
                <h2 className="text-lg font-bold text-bat-gray mb-1">
                    Authenticator App (Private Key Protection)
                </h2>
                <p className="text-sm text-bat-gray/60 mb-4">
                    Your Ed25519 signing key is encrypted and can only be unlocked by
                    providing a code from your authenticator app (Google Authenticator,
                    Authy, etc.).
                </p>

                {error && (
                    <div className="mb-4 p-3 rounded-md bg-red-900/20 border border-red-500/50 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {/* Status badge */}
                {totpEnabled !== null && (
                    <div className="mb-4">
                        <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                                totpEnabled
                                    ? "bg-green-900/30 text-green-400 border border-green-500/30"
                                    : "bg-bat-gray/10 text-bat-gray/60 border border-bat-gray/20"
                            }`}
                        >
                            <span className={`w-1.5 h-1.5 rounded-full ${totpEnabled ? "bg-green-400" : "bg-bat-gray/40"}`} />
                            {totpEnabled ? "Enabled" : "Disabled"}
                        </span>
                    </div>
                )}

                {/* ── IDLE: not yet set up ─────────────────────────────── */}
                {!totpEnabled && setupStep === "idle" && (
                    <button
                        onClick={handleStartSetup}
                        disabled={loading}
                        className="px-4 py-2 bg-bat-yellow text-bat-black font-bold rounded-md hover:bg-yellow-400 disabled:opacity-50 transition-colors"
                    >
                        {loading ? "Generating…" : "Set up authenticator app"}
                    </button>
                )}

                {/* ── QR code display ──────────────────────────────────── */}
                {setupStep === "qr" && (
                    <div className="space-y-4">
                        <p className="text-sm text-bat-gray">
                            Scan this QR code with your authenticator app, then enter the
                            6-digit code below to confirm.
                        </p>
                        {qrDataURL && (
                            <div className="inline-block bg-white p-2 rounded-lg">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={qrDataURL} alt="TOTP QR code" width={200} height={200} />
                            </div>
                        )}
                        <p className="text-xs text-bat-gray/50 font-mono break-all">
                            Manual entry key: {totpSecret}
                        </p>
                        <div>
                            <p className="text-sm text-bat-gray mb-2">Enter the 6-digit code to confirm:</p>
                            <OTPInput
                                onComplete={handleConfirmOTP}
                                length={6}
                            />
                        </div>
                        {loading && <p className="text-sm text-bat-gray/60">Verifying…</p>}
                    </div>
                )}

                {/* ── Done ─────────────────────────────────────────────── */}
                {setupStep === "done" && (
                    <div className="p-4 rounded-md bg-green-900/20 border border-green-500/30 text-green-400 text-sm">
                        Authenticator app configured. Your private key is now encrypted and
                        protected by your authenticator app.
                    </div>
                )}

                {/* ── Disable (when already enabled) ───────────────────── */}
                {totpEnabled && setupStep !== "done" && (
                    <div className="mt-4 space-y-2">
                        <p className="text-sm text-bat-gray">
                            Enter your current authenticator code to disable:
                        </p>
                        <OTPInput
                            onComplete={handleDisable}
                            length={6}
                        />
                        {loading && <p className="text-sm text-bat-gray/60">Disabling…</p>}
                    </div>
                )}
            </section>
            {/* ── Unlock key (test / on-demand access) ───────────────── */}
            {totpEnabled && hasLocalKey && setupStep !== "done" && (
                <section className="bg-bat-dark rounded-lg border border-bat-gray/10 p-6">
                    <h2 className="text-lg font-bold text-bat-gray mb-1">
                        Unlock Private Key
                    </h2>
                    <p className="text-sm text-bat-gray/60 mb-4">
                        Verify your authenticator code to decrypt your signing key.
                        The key is only held in memory while it&apos;s needed — it
                        is never written back to storage.
                    </p>

                    {unlockResult === "success" && (
                        <div className="mb-4 p-3 rounded-md bg-green-900/20 border border-green-500/30 text-green-400 text-sm">
                            Key unlocked successfully. Your Ed25519 signing key is working correctly.
                        </div>
                    )}

                    {unlockResult === "none" && (
                        <div className="mb-4 p-3 rounded-md bg-bat-gray/10 border border-bat-gray/20 text-bat-gray/60 text-sm">
                            Unlock cancelled.
                        </div>
                    )}

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleTestUnlock}
                            className="px-4 py-2 bg-bat-yellow text-bat-black font-bold rounded-md hover:bg-yellow-400 transition-colors text-sm"
                        >
                            Unlock with authenticator code
                        </button>
                        {getStoredPublicKey() && (
                            <span className="text-xs text-bat-gray/40 font-mono">
                                pubkey: {getStoredPublicKey()!.slice(0, 12)}…
                            </span>
                        )}
                    </div>
                </section>
            )}
        </div>

        {/* Render the unlock modal at root level */}
        {unlockModal}
        </>
    );
}
