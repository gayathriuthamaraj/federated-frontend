"use client";
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ModLayout from '../components/ModLayout';
import { getPendingPosts, approvePost, rejectPost, PendingPost } from '../api/moderator';
import { CheckCircle, XCircle, RefreshCw, ShieldAlert, Clock, Loader2 } from 'lucide-react';

type ActionState = 'idle' | 'approving' | 'rejecting' | 'done-approve' | 'done-reject';

function PostCard({ post, onAction }: { post: PendingPost; onAction: (id: string, action: 'approve' | 'reject') => void }) {
    const [state, setState] = useState<ActionState>('idle');

    const handle = async (action: 'approve' | 'reject') => {
        setState(action === 'approve' ? 'approving' : 'rejecting');
        try {
            if (action === 'approve') await approvePost(post.id);
            else await rejectPost(post.id);
            setState(action === 'approve' ? 'done-approve' : 'done-reject');
            setTimeout(() => onAction(post.id, action), 900);
        } catch (err) {
            console.error(err);
            setState('idle');
        }
    };

    const isDone = state === 'done-approve' || state === 'done-reject';
    const doneCol = state === 'done-approve' ? 'var(--green)' : 'var(--red)';

    return (
        <div className="post-card" style={isDone ? { borderColor: doneCol, opacity: 0.6 } : {}}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="dot dot-amber" />
                    <span className="author">@{post.author.split('@')[0]}</span>
                    <span style={{ color: 'var(--text-ghost)', fontSize: '0.65rem' }}>{post.author.includes('@') ? post.author.split('@')[1] : ''}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={11} style={{ color: 'var(--text-ghost)' }} />
                    <span className="time">{new Date(post.created_at).toLocaleString()}</span>
                </div>
            </div>

            <div className="body">{post.content}</div>

            {post.image_url && (
                <img src={post.image_url} alt="Post image" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 2, border: '1px solid var(--border-lit)', objectFit: 'contain' }} />
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="badge badge-amber">PENDING REVIEW</span>
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-ghost)', fontFamily: 'monospace' }}>id: {post.id.slice(0, 8)}…</span>
                </div>

                {isDone ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: doneCol, fontFamily: 'monospace', letterSpacing: '0.06em' }}>
                        {state === 'done-approve'
                            ? <><CheckCircle size={12} /> APPROVED</>
                            : <><XCircle size={12} /> REJECTED</>}
                    </span>
                ) : (
                    <div className="actions">
                        <button
                            id={`approve-${post.id}`}
                            className="btn btn-green"
                            onClick={() => handle('approve')}
                            disabled={state !== 'idle'}
                            style={{ fontSize: '0.7rem', padding: '6px 14px' }}
                        >
                            <CheckCircle size={13} />
                            {state === 'approving' ? 'APPROVING…' : 'APPROVE'}
                        </button>
                        <button
                            id={`reject-${post.id}`}
                            className="btn btn-red"
                            onClick={() => handle('reject')}
                            disabled={state !== 'idle'}
                            style={{ fontSize: '0.7rem', padding: '6px 14px' }}
                        >
                            <XCircle size={13} />
                            {state === 'rejecting' ? 'REJECTING…' : 'DECLINE'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function QueuePage() {
    const router = useRouter();
    const [posts, setPosts] = useState<PendingPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [refresh, setRefresh] = useState(false);
    const [loadedAt, setLoadedAt] = useState('');

    const loadPosts = useCallback(async () => {
        setRefresh(true);
        try {
            const data = await getPendingPosts();
            setPosts(data.posts);
            setError('');
            setLoadedAt(new Date().toLocaleTimeString());
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to load queue';
            setError(msg);
            if (msg.toLowerCase().includes('authenticated') || msg.includes('403')) {
                router.push('/login');
            }
        } finally {
            setLoading(false);
            setRefresh(false);
        }
    }, [router]);

    useEffect(() => {
        const token = localStorage.getItem('mod_token');
        if (!token) { router.push('/login'); return; }
        loadPosts();
        // Auto-refresh every 30s
        const interval = setInterval(loadPosts, 30000);
        return () => clearInterval(interval);
    }, [loadPosts, router]);

    const handleAction = (id: string, _action: 'approve' | 'reject') => {
        setPosts(prev => prev.filter(p => p.id !== id));
    };

    return (
        <ModLayout>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ color: 'var(--text-ghost)', fontSize: '0.62rem', letterSpacing: '0.15em', marginBottom: 4 }}>// CONTENT MODERATION</div>
                        <h1 className="term-header" style={{ fontSize: '1.4rem', margin: 0 }}>REVIEW QUEUE</h1>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 5 }}>
                            Posts flagged by the ML model — awaiting moderator decision
                            {loadedAt && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--text-ghost)', marginLeft: 12 }}><RefreshCw size={10} />{loadedAt}</span>}
                        </div>
                    </div>
                    <button onClick={loadPosts} disabled={refresh} className="btn btn-ghost" style={{ fontSize: '0.7rem' }}>
                        <RefreshCw size={12} style={{ animation: refresh ? 'spin 1s linear infinite' : 'none' }} />
                        REFRESH
                    </button>
                </div>

                {/* Stats bar */}
                <div className="panel" style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '12px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <ShieldAlert size={15} style={{ color: 'var(--amber)' }} />
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-ghost)' }}>PENDING</span>
                        <span style={{ fontSize: '1.1rem', color: 'var(--amber)', fontFamily: 'var(--font-display)' }}>{posts.length}</span>
                    </div>
                    <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-ghost)' }}>
                        ML scores above threshold → posts hidden from public feed → awaiting your review
                    </div>
                </div>

                {error && (
                    <div style={{ padding: '10px 14px', background: 'rgba(255,23,68,0.06)', border: '1px solid var(--red-dim)', fontSize: '0.75rem', color: 'var(--red)', borderRadius: 2 }}>
                        ERR › {error}
                    </div>
                )}

                {loading ? (
                    <div style={{ color: 'var(--text-ghost)', fontSize: '0.8rem', padding: '40px 0', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> LOADING QUEUE...
                    </div>
                ) : posts.length === 0 ? (
                    <div className="panel" style={{ textAlign: 'center', padding: '52px 20px' }}>
                        <CheckCircle size={32} style={{ color: 'var(--green)', opacity: 0.5, marginBottom: 12 }} />
                        <div style={{ color: 'var(--green)', fontSize: '0.85rem', marginBottom: 6 }}>ALL CLEAR</div>
                        <div style={{ color: 'var(--text-ghost)', fontSize: '0.72rem' }}>No posts waiting for review. The queue is empty.</div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {posts.map(post => (
                            <PostCard key={post.id} post={post} onAction={handleAction} />
                        ))}
                    </div>
                )}
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </ModLayout>
    );
}
