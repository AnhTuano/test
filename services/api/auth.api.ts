import { UserRole, UserProfile, LoginActivity } from '../../types';
import { checkRateLimit } from './rate-limiter';
import { buildApiUrl } from './config';
import { fetchWithTimeout, getDefaultHeaders } from './client';
import { getClientIP } from '../../utils/getClientIP';
import { getRequestSignature, APP_ID } from '../../utils/requestSignature';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Hardcoded admin usernames - TODO: Move to database
const ADMIN_USERNAMES = ['DTC245200672', 'ADMIN'];

/**
 * Check if user is admin based on username
 */
const isAdminUser = (username: string): boolean => {
    return ADMIN_USERNAMES.includes(username.trim().toUpperCase());
};

/**
 * Authentication API
 */
export const authApi = {
    /**
     * Standard login with username and password
     */
    login: async (username: string, password?: string): Promise<{
        response: { token: string, session_id: string, code: string, message: string },
        role: UserRole,
        sessionId: string,
        profile?: UserProfile
    }> => {
        checkRateLimit();

        // Check if user is blocked before allowing login
        try {
            const blockCheck = await authApi.checkBlockedUser(username);
            if (blockCheck.blocked) {
                throw new Error(`Tài khoản đã bị khóa. Lý do: ${blockCheck.reason || 'Vi phạm quy định'}`);
            }
        } catch (blockError: any) {
            // If it's a block error, throw it
            if (blockError?.message?.includes('bị khóa')) {
                throw blockError;
            }
            // If it's another error (network, etc.), ignore and continue login
        }

        const body = { username, password: password || '' };

        try {
            const headers = getDefaultHeaders(undefined, 'POST', body);

            const response = await fetchWithTimeout(buildApiUrl('/login'), {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(body)
            });

            const responseText = await response.text();

            if (!response.ok) {
                if (response.status === 401) {
                    try {
                        const errorData = JSON.parse(responseText);

                        if (errorData.code === 'auth_fail' && errorData.message?.includes('điện thoại')) {
                            throw new Error("ICTU API không hỗ trợ truy cập từ mobile browser. Vui lòng dùng desktop browser.");
                        }

                        const errorMsg = errorData.message || errorData.error || "Sai tên đăng nhập hoặc mật khẩu";
                        throw new Error(errorMsg);
                    } catch (e) {
                        if (e instanceof Error && e.message.includes('ICTU API')) {
                            throw e;
                        }
                        throw new Error("Sai tên đăng nhập hoặc mật khẩu");
                    }
                }
                if (response.status === 403) throw new Error("Lỗi xác thực. Vui lòng thử lại.");
                throw new Error(`Lỗi ${response.status}`);
            }

            let data;
            try {
                data = JSON.parse(responseText);
            } catch {
                throw new Error("Phản hồi không hợp lệ từ server");
            }

            if (data.code && data.code !== 'success' && data.code !== 200) {
                throw new Error(data.message || 'Đăng nhập thất bại');
            }

            const token = data.token || data.access_token || data.data?.token;
            if (!token) {
                throw new Error('Không nhận được token từ server');
            }

            const profile = await authApi.getProfile(token);

            const isAdmin = isAdminUser(username);

            const sessionId = data.session_id || `sess-${Date.now()}`;
            localStorage.setItem('ictu_session_id', sessionId);

            // Cache profile to Supabase
            try {
                const { isSupabaseConfigured, db: supabaseDb } = await import('../supabase');
                if (isSupabaseConfigured()) {
                    await supabaseDb.cacheUserProfile({
                        username: profile.username,
                        student_id: profile.id,
                        student_code: profile.student_code,
                        full_name: profile.full_name,
                        email: profile.email,
                        phone: profile.phone,
                        class_name: profile.class_name,
                        department: profile.department,
                        birthday: profile.birthday,
                        gender: profile.gender,
                        khoadaotao: profile.khoadaotao,
                        role: isAdmin ? 'ADMIN' : 'USER',
                    });

                    await supabaseDb.invalidateAllUserSessions(profile.username);

                    const clientIP = await getClientIP();

                    await supabaseDb.createSession({
                        username: profile.username,
                        session_id: sessionId,
                        device_fingerprint: localStorage.getItem('device_fingerprint') || undefined,
                        ip_address: clientIP,
                        user_agent: navigator.userAgent,
                    });
                }
            } catch (error) {
                // Ignore Supabase errors
            }

            return {
                response: {
                    token,
                    session_id: sessionId,
                    code: 'success',
                    message: 'Đăng nhập thành công'
                },
                role: isAdmin ? UserRole.ADMIN : UserRole.USER,
                sessionId,
                profile
            };
        } catch (e) {
            throw e;
        }
    },

    /**
     * Login with Google OAuth
     */
    loginWithGoogle: async (googleToken: string, email: string): Promise<{
        response: { token: string, session_id: string, code: string, message: string },
        role: UserRole,
        sessionId: string,
        profile: UserProfile
    }> => {
        checkRateLimit();

        try {
            const body = {
                token: googleToken,
                email: email
            };

            const headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/plain, */*',
                'X-APP-ID': APP_ID,
                'x-request-signature': getRequestSignature('POST', body),
            };

            const response = await fetchWithTimeout(buildApiUrl('/login-google'), {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
            });

            const result = await response.json();

            if (result.access_token) {
                const token = result.access_token;
                const profile = await authApi.getProfile(token);
                const sessionId = `google-${Date.now()}-${Math.random().toString(36).substring(7)}`;

                const studentCode = (profile.student_code || email.split('@')[0]).toUpperCase();
                const isAdmin = ADMIN_USERNAMES.includes(studentCode);
                const role = isAdmin ? UserRole.ADMIN : UserRole.USER;

                // Cache user profile to Supabase
                try {
                    const { isSupabaseConfigured, db: supabaseDb } = await import('../supabase');
                    if (isSupabaseConfigured()) {
                        await supabaseDb.cacheUserProfile({
                            username: studentCode.toLowerCase(),
                            student_code: profile.student_code,
                            student_id: profile.id,
                            full_name: profile.full_name,
                            email: profile.email,
                            class_name: profile.class_name || profile.tenlop_quanly,
                            department: profile.department || profile.tenkhoa,
                            birthday: profile.birthday,
                            gender: profile.gender,
                            khoadaotao: profile.khoadaotao,
                            phone: profile.phone,
                            role: role,
                        });

                        const expiresAt = new Date();
                        expiresAt.setDate(expiresAt.getDate() + 7);

                        await supabaseDb.invalidateAllUserSessions(studentCode.toLowerCase());

                        const clientIP = await getClientIP();

                        await supabaseDb.createSession({
                            username: studentCode.toLowerCase(),
                            session_id: sessionId,
                            device_fingerprint: 'google-oauth',
                            ip_address: clientIP,
                            user_agent: navigator.userAgent,
                            expires_at: expiresAt.toISOString(),
                        });
                    }
                } catch (cacheError) {
                    // Ignore cache errors
                }

                return {
                    response: {
                        token: token,
                        session_id: sessionId,
                        code: 'success',
                        message: 'Google login success'
                    },
                    role,
                    sessionId,
                    profile
                };
            }

            throw new Error(result.message || 'Google login failed - no access token');
        } catch (error) {
            throw error;
        }
    },

    /**
     * Login with Microsoft OAuth
     */
    loginWithMicrosoft: async (microsoftToken: string, email: string): Promise<{
        response: { token: string, session_id: string, code: string, message: string },
        role: UserRole,
        sessionId: string,
        profile: UserProfile
    }> => {
        checkRateLimit();

        try {
            const body = {
                token: microsoftToken,
                email: email
            };

            const headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/plain, */*',
                'X-APP-ID': APP_ID,
                'x-request-signature': getRequestSignature('POST', body),
            };

            const response = await fetchWithTimeout(buildApiUrl('/login-microsoft'), {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
            });

            const result = await response.json();

            if (result.access_token) {
                const token = result.access_token;
                const profile = await authApi.getProfile(token);
                const sessionId = `microsoft-${Date.now()}-${Math.random().toString(36).substring(7)}`;

                const studentCode = (profile.student_code || email.split('@')[0]).toUpperCase();
                const isAdmin = ADMIN_USERNAMES.includes(studentCode);
                const role = isAdmin ? UserRole.ADMIN : UserRole.USER;

                // Cache user profile to Supabase
                try {
                    const { isSupabaseConfigured, db: supabaseDb } = await import('../supabase');
                    if (isSupabaseConfigured()) {
                        await supabaseDb.cacheUserProfile({
                            username: studentCode.toLowerCase(),
                            student_code: profile.student_code,
                            student_id: profile.id,
                            full_name: profile.full_name,
                            email: profile.email,
                            class_name: profile.class_name || profile.tenlop_quanly,
                            department: profile.department || profile.tenkhoa,
                            birthday: profile.birthday,
                            gender: profile.gender,
                            khoadaotao: profile.khoadaotao,
                            phone: profile.phone,
                            role: role,
                        });

                        const expiresAt = new Date();
                        expiresAt.setDate(expiresAt.getDate() + 7);

                        await supabaseDb.invalidateAllUserSessions(studentCode.toLowerCase());

                        const clientIP = await getClientIP();

                        await supabaseDb.createSession({
                            username: studentCode.toLowerCase(),
                            session_id: sessionId,
                            device_fingerprint: 'microsoft-oauth',
                            ip_address: clientIP,
                            user_agent: navigator.userAgent,
                            expires_at: expiresAt.toISOString(),
                        });
                    }
                } catch (cacheError) {
                    // Ignore cache errors
                }

                return {
                    response: {
                        token: token,
                        session_id: sessionId,
                        code: 'success',
                        message: 'Microsoft login success'
                    },
                    role,
                    sessionId,
                    profile
                };
            }

            throw new Error(result.message || 'Microsoft login failed - no access token');
        } catch (error) {
            throw error;
        }
    },

    /**
     * Logout user
     */
    logout: async (username: string, sessionId?: string) => {
        await delay(100);
    },

    /**
     * Check if session is still valid
     */
    checkSessionValidity: async (username: string, currentSessionId: string): Promise<boolean> => {
        if (Math.random() > 0.8) checkRateLimit();

        try {
            const { isSupabaseConfigured, db: supabaseDb } = await import('../supabase');
            if (isSupabaseConfigured()) {
                return await supabaseDb.checkSessionValidity(username, currentSessionId);
            }
        } catch (error) {
            // Ignore errors
        }

        return true;
    },

    /**
     * Check if user is blocked
     */
    checkBlockedUser: async (username: string): Promise<{ blocked: boolean, reason?: string }> => {
        try {
            const { isSupabaseConfigured, db: supabaseDb } = await import('../supabase');
            if (isSupabaseConfigured()) {
                return await supabaseDb.isUserBlocked(username);
            }
        } catch (error) {
            // Ignore errors
        }

        return { blocked: false };
    },

    /**
     * Get user profile from token
     */
    getProfile: async (token: string): Promise<UserProfile> => {
        checkRateLimit();

        try {
            const response = await fetchWithTimeout(buildApiUrl('/user-profile/'), {
                headers: getDefaultHeaders(token)
            });

            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error("Máy chủ phản hồi định dạng không hợp lệ.");
            }

            const data = await response.json();

            if (data.code && data.code !== 'success' && data.code !== 200 && data.code !== '200') {
                throw new Error(data.message || `API Error: ${data.code}`);
            }

            if (data.data && data.data.length > 0) {
                const profile = data.data[0];

                // Get birthday from profile or new_personal_info
                let birthdayRaw = profile.birthday || profile.new_personal_info?.birthday || '';

                // Convert DD/MM/YYYY to ISO format YYYY-MM-DD
                let birthdayISO = '';
                if (birthdayRaw && typeof birthdayRaw === 'string') {
                    const parts = birthdayRaw.split('/');
                    if (parts.length === 3) {
                        birthdayISO = `${parts[2]}-${parts[1]}-${parts[0]}`;
                    } else {
                        birthdayISO = birthdayRaw;
                    }
                }

                const mappedProfile: UserProfile = {
                    id: profile.id,
                    username: profile.student_code || profile.username,
                    student_code: profile.student_code,
                    full_name: profile.full_name,
                    email: profile.email || `${profile.student_code?.toUpperCase()}@ictu.edu.vn`,
                    class_name: profile.tenlop_quanly,
                    department: profile.category_name || profile.tenkhoa || 'Chưa xác định',
                    role: UserRole.USER,
                    status: 'active',
                    birthday: birthdayISO,
                    gender: profile.gender,
                    tenlop_quanly: profile.tenlop_quanly,
                    tenkhoa: profile.category_name || profile.tenkhoa,
                    khoadaotao: profile.khoadaotao,
                    phone: profile.phone || profile.new_personal_info?.phone || profile.student_code?.toUpperCase(),
                    address: profile.address
                };

                return mappedProfile;
            }

            throw new Error("Không tìm thấy thông tin người dùng");
        } catch (error) {
            throw error;
        }
    },

    /**
     * Log login activity
     */
    logLoginActivity: async (activity: Partial<LoginActivity>) => {
        try {
            const { isSupabaseConfigured, db: supabaseDb } = await import('../supabase');
            if (isSupabaseConfigured()) {
                return await supabaseDb.logLoginActivity({
                    username: activity.username,
                    student_name: activity.studentName,
                    class_name: activity.className,
                    department: activity.department,
                    ip_address: activity.ip_address,
                    device: activity.device,
                    browser: activity.browser,
                    user_agent: activity.userAgent,
                    device_fingerprint: activity.deviceFingerprint,
                    session_id: activity.sessionId,
                });
            }
        } catch (error) {
            // Ignore errors
        }
        return true;
    },
};
