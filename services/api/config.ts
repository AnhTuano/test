// API Configuration Constants

export const API_TIMEOUT = 15000; // 15 seconds
export const RATE_LIMIT_WINDOW = 1000; // 1 second
export const RATE_LIMIT_MAX = 30; // 30 requests per second

// Check if running on localhost
export const isLocalhost = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

/**
 * Build API URL based on environment
 * - Localhost: Use Vite proxy directly
 * - Production: Use Edge Function with path as query param
 */
export const buildApiUrl = (path: string, params?: URLSearchParams): string => {
    if (isLocalhost) {
        // Local dev uses Vite proxy directly
        const queryString = params ? `?${params.toString()}` : '';
        return `/ionline/api${path}${queryString}`;
    } else {
        // Production uses Edge Function with path as query param
        const searchParams = params || new URLSearchParams();
        searchParams.set('path', path);
        return `/api/ictu?${searchParams.toString()}`;
    }
};
