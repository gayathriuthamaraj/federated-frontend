"use client";

import React, { createContext, useContext, useCallback, ReactNode } from 'react';

// ─── TTL constants ────────────────────────────────────────────────────────────
// FRESH_TTL  – data younger than this is served as-is, no background refetch
// STALE_TTL  – data older than FRESH_TTL but younger than this is served
//              immediately AND revalidated in the background (SWR pattern).
//              Data older than STALE_TTL is considered expired (cache miss).
export const FRESH_TTL = 5 * 60 * 1000;   // 5 minutes
export const STALE_TTL = 30 * 60 * 1000;  // 30 minutes

// ─── Internal types ───────────────────────────────────────────────────────────
interface CacheEntry<T> {
    data: T;
    timestamp: number; // Date.now() at write time
}

/** What consumers receive from the cache */
export interface CacheStatus<T> {
    data: T;
    /** true when older than FRESH_TTL — caller should revalidate in background */
    isStale: boolean;
}

// ─── localStorage helpers ─────────────────────────────────────────────────────
function lsGet<T>(key: string): CacheEntry<T> | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        return JSON.parse(raw) as CacheEntry<T>;
    } catch {
        return null;
    }
}

function lsSet<T>(key: string, data: T): void {
    if (typeof window === 'undefined') return;
    try {
        const entry: CacheEntry<T> = { data, timestamp: Date.now() };
        localStorage.setItem(key, JSON.stringify(entry));
    } catch {
        // localStorage quota exceeded — silently ignore
    }
}

function lsDel(key: string): void {
    if (typeof window === 'undefined') return;
    try { localStorage.removeItem(key); } catch { /* ignore */ }
}

function cacheKey(namespace: string, ...parts: string[]): string {
    return `fsc:${namespace}:${parts.join(':')}`;
}

/** Resolves a raw cache entry to a CacheStatus, or null if expired / absent */
function resolveEntry<T>(entry: CacheEntry<T> | null): CacheStatus<T> | null {
    if (!entry) return null;
    const age = Date.now() - entry.timestamp;
    if (age > STALE_TTL) return null;              // fully expired
    return { data: entry.data, isStale: age > FRESH_TTL };
}

// ─── Context type ─────────────────────────────────────────────────────────────
export interface CacheContextType {
    // ── Profiles ──────────────────────────────────────────────────────────────
    /** Returns { data, isStale } or null if absent/expired */
    getProfile: (userId: string) => CacheStatus<any> | null;
    setProfile: (userId: string, data: any) => void;
    /** Evicts a profile from the cache so next read triggers a fresh fetch */
    invalidateProfile: (userId: string) => void;

    // ── Conversations list (keyed by the logged-in user's id) ─────────────────
    getConversations: (userId: string) => CacheStatus<any[]> | null;
    setConversations: (userId: string, data: any[]) => void;

    // ── Message thread (keyed by both participants; order-independent) ─────────
    getMessages: (userId: string, otherId: string) => CacheStatus<any[]> | null;
    setMessages: (userId: string, otherId: string, data: any[]) => void;

    // ── Posts (legacy — kept for backward compatibility with profile/page) ─────
    getPost: (postId: string) => any | null;
    setPost: (postId: string, data: any) => void;

    /** Removes every fsc:* key from localStorage */
    clearCache: () => void;
}

const CacheContext = createContext<CacheContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function CacheProvider({ children }: { children: ReactNode }) {

    const getProfile = useCallback((userId: string): CacheStatus<any> | null =>
        resolveEntry(lsGet(cacheKey('profile', userId))), []);

    const setProfile = useCallback((userId: string, data: any) =>
        lsSet(cacheKey('profile', userId), data), []);

    const invalidateProfile = useCallback((userId: string) =>
        lsDel(cacheKey('profile', userId)), []);

    const getConversations = useCallback((userId: string): CacheStatus<any[]> | null =>
        resolveEntry(lsGet<any[]>(cacheKey('convs', userId))), []);

    const setConversations = useCallback((userId: string, data: any[]) =>
        lsSet(cacheKey('convs', userId), data), []);

    const getMessages = useCallback((userId: string, otherId: string): CacheStatus<any[]> | null => {
        // Sort the two IDs so the key is order-independent
        const key = [userId, otherId].sort().join(':');
        return resolveEntry(lsGet<any[]>(cacheKey('msgs', key)));
    }, []);

    const setMessages = useCallback((userId: string, otherId: string, data: any[]) => {
        const key = [userId, otherId].sort().join(':');
        lsSet(cacheKey('msgs', key), data);
    }, []);

    // Legacy post cache (kept for backward compatibility)
    const getPost = useCallback((postId: string): any | null =>
        resolveEntry(lsGet<any>(cacheKey('post', postId)))?.data ?? null, []);

    const setPost = useCallback((postId: string, data: any) =>
        lsSet(cacheKey('post', postId), data), []);

    const clearCache = useCallback(() => {
        if (typeof window === 'undefined') return;
        const toDelete: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k?.startsWith('fsc:')) toDelete.push(k);
        }
        toDelete.forEach(k => localStorage.removeItem(k));
    }, []);

    return (
        <CacheContext.Provider value={{
            getProfile, setProfile, invalidateProfile,
            getConversations, setConversations,
            getMessages, setMessages,
            getPost, setPost,
            clearCache,
        }}>
            {children}
        </CacheContext.Provider>
    );
}

export function useCache() {
    const ctx = useContext(CacheContext);
    if (!ctx) throw new Error('useCache must be used within a CacheProvider');
    return ctx;
}
