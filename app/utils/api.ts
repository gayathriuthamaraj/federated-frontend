// API utility for making authenticated requests with automatic token refresh

const API_BASE_URL = 'http://localhost:8082';

interface FetchOptions extends RequestInit {
    requiresAuth?: boolean;
}

/**
 * Make an authenticated API call with automatic token refresh
 */
export async function authenticatedFetch(
    endpoint: string,
    options: FetchOptions = {}
): Promise<Response> {
    const { requiresAuth = true, ...fetchOptions } = options;

    // Get access token
    let accessToken = localStorage.getItem('access_token');

    // Build headers
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(fetchOptions.headers || {}),
    };

    if (requiresAuth && accessToken) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
    }

    // Make the request
    let response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...fetchOptions,
        headers,
    });

    // If unauthorized, try to refresh the token and retry
    if (response.status === 401 && requiresAuth) {
        const refreshToken = localStorage.getItem('refresh_token');

        if (refreshToken) {
            try {
                const refreshResponse = await fetch(`${API_BASE_URL}/refresh-token`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ refresh_token: refreshToken }),
                });

                if (refreshResponse.ok) {
                    const data = await refreshResponse.json();
                    localStorage.setItem('access_token', data.access_token);

                    // Retry the original request with new token
                    (headers as Record<string, string>)['Authorization'] = `Bearer ${data.access_token}`;
                    response = await fetch(`${API_BASE_URL}${endpoint}`, {
                        ...fetchOptions,
                        headers,
                    });
                } else {
                    // Refresh token is invalid - clear storage and redirect to login
                    localStorage.removeItem('local_identity');
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    window.location.href = '/login';
                }
            } catch (error) {
                console.error('Token refresh failed:', error);
                // Clear storage and redirect to login
                localStorage.removeItem('local_identity');
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/login';
            }
        } else {
            // No refresh token - redirect to login
            window.location.href = '/login';
        }
    }

    return response;
}

/**
 * Helper for GET requests
 */
export async function apiGet(endpoint: string, requiresAuth = true): Promise<Response> {
    return authenticatedFetch(endpoint, {
        method: 'GET',
        requiresAuth,
    });
}

/**
 * Helper for POST requests
 */
export async function apiPost(
    endpoint: string,
    data: any,
    requiresAuth = true
): Promise<Response> {
    return authenticatedFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(data),
        requiresAuth,
    });
}

/**
 * Helper for PUT requests
 */
export async function apiPut(
    endpoint: string,
    data: any,
    requiresAuth = true
): Promise<Response> {
    return authenticatedFetch(endpoint, {
        method: 'PUT',
        body: JSON.stringify(data),
        requiresAuth,
    });
}

/**
 * Helper for DELETE requests
 */
export async function apiDelete(endpoint: string, requiresAuth = true): Promise<Response> {
    return authenticatedFetch(endpoint, {
        method: 'DELETE',
        requiresAuth,
    });
}
