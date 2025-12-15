import { describe, it, expect } from 'vitest';
import { validateInput, hasSqlInjection, hasXssPattern, sanitizeUsername } from '../../utils/sanitize';

describe('sanitize utilities', () => {
    describe('validateInput', () => {
        it('should reject SQL injection patterns', () => {
            const malicious = "admin' OR '1'='1";
            const result = validateInput(malicious);
            expect(result).toBeNull();
        });

        it('should reject XSS script tags', () => {
            const malicious = '<script>alert("XSS")</script>';
            const result = validateInput(malicious);
            expect(result).toBeNull();
        });

        it('should allow and sanitize normal text', () => {
            const normal = 'John Doe';
            const result = validateInput(normal);
            expect(result).toBe(normal);
        });

        it('should handle empty string', () => {
            const result = validateInput('');
            expect(result).toBe('');
        });
    });

    describe('hasSqlInjection', () => {
        it('should detect SQL injection patterns', () => {
            expect(hasSqlInjection("SELECT * FROM users")).toBe(true);
            expect(hasSqlInjection("admin' OR '1'='1")).toBe(true);
            expect(hasSqlInjection("normal text")).toBe(false);
        });
    });

    describe('hasXssPattern', () => {
        it('should detect XSS patterns', () => {
            expect(hasXssPattern('<script>alert(1)</script>')).toBe(true);
            expect(hasXssPattern('javascript:alert(1)')).toBe(true);
            expect(hasXssPattern('normal text')).toBe(false);
        });
    });

    describe('sanitizeUsername', () => {
        it('should sanitize username', () => {
            expect(sanitizeUsername('John_Doe-123')).toBe('john_doe-123');
            expect(sanitizeUsername('User@Name!')).toBe('username');
        });
    });
});
