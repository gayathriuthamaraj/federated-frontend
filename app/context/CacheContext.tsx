"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';


interface CacheData<T> {
    data: T;
    timestamp: number;
}

interface CacheContextType {
    
    getProfile: (username: string) => any | null;
    setProfile: (username: string, data: any) => void;
    
    getPost: (postId: string) => any | null;
    setPost: (postId: string, data: any) => void;
    
    clearCache: () => void;
}

const CacheContext = createContext<CacheContextType | undefined>(undefined);


const CACHE_DURATION = 5 * 60 * 1000;

export function CacheProvider({ children }: { children: ReactNode }) {
    const [profileCache, setProfileCache] = useState<Record<string, CacheData<any>>>({});
    const [postCache, setPostCache] = useState<Record<string, CacheData<any>>>({});

    const getProfile = (username: string) => {
        const item = profileCache[username];
        if (!item) return null;

        
        if (Date.now() - item.timestamp > CACHE_DURATION) {
            
            const newCache = { ...profileCache };
            delete newCache[username];
            setProfileCache(newCache);
            return null;
        }

        return item.data;
    };

    const setProfile = (username: string, data: any) => {
        setProfileCache(prev => ({
            ...prev,
            [username]: {
                data,
                timestamp: Date.now()
            }
        }));
    };

    const getPost = (postId: string) => {
        const item = postCache[postId];
        if (!item) return null;
        if (Date.now() - item.timestamp > CACHE_DURATION) return null;
        return item.data;
    };

    const setPost = (postId: string, data: any) => {
        setPostCache(prev => ({
            ...prev,
            [postId]: {
                data,
                timestamp: Date.now()
            }
        }));
    };

    const clearCache = () => {
        setProfileCache({});
        setPostCache({});
    };

    return (
        <CacheContext.Provider value={{ getProfile, setProfile, getPost, setPost, clearCache }}>
            {children}
        </CacheContext.Provider>
    );
}

export function useCache() {
    const context = useContext(CacheContext);
    if (context === undefined) {
        throw new Error('useCache must be used within a CacheProvider');
    }
    return context;
}
