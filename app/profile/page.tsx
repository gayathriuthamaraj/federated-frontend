"use client";

import { useEffect, useState } from 'react';
import ProfileCard from '../components/ProfileCard';
import PostCard from '../components/PostCard';
import { useAuth } from '../context/AuthContext';
import { Profile } from '../types/profile';
import { useCache } from '../context/CacheContext';

interface Post {
  id: string;
  author: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export default function ProfilePage() {
  const { identity, isLoading: authLoading } = useAuth();
  const { getProfile, setProfile } = useCache();

  const [profile, setProfileState] = useState<Profile | null>(null);
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

    const fetchProfile = async () => {
      
      const cached = getProfile(identity.user_id);
      if (cached) {
        setProfileState(cached.profile);
        if (cached.did) setDid(cached.did);
        setLoading(false);
        
        return;
      }

      setLoading(true);
      setError(null);

      try {
        
        const url = `${identity.home_server}/user/me?user_id=${encodeURIComponent(identity.user_id)}`;

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
        const profileData = data.profile ?? data.user ?? null;
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
          setProfile(identity.user_id, { profile: profileData, did: didVal });
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
        const res = await fetch(`${identity.home_server}/posts/user?user_id=${encodeURIComponent(identity.user_id)}&viewer_id=${encodeURIComponent(identity.user_id)}`);
        if (res.ok) {
          const data = await res.json();
          setPosts(data.posts || []);
        }
      } catch (err) {
        console.error('Error fetching posts:', err);
      } finally {
        setLoadingPosts(false);
      }
    };

    fetchProfile();
    fetchPosts();
  }, [authLoading, identity]);


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
