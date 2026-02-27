"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ProfileCard from '../components/ProfileCard';
import { useAuth } from '../context/AuthContext';
import { Profile } from '../types/profile';
import { useCache } from '../context/CacheContext';
import type { Post } from '../types/post';

interface UserReply {
  id: string;
  post_id: string;
  post_content: string;
  post_author: string;
  content: string;
  created_at: string;
}

function ProfileContent() {
  const { identity, isLoading: authLoading } = useAuth();
  const { getProfile, setProfile } = useCache();
  const searchParams = useSearchParams();

  const [profile, setProfileState] = useState<Profile | null>(null);
  const [did, setDid] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [replies, setReplies] = useState<UserReply[]>([]);
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowingTarget, setIsFollowingTarget] = useState(false);

  // Support viewing other users via ?user_id= query param
  const queryUserId = searchParams.get('user_id');
  const targetUserId = queryUserId || identity?.user_id || null;
  const isOwnProfile = !queryUserId || queryUserId === identity?.user_id;

  // Detect cross-server: target user lives on a different server than the viewer
  const targetServer = targetUserId?.split('@')[1] ?? '';
  const myServer = identity?.user_id?.split('@')[1] ?? '';
  const isCrossServer = !isOwnProfile && !!targetServer && !!myServer && targetServer !== myServer;

  useEffect(() => {
    if (authLoading) return;
    if (!identity?.home_server || !targetUserId) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      // Serve from cache immediately for instant display (stale-while-revalidate)
      const cached = getProfile(targetUserId);
      if (cached) {
        setProfileState(cached.data.profile);
        if (cached.data.did) setDid(cached.data.did);
        if (typeof cached.data.isFollowing === 'boolean') setIsFollowingTarget(cached.data.isFollowing);
        setLoading(false);
        // fall through — still do a background refresh to get fresh counts
      } else {
        setLoading(true);
      }

      setError(null);

      try {
        let url: string;
        if (isOwnProfile) {
          url = `${identity.home_server}/user/me?user_id=${encodeURIComponent(targetUserId)}`;
        } else if (isCrossServer) {
          // Federated lookup: proxy through home server's /search endpoint
          url = `${identity.home_server}/search?q=${encodeURIComponent(targetUserId)}`;
        } else {
          // Fetch another user's public profile, passing viewer_id for is_following
          url = `${identity.home_server}/user/search?user_id=${encodeURIComponent(targetUserId)}&viewer_id=${encodeURIComponent(identity.user_id)}`;
        }

        const res = await fetch(url);

        if (!res.ok) {
          if (res.status === 404) {
            setProfileState(null);
            return;
          }
          const errorText = await res.text();
          throw new Error(`Failed to fetch profile (${res.status}): ${errorText}`);
        }

        const data = await res.json();

        let profileData: Profile | null = null;
        if (isCrossServer) {
          // Federated response: { found, user: { user_id, display_name, avatar_url, bio, ... } }
          if (!data.found || !data.user) {
            setProfileState(null);
            return;
          }
          const u = data.user;
          profileData = {
            user_id: u.user_id ?? targetUserId,
            display_name: u.display_name ?? u.username ?? targetUserId.split('@')[0],
            avatar_url: u.avatar_url ?? null,
            banner_url: u.banner_url ?? null,
            bio: u.bio ?? null,
            location: u.location ?? null,
            portfolio_url: u.portfolio_url ?? null,
            followers_visibility: 'public',
            following_visibility: 'public',
            followers_count: u.followers_count ?? 0,
            following_count: u.following_count ?? 0,
            created_at: u.created_at ?? new Date().toISOString(),
            updated_at: u.updated_at ?? new Date().toISOString(),
          };
        } else {
          profileData = data.profile ?? data.user ?? null;
          if (typeof data.is_following === 'boolean') setIsFollowingTarget(data.is_following);
        }

        setProfileState(profileData);

        let didVal = null;
        if (data.identity?.did) {
          didVal = data.identity.did;
          setDid(data.identity.did);
        } else if (data.data?.identity?.did) {
          didVal = data.data.identity.did;
          setDid(data.data.identity.did);
        }

        if (profileData) {
          // Normalised shape matches profileService.ts so all readers are consistent
          setProfile(targetUserId, {
            profile: profileData,
            identity: data.identity ?? null,
            isFollowing: typeof data.is_following === 'boolean' ? data.is_following : undefined,
            did: didVal,
          });
        }

      } catch (err: any) {
        console.error("Profile fetch error:", err);
        if (!profile) setError(err.message ?? "Unexpected error");
      } finally {
        setLoading(false);
      }
    };

    const fetchPosts = async () => {
      setLoadingPosts(true);
      try {
        const base = identity.home_server;
        const uid = encodeURIComponent(targetUserId);
        const vid = encodeURIComponent(identity.user_id);

        if (isCrossServer) {
          // Cross-server: only fetch federated posts (replies/likes not available remotely)
          const postsRes = await fetch(`${base}/api/posts/federated?user_id=${uid}&viewer_id=${vid}`);
          if (postsRes.ok) {
            const data = await postsRes.json();
            setPosts(data.posts || []);
          }
        } else {
          const [postsRes, repliesRes, likesRes] = await Promise.all([
            fetch(`${base}/posts/user?user_id=${uid}&viewer_id=${vid}`),
            fetch(`${base}/posts/user/replies?user_id=${uid}`),
            fetch(`${base}/posts/user/likes?user_id=${uid}&viewer_id=${vid}`),
          ]);

          if (postsRes.ok) {
            const data = await postsRes.json();
            setPosts(data.posts || []);
          }
          if (repliesRes.ok) {
            const data = await repliesRes.json();
            setReplies(data.replies || []);
          }
          if (likesRes.ok) {
            const data = await likesRes.json();
            setLikedPosts(data.posts || []);
          }
        }
      } catch (err) {
        console.error('Error fetching posts/replies/likes:', err);
      } finally {
        setLoadingPosts(false);
      }
    };

    fetchProfile();
    fetchPosts();
  }, [authLoading, identity, targetUserId]);


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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bat-black text-bat-gray">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bat-yellow"></div>
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

  return (
    <main className="min-h-screen bg-bat-black">
      <ProfileCard
        profile={profile}
        isOwnProfile={isOwnProfile}
        isFollowing={isFollowingTarget}
        posts={posts}
        replies={replies}
        likedPosts={likedPosts}
        loadingPosts={loadingPosts}
        did={did || undefined}
        onFollowChange={(delta) => {
          setProfileState(prev => {
            if (!prev) return prev;
            const updated = {
              ...prev,
              followers_count: Math.max(0, (prev.followers_count ?? 0) + delta),
            };
            // Keep cache in sync so next visit shows correct count
            setProfile(targetUserId!, { profile: updated, did });
            return updated;
          });
          setIsFollowingTarget(prev => !prev);
        }}
      />
    </main>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-bat-black">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bat-yellow" />
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
