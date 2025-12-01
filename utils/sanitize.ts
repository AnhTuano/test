/**
 * Input Sanitization Utilities
 * Bảo vệ khỏi XSS và SQL Injection
 */

/**
 * Escape HTML special characters to prevent XSS
 */
export function escapeHtml(str: string): string {
  if (!str || typeof str !== 'string') return '';
  
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };
  
  return str.replace(/[&<>"'`=/]/g, char => htmlEscapes[char]);
}

/**
 * Remove HTML tags from string
 */
export function stripHtml(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '');
}

/**
 * Sanitize string for safe display (combines escapeHtml and trim)
 */
export function sanitizeDisplayText(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return escapeHtml(str.trim());
}

/**
 * Validate and sanitize username (alphanumeric, underscore, dash only)
 */
export function sanitizeUsername(username: string): string {
  if (!username || typeof username !== 'string') return '';
  // Remove any characters that aren't alphanumeric, underscore, dash, or dot
  return username.trim().toLowerCase().replace(/[^a-z0-9._-]/gi, '');
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim());
}

/**
 * Check for potential SQL injection patterns
 */
export function hasSqlInjection(str: string): boolean {
  if (!str || typeof str !== 'string') return false;
  
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC|EXECUTE)\b)/i,
    /(--)|(\/\*)|(\*\/)/,  // SQL comments
    /(;|\||\||&&)/,        // Command separators
    /('|"|`)\s*(OR|AND)\s*('|"|`)/i,  // Classic SQL injection
    /(\bOR\b|\bAND\b)\s+\d+\s*=\s*\d+/i,  // OR 1=1 pattern
  ];
  
  return sqlPatterns.some(pattern => pattern.test(str));
}

/**
 * Check for potential XSS patterns
 */
export function hasXssPattern(str: string): boolean {
  if (!str || typeof str !== 'string') return false;
  
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,  // onclick, onerror, etc.
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /data:text\/html/gi,
    /expression\s*\(/gi,  // CSS expression
  ];
  
  return xssPatterns.some(pattern => pattern.test(str));
}

/**
 * Full input validation - returns cleaned string or null if malicious
 */
export function validateInput(str: string): string | null {
  if (!str || typeof str !== 'string') return '';
  
  const trimmed = str.trim();
  
  // Check for malicious patterns
  if (hasSqlInjection(trimmed) || hasXssPattern(trimmed)) {
    return null; // Reject malicious input
  }
  
  return sanitizeDisplayText(trimmed);
}

/**
 * Sanitize object values recursively
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized = { ...obj };
  
  for (const key in sanitized) {
    const value = sanitized[key];
    if (typeof value === 'string') {
      (sanitized as Record<string, unknown>)[key] = escapeHtml(value);
    } else if (typeof value === 'object' && value !== null) {
      (sanitized as Record<string, unknown>)[key] = sanitizeObject(value as Record<string, unknown>);
    }
  }
  
  return sanitized;
}

/**
 * Generate secure random string for tokens/IDs
 */
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => chars[byte % chars.length]).join('');
}
