"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode } from 'react';
import { LayoutDashboard, Server, Database, Ticket, Users, LogOut } from 'lucide-react';

interface AdminLayoutProps {
    children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        router.push('/login');
    };

    const isActive = (path: string) => pathname === path;

    return (
        <div className="min-h-screen bg-gray-900 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
                <div className="p-6 border-b border-gray-700">
                    <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
                    <p className="text-sm text-gray-400 mt-1">Server Management</p>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <Link
                        href="/dashboard"
                        className={`block px-4 py-3 rounded-lg transition-colors ${isActive('/dashboard')
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-300 hover:bg-gray-700'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <LayoutDashboard className="w-5 h-5" />
                            <span>Dashboard</span>
                        </div>
                    </Link>

                    <Link
                        href="/server-config"
                        className={`block px-4 py-3 rounded-lg transition-colors ${isActive('/server-config')
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-300 hover:bg-gray-700'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <Server className="w-5 h-5" />
                            <span>Server Config</span>
                        </div>
                    </Link>

                    <Link
                        href="/database-config"
                        className={`block px-4 py-3 rounded-lg transition-colors ${isActive('/database-config')
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-300 hover:bg-gray-700'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <Database className="w-5 h-5" />
                            <span>Database Config</span>
                        </div>
                    </Link>

                    <Link
                        href="/invites"
                        className={`block px-4 py-3 rounded-lg transition-colors ${isActive('/invites')
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-300 hover:bg-gray-700'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <Ticket className="w-5 h-5" />
                            <span>Invites</span>
                        </div>
                    </Link>

                    <Link
                        href="/users"
                        className={`block px-4 py-3 rounded-lg transition-colors ${isActive('/users')
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-300 hover:bg-gray-700'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <Users className="w-5 h-5" />
                            <span>Users</span>
                        </div>
                    </Link>
                </nav>

                <div className="p-4 border-t border-gray-700">
                    <button
                        onClick={handleLogout}
                        className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
