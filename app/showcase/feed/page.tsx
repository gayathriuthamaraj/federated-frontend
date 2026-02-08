"use client";

import { mockPosts } from '../../data/mockData';
import PostCard from '../../components/PostCard';

export default function FeedPage() {
    return (
        <div className="max-w-3xl mx-auto p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-bat-gray mb-2">Feed</h1>
                <div className="h-0.5 w-16 bg-bat-yellow rounded-full opacity-50"></div>
            </div>

            {/* Compose Box */}
            <div className="mb-6 p-4 bg-bat-dark rounded-lg border border-bat-gray/10">
                <textarea
                    placeholder="What's happening in Gotham?"
                    className="
              w-full px-4 py-3 rounded-lg
              bg-bat-black text-white
              border border-bat-gray/20
              focus:border-bat-yellow focus:ring-1 focus:ring-bat-yellow
              outline-none transition-all duration-200
              placeholder-gray-600
              resize-none
            "
                    rows={3}
                />
                <div className="flex justify-end mt-3">
                    <button className="
              px-6 py-2 rounded-full font-bold
              bg-bat-yellow text-bat-black
              hover:bg-yellow-400
              transform active:scale-95
              transition-all duration-200
              shadow-[0_0_15px_rgba(245,197,24,0.3)]
            ">
                        Post
                    </button>
                </div>
            </div>

            {/* Posts Feed */}
            <div className="space-y-4">
                {mockPosts.map(post => (
                    <PostCard key={post.id} post={post} />
                ))}
            </div>

            {/* Load More */}
            <div className="mt-6 text-center">
                <button className="
            px-6 py-3 rounded-full font-bold
            bg-bat-dark text-bat-gray
            border border-bat-gray/20
            hover:border-bat-yellow/50
            transition-all duration-200
          ">
                    Load More Posts
                </button>
            </div>
        </div>
    );
}
