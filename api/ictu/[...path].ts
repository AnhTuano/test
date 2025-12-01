export const config = {
  runtime: 'edge',
};

const ICTU_BASE_URL = 'https://apps.ictu.edu.vn:9087';

export default async function handler(request: Request) {
  const url = new URL(request.url);
  
  // Get the actual API path from the URL
  // /api/ictu/login -> /ionline/api/login
  const apiPath = url.pathname.replace('/api/ictu', '/ionline/api');
  const targetUrl = `${ICTU_BASE_URL}${apiPath}${url.search}`;

  // Build headers with ICTU origin
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  headers.set('Accept', 'application/json, text/plain, */*');
  headers.set('Origin', 'https://lms.ictu.edu.vn');
  headers.set('Referer', 'https://lms.ictu.edu.vn/');
  headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

  // Forward auth headers
  const xAppId = request.headers.get('X-APP-ID');
  const xSignature = request.headers.get('x-request-signature');
  const authorization = request.headers.get('Authorization');

  if (xAppId) headers.set('X-APP-ID', xAppId);
  if (xSignature) headers.set('x-request-signature', xSignature);
  if (authorization) headers.set('Authorization', authorization);

  try {
    const fetchOptions: RequestInit = {
      method: request.method,
      headers,
    };

    // Forward body for POST/PUT
    if (request.method === 'POST' || request.method === 'PUT') {
      fetchOptions.body = await request.text();
    }

    const response = await fetch(targetUrl, fetchOptions);
    const data = await response.text();

    return new Response(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-APP-ID, x-request-signature',
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Proxy error', message: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
