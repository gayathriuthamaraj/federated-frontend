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
    signData,
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

    // ── TOTP backup codes ─────────────────────────────────────────────────────
    const [backupCodes, setBackupCodes] = useState<string[]>([]);
    const [backupCodesLoading, setBackupCodesLoading] = useState(false);

    // ── OTPInput reset keys (increment to clear boxes after a wrong code) ─────
    const [confirmOtpKey, setConfirmOtpKey] = useState(0);
    const [disableOtpKey, setDisableOtpKey] = useState(0);

    // ── ZKP state ─────────────────────────────────────────────────────────────
    const [zkpRegistered, setZkpRegistered] = useState<boolean>(false);
    const [zkpLastProved, setZkpLastProved] = useState<string | null>(null);
    const [zkpProofToken, setZkpProofToken] = useState<string>("");
    const [zkpVerifyInput, setZkpVerifyInput] = useState<string>("");
    const [zkpVerifyResult, setZkpVerifyResult] = useState<{ valid: boolean; user_id?: string; expires_at?: string } | null>(null);
    const [zkpError, setZkpError] = useState<string>("");
    const [zkpLoading, setZkpLoading] = useState(false);
    const [zkpCopied, setZkpCopied] = useState(false);
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

    // ── Fetch ZKP status on mount ─────────────────────────────────────────────
    useEffect(() => {
        if (!identity) return;
        fetch(`${identity.home_server}/zkp/status?user_id=${encodeURIComponent(identity.user_id)}`)
            .then(r => r.ok ? r.json() : null)
            .then(d => {
                if (!d) return;
                setZkpRegistered(d.zkp_enabled ?? false);
                setZkpLastProved(d.last_proved_at ?? null);
            })
            .catch(() => {});
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

    // ── ZKP: register current public key with server ──────────────────────────
    async function handleZKPRegister() {
        setZkpError(""); setZkpLoading(true);
        try {
            const pubKey = getStoredPublicKey();
            if (!pubKey) throw new Error("No local key pair found. Enable TOTP first to generate a key pair.");
            const res = await fetch(`${identity!.home_server}/zkp/register-key`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
                body: JSON.stringify({ zkp_public_key: pubKey }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Registration failed");
            setZkpRegistered(true);
        } catch (e: unknown) {
            setZkpError(e instanceof Error ? e.message : "Registration failed");
        } finally {
            setZkpLoading(false);
        }
    }

    // ── ZKP: obtain challenge → sign → get proof token ────────────────────────
    async function handleZKPGenerateProof() {
        setZkpError(""); setZkpProofToken(""); setZkpLoading(true);
        try {
            if (!zkpRegistered) throw new Error("Enable ZKP first by registering your key.");

            // Unlock the private key via TOTP
            const privateKeyHex = await requestPrivateKey();
            if (!privateKeyHex) throw new Error("TOTP unlock cancelled.");

            // Get a challenge
            const chalRes = await fetch(`${identity!.home_server}/zkp/challenge`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token()}` },
            });
            const chalData = await chalRes.json();
            if (!chalRes.ok) throw new Error(chalData.error ?? "Failed to get challenge");

            // Sign the challenge message
            const message = `zkp-challenge:${chalData.challenge}:user:${identity!.user_id}`;
            const userSig = await signData(message, privateKeyHex);

            // Submit proof
            const proveRes = await fetch(`${identity!.home_server}/zkp/prove`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
                body: JSON.stringify({ challenge_id: chalData.challenge_id, user_sig: userSig }),
            });
            const proveData = await proveRes.json();
            if (!proveRes.ok) throw new Error(proveData.error ?? "Proof failed");

            setZkpProofToken(proveData.proof_token);
            setZkpLastProved(new Date().toISOString());
        } catch (e: unknown) {
            setZkpError(e instanceof Error ? e.message : "Proof generation failed");
        } finally {
            setZkpLoading(false);
        }
    }

    // ── ZKP: verify a proof token ─────────────────────────────────────────────
    async function handleZKPVerifyToken() {
        setZkpError(""); setZkpVerifyResult(null); setZkpLoading(true);
        try {
            const res = await fetch(`${identity!.home_server}/zkp/verify-token`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ proof_token: zkpVerifyInput.trim() }),
            });
            const data = await res.json();
            if (!res.ok) {
                setZkpVerifyResult({ valid: false });
                setZkpError(data.error ?? "Invalid token");
            } else {
                setZkpVerifyResult(data);
            }
        } catch (e: unknown) {
            setZkpError(e instanceof Error ? e.message : "Verification failed");
        } finally {
            setZkpLoading(false);
        }
    }

    // ── Backup codes: generate/regenerate ─────────────────────────────────────
    async function handleGenerateBackupCodes() {
        setBackupCodesLoading(true);
        try {
            const res = await fetch(`${identity!.home_server}/totp/backup-codes/generate`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token()}` },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Failed to generate backup codes");
            setBackupCodes(data.backup_codes ?? []);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Failed to generate backup codes");
        } finally {
            setBackupCodesLoading(false);
        }
    }

    function handleDownloadBackupCodes() {
        const text = [
            "Federated Social Network – TOTP Backup Recovery Codes",
            `Account: ${identity!.user_id}`,
            `Generated: ${new Date().toLocaleString()}`,
            "",
            "Each code can only be used ONCE.",
            "Store this file somewhere safe (offline password manager, printed copy, etc.).",
            "",
            ...backupCodes.map((c, i) => `  ${i + 1}. ${c}`),
            "",
            "These codes expire when you disable or reset your authenticator app.",
        ].join("\n");
        const blob = new Blob([text], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "totp-backup-codes.txt";
        a.click();
        URL.revokeObjectURL(url);
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
            // Immediately generate backup codes now that TOTP is enabled
            // (runs async, result populates backupCodes state for display below)
            handleGenerateBackupCodes();
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Invalid OTP code');
            setConfirmOtpKey(k => k + 1);
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
            setDisableOtpKey(k => k + 1);
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
                            <div className="inline-block bg-white p-3 rounded-lg">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={qrDataURL} alt="TOTP QR code" width={256} height={256} style={{imageRendering: "pixelated"}} />
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
                                resetKey={confirmOtpKey}
                            />
                        </div>
                        {loading && <p className="text-sm text-bat-gray/60">Verifying…</p>}
                    </div>
                )}

                {/* ── Done ─────────────────────────────────────────────── */}
                {setupStep === "done" && (
                    <div className="space-y-4">
                        <div className="p-4 rounded-md bg-green-900/20 border border-green-500/30 text-green-400 text-sm">
                            Authenticator app configured. Your private key is now encrypted and
                            protected by your authenticator app.
                        </div>

                        {/* Backup codes section */}
                        {backupCodesLoading ? (
                            <p className="text-sm text-bat-gray/60">Generating backup codes…</p>
                        ) : backupCodes.length > 0 && (
                            <div className="space-y-3">
                                {/* Warning banner */}
                                <div className="p-4 rounded-md bg-yellow-900/20 border border-yellow-500/40 text-yellow-400 text-sm space-y-1">
                                    <p className="font-bold">⚠ Save your backup codes</p>
                                    <p className="text-yellow-400/80">
                                        If you lose your authenticator device, these codes are the{" "}
                                        <strong>only way</strong> to recover access to your account.
                                        Each code can only be used once.
                                    </p>
                                </div>

                                {/* Codes grid */}
                                <div className="grid grid-cols-2 gap-2">
                                    {backupCodes.map((code, i) => (
                                        <div
                                            key={i}
                                            className="font-mono text-sm px-3 py-2 rounded bg-bat-gray/10 border border-bat-gray/20 text-bat-gray text-center tracking-widest"
                                        >
                                            {code}
                                        </div>
                                    ))}
                                </div>

                                {/* Action buttons */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleDownloadBackupCodes}
                                        className="px-4 py-2 bg-bat-yellow text-bat-black font-bold rounded-md hover:bg-yellow-400 transition-colors text-sm"
                                    >
                                        Download codes
                                    </button>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(backupCodes.join("\n"))}
                                        className="px-4 py-2 bg-bat-gray/20 hover:bg-bat-gray/30 text-bat-gray font-bold rounded-md transition-colors text-sm"
                                    >
                                        Copy all
                                    </button>
                                </div>
                            </div>
                        )}
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
                            resetKey={disableOtpKey}
                        />
                        {loading && <p className="text-sm text-bat-gray/60">Disabling…</p>}
                    </div>
                )}

                {/* ── Regenerate backup codes (already enabled) ────────── */}
                {totpEnabled && setupStep !== "done" && (
                    <div className="mt-6 border-t border-bat-gray/10 pt-4 space-y-3">
                        <div>
                            <p className="text-sm font-semibold text-bat-gray">Backup Recovery Codes</p>
                            <p className="text-xs text-bat-gray/50 mt-0.5">
                                Generate fresh one-time recovery codes. Old codes will be invalidated.
                            </p>
                        </div>
                        <button
                            onClick={handleGenerateBackupCodes}
                            disabled={backupCodesLoading}
                            className="px-4 py-2 bg-bat-gray/20 hover:bg-bat-gray/30 text-bat-gray font-bold rounded-md transition-colors text-sm disabled:opacity-50"
                        >
                            {backupCodesLoading ? "Generating…" : "Regenerate backup codes"}
                        </button>

                        {backupCodes.length > 0 && (
                            <div className="space-y-3">
                                <div className="p-3 rounded-md bg-yellow-900/20 border border-yellow-500/40 text-yellow-400 text-xs">
                                    ⚠ New codes generated — your previous codes are now invalid. Save these immediately.
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {backupCodes.map((code, i) => (
                                        <div
                                            key={i}
                                            className="font-mono text-sm px-3 py-2 rounded bg-bat-gray/10 border border-bat-gray/20 text-bat-gray text-center tracking-widest"
                                        >
                                            {code}
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleDownloadBackupCodes}
                                        className="px-4 py-2 bg-bat-yellow text-bat-black font-bold rounded-md hover:bg-yellow-400 transition-colors text-sm"
                                    >
                                        Download codes
                                    </button>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(backupCodes.join("\n"))}
                                        className="px-4 py-2 bg-bat-gray/20 hover:bg-bat-gray/30 text-bat-gray font-bold rounded-md transition-colors text-sm"
                                    >
                                        Copy all
                                    </button>
                                </div>
                            </div>
                        )}
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

        {/* ── Zero-Knowledge Identity Verification ─────────────────────────── */}
        <div className="max-w-2xl mx-auto px-6 pb-6">
            <section className="bg-bat-dark rounded-lg border border-bat-gray/10 p-6 mb-6">
                <h2 className="text-lg font-bold text-bat-gray mb-1 flex items-center gap-2">
                    <span>🛡</span> Zero-Knowledge Identity Verification
                    {zkpRegistered && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20">
                            ✓ Active
                        </span>
                    )}
                </h2>
                <p className="text-sm text-bat-gray/60 mb-4">
                    Prove you own your account to anyone — without revealing your password or any personal data.
                    Uses your Ed25519 client key (requires TOTP to be set up first).
                    {zkpLastProved && (
                        <span className="block mt-1 text-bat-gray/40 text-xs">
                            Last proved: {new Date(zkpLastProved).toLocaleString()}
                        </span>
                    )}
                </p>

                {zkpError && (
                    <div className="mb-4 p-3 rounded-md bg-red-900/20 border border-red-500/50 text-red-400 text-sm">
                        {zkpError}
                    </div>
                )}

                {/* Step 1 — register key */}
                {!zkpRegistered && (
                    <div className="mb-5">
                        <p className="text-sm text-bat-gray/50 mb-3">
                            {!getStoredPublicKey()
                                ? "⚠ No local key found. Set up your Authenticator App above first."
                                : "Register your public key to enable ZKP proofs."}
                        </p>
                        <button
                            onClick={handleZKPRegister}
                            disabled={zkpLoading || !getStoredPublicKey()}
                            className="px-4 py-2 bg-bat-yellow text-bat-black font-bold rounded-md hover:bg-yellow-400 transition-colors text-sm disabled:opacity-50"
                        >
                            {zkpLoading ? "Registering…" : "Enable Zero-Knowledge Verification"}
                        </button>
                    </div>
                )}

                {/* Step 2 — generate proof */}
                {zkpRegistered && (
                    <div className="mb-5">
                        <button
                            onClick={handleZKPGenerateProof}
                            disabled={zkpLoading}
                            className="px-4 py-2 bg-bat-yellow text-bat-black font-bold rounded-md hover:bg-yellow-400 transition-colors text-sm disabled:opacity-50"
                        >
                            {zkpLoading ? "Generating…" : "Generate Proof Token"}
                        </button>
                        <p className="text-xs text-bat-gray/40 mt-1">
                            Requires your authenticator code. The token proves your identity for 1 hour.
                        </p>
                    </div>
                )}

                {/* Proof token display */}
                {zkpProofToken && (
                    <div className="mb-5 p-3 rounded bg-bat-gray/5 border border-bat-gray/20">
                        <p className="text-xs text-bat-gray/50 mb-1 font-medium">Your proof token (share with anyone to verify you):</p>
                        <textarea
                            readOnly
                            value={zkpProofToken}
                            rows={3}
                            className="w-full text-xs font-mono bg-transparent text-bat-gray/70 resize-none outline-none border-none"
                        />
                        <button
                            onClick={() => { navigator.clipboard.writeText(zkpProofToken); setZkpCopied(true); setTimeout(() => setZkpCopied(false), 2000); }}
                            className="mt-2 px-3 py-1 text-xs rounded bg-bat-gray/10 hover:bg-bat-gray/20 text-bat-gray/70 transition-colors"
                        >
                            {zkpCopied ? "✓ Copied!" : "Copy token"}
                        </button>
                    </div>
                )}

                {/* Verify someone else's token */}
                <div className="border-t border-bat-gray/10 pt-4 mt-4">
                    <p className="text-sm text-bat-gray/60 mb-2 font-medium">Verify someone&apos;s proof token:</p>
                    <textarea
                        value={zkpVerifyInput}
                        onChange={e => setZkpVerifyInput(e.target.value)}
                        rows={3}
                        placeholder="Paste proof token here…"
                        className="w-full text-xs font-mono bg-bat-gray/5 border border-bat-gray/20 rounded p-2 text-bat-gray/70 resize-none outline-none focus:border-bat-yellow/40 transition-colors"
                    />
                    <button
                        onClick={handleZKPVerifyToken}
                        disabled={zkpLoading || !zkpVerifyInput.trim()}
                        className="mt-2 px-4 py-2 bg-bat-gray/20 hover:bg-bat-gray/30 text-bat-gray font-bold rounded-md transition-colors text-sm disabled:opacity-50"
                    >
                        Verify Token
                    </button>
                    {zkpVerifyResult && (
                        <div className={`mt-3 p-3 rounded border text-sm ${zkpVerifyResult.valid ? "bg-green-900/20 border-green-500/30 text-green-400" : "bg-red-900/20 border-red-500/30 text-red-400"}`}>
                            {zkpVerifyResult.valid ? (
                                <>
                                    <span className="font-bold">✓ Valid proof</span>
                                    {zkpVerifyResult.user_id && <span className="ml-2 font-mono text-xs">{zkpVerifyResult.user_id}</span>}
                                    {zkpVerifyResult.expires_at && <span className="text-xs text-bat-gray/40 block mt-0.5">Expires: {new Date(zkpVerifyResult.expires_at).toLocaleString()}</span>}
                                </>
                            ) : (
                                <span className="font-bold">✗ Invalid or expired proof</span>
                            )}
                        </div>
                    )}
                </div>
            </section>
        </div>

        {/* Render the unlock modal at root level */}
        {unlockModal}
        </>
    );
}
