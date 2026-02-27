




function getApiBaseUrl(): string {
    if (typeof window === 'undefined') return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

    const trusted = localStorage.getItem('trusted_server');
    if (trusted) {
        try {
            const data = JSON.parse(trusted);
            return data.server_url || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
        } catch (e) {
            return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
        }
    }

    return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
}

interface FetchOptions extends RequestInit {
    requiresAuth?: boolean;
}


export async function authenticatedFetch(
    endpoint: string,
    options: FetchOptions = {}
): Promise<Response> {
    const { requiresAuth = true, ...fetchOptions } = options;


    let accessToken = localStorage.getItem('access_token');


    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(fetchOptions.headers || {}),
    };

    if (requiresAuth && accessToken) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
    }


    let response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
        ...fetchOptions,
        headers,
    });


    if (response.status === 401 && requiresAuth) {
        const refreshToken = localStorage.getItem('refresh_token');

        if (refreshToken) {
            try {
                const refreshResponse = await fetch(`${getApiBaseUrl()}/refresh-token`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ refresh_token: refreshToken }),
                });

                if (refreshResponse.ok) {
                    const data = await refreshResponse.json();
                    localStorage.setItem('access_token', data.access_token);


                    (headers as Record<string, string>)['Authorization'] = `Bearer ${data.access_token}`;
                    response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
                        ...fetchOptions,
                        headers,
                    });
                } else {

                    localStorage.removeItem('local_identity');
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    window.location.href = '/login';
                }
            } catch (error) {
                console.error('Token refresh failed:', error);

                localStorage.removeItem('local_identity');
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/login';
            }
        } else {

            window.location.href = '/login';
        }
    }

    return response;
}


export async function apiGet(endpoint: string, requiresAuth = true): Promise<Response> {
    return authenticatedFetch(endpoint, {
        method: 'GET',
        requiresAuth,
    });
}


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


export async function apiDelete(endpoint: string, requiresAuth = true): Promise<Response> {
    return authenticatedFetch(endpoint, {
        method: 'DELETE',
        requiresAuth,
    });
}
