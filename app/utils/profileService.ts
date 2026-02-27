/**
 * profileService.ts
 *
 * Centralised profile-fetching utility that implements the
 * Stale-While-Revalidate (SWR) caching policy used across the app
 * (mirrors the pattern in profile/page.tsx and search/page.tsx).
 *
 * Cache tiers:
 *   FRESH  (<5 min old)  → served immediately, no network request.
 *   STALE  (5-30 min)    → served immediately AND a background fetch
 *                          updates the cache; `onBackground` is called
 *                          with the fresh payload so UI can update.
 *   ABSENT / EXPIRED     → awaited synchronously, cached, returned.
 */

import type { LocalIdentity } from '../context/AuthContext';
import type { CacheContextType } from '../context/CacheContext';

// ─── Types ───────────────────────────────────────────────────────────────────
// We use a loose shape since the server may return extra fields at any time.
export type RawApiData = Record<string, unknown>;

export interface NormalisedProfile {
    profile: RawApiData;
    identity: RawApiData | null;
    isFollowing?: boolean;
}

// ─── Response normalisation ───────────────────────────────────────────────────
/**
 * Both /user/me and /user/search return slightly different shapes; this
 * produces the canonical { profile, identity, isFollowing } object that
 * the rest of the app uses (same shape that profile/page.tsx stores).
 */
export function normaliseProfileResponse(data: RawApiData): NormalisedProfile {
    const profile = (data.profile ?? data.user ?? data) as RawApiData;
    const identity = (data.identity ?? null) as RawApiData | null;
    const isFollowing =
        typeof data.is_following === 'boolean' ? data.is_following : undefined;
    return { profile, identity, isFollowing };
}

// ─── Low-level fetch (no caching) ────────────────────────────────────────────
/**
 * Hits the same server endpoints as profile/page.tsx and search/page.tsx.
 * Returns null on any error or non-2xx response.
 */
export async function fetchProfileFromServer(
    userId: string,
    identity: LocalIdentity
): Promise<NormalisedProfile | null> {
    try {
        const isSelf = userId === identity.user_id;
        const url = isSelf
            ? `${identity.home_server}/user/me?user_id=${encodeURIComponent(userId)}`
            : `${identity.home_server}/user/search?user_id=${encodeURIComponent(userId)}&viewer_id=${encodeURIComponent(identity.user_id)}`;

        const res = await fetch(url);
        if (!res.ok) return null;

        const raw = (await res.json()) as RawApiData;
        return normaliseProfileResponse(raw);
    } catch {
        return null;
    }
}

// ─── Background revalidation helper ──────────────────────────────────────────
function revalidateInBackground(
    userId: string,
    identity: LocalIdentity,
    setProfile: CacheContextType['setProfile'],
    onBackground?: (userId: string, fresh: NormalisedProfile) => void
): void {
    fetchProfileFromServer(userId, identity)
        .then(fresh => {
            if (!fresh) return;
            setProfile(userId, fresh);          // write to localStorage cache
            onBackground?.(userId, fresh);      // notify caller so UI can update
        })
        .catch(() => {
            // Background revalidation failed — keep serving stale data
        });
}

// ─── SWR fetch ────────────────────────────────────────────────────────────────
/**
 * Fetch a profile using Stale-While-Revalidate.
 *
 * @param userId      The full federated user_id to look up.
 * @param identity    The logged-in user's identity (provides home_server + viewer_id).
 * @param cache       The CacheContext object (getProfile / setProfile).
 * @param onBackground  Optional callback invoked with fresh data when a
 *                      background revalidation completes. Use this to re-render.
 *
 * @returns { data, fromCache }
 *   data      – the normalised profile payload, or null on fetch failure.
 *   fromCache – true when the returned data came from the local cache.
 */
export async function fetchProfileSWR(
    userId: string,
    identity: LocalIdentity,
    cache: Pick<CacheContextType, 'getProfile' | 'setProfile'>,
    onBackground?: (userId: string, fresh: NormalisedProfile) => void
): Promise<{ data: NormalisedProfile | null; fromCache: boolean }> {
    const cached = cache.getProfile(userId);

    if (cached) {
        if (!cached.isStale) {
            // FRESH — serve immediately, skip any network request
            return { data: cached.data, fromCache: true };
        }
        // STALE — serve immediately AND revalidate in background
        revalidateInBackground(userId, identity, cache.setProfile, onBackground);
        return { data: cached.data, fromCache: true };
    }

    // ABSENT / EXPIRED — synchronous fetch
    const fresh = await fetchProfileFromServer(userId, identity);
    if (fresh) cache.setProfile(userId, fresh);
    return { data: fresh, fromCache: false };
}

// ─── Convenience: bulk pre-fetch many profiles ───────────────────────────────
/**
 * Fires SWR fetches for a list of user IDs in parallel.
 * FRESH entries are served from cache with no network cost.
 * STALE entries are served from cache and revalidated in the background.
 * Only ABSENT entries cause real network requests.
 *
 * @param userIds   List of federated user IDs to pre-fetch.
 * @param identity  Logged-in user identity.
 * @param cache     CacheContext.
 * @param onEach    Called with (userId, freshData) whenever a profile loads
 *                  (both from cache and from network).
 */
export async function prefetchProfiles(
    userIds: string[],
    identity: LocalIdentity,
    cache: Pick<CacheContextType, 'getProfile' | 'setProfile'>,
    onEach?: (userId: string, data: NormalisedProfile) => void
): Promise<void> {
    await Promise.all(
        userIds.map(uid =>
            fetchProfileSWR(uid, identity, cache, onEach).then(({ data }) => {
                if (data) onEach?.(uid, data);
            })
        )
    );
}
