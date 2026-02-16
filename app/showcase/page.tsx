"use client";

import { useRouter } from 'next/navigation';

interface PageCard {
    title: string;
    description: string;
    path: string;
    icon: React.ReactNode;
    color: string;
}

export default function DemoPage() {
    const router = useRouter();

    const pages: PageCard[] = [
        {
            title: 'Profile',
            description: 'View and edit your profile with stats, posts, and bio',
            path: '/showcase/profile',
            color: 'from-yellow-500 to-yellow-600',
            icon: (
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            ),
        },
        {
            title: 'Feed',
            description: 'Browse and interact with posts from across Gotham',
            path: '/showcase/feed',
            color: 'from-blue-500 to-blue-600',
            icon: (
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
            ),
        },
        {
            title: 'Followers',
            description: 'See who follows you and manage your followers',
            path: '/showcase/followers',
            color: 'from-purple-500 to-purple-600',
            icon: (
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
        },
        {
            title: 'Following',
            description: 'Manage who you follow and discover new users',
            path: '/showcase/following',
            color: 'from-green-500 to-green-600',
            icon: (
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ),
        },
        {
            title: 'Notifications',
            description: 'Stay updated with likes, follows, and comments',
            path: '/showcase/notifications',
            color: 'from-red-500 to-red-600',
            icon: (
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
            ),
        },
        {
            title: 'Explore',
            description: 'Discover trending posts and new users',
            path: '/showcase/explore',
            color: 'from-pink-500 to-pink-600',
            icon: (
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            ),
        },
        {
            title: 'Messages',
            description: 'Chat with other users in real-time',
            path: '/showcase/messages',
            color: 'from-indigo-500 to-indigo-600',
            icon: (
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
            ),
        },
    ];

    return (
        <div className="min-h-screen bg-bat-black p-8">
            {}
            <div className="max-w-7xl mx-auto mb-12 text-center">
                <h1 className="text-5xl font-bold text-bat-gray mb-4">
                    Gotham Social <span className="text-bat-yellow">Showcase</span>
                </h1>
                <div className="h-1 w-32 bg-bat-yellow mx-auto rounded-full mb-6"></div>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                    Explore all the pages of our social platform. Click any card to navigate to that page.
                </p>
            </div>

            {}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {pages.map((page, index) => (
                    <div
                        key={page.path}
                        onClick={() => router.push(page.path)}
                        className="
              group relative overflow-hidden
              bg-bat-dark rounded-xl border border-bat-gray/10
              hover:border-bat-yellow/50
              cursor-pointer
              transform hover:scale-105 hover:-translate-y-2
              transition-all duration-300
              shadow-lg hover:shadow-2xl hover:shadow-bat-yellow/20
            "
                        style={{
                            animationDelay: `${index * 100}ms`,
                        }}
                    >
                        {}
                        <div className={`
              absolute inset-0 bg-gradient-to-br ${page.color}
              opacity-0 group-hover:opacity-10
              transition-opacity duration-300
            `}></div>

                        {}
                        <div className="relative p-6">
                            {}
                            <div className="
                w-16 h-16 mb-4 rounded-lg
                bg-bat-black/50 border border-bat-gray/20
                flex items-center justify-center
                text-bat-yellow
                group-hover:scale-110 group-hover:rotate-6
                transition-all duration-300
              ">
                                {page.icon}
                            </div>

                            {}
                            <h2 className="text-2xl font-bold text-bat-gray mb-2 group-hover:text-bat-yellow transition-colors duration-300">
                                {page.title}
                            </h2>

                            {}
                            <p className="text-gray-400 text-sm leading-relaxed">
                                {page.description}
                            </p>

                            {}
                            <div className="
                absolute bottom-4 right-4
                text-bat-yellow opacity-0 group-hover:opacity-100
                transform translate-x-2 group-hover:translate-x-0
                transition-all duration-300
              ">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {}
            <div className="max-w-7xl mx-auto mt-16 text-center">
                <p className="text-gray-500">
                    Built with ❤️ for Gotham City
                </p>
            </div>
        </div>
    );
}
