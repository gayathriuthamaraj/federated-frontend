"use client";

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';

interface CloseFriend {
    friend_id: string;
    display_name: string;
}

interface CloseFriendsContextType {
    closeFriends: Set<string>;
    closeFriendsList: CloseFriend[];
    addCloseFriend: (friendId: string) => Promise<void>;
    removeCloseFriend: (friendId: string) => Promise<void>;
    refresh: () => Promise<void>;
}

const CloseFriendsContext = createContext<CloseFriendsContextType>({
    closeFriends: new Set(),
    closeFriendsList: [],
    addCloseFriend: async () => {},
    removeCloseFriend: async () => {},
    refresh: async () => {},
});

export function CloseFriendsProvider({ children }: { children: React.ReactNode }) {
    const { identity } = useAuth();
    const [closeFriends, setCloseFriends] = useState<Set<string>>(new Set());
    const [closeFriendsList, setCloseFriendsList] = useState<CloseFriend[]>([]);

    const refresh = useCallback(async () => {
        if (!identity) return;
        try {
            const res = await fetch(
                `${identity.home_server}/close-friends?user_id=${encodeURIComponent(identity.user_id)}`
            );
            if (!res.ok) return;
            const data = await res.json();
            const list: CloseFriend[] = data.friends ?? [];
            setCloseFriendsList(list);
            setCloseFriends(new Set(list.map(f => f.friend_id)));
        } catch {
            // silently ignore network errors
        }
    }, [identity]);

    // Load on mount and whenever identity changes
    useEffect(() => {
        let active = true;
        if (!identity) return;
        (async () => {
            try {
                const res = await fetch(
                    `${identity.home_server}/close-friends?user_id=${encodeURIComponent(identity.user_id)}`
                );
                if (!res.ok || !active) return;
                const data = await res.json();
                const list: CloseFriend[] = data.friends ?? [];
                if (active) {
                    setCloseFriendsList(list);
                    setCloseFriends(new Set(list.map(f => f.friend_id)));
                }
            } catch { /* ignored */ }
        })();
        return () => { active = false; };
    }, [identity]);

    const addCloseFriend = async (friendId: string) => {
        if (!identity) return;
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') ?? '' : '';
        await fetch(`${identity.home_server}/close-friends`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ user_id: identity.user_id, friend_id: friendId }),
        });
        await refresh();
    };

    const removeCloseFriend = async (friendId: string) => {
        if (!identity) return;
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') ?? '' : '';
        await fetch(`${identity.home_server}/close-friends/remove`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ user_id: identity.user_id, friend_id: friendId }),
        });
        await refresh();
    };

    return (
        <CloseFriendsContext.Provider value={{ closeFriends, closeFriendsList, addCloseFriend, removeCloseFriend, refresh }}>
            {children}
        </CloseFriendsContext.Provider>
    );
}

export const useCloseFriends = () => useContext(CloseFriendsContext);
