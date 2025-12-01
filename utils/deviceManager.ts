/**
 * Device Fingerprinting & Management
 * Tạo dấu vân tay thiết bị duy nhất để tracking và security
 */

export interface DeviceFingerprint {
  deviceId: string;
  userAgent: string;
  screenResolution: string;
  timezone: string;
  language: string;
  platform: string;
  timestamp: number;
}

export interface DeviceInfo {
  browser: string;
  os: string;
  device: string;
}

// Helper to hash string using SHA-256
async function simpleHash(str: string): Promise<string> {
  if (window.crypto && window.crypto.subtle) {
    const msgBuffer = new TextEncoder().encode(str);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  // Fallback: djb2 hash
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
  }
  return Math.abs(hash).toString(16);
}

// Canvas fingerprinting
async function getCanvasFingerprint(): Promise<string | null> {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.textBaseline = 'top';
    ctx.font = '14px "Arial"';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('ICTU Portal', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Device ID', 4, 17);

    return canvas.toDataURL();
  } catch (e) {
    return null;
  }
}

// WebGL fingerprinting
function getWebGLFingerprint(): string | null {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl || !(gl instanceof WebGLRenderingContext)) return null;

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return null;

    const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    return `${vendor}~${renderer}`;
  } catch (e) {
    return null;
  }
}

/**
 * Generate unique device fingerprint
 */
export async function generateDeviceFingerprint(): Promise<string> {
  const components = [
    navigator.userAgent,
    navigator.language,
    navigator.platform,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 'unknown',
    navigator.maxTouchPoints || 0,
  ];

  const canvasFingerprint = await getCanvasFingerprint();
  if (canvasFingerprint) {
    components.push(canvasFingerprint);
  }

  const webglFingerprint = getWebGLFingerprint();
  if (webglFingerprint) {
    components.push(webglFingerprint);
  }

  const fingerprint = components.join('|');
  const hash = await simpleHash(fingerprint);
  return hash;
}

/**
 * Save device fingerprint to localStorage
 */
export function saveDeviceFingerprint(fingerprint: string): void {
  const deviceInfo: DeviceFingerprint = {
    deviceId: fingerprint,
    userAgent: navigator.userAgent,
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    platform: navigator.platform,
    timestamp: Date.now(),
  };
  
  localStorage.setItem('device_fingerprint', JSON.stringify(deviceInfo));
}

/**
 * Clear device fingerprint from localStorage
 */
export function clearDeviceFingerprint(): void {
  localStorage.removeItem('device_fingerprint');
}

/**
 * Get human-readable device info
 */
export function getDeviceInfo(): DeviceInfo {
  const ua = navigator.userAgent;
  
  // Detect browser
  let browser = 'Unknown Browser';
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Edg')) browser = 'Edge';
  
  // Detect OS
  let os = 'Unknown OS';
  if (ua.includes('Win')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS')) os = 'iOS';
  
  // Detect device type
  let device = 'Desktop';
  if (/Mobi|Android/i.test(ua)) device = 'Mobile';
  else if (/Tablet|iPad/i.test(ua)) device = 'Tablet';
  
  return { browser, os, device };
}
