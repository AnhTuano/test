import { ClassStudent, ClassDetails, CoursePlan, TestResultData, UserProfile, UserRole, SystemSettings, PopupNotification, LoginActivity, StudentProgress, SecurityStats, SecurityLog, AdminUserDetailedStats } from '../types';
import { getRequestSignature, APP_ID } from '../utils/requestSignature';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// API Configuration
const BASE_URL = '/ionline/api'; // Proxy path
const API_TIMEOUT = 15000; // 15 seconds

// --- Rate Limiter State ---
let requestTimestamps: number[] = [];
const RATE_LIMIT_WINDOW = 1000; // 1 second
const RATE_LIMIT_MAX = 30; // 30 requests per second
let isBanned = false;

// Helper to check rate limit
const checkRateLimit = () => {
    if (isBanned) throw new Error("SECURITY_LOCKOUT");

    const currentUserRole = localStorage.getItem('ictu_role');
    if (currentUserRole === 'ADMIN') return; 

    const now = Date.now();
    requestTimestamps = requestTimestamps.filter(t => now - t < RATE_LIMIT_WINDOW);
    requestTimestamps.push(now);

    if (requestTimestamps.length > RATE_LIMIT_MAX) {
        isBanned = true;
        window.dispatchEvent(new CustomEvent('security-lockout', { detail: { duration: 180 } }));
        
        throw new Error("SECURITY_LOCKOUT");
    }
};

// Helper to get default headers with signature
const getDefaultHeaders = (token?: string, method: string = 'GET', body: any = {}): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/plain, */*',
    'X-APP-ID': APP_ID,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const signature = getRequestSignature(method, body);
  headers['x-request-signature'] = signature;

  return headers;
};

// Robust timeout wrapper
async function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  
  const fetchPromise = fetch(url, {
    ...options,
    signal: controller.signal
  });

  const timeoutPromise = new Promise<Response>((_, reject) => {
    setTimeout(() => {
      controller.abort();
      reject(new Error('TIMEOUT'));
    }, API_TIMEOUT);
  });

  try {
    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch (error) {
    if (error instanceof Error && (error.message === 'TIMEOUT' || error.name === 'AbortError')) {
      throw new Error('Kết nối đến máy chủ ICTU bị quá hạn (15s). Vui lòng kiểm tra mạng.');
    }
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng của bạn.');
    }
    throw error;
  }
}

// Handle API response
async function handleResponse<T>(response: Response, context: string): Promise<T> {
    if (!response.ok) {
        if (response.status === 403) throw new Error(`Lỗi 403 Forbidden tại ${context}.`);
        if (response.status === 401) {
            
            
            const event = new CustomEvent('auth:expired', { 
              detail: { message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' }
            });
            window.dispatchEvent(event);
            
            throw new Error("Phiên đăng nhập hết hạn.");
        }
        if (response.status === 404) throw new Error(`Không tìm thấy API (404) tại ${context}.`);
        if (response.status >= 500) throw new Error(`Lỗi máy chủ ICTU (${response.status}).`);
        throw new Error(`HTTP Error ${response.status} tại ${context}`);
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        if (data.code && data.code !== 'success' && data.code !== 200 && data.code !== '200') {
            throw new Error(data.message || `API Error: ${data.code}`);
        }
        return data as T;
    }
    
    throw new Error("Máy chủ phản hồi định dạng không hợp lệ.");
}

export const api = {
  triggerSecurityLockout: () => {
      isBanned = true;
      window.dispatchEvent(new CustomEvent('security-lockout', { detail: { duration: 180 } }));
  },
  
  resetSecurityLockout: () => {
      isBanned = false;
      requestTimestamps = [];
  },

  // --- Auth API ---

  login: async (username: string, password?: string): Promise<{ 
    response: { token: string, session_id: string, code: string, message: string },
    role: UserRole, 
    sessionId: string,
    profile?: UserProfile
  }> => {
    checkRateLimit();
    
    // ⚠️ KIỂM TRA USER BỊ BLOCK TRƯỚC KHI CHO PHÉP LOGIN
    try {
      const blockCheck = await api.checkBlockedUser(username);
      if (blockCheck.blocked) {
        
        throw new Error(`Tài khoản đã bị khóa. Lý do: ${blockCheck.reason || 'Vi phạm quy định'}`);
      }
    } catch (blockError: any) {
      // Nếu là lỗi block user thì throw lại
      if (blockError?.message?.includes('bị khóa')) {
        throw blockError;
      }
      // Nếu là lỗi khác (network, etc.) thì bỏ qua và tiếp tục login
      
    }
    
    const body = { username, password: password || '' };
    
    try {
      const headers = getDefaultHeaders(undefined, 'POST', body);
      
      
      
      
      const response = await fetchWithTimeout(`${BASE_URL}/login`, {
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

      
      const profile = await api.getProfile(token);
      
      const adminUsernames = ['DTC245200672', 'ADMIN'];
      const isAdmin = adminUsernames.includes(username.trim().toUpperCase());
      
      const sessionId = data.session_id || `sess-${Date.now()}`;
      localStorage.setItem('ictu_session_id', sessionId);
      
      // Cache profile to Supabase
      try {
        const { isSupabaseConfigured, db: supabaseDb } = await import('./supabase');
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
          
          await supabaseDb.createSession({
            username: profile.username,
            session_id: sessionId,
            device_fingerprint: localStorage.getItem('device_fingerprint') || undefined,
            ip_address: '127.0.0.1',
            user_agent: navigator.userAgent,
          });
          
        }
      } catch (error) {
        
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
      
      
      
      
      const response = await fetchWithTimeout(`${BASE_URL}/login-google`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      
      

      // Parse response manually
      const result = await response.json();
      
      
      // Check if we have access_token
      if (result.access_token) {
        const token = result.access_token;
        
        
        // Fetch user profile with this token
        
        const profile = await api.getProfile(token);
        
        
        // Generate session ID
        const sessionId = `google-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        
        // Determine role - check admin list
        const studentCode = (profile.student_code || email.split('@')[0]).toUpperCase();
        const adminUsernames = ['DTC245200672', 'ADMIN'];
        const isAdmin = adminUsernames.includes(studentCode);
        const role = isAdmin ? UserRole.ADMIN : UserRole.USER;
        
        // Cache user profile to Supabase
        try {
          const { isSupabaseConfigured, db: supabaseDb } = await import('./supabase');
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
            
            // Create session
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);
            
            await supabaseDb.invalidateAllUserSessions(studentCode.toLowerCase());
            await supabaseDb.createSession({
              username: studentCode.toLowerCase(),
              session_id: sessionId,
              device_fingerprint: 'google-oauth',
              ip_address: '127.0.0.1',
              user_agent: navigator.userAgent,
              expires_at: expiresAt.toISOString(),
            });
            
            
          }
        } catch (cacheError) {
          
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
      
      
      
      
      const response = await fetchWithTimeout(`${BASE_URL}/login-microsoft`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      
      

      // Parse response manually
      const result = await response.json();
      
      
      // Check if we have access_token
      if (result.access_token) {
        const token = result.access_token;
        
        
        // Fetch user profile with this token
        
        const profile = await api.getProfile(token);
        
        
        // Generate session ID
        const sessionId = `microsoft-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        
        // Determine role - check admin list
        const studentCode = (profile.student_code || email.split('@')[0]).toUpperCase();
        const adminUsernames = ['DTC245200672', 'ADMIN'];
        const isAdmin = adminUsernames.includes(studentCode);
        const role = isAdmin ? UserRole.ADMIN : UserRole.USER;
        
        // Cache user profile to Supabase
        try {
          const { isSupabaseConfigured, db: supabaseDb } = await import('./supabase');
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
            
            // Create session
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);
            
            await supabaseDb.invalidateAllUserSessions(studentCode.toLowerCase());
            await supabaseDb.createSession({
              username: studentCode.toLowerCase(),
              session_id: sessionId,
              device_fingerprint: 'microsoft-oauth',
              ip_address: '127.0.0.1',
              user_agent: navigator.userAgent,
              expires_at: expiresAt.toISOString(),
            });
          }
        } catch (cacheError) {
          
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

  logout: async (username: string, sessionId?: string) => {
    await delay(100);
  },

  checkSessionValidity: async (username: string, currentSessionId: string): Promise<boolean> => {
    if (Math.random() > 0.8) checkRateLimit(); 
    
    try {
      const { isSupabaseConfigured, db: supabaseDb } = await import('./supabase');
      if (isSupabaseConfigured()) {
        return await supabaseDb.checkSessionValidity(username, currentSessionId);
      }
    } catch (error) {
      
    }
    
    return true;
  },

  checkBlockedUser: async (username: string): Promise<{ blocked: boolean, reason?: string }> => {
    try {
      const { isSupabaseConfigured, db: supabaseDb } = await import('./supabase');
      if (isSupabaseConfigured()) {
        return await supabaseDb.isUserBlocked(username);
      }
    } catch (error) {
      
    }
    
    return { blocked: false };
  },

  getProfile: async (token: string): Promise<UserProfile> => {
    checkRateLimit();
    
    try {
      const response = await fetchWithTimeout(`${BASE_URL}/user-profile/`, { 
        headers: getDefaultHeaders(token) 
      });
      const data = await handleResponse<any>(response, 'getProfile');
      
      if (data.data && data.data.length > 0) {
        const profile = data.data[0];
        
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
          birthday: profile.birthday,
          gender: profile.gender,
          tenlop_quanly: profile.tenlop_quanly,
          tenkhoa: profile.category_name || profile.tenkhoa,
          khoadaotao: profile.khoadaotao,
          phone: profile.phone || profile.student_code?.toUpperCase(),
          address: profile.address
        };
        
        return mappedProfile;
      }
      
      throw new Error("Không tìm thấy thông tin người dùng");
    } catch (error) {
      
      throw error;
    }
  },

  logLoginActivity: async (activity: Partial<LoginActivity>) => {
    try {
      const { isSupabaseConfigured, db: supabaseDb } = await import('./supabase');
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
      
    }
    return true;
  },

  // --- Student API ---

  getAllClasses: async (token: string, studentId: number): Promise<ClassStudent[]> => {
    checkRateLimit();
    
    try {
      const params = new URLSearchParams({
        limit: '1000',
        paged: '1',
        select: 'namhoc,hocky,class_id',
        'condition[0][key]': 'student_id',
        'condition[0][value]': studentId.toString(),
        'condition[0][compare]': '='
      });
      
      const response = await fetchWithTimeout(`${BASE_URL}/class-students/?${params.toString()}`, { 
        headers: getDefaultHeaders(token) 
      });
      
      const data = await handleResponse<any>(response, 'getAllClasses');
      
      return data.data || [];
    } catch (error) {
      
      throw error;
    }
  },

  getClassDetails: async (token: string, classId: number): Promise<ClassDetails | null> => {
    checkRateLimit();
    
    try {
      const params = new URLSearchParams({
        'with': 'managers'
      });
      
      const response = await fetchWithTimeout(`${BASE_URL}/class/${classId}?${params.toString()}`, { 
        headers: getDefaultHeaders(token) 
      });
      
      const data = await handleResponse<any>(response, 'getClassDetails');
      
      let classDetail = null;
      if (data.data) {
        if (Array.isArray(data.data)) {
          classDetail = data.data.length > 0 ? data.data[0] : null;
        } else {
          classDetail = data.data;
        }
      } else if (data.id) {
        classDetail = data;
      }
      
      
      
      return classDetail;
    } catch (error) {
      
      throw error;
    }
  },

  getCoursePlan: async (token: string, classId: number): Promise<CoursePlan[]> => {
    checkRateLimit();
    
    try {
      const params = new URLSearchParams({
        limit: '1000',
        paged: '1',
        order: 'ASC',
        orderby: 'week',
        'condition[0][key]': 'class_id',
        'condition[0][value]': classId.toString(),
        'condition[0][compare]': '='
      });
      
      const response = await fetchWithTimeout(`${BASE_URL}/class-plans/?${params.toString()}`, { 
        headers: getDefaultHeaders(token) 
      });
      
      const data = await handleResponse<any>(response, 'getCoursePlan');
      return data.data || [];
    } catch (error) {
      
      return [];
    }
  },

  getAllTestResultsForClass: async (token: string, classId: number, studentId?: number): Promise<TestResultData[]> => {
    checkRateLimit();
    
    // Get student_id from localStorage if not provided
    const effectiveStudentId = studentId || parseInt(localStorage.getItem('ictu_student_id') || '0');
    
    try {
      const params = new URLSearchParams({
        limit: '1000',
        paged: '1',
        order: 'ASC',
        orderby: 'id',
        'condition[0][key]': 'class_id',
        'condition[0][value]': classId.toString(),
        'condition[0][compare]': '=',
        'condition[1][key]': 'student_id',
        'condition[1][value]': effectiveStudentId.toString(),
        'condition[1][compare]': '='
      });
      
      
      
      const response = await fetchWithTimeout(`${BASE_URL}/class-plan-activity-student-tests/?${params.toString()}`, { 
        headers: getDefaultHeaders(token) 
      });
      
      const data = await handleResponse<any>(response, 'getAllTestResultsForClass');
      
      // Map dữ liệu để đảm bảo av được tính đúng
      // Theo logic từ student-grades-portal:
      // - Nếu có tong_diem: av = tong_diem / 10
      // - Nếu chỉ có av: dùng trực tiếp
      const results = (data.data || []).map((item: any) => {
        let score = 0;
        if (item.tong_diem !== undefined && item.tong_diem !== null) {
          score = parseFloat(String(item.tong_diem)) / 10;
        } else if (item.av !== undefined && item.av !== null) {
          score = parseFloat(String(item.av));
        }
        
        return {
          id: item.id,
          class_id: item.class_id,
          week: item.week,
          av: score, // Điểm đã được chuẩn hóa về thang 10
          tong_diem: item.tong_diem ?? 0,
          time: item.time ?? 0,
          passed: item.passed ?? 0,
          submit_at: item.submit_at || new Date().toISOString(),
          questions: item.questions,
          test: item.test
        };
      });
      
      return results;
    } catch (error) {
      
      throw error;
    }
  },

  getTestDetails: async (token: string, testId: number): Promise<TestResultData> => {
    checkRateLimit();
    
    try {
      const params = new URLSearchParams({
        select: 'id,class_plan_activity_id,av,tong_diem,class_id,time,questions,course_id,status,week,passed,submit_at',
        with: 'test',
        'condition[0][key]': 'id',
        'condition[0][value]': testId.toString(),
        'condition[0][compare]': '='
      });
      
      
      
      const response = await fetchWithTimeout(`${BASE_URL}/class-plan-activity-student-tests/?${params.toString()}`, { 
        headers: getDefaultHeaders(token) 
      });
      
      const data = await handleResponse<any>(response, 'getTestDetails');
      
      if (data.data && data.data.length > 0) {
        const item = data.data[0];
        
        // Tính điểm theo logic chuẩn
        let score = 0;
        if (item.tong_diem !== undefined && item.tong_diem !== null) {
          score = parseFloat(String(item.tong_diem)) / 10;
        } else if (item.av !== undefined && item.av !== null) {
          score = parseFloat(String(item.av));
        }
        
        return {
          ...item,
          av: score // Override av với điểm đã chuẩn hóa
        };
      }
      
      throw new Error("Test not found");
    } catch (error) {
      
      throw error;
    }
  },

  getStudentProgress: async (token: string, studentId: number): Promise<StudentProgress[]> => {
    checkRateLimit();
    
    try {
      const classes = await api.getAllClasses(token, studentId);
      const progress: StudentProgress[] = [];
      
      for (const cls of classes) {
        try {
          const details = await api.getClassDetails(token, cls.class_id);
          if (!details) continue;
          
          const results = await api.getAllTestResultsForClass(token, cls.class_id);
          const bestScore = results.length > 0 ? Math.max(...results.map(r => r.av || 0)) : 0;
          
          progress.push({
            classId: cls.class_id,
            className: details.name,
            teacherName: details.managers[0]?.display_name || "N/A",
            year: cls.namhoc,
            semester: cls.hocky,
            latestWeek: results.length > 0 ? Math.max(...results.map(r => r.week)) : 0,
            totalWeeks: 15,
            status: bestScore >= 5 ? 'on-track' : (results.length > 0 ? 'behind' : 'on-track'),
            hasTest: results.length > 0,
            bestScore: bestScore,
            testCount: results.length
          });
        } catch (error) {
          
        }
      }
      
      return progress;
    } catch (error) {
      
      return [];
    }
  },

  // --- Admin API ---

  adminGetUsers: async (): Promise<UserProfile[]> => {
    checkRateLimit();
    
    try {
      const { isSupabaseConfigured, db: supabaseDb } = await import('./supabase');
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
      
    }
    
    return [];
  },

  adminGetUserDetails: async (username: string): Promise<AdminUserDetailedStats> => {
    checkRateLimit();
    
    try {
      const { isSupabaseConfigured, db: supabaseDb } = await import('./supabase');
      
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
        .limit(100); // Lấy 100 bản ghi gần nhất
      
      if (logsError) {
        
      }
      
      // Lọc theo username (case-insensitive)
      const userLogs = (logs || []).filter(log => 
        log.username?.toLowerCase() === normalizedUsername
      ).slice(0, 10);
      
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

  adminToggleBlockUser: async (username: string, reason: string) => {
    checkRateLimit();
    
    try {
      const { isSupabaseConfigured, db: supabaseDb } = await import('./supabase');
      
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

  adminGetSettings: async (): Promise<SystemSettings> => {
    const defaultSettings: SystemSettings = {
      maintenanceMode: false,
      socialLoginOnly: false,
      disableStandardLogin: false,
      disableLoginMessage: "Chức năng đăng nhập bằng tài khoản/mật khẩu đang tạm khóa.",
      portalName: "ICTU Student Portal",
      dashboardTitle: "ICTU Dashboard",
      loginTitle: "Chào mừng trở lại",
      loginSubtitle: "Cổng thông tin sinh viên ICTU",
      contactEmail: "support@ictu.edu.vn",
      contactZalo: "0987654321",
      appVersion: "v2.0.0",
      copyrightText: "© 2025 ICTU",
      aboutTitle: "ICTU Student Portal",
      aboutDescription: "Hệ thống theo dõi kết quả học tập.",
    };
    
    try {
      const { isSupabaseConfigured, db: supabaseDb } = await import('./supabase');
      
      if (isSupabaseConfigured()) {
        // Lấy settings từ Supabase
        const { data, error } = await supabaseDb.supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'system_settings')
          .single();
        
        if (data && data.value) {
          
          return { ...defaultSettings, ...data.value as SystemSettings };
        }
        
        // Nếu chưa có trong database, tạo mới
        if (error?.code === 'PGRST116') {
          await supabaseDb.supabase.from('app_settings').insert({
            key: 'system_settings',
            value: defaultSettings
          });
        }
      }
    } catch (error) {
      
      
      // Fallback to localStorage
      const stored = localStorage.getItem('system_settings');
      if (stored) {
        try {
          return { ...defaultSettings, ...JSON.parse(stored) };
        } catch (e) {
          return defaultSettings;
        }
      }
    }
    
    return defaultSettings;
  },

  adminUpdateSettings: async (settings: SystemSettings) => {
    checkRateLimit();
    
    try {
      const { isSupabaseConfigured, isAdminConfigured, supabaseAdmin, supabase } = await import('./supabase');
      
      if (isSupabaseConfigured()) {
        const client = isAdminConfigured() ? supabaseAdmin : supabase;
        
        // Upsert settings vào Supabase
        const { error } = await client
          .from('app_settings')
          .upsert({
            key: 'system_settings',
            value: settings,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'key'
          });
        
        if (error) {
          
          throw error;
        }
        
        
        
        // Đồng bộ vào localStorage để fallback
        localStorage.setItem('system_settings', JSON.stringify(settings));
        return;
      }
    } catch (error) {
      
    }
    
    // Fallback to localStorage
    localStorage.setItem('system_settings', JSON.stringify(settings));
  },

  getPublicSettings: async (): Promise<Partial<SystemSettings>> => {
    const settings = await api.adminGetSettings();
    const { 
      portalName, dashboardTitle, loginTitle, loginSubtitle, contactEmail, contactZalo,
      maintenanceMode, socialLoginOnly, copyrightText,
      disableStandardLogin, disableLoginMessage 
    } = settings;
    return { 
      portalName, dashboardTitle, loginTitle, loginSubtitle, contactEmail, contactZalo,
      maintenanceMode, socialLoginOnly, copyrightText,
      disableStandardLogin, disableLoginMessage
    };
  },

  getPopupNotification: async (): Promise<PopupNotification> => {
    const defaultNotif: PopupNotification = {
      id: "notif-default",
      title: "Chào mừng",
      content: "Chào mừng bạn đến với ICTU Student Portal",
      isActive: false,
      type: "info"
    };
    
    try {
      const { isSupabaseConfigured, db: supabaseDb } = await import('./supabase');
      
      if (isSupabaseConfigured()) {
        // Lấy thông báo từ Supabase
        const { data, error } = await supabaseDb.supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'popup_notification')
          .single();
        
        if (data && data.value) {
          
          return data.value as PopupNotification;
        }
        
        // Nếu chưa có trong database, tạo mới
        if (error?.code === 'PGRST116') {
          await supabaseDb.supabase.from('app_settings').insert({
            key: 'popup_notification',
            value: defaultNotif
          });
        }
      }
    } catch (error) {
      
      
      // Fallback to localStorage
      const stored = localStorage.getItem('popup_notification');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          return defaultNotif;
        }
      }
    }
    
    return defaultNotif;
  },

  adminUpdatePopup: async (notification: PopupNotification) => {
    checkRateLimit();
    
    try {
      const { isSupabaseConfigured, isAdminConfigured, supabaseAdmin, supabase } = await import('./supabase');
      
      if (isSupabaseConfigured()) {
        const client = isAdminConfigured() ? supabaseAdmin : supabase;
        
        // Upsert notification vào Supabase
        const { error } = await client
          .from('app_settings')
          .upsert({
            key: 'popup_notification',
            value: notification,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'key'
          });
        
        if (error) {
          
          throw error;
        }
        
        
        
        // Đồng bộ vào localStorage để fallback
        localStorage.setItem('popup_notification', JSON.stringify(notification));
        return;
      }
    } catch (error) {
      
    }
    
    // Fallback to localStorage
    localStorage.setItem('popup_notification', JSON.stringify(notification));
  },

  getSystemMetrics: async () => {
    // Lấy thời gian bắt đầu từ sessionStorage (reset khi đóng tab) hoặc tạo mới
    let startTime = sessionStorage.getItem('app_session_start_time');
    if (!startTime) {
      startTime = Date.now().toString();
      sessionStorage.setItem('app_session_start_time', startTime);
    }
    
    const uptimeMs = Date.now() - parseInt(startTime);
    const days = Math.floor(uptimeMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((uptimeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));
    
    // Tính RAM - sử dụng performance.memory nếu có (Chrome), nếu không estimate
    let memoryMB = 0;
    try {
      const perfMemory = (performance as any).memory;
      if (perfMemory && perfMemory.usedJSHeapSize) {
        memoryMB = Math.round(perfMemory.usedJSHeapSize / 1024 / 1024);
      } else {
        // Estimate dựa trên số DOM nodes và objects
        const domNodes = document.querySelectorAll('*').length;
        memoryMB = Math.max(20, Math.round(domNodes * 0.05 + 30)); // Rough estimate
      }
    } catch {
      memoryMB = 30;
    }
    
    // Format uptime đẹp hơn
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

  getDatabaseStats: async () => {
    try {
      const { isSupabaseConfigured, db: supabaseDb } = await import('./supabase');
      
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
      
    }
    
    return {
      activeConnections: 0,
      totalQueries: 0,
      latency: "N/A"
    };
  },

  adminClearLoginActivities: async () => {
    checkRateLimit();
    
    try {
      const { isSupabaseConfigured, isAdminConfigured, supabaseAdmin, supabase } = await import('./supabase');
      
      if (isSupabaseConfigured()) {
        
        
        // Sử dụng admin client nếu có, nếu không thì dùng regular client
        const client = isAdminConfigured() ? supabaseAdmin : supabase;
        
        const { error, count } = await client
          .from('login_activities')
          .delete()
          .not('id', 'is', null); // Xóa tất cả records có id không null
        
        if (error) {
          
          throw error;
        }
        
        
        return { success: true, count };
      }
    } catch (error) {
      
      throw error;
    }
  },

  getLoginActivities: async (limit: number = 50): Promise<LoginActivity[]> => {
    checkRateLimit();
    
    try {
      const { isSupabaseConfigured, db: supabaseDb } = await import('./supabase');
      
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
      
    }
    
    return [];
  },

  getSecurityMetrics: async (simulateAttack: boolean = false): Promise<{stats: SecurityStats, logs: SecurityLog[]}> => {
    const now = Date.now();
    const recentRequests = requestTimestamps.filter(t => now - t < 1000);
    const requestsPerSecond = recentRequests.length;
    
    let blockedIPsCount = 0;
    let activeConnections = 0;
    let logs: SecurityLog[] = [];
    
    try {
      const { isSupabaseConfigured, db: supabaseDb } = await import('./supabase');
      
      if (isSupabaseConfigured()) {
        // Đếm số users bị block
        const { count: blockedCount } = await supabaseDb.supabase
          .from('blocked_users')
          .select('*', { count: 'exact', head: true });
        
        blockedIPsCount = blockedCount || 0;
        
        // Đếm sessions active (kết nối thực)
        const { count: sessionCount } = await supabaseDb.supabase
          .from('user_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true);
        
        activeConnections = sessionCount || 0;
        
        // Lấy danh sách users bị block làm security logs
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
      
    }
    
    // Threat level based on real metrics
    let threatLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (requestsPerSecond > 25 || blockedIPsCount > 5) threatLevel = 'medium';
    if (requestsPerSecond > 28 || blockedIPsCount > 10) threatLevel = 'high';
    if (isBanned || requestsPerSecond > 30 || blockedIPsCount > 20) threatLevel = 'critical';
    
    const stats: SecurityStats = {
      threatLevel: simulateAttack ? 'critical' : threatLevel,
      requestsPerSecond: simulateAttack ? Math.floor(Math.random() * 2000) + 1500 : requestsPerSecond,
      blockedIPsCount: simulateAttack ? 154 : blockedIPsCount,
      totalAttacks24h: simulateAttack ? 3420 : blockedIPsCount, // Tạm dùng blocked count
      activeConnections: simulateAttack ? 5000 : activeConnections
    };

    // Thêm simulated logs nếu đang giả lập
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
