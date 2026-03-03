"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";

function getStoredToken(): string {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("access_token") ?? "";
}

import {
    fetchPrivacySettings,
    savePrivacySettings,
    defaultPrivacySettings,
    PrivacySettings,
} from "../../api/privacy";

// ── helpers ───────────────────────────────────────────────────────────────────

type SearchOption = { value: string; label: string; desc: string };
type VisOption = { value: string; label: string; desc: string };

const SEARCH_OPTIONS: SearchOption[] = [
    { value: "everyone", label: "Everyone", desc: "Anyone can find you in search" },
    { value: "hidden", label: "Hidden", desc: "You won't appear in search results" },
];

const VIS_OPTIONS: VisOption[] = [
    { value: "public", label: "Public", desc: "Visible to everyone, no account needed" },
    { value: "followers", label: "Followers only", desc: "Only people who follow you can see this" },
    { value: "private", label: "Private", desc: "Only you can see this" },
];

// ── sub-components ────────────────────────────────────────────────────────────

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
    return (
        <div className="mb-4">
            <h2 className="text-bat-yellow font-bold text-base tracking-wide uppercase">{title}</h2>
            {subtitle && <p className="text-bat-gray/50 text-sm mt-0.5">{subtitle}</p>}
        </div>
    );
}

function RadioGroup<T extends string>({
    value,
    onChange,
    options,
    disabled,
}: {
    value: T;
    onChange: (v: T) => void;
    options: { value: string; label: string; desc: string }[];
    disabled?: boolean;
}) {
    return (
        <div className="flex flex-col gap-2">
            {options.map((opt) => {
                const active = value === opt.value;
                return (
                    <button
                        key={opt.value}
                        type="button"
                        disabled={disabled}
                        onClick={() => onChange(opt.value as T)}
                        className={`
                            w-full flex items-start gap-3 px-4 py-3 rounded-lg border text-left transition-all duration-150
                            ${active
                                ? "border-bat-yellow bg-bat-yellow/10 text-bat-yellow"
                                : "border-bat-gray/20 bg-bat-dark/30 text-bat-gray hover:border-bat-gray/40 hover:bg-bat-dark/50"
                            }
                            ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                        `}
                    >
                        {/* Radio dot */}
                        <span className={`mt-0.5 h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center
                            ${active ? "border-bat-yellow" : "border-bat-gray/40"}`}>
                            {active && <span className="h-2 w-2 rounded-full bg-bat-yellow" />}
                        </span>
                        <span>
                            <span className="block font-semibold text-sm">{opt.label}</span>
                            <span className="block text-xs opacity-60 mt-0.5">{opt.desc}</span>
                        </span>
                    </button>
                );
            })}
        </div>
    );
}

function SettingGroup({
    label,
    value,
    onChange,
    options,
    saving,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string; desc: string }[];
    saving: boolean;
}) {
    return (
        <div className="border border-bat-gray/10 rounded-xl bg-bat-dark/20 p-4">
            <p className="text-bat-gray text-sm font-medium mb-3">{label}</p>
            <RadioGroup value={value} onChange={onChange} options={options} disabled={saving} />
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PrivacySettingsPage() {
    const router = useRouter();
    const { identity, isLoading: authLoading } = useAuth();

    const [settings, setSettings] = useState<PrivacySettings>(defaultPrivacySettings());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Redirect if not logged in
    useEffect(() => {
        if (!authLoading && !identity) router.replace("/login");
    }, [authLoading, identity, router]);

    // Load current settings
    useEffect(() => {
        if (authLoading || !identity) return;

        const token = getStoredToken();

        fetchPrivacySettings(identity.home_server, token)
            .then((s) => {
                setSettings(s);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message ?? "Failed to load settings");
                setLoading(false);
            });
    }, [authLoading, identity]);

    const set = <K extends keyof PrivacySettings>(key: K, value: PrivacySettings[K]) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
        setSaved(false);
    };

    const handleSave = async () => {
        if (!identity) return;
        setSaving(true);
        setError(null);
        setSaved(false);

        try {
            const token = getStoredToken();

            await savePrivacySettings(identity.home_server, token, settings);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-bat-black">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bat-yellow" />
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-bat-black text-bat-gray">
            {/* Top bar */}
            <div className="sticky top-0 z-10 flex items-center gap-4 px-4 py-3 border-b border-bat-gray/10 bg-bat-black/95 backdrop-blur">
                <Link
                    href="/profile"
                    className="text-bat-gray/60 hover:text-bat-yellow transition-colors p-1"
                    aria-label="Back to profile"
                >
                    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                        <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                    </svg>
                </Link>
                <div className="flex-1">
                    <h1 className="text-bat-gray font-bold text-lg leading-none">Privacy</h1>
                    <p className="text-bat-gray/40 text-xs mt-0.5">Control who can find and see your content</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`
                        px-5 py-2 rounded-lg font-bold text-sm transition-all duration-150
                        ${saving
                            ? "bg-bat-yellow/50 text-bat-black cursor-not-allowed"
                            : "bg-bat-yellow text-bat-black hover:bg-bat-yellow/90"
                        }
                    `}
                >
                    {saving ? "Saving…" : saved ? "✓ Saved" : "Save"}
                </button>
            </div>

            {/* Error banner */}
            {error && (
                <div className="mx-4 mt-4 px-4 py-3 rounded-lg bg-red-900/30 border border-red-500/40 text-red-400 text-sm">
                    {error}
                </div>
            )}

            <div className="max-w-xl mx-auto px-4 pb-16 pt-6 space-y-10">

                {/* ── DISCOVERABILITY ─────────────────────────────────── */}
                <section>
                    <SectionTitle
                        title="Discoverability"
                        subtitle="Choose whether other users can find your account in search"
                    />
                    <div className="space-y-4">
                        <SettingGroup
                            label="Same-server search"
                            value={settings.search_local}
                            onChange={(v) => set("search_local", v)}
                            options={SEARCH_OPTIONS}
                            saving={saving}
                        />
                        <SettingGroup
                            label="Cross-server (federated) search"
                            value={settings.search_federated}
                            onChange={(v) => set("search_federated", v)}
                            options={SEARCH_OPTIONS}
                            saving={saving}
                        />
                    </div>
                </section>

                {/* ── CONTENT VISIBILITY ──────────────────────────────── */}
                <section>
                    <SectionTitle
                        title="Content visibility"
                        subtitle="Control what visitors see before and after they follow you"
                    />
                    <div className="space-y-4">
                        <SettingGroup
                            label="Posts"
                            value={settings.posts_visibility}
                            onChange={(v) => set("posts_visibility", v)}
                            options={VIS_OPTIONS}
                            saving={saving}
                        />
                        <SettingGroup
                            label="Replies"
                            value={settings.replies_visibility}
                            onChange={(v) => set("replies_visibility", v)}
                            options={VIS_OPTIONS}
                            saving={saving}
                        />
                        <SettingGroup
                            label="Liked posts"
                            value={settings.likes_visibility}
                            onChange={(v) => set("likes_visibility", v)}
                            options={VIS_OPTIONS}
                            saving={saving}
                        />
                    </div>
                </section>

                {/* ── SOCIAL GRAPH ────────────────────────────────────── */}
                <section>
                    <SectionTitle
                        title="Social graph"
                        subtitle="Who can see your followers and following lists"
                    />
                    <div className="space-y-4">
                        <SettingGroup
                            label="Following list"
                            value={settings.following_list_visibility}
                            onChange={(v) => set("following_list_visibility", v)}
                            options={VIS_OPTIONS}
                            saving={saving}
                        />
                        <SettingGroup
                            label="Followers list"
                            value={settings.followers_list_visibility}
                            onChange={(v) => set("followers_list_visibility", v)}
                            options={VIS_OPTIONS}
                            saving={saving}
                        />
                    </div>
                </section>
            </div>
        </main>
    );
}
