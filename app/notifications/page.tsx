"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

interface Notification {
    id: string;
    type: 'follow' | 'like' | 'repost' | 'mention';
    actor: string;
    content?: string;
    post_id?: string;
    created_at: string;
    read: boolean;
}

export default function NotificationsPage() {
    const { identity, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !identity) {
            router.push('/login');
        }
    }, [identity, authLoading, router]);

    // Fetch notifications
    useEffect(() => {
        async function fetchNotifications() {
            if (!identity) return;

            try {
                const res = await fetch(
                    `${identity.home_server}/notifications?user_id=${encodeURIComponent(identity.user_id)}`
                );

                if (res.ok) {
                    const data = await res.json();
                    setNotifications(data.notifications || []);
                }
            } catch (err) {
                console.error('Failed to fetch notifications:', err);
            } finally {
                setLoading(false);
            }
        }

        if (identity) fetchNotifications();
    }, [identity]);

    const getNotificationText = (notif: Notification) => {
        switch (notif.type) {
            case 'follow':
                return `${notif.actor} started following you`;
            case 'like':
                return `${notif.actor} liked your post`;
            case 'repost':
                return `${notif.actor} reposted your post`;
            case 'mention':
                return `${notif.actor} mentioned you`;
            default:
                return 'New notification';
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'follow':
                return '👤';
            case 'like':
                return '❤️';
            case 'repost':
                return '🔄';
            case 'mention':
                return '@';
            default:
                return '🔔';
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-bat-black">
                <div className="text-center text-bat-gray">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-bat-yellow"></div>
                    <p className="mt-2">Loading notifications...</p>
                </div>
            </div>
        );
    }

    const filteredNotifications = filter === 'unread'
        ? notifications.filter(n => !n.read)
        : notifications;

    return (
        <main className="min-h-screen bg-bat-black">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-bat-black/95 backdrop-blur-sm border-b border-bat-gray/10">
                    <div className="p-4">
                        <h1 className="text-2xl font-bold text-bat-gray">Notifications</h1>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex border-b border-bat-dark">
                        <button
                            onClick={() => setFilter('all')}
                            className={`
                                flex-1 py-4 text-center text-sm font-medium transition-colors
                                ${filter === 'all'
                                    ? 'text-bat-yellow border-b-2 border-bat-yellow'
                                    : 'text-bat-gray/60 hover:text-bat-gray hover:bg-bat-dark/30'
                                }
                            `}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilter('unread')}
                            className={`
                                flex-1 py-4 text-center text-sm font-medium transition-colors
                                ${filter === 'unread'
                                    ? 'text-bat-yellow border-b-2 border-bat-yellow'
                                    : 'text-bat-gray/60 hover:text-bat-gray hover:bg-bat-dark/30'
                                }
                            `}
                        >
                            Unread
                        </button>
                    </div>
                </div>

                {/* Notifications List */}
                <div>
                    {filteredNotifications.length === 0 ? (
                        <div className="p-8 text-center">
                            <div className="text-6xl mb-4">🔔</div>
                            <div className="text-bat-gray/40 text-lg font-medium">
                                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                            </div>
                            <div className="text-bat-gray/20 text-sm mt-1">
                                When you get notifications, they'll show up here
                            </div>
                        </div>
                    ) : (
                        filteredNotifications.map(notif => (
                            <div
                                key={notif.id}
                                className={`
                                    p-4 border-b border-bat-dark/50
                                    hover:bg-bat-dark/30 transition-colors cursor-pointer
                                    ${!notif.read ? 'bg-bat-yellow/5' : ''}
                                `}
                            >
                                <div className="flex gap-3">
                                    <div className="text-2xl">{getNotificationIcon(notif.type)}</div>
                                    <div className="flex-1">
                                        <p className="text-bat-gray">
                                            <span className="font-bold">{notif.actor}</span>
                                            {' '}
                                            {getNotificationText(notif).replace(notif.actor, '')}
                                        </p>
                                        {notif.content && (
                                            <p className="text-bat-gray/60 text-sm mt-1">{notif.content}</p>
                                        )}
                                        <p className="text-bat-gray/40 text-xs mt-1">
                                            {new Date(notif.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                    {!notif.read && (
                                        <div className="w-2 h-2 bg-bat-yellow rounded-full mt-2"></div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </main>
    );
}
