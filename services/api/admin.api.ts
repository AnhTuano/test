import { UserProfile, UserRole, LoginActivity, AdminUserDetailedStats, SecurityStats, SecurityLog } from '../../types';
import { checkRateLimit } from './rate-limiter';
import { getRequestTimestamps, isBannedStatus } from './rate-limiter';

/**
 * Admin API
 */
export const adminApi = {
    /**
     * Get all users from Supabase
     */
    getUsers: async (): Promise<UserProfile[]> => {
        checkRateLimit();

        try {
            const { isSupabaseConfigured, db: supabaseDb } = await import('../supabase');
            if (isSupabaseConfigured()) {
                const profiles = await supabaseDb.getAllUsers();
                const blockedUsers = await supabaseDb.getBlockedUsers();

                const blockedUsernames = new Set(blockedUsers.map(b => b.username));

                const users: UserProfile[] = profiles.map(p => ({
                    id: p.student_id || 0,
                    username: p.username,
                    student_code: p.student_code,
                    full_name: p.full_name || p.username,
                    email: p.email,
                    class_name: p.class_name,
                    department: p.department,
                    birthday: p.birthday,
                    gender: p.gender,
                    tenlop_quanly: p.class_name,
                    tenkhoa: p.department,
                    khoadaotao: p.khoadaotao,
                    role: p.role as UserRole,
                    status: blockedUsernames.has(p.username) ? 'blocked' as const : 'active' as const,
                    blocked_reason: blockedUsers.find(b => b.username === p.username)?.reason,
                }));

                return users;
            }
        } catch (error) {
            // Ignore errors
        }

        return [];
    },

    /**
     * Get detailed user stats
     */
    getUserDetails: async (username: string): Promise<AdminUserDetailedStats> => {
        checkRateLimit();

        try {
            const { isSupabaseConfigured, db: supabaseDb } = await import('../supabase');

            if (!isSupabaseConfigured()) {
                throw new Error("Supabase not configured");
            }

            const profiles = await supabaseDb.getAllUsers();
            const cachedUser = profiles.find(p => p.username === username);

            if (!cachedUser) throw new Error("User not found");

            const blockCheck = await supabaseDb.isUserBlocked(username);

            const userProfile: UserProfile = {
                id: cachedUser.student_id || 0,
                username: cachedUser.username,
                student_code: cachedUser.student_code,
                full_name: cachedUser.full_name || cachedUser.username,
                email: cachedUser.email,
                class_name: cachedUser.class_name,
                department: cachedUser.department,
                role: cachedUser.role as UserRole,
                status: blockCheck.blocked ? 'blocked' : 'active',
                blocked_reason: blockCheck.reason,
                birthday: cachedUser.birthday,
                gender: cachedUser.gender,
                tenlop_quanly: cachedUser.class_name,
                tenkhoa: cachedUser.department,
                khoadaotao: cachedUser.khoadaotao,
                phone: cachedUser.phone,
            };

            // Query login history
            const normalizedUsername = username.trim().toLowerCase();

            const { data: logs, error: logsError } = await supabaseDb.supabase
                .from('login_activities')
                .select('*')
                .order('login_at', { ascending: false })
                .limit(100);

            if (logsError) {
                // Ignore error
            }

            // Filter by username (case-insensitive) - show ALL login history
            const userLogs = (logs || []).filter(log =>
                log.username?.toLowerCase() === normalizedUsername
            );

            const loginHistory = userLogs.map(log => ({
                id: log.id,
                username: log.username,
                studentName: log.student_name,
                className: log.class_name,
                department: log.department,
                ip_address: log.ip_address,
                device: log.device || 'Unknown',
                browser: log.browser,
                userAgent: log.user_agent,
                deviceFingerprint: log.device_fingerprint,
                sessionId: log.session_id,
                timestamp: log.login_at,
                status: 'success' as const
            }));

            const academicStats = await supabaseDb.getAcademicStats(username);

            return {
                user: userProfile,
                loginHistory,
                academicOverview: academicStats
            };
        } catch (error) {
            throw error;
        }
    },

    /**
     * Toggle block/unblock user
     */
    toggleBlockUser: async (username: string, reason: string) => {
        checkRateLimit();

        try {
            const { isSupabaseConfigured, db: supabaseDb } = await import('../supabase');

            if (!isSupabaseConfigured()) {
                throw new Error("Supabase not configured");
            }

            const blockCheck = await supabaseDb.isUserBlocked(username);

            if (blockCheck.blocked) {
                await supabaseDb.unblockUser(username);
            } else {
                await supabaseDb.blockUser(username, reason, 'admin');
            }
        } catch (error) {
            throw error;
        }
    },

    /**
     * Get login activities
     */
    getLoginActivities: async (limit: number = 50): Promise<LoginActivity[]> => {
        checkRateLimit();

        try {
            const { isSupabaseConfigured, db: supabaseDb } = await import('../supabase');

            if (isSupabaseConfigured()) {
                const { data: logs } = await supabaseDb.supabase
                    .from('login_activities')
                    .select('*')
                    .order('login_at', { ascending: false })
                    .limit(limit);

                return (logs || []).map(log => ({
                    id: log.id,
                    username: log.username,
                    studentName: log.student_name,
                    className: log.class_name,
                    department: log.department,
                    ip_address: log.ip_address,
                    device: log.device || 'Unknown',
                    browser: log.browser,
                    userAgent: log.user_agent,
                    deviceFingerprint: log.device_fingerprint,
                    sessionId: log.session_id,
                    timestamp: log.login_at,
                    status: 'success'
                }));
            }
        } catch (error) {
            // Ignore errors
        }

        return [];
    },

    /**
     * Clear all login activities
     */
    clearLoginActivities: async () => {
        checkRateLimit();

        try {
            const { isSupabaseConfigured, isAdminConfigured, supabaseAdmin, supabase } = await import('../supabase');

            if (isSupabaseConfigured()) {
                const client = isAdminConfigured() ? supabaseAdmin : supabase;

                const { error, count } = await client
                    .from('login_activities')
                    .delete()
                    .not('id', 'is', null);

                if (error) {
                    throw error;
                }

                return { success: true, count };
            }
        } catch (error) {
            throw error;
        }
    },

    /**
     * Get system metrics (uptime, memory)
     */
    getSystemMetrics: async () => {
        // Get start time from sessionStorage
        let startTime = sessionStorage.getItem('app_session_start_time');
        if (!startTime) {
            startTime = Date.now().toString();
            sessionStorage.setItem('app_session_start_time', startTime);
        }

        const uptimeMs = Date.now() - parseInt(startTime);
        const days = Math.floor(uptimeMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((uptimeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));

        // Calculate RAM usage
        let memoryMB = 0;
        try {
            const perfMemory = (performance as any).memory;
            if (perfMemory && perfMemory.usedJSHeapSize) {
                memoryMB = Math.round(perfMemory.usedJSHeapSize / 1024 / 1024);
            } else {
                const domNodes = document.querySelectorAll('*').length;
                memoryMB = Math.max(20, Math.round(domNodes * 0.05 + 30));
            }
        } catch {
            memoryMB = 30;
        }

        let uptimeStr = '';
        if (days > 0) {
            uptimeStr = `${days} ngày ${hours} giờ`;
        } else if (hours > 0) {
            uptimeStr = `${hours} giờ ${minutes} phút`;
        } else {
            uptimeStr = `${minutes} phút`;
        }

        return {
            uptime: uptimeStr,
            memoryUsage: `${memoryMB} MB`,
            nodeVersion: "Browser"
        };
    },

    /**
     * Get database stats
     */
    getDatabaseStats: async () => {
        try {
            const { isSupabaseConfigured, db: supabaseDb } = await import('../supabase');

            if (isSupabaseConfigured()) {
                const { count: userCount } = await supabaseDb.supabase
                    .from('user_profiles')
                    .select('*', { count: 'exact', head: true });

                const { count: sessionCount } = await supabaseDb.supabase
                    .from('user_sessions')
                    .select('*', { count: 'exact', head: true })
                    .eq('is_active', true);

                return {
                    activeConnections: sessionCount || 0,
                    totalQueries: userCount || 0,
                    latency: "< 100ms"
                };
            }
        } catch (error) {
            // Ignore errors
        }

        return {
            activeConnections: 0,
            totalQueries: 0,
            latency: "N/A"
        };
    },

    /**
     * Get security metrics and logs
     */
    getSecurityMetrics: async (simulateAttack: boolean = false): Promise<{ stats: SecurityStats, logs: SecurityLog[] }> => {
        const now = Date.now();
        const requestTimestamps = getRequestTimestamps();
        const recentRequests = requestTimestamps.filter(t => now - t < 1000);
        const requestsPerSecond = recentRequests.length;

        let blockedIPsCount = 0;
        let activeConnections = 0;
        let logs: SecurityLog[] = [];

        try {
            const { isSupabaseConfigured, db: supabaseDb } = await import('../supabase');

            if (isSupabaseConfigured()) {
                const { count: blockedCount } = await supabaseDb.supabase
                    .from('blocked_users')
                    .select('*', { count: 'exact', head: true });

                blockedIPsCount = blockedCount || 0;

                const { count: sessionCount } = await supabaseDb.supabase
                    .from('user_sessions')
                    .select('*', { count: 'exact', head: true })
                    .eq('is_active', true);

                activeConnections = sessionCount || 0;

                const { data: blockedUsers } = await supabaseDb.supabase
                    .from('blocked_users')
                    .select('*')
                    .order('blocked_at', { ascending: false })
                    .limit(20);

                if (blockedUsers && blockedUsers.length > 0) {
                    logs = blockedUsers.map((user: any, idx: number) => ({
                        id: user.id || `blocked-${idx}`,
                        ip: user.ip_address || '127.0.0.1',
                        location: 'Vietnam',
                        type: 'brute_force' as const,
                        severity: 'high' as const,
                        timestamp: user.blocked_at || new Date().toISOString(),
                        status: 'blocked' as const,
                        details: `Tài khoản ${user.username} bị khóa: ${user.reason || 'Vi phạm chính sách'}`
                    }));
                }
            }
        } catch (error) {
            // Ignore errors
        }

        // Determine threat level
        let threatLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
        if (requestsPerSecond > 25 || blockedIPsCount > 5) threatLevel = 'medium';
        if (requestsPerSecond > 28 || blockedIPsCount > 10) threatLevel = 'high';
        if (isBannedStatus() || requestsPerSecond > 30 || blockedIPsCount > 20) threatLevel = 'critical';

        const stats: SecurityStats = {
            threatLevel: simulateAttack ? 'critical' : threatLevel,
            requestsPerSecond: simulateAttack ? Math.floor(Math.random() * 2000) + 1500 : requestsPerSecond,
            blockedIPsCount: simulateAttack ? 154 : blockedIPsCount,
            totalAttacks24h: simulateAttack ? 3420 : blockedIPsCount,
            activeConnections: simulateAttack ? 5000 : activeConnections
        };

        // Add simulated logs if simulating attack
        if (simulateAttack) {
            const ips = ['192.168.1.10', '10.0.0.5', '14.232.112.55', '113.161.78.22', '203.113.131.1'];
            const simulatedLogs: SecurityLog[] = [];

            for (let i = 0; i < 15; i++) {
                simulatedLogs.push({
                    id: `sec-${Date.now()}-${i}`,
                    ip: ips[Math.floor(Math.random() * ips.length)],
                    location: 'Vietnam',
                    type: 'ddos',
                    severity: 'critical',
                    timestamp: new Date(Date.now() - i * 1000 * 60).toISOString(),
                    status: 'blocked',
                    details: 'Vượt quá giới hạn truy cập (2000 req/s)'
                });
            }

            logs = [...simulatedLogs, ...logs].slice(0, 50);
        }

        return { stats, logs };
    }
};
