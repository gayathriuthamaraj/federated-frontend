"use client";

import { mockNotifications } from '../../data/mockData';

export default function NotificationsPage() {
    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'like':
                return (
                    <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                    </svg>
                );
            case 'follow':
                return (
                    <svg className="w-6 h-6 text-bat-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                );
            case 'comment':
                return (
                    <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                );
            case 'repost':
                return (
                    <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                );
            default:
                return null;
        }
    };

    const getNotificationText = (notification: typeof mockNotifications[0]) => {
        switch (notification.type) {
            case 'like':
                return `liked your post`;
            case 'follow':
                return `started following you`;
            case 'comment':
                return `commented on your post`;
            case 'repost':
                return `reposted your post`;
            default:
                return '';
        }
    };

    return (
        <div className=" max-w-3xl mx-auto p-6">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-bat-gray mb-2">Notifications</h1>
                    <div className="h-0.5 w-16 bg-bat-yellow rounded-full opacity-50"></div>
                </div>

                {/* Notifications List */}
                <div className="space-y-2">
                    {mockNotifications.map(notification => (
                        <div
                            key={notification.id}
                            className={`
                flex items-start gap-4 p-4 rounded-lg
                border transition-all duration-200
                ${notification.isRead
                                    ? 'bg-bat-dark border-bat-gray/10'
                                    : 'bg-bat-dark/50 border-bat-yellow/30'
                                }
                hover:border-bat-yellow/50 cursor-pointer
              `}
                        >
                            {/* Icon */}
                            <div className="flex-shrink-0 mt-1">
                                {getNotificationIcon(notification.type)}
                            </div>

                            {/* Avatar */}
                            <img
                                src={notification.user.avatarUrl}
                                alt={notification.user.displayName}
                                className="w-10 h-10 rounded-full border-2 border-bat-yellow/50"
                            />

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <p className="text-bat-gray">
                                    <span className="font-bold">{notification.user.displayName}</span>
                                    {' '}
                                    <span className="text-gray-400">{getNotificationText(notification)}</span>
                                </p>
                                <p className="text-gray-500 text-sm mt-1">{notification.timestamp}</p>
                                {notification.post && (
                                    <p className="text-gray-400 text-sm mt-2 line-clamp-2">
                                        "{notification.post.content}"
                                    </p>
                                )}
                            </div>

                            {/* Unread Indicator */}
                            {!notification.isRead && (
                                <div className="w-2 h-2 bg-bat-yellow rounded-full flex-shrink-0 mt-2"></div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {mockNotifications.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">No notifications yet</p>
                    </div>
                )}
            </div>
    );
}