import { RATE_LIMIT_WINDOW, RATE_LIMIT_MAX } from './config';

// Rate Limiter State
let requestTimestamps: number[] = [];
let isBanned = false;

/**
 * Check if request should be rate limited
 * Throws error if rate limit exceeded or user is banned
 */
export const checkRateLimit = () => {
    if (isBanned) throw new Error("SECURITY_LOCKOUT");

    const currentUserRole = localStorage.getItem('ictu_role');
    if (currentUserRole === 'ADMIN') return; // Skip rate limiting for admins

    const now = Date.now();
    requestTimestamps = requestTimestamps.filter(t => now - t < RATE_LIMIT_WINDOW);
    requestTimestamps.push(now);

    if (requestTimestamps.length > RATE_LIMIT_MAX) {
        isBanned = true;
        window.dispatchEvent(new CustomEvent('security-lockout', { detail: { duration: 180 } }));

        throw new Error("SECURITY_LOCKOUT");
    }
};

/**
 * Trigger security lockout manually
 */
export const triggerSecurityLockout = () => {
    isBanned = true;
    window.dispatchEvent(new CustomEvent('security-lockout', { detail: { duration: 180 } }));
};

/**
 * Reset security lockout state
 */
export const resetSecurityLockout = () => {
    isBanned = false;
    requestTimestamps = [];
};

/**
 * Get current request timestamps (for metrics)
 */
export const getRequestTimestamps = () => requestTimestamps;

/**
 * Check if currently banned
 */
export const isBannedStatus = () => isBanned;
