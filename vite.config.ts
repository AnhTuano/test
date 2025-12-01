import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/ionline': {
            target: 'https://apps.ictu.edu.vn:9087',
            changeOrigin: true,
            secure: false, // Ignore SSL self-signed certs
            timeout: 20000,
            configure: (proxy, _options) => {
                proxy.on('error', (err, _req, _res) => {
                    
                });
                proxy.on('proxyReq', (proxyReq, req, _res) => {
                    // Override headers to match ICTU LMS requirements
                    proxyReq.setHeader('Origin', 'https://lms.ictu.edu.vn');
                    proxyReq.setHeader('Referer', 'https://lms.ictu.edu.vn/');
                    proxyReq.setHeader('Host', 'apps.ictu.edu.vn:9087');
                    
                    // IMPORTANT: Fake desktop User-Agent to bypass mobile restriction
                    proxyReq.setHeader('User-Agent', 
                      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    );
                    
                    console.log('🔄 Proxy Request:', {
                        method: req.method,
                        url: req.url
                    });
                });
                proxy.on('proxyRes', (proxyRes, req, _res) => {
                    console.log('📨 Proxy Response:', {
                        status: proxyRes.statusCode,
                        url: req.url
                    });
                });
            }
          }
        }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
