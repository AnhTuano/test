/**
 * Debug utility for development logging
 * Automatically disabled in production
 */

const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export const logger = {
    log: (...args: any[]) => {
        if (isDev) {
            console.log(...args);
        }
    },

    error: (...args: any[]) => {
        if (isDev) {
            console.error(...args);
        }
    },

    warn: (...args: any[]) => {
        if (isDev) {
            console.warn(...args);
        }
    },

    info: (...args: any[]) => {
        if (isDev) {
            console.info(...args);
        }
    },

    // Always log errors in production (for monitoring)
    critical: (...args: any[]) => {
        console.error('[CRITICAL]', ...args);
    }
};
