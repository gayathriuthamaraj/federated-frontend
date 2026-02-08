"use client";

import { useState } from 'react';

interface LikeButtonProps {
    initialLiked?: boolean;
    initialCount?: number;
    onLike?: (liked: boolean) => void;
    size?: 'sm' | 'md' | 'lg';
}

export default function LikeButton({
    initialLiked = false,
    initialCount = 0,
    onLike,
    size = 'md'
}: LikeButtonProps) {
    const [isLiked, setIsLiked] = useState(initialLiked);
    const [likeCount, setLikeCount] = useState(initialCount);
    const [isAnimating, setIsAnimating] = useState(false);

    const handleLike = () => {
        const newLikedState = !isLiked;
        setIsLiked(newLikedState);
        setLikeCount(prev => newLikedState ? prev + 1 : prev - 1);
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 600);
        onLike?.(newLikedState);
    };

    const sizeClasses = {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg'
    };

    return (
        <button
            onClick={handleLike}
            className={`
        flex items-center gap-2 px-3 py-1.5 rounded-full
        transition-all duration-200
        ${isLiked ? 'text-red-500' : 'text-gray-500'}
        hover:bg-red-500/10
        ${sizeClasses[size]}
      `}
        >
            <span className={`
        relative inline-block
        ${isAnimating ? 'animate-pulse' : ''}
      `}>
                {isLiked ? (
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                        <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                    </svg>
                ) : (
                    <svg className="w-5 h-5 stroke-current fill-none" viewBox="0 0 20 20" strokeWidth="2">
                        <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                    </svg>
                )}
            </span>
            <span className="font-medium">{likeCount}</span>
        </button>
    );
}
