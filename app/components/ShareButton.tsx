"use client";

import { useState } from 'react';

interface ShareButtonProps {
    url?: string;
    text?: string;
    size?: 'sm' | 'md' | 'lg';
}

export default function ShareButton({
    url = window.location.href,
    text = 'Check this out!',
    size = 'md'
}: ShareButtonProps) {
    const [showToast, setShowToast] = useState(false);

    const handleShare = async () => {
        try {
            if (navigator.share) {
                await navigator.share({ title: text, url });
            } else {
                await navigator.clipboard.writeText(url);
                setShowToast(true);
                setTimeout(() => setShowToast(false), 2000);
            }
        } catch (err) {
            console.log('Share failed:', err);
        }
    };

    const sizeClasses = {
        sm: 'text-sm px-2 py-1',
        md: 'text-base px-3 py-1.5',
        lg: 'text-lg px-4 py-2'
    };

    return (
        <>
            <button
                onClick={handleShare}
                className={`
          flex items-center gap-2 rounded-full
          text-gray-500 hover:text-bat-yellow
          hover:bg-bat-yellow/10
          transition-all duration-200
          ${sizeClasses[size]}
        `}
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span className="font-medium">Share</span>
            </button>

            {}
            {showToast && (
                <div className="fixed bottom-4 right-4 bg-bat-yellow text-bat-black px-4 py-2 rounded-lg shadow-lg animate-bounce z-50">
                    ✓ Link copied to clipboard!
                </div>
            )}
        </>
    );
}
