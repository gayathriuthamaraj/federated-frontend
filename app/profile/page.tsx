'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import ProfileCard from '../components/ProfileCard';
import PostCard from '../components/PostCard';
import { useAuth } from '../context/AuthContext';
import { Profile } from '../types/profile';

interface Post {
  id: string;
  author: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export default function ProfilePage() {
  const searchParams = useSearchParams();
  const { identity, isLoading: authLoading } = useAuth();

  // Determine the effective user ID: query param OR local identity
  const paramUserId = searchParams.get('user_id');
  const effectiveUserId = paramUserId || identity?.user_id;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [did, setDid] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!identity?.home_server || !identity?.user_id) {
      setLoading(false);
      return;
    }

    const userId = paramUserId ?? identity.user_id;

    const fetchProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        const url =
          userId === identity.user_id
            ? `${identity.home_server}/user/me?user_id=${encodeURIComponent(userId)}`
            : `${identity.home_server}/user/search?user_id=${encodeURIComponent(userId)}`;


        const res = await fetch(url);

        if (!res.ok) {
          if (res.status === 404) {
            setProfile(null);
            return;
          }
          // Get error details for debugging
          const errorText = await res.text();
          throw new Error(`Failed to fetch profile (${res.status}): ${errorText}`);
        }

        const data = await res.json();
        setProfile(data.profile ?? data.user ?? null);
        if (data.identity?.did) {
          setDid(data.identity.did);
        } else if (data.data?.identity?.did) {
          // Handle federated lookup format
          setDid(data.data.identity.did);
        }

      } catch (err: any) {
        console.error("Profile fetch error:", err);
        setError(err.message ?? "Unexpected error");
      } finally {
        setLoading(false);
      }
    };

    const fetchPosts = async () => {
      setLoadingPosts(true);
      try {
        const res = await fetch(`${identity.home_server}/posts/user?user_id=${encodeURIComponent(userId)}`);
        if (res.ok) {
          const data = await res.json();
          setPosts(data.posts || []);
        }
      } catch (err) {
        console.error("Failed to fetch posts:", err);
      } finally {
        setLoadingPosts(false);
      }
    };

    fetchProfile();
    fetchPosts();
  }, [authLoading, identity, paramUserId]);


  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bat-black text-bat-gray">
        <div className="text-center p-8 border border-bat-gray/20 rounded-lg bg-bat-dark">
          <h2 className="text-2xl font-bold text-bat-yellow mb-2">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bat-black text-bat-gray">
        <div className="text-center">Profile not found.</div>
      </div>
    );
  }

  // Determine if this is the user's own profile
  const isOwnProfile = identity?.user_id === profile.user_id;

  return (
    <main className="min-h-screen bg-bat-black">
      <ProfileCard
        profile={profile}
        isOwnProfile={isOwnProfile}
        posts={posts}
        loadingPosts={loadingPosts}
        did={did || undefined}
      />
    </main>
  );
}
