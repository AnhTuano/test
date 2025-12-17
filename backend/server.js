const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-APP-ID', 'x-request-signature']
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Image proxy endpoint
app.get('/api/media/:id', async (req, res) => {
    const { id } = req.params;

    // Validate image ID
    if (!id || !/^\d+$/.test(id)) {
        return res.status(400).json({ error: 'Invalid image ID' });
    }

    // Get auth headers from request
    const authorization = req.headers.authorization;
    const xAppId = req.headers['x-app-id'];
    const xSignature = req.headers['x-request-signature'];

    if (!authorization) {
        return res.status(401).json({ error: 'Missing authorization header' });
    }

    const LMS_BASE_URL = 'https://apps.ictu.edu.vn:9087';
    const imageUrl = `${LMS_BASE_URL}/ionline/api/media/${id}`;

    try {
        // Fetch image from LMS
        const headers = {
            'Authorization': authorization,
            'Accept': 'image/*',
            'Origin': 'https://lms.ictu.edu.vn',
            'Referer': 'https://lms.ictu.edu.vn/',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        };

        if (xAppId) headers['X-APP-ID'] = xAppId;
        if (xSignature) headers['x-request-signature'] = xSignature;

        console.log(`[${new Date().toISOString()}] Fetching image ${id} from LMS...`);

        const response = await fetch(imageUrl, {
            method: 'GET',
            headers
        });

        if (!response.ok) {
            console.error(`[${new Date().toISOString()}] LMS returned ${response.status} for image ${id}`);
            return res.status(response.status).json({
                error: `Failed to fetch image from LMS: ${response.status}`
            });
        }

        // Get image data
        const imageBuffer = await response.buffer();
        const contentType = response.headers.get('content-type') || 'image/jpeg';

        console.log(`[${new Date().toISOString()}] Successfully fetched image ${id} (${imageBuffer.length} bytes)`);

        // Set response headers
        res.set({
            'Content-Type': contentType,
            'Content-Length': imageBuffer.length,
            'Cache-Control': 'public, max-age=31536000, immutable',
            'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*'
        });

        // Send image
        res.send(imageBuffer);

    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error fetching image ${id}:`, error.message);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`🚀 Backend server running on port ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/health`);
    console.log(`🖼️  Image proxy: http://localhost:${PORT}/api/media/:id`);
});
