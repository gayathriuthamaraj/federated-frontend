"use client";

import { ReactNode } from 'react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: ReactNode;
    color?: string;
}

export default function StatCard({ title, value, icon, color = 'blue' }: StatCardProps) {
    const colorClasses = {
        blue: 'bg-blue-600',
        green: 'bg-green-600',
        purple: 'bg-purple-600',
        orange: 'bg-orange-600',
        red: 'bg-red-600',
    };

    const bgColor = colorClasses[color as keyof typeof colorClasses] || colorClasses.blue;

    return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-400 text-sm font-medium">{title}</p>
                    <p className="text-3xl font-bold text-white mt-2">{value}</p>
                </div>
                <div className={`${bgColor} w-12 h-12 rounded-lg flex items-center justify-center text-white`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}
