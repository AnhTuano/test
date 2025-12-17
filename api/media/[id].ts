export const config = {
    runtime: 'edge',
};

const ICTU_BASE_URL = 'https://apps.ictu.edu.vn:9087';

export default async function handler(request: Request) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-APP-ID, x-request-signature',
                'Access-Control-Max-Age': '86400',
            },
        });
    }

    // Only allow GET requests
    if (request.method !== 'GET') {
        return new Response('Method not allowed', { status: 405 });
    }

    const url = new URL(request.url);

    // Extract image ID from URL path: /api/media/318782 -> 318782
    const pathParts = url.pathname.split('/');
    const imageId = pathParts[pathParts.length - 1];

    if (!imageId || !/^\d+$/.test(imageId)) {
        return new Response('Invalid image ID', { status: 400 });
    }

    // Build target URL
    const targetUrl = `${ICTU_BASE_URL}/ionline/api/media/${imageId}`;

    // Build headers with ICTU origin
    const headers = new Headers();
    headers.set('Accept', 'image/*');
    headers.set('Origin', 'https://lms.ictu.edu.vn');
    headers.set('Referer', 'https://lms.ictu.edu.vn/');
    headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    // Forward auth headers from request
    const xAppId = request.headers.get('X-APP-ID');
    const xSignature = request.headers.get('x-request-signature');
    const authorization = request.headers.get('Authorization');

    if (xAppId) headers.set('X-APP-ID', xAppId);
    if (xSignature) headers.set('x-request-signature', xSignature);
    if (authorization) headers.set('Authorization', authorization);

    try {
        const response = await fetch(targetUrl, {
            method: 'GET',
            headers,
        });

        if (!response.ok) {
            return new Response(`Failed to fetch image: ${response.status}`, {
                status: response.status
            });
        }

        // Get image data
        const imageData = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'image/jpeg';

        return new Response(imageData, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: 'Proxy error', message: error.message }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        });
    }
}
