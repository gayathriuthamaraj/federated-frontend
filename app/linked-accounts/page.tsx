"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AccountLink {
    id: string;
    requester_id: string;
    target_id: string;
    status: "pending" | "confirmed" | "rejected";
    can_remove: boolean;
    is_inbound: boolean;
    requester_name?: string;
    requester_avatar?: string;
    target_name?: string;
    target_avatar?: string;
    created_at: string;
}

// ── Avatar helper ─────────────────────────────────────────────────────────────

function Avatar({ src, name, size = 40 }: { src?: string; name: string; size?: number }) {
    const initials = name
        .split("@")[0]
        .slice(0, 2)
        .toUpperCase();

    if (src) {
        return (
            <img
                src={src}
                alt={name}
                width={size}
                height={size}
                className="rounded-full object-cover"
                style={{ width: size, height: size }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
        );
    }
    return (
        <div
            className="rounded-full bg-bat-yellow/20 flex items-center justify-center text-bat-yellow font-bold"
            style={{ width: size, height: size, fontSize: size * 0.38 }}
        >
            {initials}
        </div>
    );
}

// ── Graph renderer ────────────────────────────────────────────────────────────

interface GraphNode {
    id: string;       // user_id
    label: string;    // display_name or user_id
    avatar?: string;
    isCenter: boolean;
    x: number;
    y: number;
    status: "self" | "confirmed" | "pending-out" | "pending-in";
    linkId?: string;
    canRemove?: boolean;
}

interface GraphEdge {
    from: string;
    to: string;
    status: "confirmed" | "pending-out" | "pending-in";
    linkId: string;
}

function buildGraph(
    userID: string,
    links: AccountLink[]
): { nodes: GraphNode[]; edges: GraphEdge[] } {
    const W = 560, H = 340, CX = 280, CY = 170, R_CONFIRMED = 130, R_PENDING = 130;

    const nodes: Map<string, GraphNode> = new Map();
    const edges: GraphEdge[] = [];

    // Center = current user
    nodes.set(userID, {
        id: userID,
        label: userID.split("@")[0],
        isCenter: true,
        x: CX,
        y: CY,
        status: "self",
    });

    const confirmed = links.filter((l) => l.status === "confirmed");
    const pendingOut = links.filter((l) => l.status === "pending" && !l.is_inbound);
    const pendingIn = links.filter((l) => l.status === "pending" && l.is_inbound);

    const placeNodes = (
        group: AccountLink[],
        statusKey: "confirmed" | "pending-out" | "pending-in",
        radius: number,
        angleOffset: number
    ) => {
        group.forEach((link, i) => {
            const angle = angleOffset + (i / Math.max(group.length, 1)) * 2 * Math.PI;
            const peerID = link.is_inbound ? link.requester_id : link.target_id;
            const peerName = link.is_inbound
                ? (link.requester_name || peerID.split("@")[0])
                : (link.target_name || peerID.split("@")[0]);
            const peerAvatar = link.is_inbound ? link.requester_avatar : link.target_avatar;

            if (!nodes.has(peerID)) {
                nodes.set(peerID, {
                    id: peerID,
                    label: peerName.split("@")[0] || peerID.split("@")[0],
                    avatar: peerAvatar,
                    isCenter: false,
                    x: CX + Math.cos(angle) * radius,
                    y: CY + Math.sin(angle) * radius,
                    status: statusKey,
                    linkId: link.id,
                    canRemove: link.can_remove,
                });
            }

            edges.push({
                from: userID,
                to: peerID,
                status: statusKey,
                linkId: link.id,
            });
        });
    };

    placeNodes(confirmed, "confirmed", R_CONFIRMED, -Math.PI / 2);
    placeNodes(pendingOut, "pending-out", R_PENDING, Math.PI / 4);
    placeNodes(pendingIn, "pending-in", R_PENDING, (3 * Math.PI) / 4);

    return { nodes: Array.from(nodes.values()), edges };
}

const NODE_R = 26;

const edgeColor = {
    confirmed: "#F5C518",
    "pending-out": "#888",
    "pending-in": "#F5A518",
};

const nodeStroke = {
    self: "#F5C518",
    confirmed: "#F5C518",
    "pending-out": "#888",
    "pending-in": "#F5A518",
};

// ── Main page ─────────────────────────────────────────────────────────────────

export default function LinkedAccountsPage() {
    const { identity, isLoading: authLoading, addSession } = useAuth();
    const router = useRouter();

    const [links, setLinks] = useState<AccountLink[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionPending, setActionPending] = useState<string | null>(null); // link id being actioned

    // Form
    const [targetInput, setTargetInput] = useState("");
    const [formError, setFormError] = useState<string | null>(null);
    const [formSuccess, setFormSuccess] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && !identity) router.push("/login");
    }, [identity, authLoading, router]);

    const fetchLinks = useCallback(async () => {
        if (!identity) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(
                `${identity.home_server}/account/links?user_id=${encodeURIComponent(identity.user_id)}`
            );
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to load links");
            const fetched: AccountLink[] = data.links || [];
            setLinks(fetched);
            // Auto-populate the account switcher with confirmed linked peers
            // so users can switch to them instantly without re-entering credentials
            fetched
                .filter(l => l.status === 'confirmed')
                .forEach(l => {
                    const peerId = l.is_inbound ? l.requester_id : l.target_id;
                    // All account links are between local users on the same server
                    addSession(peerId, identity.home_server, '', '');
                });
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [identity]);

    useEffect(() => {
        fetchLinks();
    }, [fetchLinks]);

    // Poll every 15 s so the receiving user sees incoming link requests without a manual refresh
    useEffect(() => {
        if (!identity) return;
        const id = setInterval(fetchLinks, 15_000);
        return () => clearInterval(id);
    }, [identity, fetchLinks]);

    // ── Actions ────────────────────────────────────────────────────────────────

    async function handleRequest(e: React.FormEvent) {
        e.preventDefault();
        if (!identity || !targetInput.trim()) return;
        setFormError(null);
        setFormSuccess(null);

        const target = targetInput.trim();
        const myServer = identity.user_id.split('@')[1];
        const targetServer = target.includes('@') ? target.split('@').pop() : myServer;

        // Only pre-check existence for users on the same server; cross-server
        // validation is handled by the backend federation layer.
        if (targetServer === myServer) {
            try {
                const checkRes = await fetch(
                    `${identity.home_server}/user/search?user_id=${encodeURIComponent(target)}&viewer_id=${encodeURIComponent(identity.user_id)}`
                );
                if (checkRes.status === 404) {
                    setFormError('User not found on this server.');
                    return;
                }
                if (!checkRes.ok && checkRes.status !== 403) {
                    // 403 = user exists but has hidden profile — still allow link request
                    setFormError('Could not verify user. Please try again.');
                    return;
                }
            } catch {
                setFormError('Could not verify user. Please check your connection.');
                return;
            }
        }

        try {
            const res = await fetch(`${identity.home_server}/account/link/request`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    requester_id: identity.user_id,
                    target_id: targetInput.trim(),
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Request failed");
            setFormSuccess("Link request sent to " + targetInput.trim());
            setTargetInput("");
            fetchLinks();
        } catch (e: any) {
            setFormError(e.message);
        }
    }

    async function handleAccept(link: AccountLink) {
        if (!identity) return;
        setActionPending(link.id);
        try {
            const res = await fetch(`${identity.home_server}/account/link/accept`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: identity.user_id, link_id: link.id }),
            });
            if (!res.ok) throw new Error("Failed to accept");
            fetchLinks();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setActionPending(null);
        }
    }

    async function handleReject(link: AccountLink) {
        if (!identity) return;
        setActionPending(link.id);
        try {
            const res = await fetch(`${identity.home_server}/account/link/reject`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: identity.user_id, link_id: link.id }),
            });
            if (!res.ok) throw new Error("Failed to reject");
            fetchLinks();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setActionPending(null);
        }
    }

    async function handleRemove(link: AccountLink) {
        if (!identity) return;
        setActionPending(link.id);
        try {
            const res = await fetch(`${identity.home_server}/account/link/remove`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: identity.user_id, link_id: link.id }),
            });
            if (!res.ok) throw new Error("Failed to remove");
            fetchLinks();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setActionPending(null);
        }
    }

    // ── Graph ──────────────────────────────────────────────────────────────────

    const W = 560, H = 340;

    const graph =
        identity && links.length > 0
            ? buildGraph(identity.user_id, links)
            : identity
            ? buildGraph(identity.user_id, [])
            : null;

    const confirmed = links.filter((l) => l.status === "confirmed");
    const pendingIn = links.filter((l) => l.status === "pending" && l.is_inbound);
    const pendingOut = links.filter((l) => l.status === "pending" && !l.is_inbound);

    if (authLoading) {
        return (
            <div className="flex-1 flex items-center justify-center text-bat-gray">
                Loading…
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-4 md:p-8 text-bat-light">
            <h1 className="text-2xl font-bold text-bat-yellow mb-1">Linked Accounts</h1>
            <p className="text-bat-gray text-sm mb-6">
                Direct links only — A↔B and B↔C does&nbsp;<span className="font-semibold text-bat-yellow">not</span>&nbsp;imply A↔C.
            </p>

            {error && (
                <div className="mb-4 p-3 bg-red-900/40 border border-red-500/40 rounded-lg text-red-400 text-sm">
                    {error}
                </div>
            )}

            {/* ── SVG Graph ─────────────────────────────────────────────────── */}
            <div className="bg-bat-dark/60 border border-bat-yellow/10 rounded-xl p-4 mb-6 overflow-x-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-48 text-bat-gray">
                        Loading graph…
                    </div>
                ) : graph ? (
                    <svg
                        viewBox={`0 0 ${W} ${H}`}
                        width="100%"
                        style={{ maxHeight: 340, minHeight: 220 }}
                    >
                        {/* edges */}
                        {graph.edges.map((edge) => {
                            const from = graph.nodes.find((n) => n.id === edge.from);
                            const to = graph.nodes.find((n) => n.id === edge.to);
                            if (!from || !to) return null;
                            const isDashed = edge.status !== "confirmed";
                            return (
                                <line
                                    key={edge.linkId}
                                    x1={from.x}
                                    y1={from.y}
                                    x2={to.x}
                                    y2={to.y}
                                    stroke={edgeColor[edge.status]}
                                    strokeWidth={2}
                                    strokeDasharray={isDashed ? "6 4" : undefined}
                                    strokeOpacity={0.7}
                                />
                            );
                        })}

                        {/* nodes */}
                        {graph.nodes.map((node) => {
                            const stroke = nodeStroke[node.status];
                            const isCenter = node.isCenter;
                            const r = isCenter ? NODE_R + 6 : NODE_R;
                            return (
                                <g key={node.id} transform={`translate(${node.x},${node.y})`}>
                                    <circle
                                        r={r}
                                        fill={isCenter ? "#1a1a0f" : "#111"}
                                        stroke={stroke}
                                        strokeWidth={isCenter ? 3 : 2}
                                    />
                                    {/* Avatar initial text fallback */}
                                    <text
                                        textAnchor="middle"
                                        dominantBaseline="central"
                                        fontSize={r * 0.52}
                                        fill={stroke}
                                        fontWeight="bold"
                                    >
                                        {node.label.slice(0, 2).toUpperCase()}
                                    </text>
                                    {/* label below */}
                                    <text
                                        y={r + 14}
                                        textAnchor="middle"
                                        fontSize={10}
                                        fill="#ccc"
                                    >
                                        {node.label.length > 12
                                            ? node.label.slice(0, 11) + "…"
                                            : node.label}
                                    </text>
                                    {/* status indicator dot */}
                                    {!isCenter && node.status === "pending-in" && (
                                        <circle cx={r - 4} cy={-(r - 4)} r={5} fill="#F5A518" />
                                    )}
                                </g>
                            );
                        })}
                    </svg>
                ) : null}

                {/* Legend */}
                <div className="flex flex-wrap gap-4 mt-3 text-xs text-bat-gray">
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block w-5 h-0.5 bg-bat-yellow"></span>
                        Confirmed link
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block w-5 border-t-2 border-dashed border-gray-500"></span>
                        Pending outbound
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block w-5 border-t-2 border-dashed border-yellow-500/70"></span>
                        Pending inbound
                    </span>
                </div>

                {links.length === 0 && !loading && (
                    <p className="text-center text-bat-gray text-sm mt-4">
                        No linked accounts yet. Send a link request below.
                    </p>
                )}
            </div>

            {/* ── Request Form ──────────────────────────────────────────────── */}
            <div className="bg-bat-dark/60 border border-bat-yellow/10 rounded-xl p-5 mb-6">
                <h2 className="text-bat-yellow font-semibold mb-3">Link a New Account</h2>
                <form onSubmit={handleRequest} className="flex gap-2 flex-wrap">
                    <input
                        type="text"
                        value={targetInput}
                        onChange={(e) => setTargetInput(e.target.value)}
                        placeholder="username@server_id"
                        className="flex-1 min-w-0 bg-bat-black border border-bat-yellow/20 rounded-lg px-3 py-2 text-sm text-bat-light placeholder-bat-gray focus:outline-none focus:border-bat-yellow/60"
                    />
                    <button
                        type="submit"
                        disabled={!targetInput.trim()}
                        className="px-4 py-2 bg-bat-yellow text-bat-black font-semibold rounded-lg text-sm hover:bg-bat-yellow/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        Send Request
                    </button>
                </form>
                {formError && <p className="text-red-400 text-xs mt-2">{formError}</p>}
                {formSuccess && <p className="text-green-400 text-xs mt-2">{formSuccess}</p>}
            </div>

            {/* ── Pending Inbound ───────────────────────────────────────────── */}
            {pendingIn.length > 0 && (
                <section className="mb-6">
                    <h2 className="text-bat-yellow font-semibold mb-3">
                        Incoming Requests&nbsp;
                        <span className="text-xs bg-bat-yellow/20 text-bat-yellow px-2 py-0.5 rounded-full">
                            {pendingIn.length}
                        </span>
                    </h2>
                    <div className="space-y-2">
                        {pendingIn.map((link) => (
                            <div
                                key={link.id}
                                className="flex items-center gap-3 bg-bat-dark/60 border border-bat-yellow/10 rounded-xl px-4 py-3"
                            >
                                <Avatar
                                    src={link.requester_avatar}
                                    name={link.requester_name || link.requester_id}
                                    size={36}
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-bat-light truncate">
                                        {link.requester_name || link.requester_id.split("@")[0]}
                                    </p>
                                    <p className="text-xs text-bat-gray truncate">{link.requester_id}</p>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <button
                                        onClick={() => handleAccept(link)}
                                        disabled={actionPending === link.id}
                                        className="px-3 py-1.5 bg-bat-yellow text-bat-black text-xs font-semibold rounded-lg hover:bg-bat-yellow/80 disabled:opacity-40 transition-colors"
                                    >
                                        Accept
                                    </button>
                                    <button
                                        onClick={() => handleReject(link)}
                                        disabled={actionPending === link.id}
                                        className="px-3 py-1.5 bg-transparent border border-red-500/50 text-red-400 text-xs rounded-lg hover:bg-red-500/10 disabled:opacity-40 transition-colors"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* ── Confirmed Links ───────────────────────────────────────────── */}
            {confirmed.length > 0 && (
                <section className="mb-6">
                    <h2 className="text-bat-yellow font-semibold mb-3">Confirmed Links</h2>
                    <div className="space-y-2">
                        {confirmed.map((link) => {
                            const peerID = link.is_inbound ? link.requester_id : link.target_id;
                            const peerName = link.is_inbound
                                ? (link.requester_name || peerID)
                                : (link.target_name || peerID);
                            const peerAvatar = link.is_inbound ? link.requester_avatar : link.target_avatar;
                            const role = link.can_remove ? "You sent this link request" : "They sent this link request";

                            return (
                                <div
                                    key={link.id}
                                    className="flex items-center gap-3 bg-bat-dark/60 border border-bat-yellow/10 rounded-xl px-4 py-3"
                                >
                                    <Avatar src={peerAvatar} name={peerName} size={36} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-bat-light truncate">
                                            {peerName.split("@")[0]}
                                        </p>
                                        <p className="text-xs text-bat-gray truncate">{peerID}</p>
                                        <p className="text-xs text-bat-yellow/50 mt-0.5">{role}</p>
                                    </div>
                                    {/* Both parties can remove a confirmed link */}
                                    <button
                                        onClick={() => handleRemove(link)}
                                        disabled={actionPending === link.id}
                                        className="shrink-0 px-3 py-1.5 border border-red-500/40 text-red-400 text-xs rounded-lg hover:bg-red-500/10 disabled:opacity-40 transition-colors"
                                    >
                                        Remove
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* ── Pending Outbound ──────────────────────────────────────────── */}
            {pendingOut.length > 0 && (
                <section className="mb-6">
                    <h2 className="text-bat-yellow font-semibold mb-3">Sent Requests</h2>
                    <div className="space-y-2">
                        {pendingOut.map((link) => (
                            <div
                                key={link.id}
                                className="flex items-center gap-3 bg-bat-dark/60 border border-bat-gray/10 rounded-xl px-4 py-3"
                            >
                                <Avatar
                                    src={link.target_avatar}
                                    name={link.target_name || link.target_id}
                                    size={36}
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-bat-light truncate">
                                        {(link.target_name || link.target_id).split("@")[0]}
                                    </p>
                                    <p className="text-xs text-bat-gray truncate">{link.target_id}</p>
                                    <p className="text-xs text-bat-gray/50 mt-0.5">Awaiting acceptance</p>
                                </div>
                                <button
                                    onClick={() => handleRemove(link)}
                                    disabled={actionPending === link.id}
                                    className="shrink-0 px-3 py-1.5 border border-bat-gray/30 text-bat-gray text-xs rounded-lg hover:bg-bat-gray/10 disabled:opacity-40 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
