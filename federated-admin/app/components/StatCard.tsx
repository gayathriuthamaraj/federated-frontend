"use client";

import { ReactNode } from 'react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: ReactNode;
    color?: string;
    suffix?: string;
}

const ACCENT: Record<string, string> = {
    blue:   'var(--cyan)',
    green:  'var(--green)',
    purple: '#c678dd',
    orange: 'var(--amber)',
    red:    'var(--red)',
};

export default function StatCard({ title, value, icon, color = 'green', suffix }: StatCardProps) {
    const accent = ACCENT[color] ?? ACCENT.green;

    return (
        <div className="term-panel" style={{ borderRadius: 2, padding: '18px 20px', overflow: 'hidden' }}>
            {/* Corner label */}
            <div style={{
                fontSize: '0.6rem',
                color: 'var(--text-ghost)',
                letterSpacing: '0.12em',
                marginBottom: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
            }}>
                <span style={{ color: accent, opacity: 0.7 }}>◆</span>
                <span style={{ textTransform: 'uppercase' }}>{title}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                {/* Big number */}
                <div>
                    <div className="stat-value" style={{ color: accent, textShadow: `0 0 12px ${accent}55` }}>
                        {value}{suffix && <span style={{ fontSize: '1rem', marginLeft: 4, opacity: 0.7 }}>{suffix}</span>}
                    </div>
                </div>

                {/* Icon */}
                <div style={{
                    width: 40, height: 40,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `1px solid ${accent}44`,
                    borderRadius: 2,
                    color: accent,
                    opacity: 0.85,
                }}>
                    {icon}
                </div>
            </div>

            {/* Bottom rule with color */}
            <div style={{
                marginTop: 14,
                height: 2,
                background: `linear-gradient(90deg, ${accent}88, ${accent}11)`,
                borderRadius: 1,
            }} />
        </div>
    );
}

