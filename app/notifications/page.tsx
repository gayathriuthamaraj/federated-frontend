"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

import UserCard from '../components/UserCard';

interface AS2Activity {
    type: string; // 'Follow' | 'Like' | 'Create' | 'Announce' | 'Undo' | 'Update'
    actor: { type: string; id: string };
    object: { type: string; id?: string; inReplyTo?: string; content?: string };
    summary?: string;
}

interface Notification {
    id: string;
    type: 'FOLLOW' | 'LIKE' | 'REPLY' | 'REPOST' | 'SYSTEM' | 'SERVER_UPDATE' | 'MESSAGE' | 'UNLIKE';
    actor_id: string;
    actor_name?: string;
    actor_avatar?: string;
    entity_id?: string;
    is_read: boolean;
    created_at: string;
    message?: string;
    activity_stream?: AS2Activity;
}

export default function NotificationsPage() {
    const { identity, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !identity) {
            router.push('/login');
        }
    }, [identity, authLoading, router]);

    useEffect(() => {
        async function fetchNotifications() {
            if (!identity) return;

            try {
                const res = await fetch(`${identity.home_server}/notifications?user_id=${encodeURIComponent(identity.user_id)}`);
                if (res.ok) {
                    const data = await res.json();
                    setNotifications(data.notifications || []);

                    
                    await fetch(`${identity.home_server}/notifications/read`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ user_id: identity.user_id })
                    });
                }
            } catch (err) {
                console.error('Failed to fetch notifications:', err);
            } finally {
                setLoading(false);
            }
        }

        if (identity) fetchNotifications();
    }, [identity]);

    const getNotificationText = (n: Notification) => {
        // Prefer the richer AS2 summary when available
        if (n.activity_stream?.summary) return n.activity_stream.summary;
        switch (n.type) {
            case 'FOLLOW': return 'followed you';
            case 'LIKE': return 'liked your post';
            case 'UNLIKE': return 'unliked your post';
            case 'REPLY': return 'replied to your post';
            case 'REPOST': return 'reposted your post';
            case 'MESSAGE': return 'sent you a message';
            case 'SERVER_UPDATE': return `server updated: ${n.entity_id || ''}`;
            case 'SYSTEM': return n.entity_id || n.message || 'System notification';
            default: return 'interacted with you';
        }
    };

    const getIcon = (n: Notification) => {
        // If we have an AS2 activity_stream, use its canonical type for the icon
        const as2Type = n.activity_stream?.type;
        const key = as2Type ?? n.type;
        switch (key) {
            case 'Follow':        case 'FOLLOW':        return <span className="text-blue-500">👤</span>;
            case 'Like':          case 'LIKE':          return <span className="text-red-500">❤️</span>;
            case 'Undo':          case 'UNLIKE':        return <span className="text-gray-400">💔</span>;
            case 'Create':        case 'REPLY':         return <span className="text-green-500">💬</span>;
            case 'Announce':      case 'REPOST':        return <span className="text-purple-500">🔁</span>;
            case 'Update':        case 'SERVER_UPDATE': return <span className="text-yellow-500">⚙️</span>;
            case 'MESSAGE':       return <span className="text-sky-400">✉️</span>;
            default:              return <span className="text-gray-500">🔔</span>;
        }
    };

    return (
        <div className="max-w-2xl mx-auto w-full py-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-bat-gray mb-2">Notifications</h1>
                <div className="h-0.5 w-16 bg-bat-yellow rounded-full opacity-50"></div>
            </div>

            {notifications.length === 0 ? (
                <div className="text-center py-12 text-bat-gray">
                    <p className="text-lg">No notifications yet</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {notifications.map(n => (
                        <div
                            key={n.id}
                            onClick={() => {
                                if (n.type === 'FOLLOW') {
                                    router.push(`/search?user_id=${encodeURIComponent(n.actor_id)}`);
                                } else if (n.entity_id) {
                                    router.push(`/post/${n.entity_id}`);
                                }
                            }}
                            className={`
                                flex items-center gap-4 p-4 rounded-lg border cursor-pointer
                                ${n.is_read ? 'bg-bat-black border-bat-gray/10' : 'bg-bat-black border-bat-yellow/30'}
                                hover:border-bat-yellow/50 transition-colors duration-200
                            `}
                        >
                            <div className="flex-shrink-0">
                                {n.actor_avatar && n.actor_avatar !== "" ? (
                                    <img src={n.actor_avatar} alt={n.actor_name} className="w-10 h-10 rounded-full object-cover" />
                                ) : (
                                    <div className="text-2xl w-10 h-10 flex items-center justify-center bg-bat-dark rounded-full">
                                        {getIcon(n)}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                {n.type === 'SYSTEM' ? (
                                    <p className="text-bat-gray">{n.entity_id || n.message}</p>
                                ) : (
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <span
                                                className="font-bold text-white hover:underline cursor-pointer"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/search?user_id=${encodeURIComponent(n.actor_id)}`);
                                                }}
                                            >
                                                {n.actor_name || n.actor_id.split('@')[0]}
                                            </span>
                                            <span className="text-bat-gray text-sm">
                                                {getNotificationText(n)}
                                            </span>
                                        </div>
                                        <span className="text-xs text-bat-gray/40 mt-1">
                                            {new Date(n.created_at).toLocaleDateString()} at {new Date(n.created_at).toLocaleTimeString()}
                                        </span>
                                    </div>
                                )}
                            </div>
                            {!n.is_read && (
                                <div className="w-2 h-2 rounded-full bg-bat-yellow"></div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
