// Vercel Serverless Function
const ICTU_BASE_URL = 'https://apps.ictu.edu.vn:9087';

export default async function handler(req, res) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-APP-ID, x-request-signature');
        res.setHeader('Access-Control-Max-Age', '86400');
        return res.status(204).end();
    }

    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { id } = req.query;

    if (!id || !/^\d+$/.test(id)) {
        return res.status(400).json({ error: 'Invalid image ID' });
    }

    // Build target URL
    const targetUrl = `${ICTU_BASE_URL}/ionline/api/media/${id}`;

    // Build headers
    const headers = {
        'Accept': 'image/*',
        'Origin': 'https://lms.ictu.edu.vn',
        'Referer': 'https://lms.ictu.edu.vn/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    };

    // Forward auth headers from request
    if (req.headers['x-app-id']) headers['X-APP-ID'] = req.headers['x-app-id'];
    if (req.headers['x-request-signature']) headers['x-request-signature'] = req.headers['x-request-signature'];
    if (req.headers['authorization']) headers['Authorization'] = req.headers['authorization'];

    try {
        const response = await fetch(targetUrl, {
            method: 'GET',
            headers,
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: `Failed to fetch image: ${response.status}` });
        }

        // Get image data
        const imageBuffer = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'image/jpeg';

        res.setHeader('Content-Type', contentType);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

        return res.send(Buffer.from(imageBuffer));
    } catch (error) {
        console.error('Proxy error:', error);
        return res.status(500).json({ error: 'Proxy error', message: error.message });
    }
}
