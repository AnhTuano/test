/**
 * Get client's real IP address
 * Uses multiple fallback methods
 */

let cachedIP: string | null = null;
let cacheExpiry: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getClientIP(): Promise<string> {
  // Return cached IP if still valid
  if (cachedIP && Date.now() < cacheExpiry) {
    return cachedIP;
  }

  try {
    // Try ipify first (most reliable)
    const response = await fetch('https://api.ipify.org?format=json', {
      method: 'GET',
      signal: AbortSignal.timeout(3000) // 3 second timeout
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.ip) {
        cachedIP = data.ip;
        cacheExpiry = Date.now() + CACHE_DURATION;
        return data.ip;
      }
    }
  } catch (e) {
    // Try fallback
  }

  try {
    // Fallback to ip-api
    const response = await fetch('http://ip-api.com/json/?fields=query', {
      method: 'GET',
      signal: AbortSignal.timeout(3000)
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.query) {
        cachedIP = data.query;
        cacheExpiry = Date.now() + CACHE_DURATION;
        return data.query;
      }
    }
  } catch (e) {
    // Final fallback
  }

  // Return unknown if all methods fail
  return 'Unknown';
}
