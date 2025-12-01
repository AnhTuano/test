
import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { UserRole, UserProfile, DeviceInfo } from '../types';
import { api } from '../services/api';
import { 
  generateDeviceFingerprint, 
  saveDeviceFingerprint, 
  clearDeviceFingerprint,
  getDeviceInfo 
} from '../utils/deviceManager';
import { getClientIP } from '../utils/getClientIP';
import { APP_VERSION } from '../utils/requestSignature';
import { GoogleUser, extractStudentCode, inferStudentInfo } from '../services/googleAuth';
import { MicrosoftUser, extractStudentCode as msExtractStudentCode, inferStudentInfo as msInferStudentInfo } from '../services/microsoftAuth';

interface AuthContextType {
  isLoggedIn: boolean;
  role: UserRole | null;
  profile: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password?: string) => Promise<void>;
  loginWithGoogleToken: (accessToken: string, googleUser: GoogleUser) => Promise<void>;
  loginWithMicrosoftToken: (accessToken: string, msUser: MicrosoftUser) => Promise<void>;
  logout: (message?: string) => void;
  logoutMessage: string | null;
  clearLogoutMessage: () => void;
  deviceInfo: DeviceInfo | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const STORAGE_KEYS = {
  token: "ictu_token",
  role: "ictu_role",
  username: "ictu_username",
  sessionId: "ictu_session_id",
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<UserRole | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [logoutMessage, setLogoutMessage] = useState<string | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);

  const clearAuthData = useCallback(() => {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    clearDeviceFingerprint();
    setIsLoggedIn(false);
    setToken(null);
    setProfile(null);
    setRole(null);
    setDeviceInfo(null);
  }, []);

  // Initialize Auth State from LocalStorage
  useEffect(() => {
    const checkAuthStatus = async () => {
      // Check app version and clear cache if needed
      const storedVersion = localStorage.getItem('app_version');
      
      if (storedVersion !== APP_VERSION) {
        
        Object.values(STORAGE_KEYS).forEach(key => {
          localStorage.removeItem(key);
        });
        localStorage.setItem('app_version', APP_VERSION);
        setIsLoading(false);
        return;
      }

      const storedToken = localStorage.getItem(STORAGE_KEYS.token);
      const storedRole = localStorage.getItem(STORAGE_KEYS.role);
      const username = localStorage.getItem(STORAGE_KEYS.username);
      const sessionId = localStorage.getItem(STORAGE_KEYS.sessionId);

      if (storedToken && username && sessionId) {
        try {
          // Check if user is blocked
          const blockCheck = await api.checkBlockedUser(username);
          if (blockCheck.blocked) {
            const msg = `Tài khoản đã bị chặn. Lý do: ${blockCheck.reason}`;
            setLogoutMessage(msg);
            clearAuthData();
            setIsLoading(false);
            return;
          }

          // Get device info
          const devInfo = getDeviceInfo();
          setDeviceInfo(devInfo);

          // Fetch profile
          const user = await api.getProfile(storedToken);
          if (user) {
            setProfile(user);
            setToken(storedToken);
            setRole(storedRole as UserRole);
            setIsLoggedIn(true);
          } else {
            clearAuthData();
          }
        } catch (error) {
          
          clearAuthData();
        }
      } else {
        clearAuthData();
      }

      setIsLoading(false);
    };

    checkAuthStatus();
  }, [clearAuthData]);

  // Listen for storage changes from other tabs
  useEffect(() => {
    if (!isLoggedIn) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.sessionId) {
        const currentSessionId = localStorage.getItem(STORAGE_KEYS.sessionId);
        const newSessionId = e.newValue;

        if (currentSessionId && newSessionId && currentSessionId !== newSessionId) {
          const msg = "Tài khoản của bạn đang được đăng nhập ở thiết bị khác.";
          setLogoutMessage(msg);
          clearAuthData();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isLoggedIn, clearAuthData]);

  // Session validity check
  const sessionCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isCheckingRef = useRef(false);

  useEffect(() => {
    if (!isLoggedIn || !profile) {
      if (sessionCheckIntervalRef.current) {
        clearInterval(sessionCheckIntervalRef.current);
        sessionCheckIntervalRef.current = null;
      }
      if (sessionCheckTimeoutRef.current) {
        clearTimeout(sessionCheckTimeoutRef.current);
        sessionCheckTimeoutRef.current = null;
      }
      return;
    }

    if (sessionCheckIntervalRef.current) {
      return;
    }

    const checkSessionValidity = async () => {
      if (isCheckingRef.current) return;
      isCheckingRef.current = true;

      try {
        const username = localStorage.getItem(STORAGE_KEYS.username);
        const sessionId = localStorage.getItem(STORAGE_KEYS.sessionId);

        if (!username || !sessionId) {
          isCheckingRef.current = false;
          return;
        }

        // Check if user is blocked
        const blockCheck = await api.checkBlockedUser(username);
        if (blockCheck.blocked) {
          const msg = `Tài khoản đã bị chặn. Lý do: ${blockCheck.reason}`;
          setLogoutMessage(msg);
          await api.logout(username, sessionId);
          clearAuthData();
          isCheckingRef.current = false;
          return;
        }

        // Check session validity
        try {
          const { isSupabaseConfigured } = await import('../services/supabase');
          if (isSupabaseConfigured()) {
            const isValid = await api.checkSessionValidity(username, sessionId);
            if (!isValid) {
              const msg = "Tài khoản đã được đăng nhập từ thiết bị khác";
              setLogoutMessage(msg);
              clearAuthData();
            }
          }
        } catch (error) {
          // Ignore error
        }
      } catch (error) {
        // Ignore error
      } finally {
        isCheckingRef.current = false;
      }
    };

    // Wait 3 seconds before first check
    sessionCheckTimeoutRef.current = setTimeout(() => {
      checkSessionValidity();
    }, 3000);

    // Then check every 5 seconds
    sessionCheckIntervalRef.current = setInterval(() => {
      checkSessionValidity();
    }, 5000);

    return () => {
      if (sessionCheckTimeoutRef.current) {
        clearTimeout(sessionCheckTimeoutRef.current);
        sessionCheckTimeoutRef.current = null;
      }
      if (sessionCheckIntervalRef.current) {
        clearInterval(sessionCheckIntervalRef.current);
        sessionCheckIntervalRef.current = null;
      }
    };
  }, [isLoggedIn, profile, clearAuthData]);

  const login = useCallback(async (username: string, password?: string) => {
    try {
      const { response, role, sessionId, profile: userProfile } = await api.login(username, password);
      
      if (!userProfile) throw new Error("Không thể tải thông tin người dùng");

      // Generate device fingerprint
      const fingerprint = await generateDeviceFingerprint();
      saveDeviceFingerprint(fingerprint);

      // Get device info
      const devInfo = getDeviceInfo();
      setDeviceInfo(devInfo);

      // Store in localStorage
      localStorage.setItem(STORAGE_KEYS.token, response.token);
      localStorage.setItem(STORAGE_KEYS.username, userProfile.username);
      localStorage.setItem(STORAGE_KEYS.role, role);
      localStorage.setItem(STORAGE_KEYS.sessionId, sessionId);
      localStorage.setItem('ictu_student_id', userProfile.id.toString());

      setToken(response.token);
      setProfile(userProfile);
      setRole(role);
      setIsLoggedIn(true);
      setLogoutMessage(null);

      // Log Activity with device fingerprint
      getClientIP().then(clientIP => {
        api.logLoginActivity({
            username: userProfile.username,
            studentName: userProfile.full_name,
            className: userProfile.class_name,
            department: userProfile.department,
            ip_address: clientIP,
            device: `${devInfo.device} - ${devInfo.browser}`,
            browser: devInfo.browser,
            userAgent: navigator.userAgent,
            deviceFingerprint: fingerprint,
            sessionId: sessionId
        }).catch(console.error);
      });

    } catch (err: any) {
      
      throw err;
    }
  }, []);

  const logout = useCallback(async (message?: string) => {
    const username = localStorage.getItem(STORAGE_KEYS.username);
    const sessionId = localStorage.getItem(STORAGE_KEYS.sessionId);
    
    if (username && sessionId) {
      try {
        await api.logout(username, sessionId);
      } catch (error) {
        // Ignore logout error
      }
    }

    clearAuthData();
    
    if (message) {
      setLogoutMessage(message);
    }
  }, [clearAuthData]);

  /**
   * Login with Google OAuth token
   * This creates a local session based on Google user info
   */
  const loginWithGoogleToken = useCallback(async (accessToken: string, googleUser: GoogleUser) => {
    try {
      // Try to login via ICTU API with Google token
      let userProfile: UserProfile | null = null;
      let sessionId: string = '';
      let tokenToUse: string = '';
      let userRole: UserRole = UserRole.USER;

      try {
        // Try ICTU login-google endpoint with both token and email
        
        const result = await api.loginWithGoogle(accessToken, googleUser.email);
        if (result && result.profile) {
          userProfile = result.profile;
          sessionId = result.sessionId;
          tokenToUse = result.response.token;
          userRole = result.role || UserRole.USER;
          
        }
      } catch (apiError) {
        
      }

      // If ICTU API fails, create local session from Google user info
      if (!userProfile) {
        
        const studentCode = extractStudentCode(googleUser.email);
        const inferredInfo = inferStudentInfo(googleUser.email, googleUser.name);
        
        sessionId = `google_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        tokenToUse = `google_token_${accessToken.substring(0, 20)}`;
        
        userProfile = {
          id: parseInt(studentCode.replace(/\D/g, '').slice(-6)) || Date.now(),
          username: studentCode.toLowerCase(),
          student_code: studentCode,
          full_name: googleUser.name,
          email: googleUser.email,
          class_name: inferredInfo.className,
          department: inferredInfo.department,
          course: inferredInfo.course,
          gender: inferredInfo.gender,
          birthday: inferredInfo.birthday,
          google_avatar: googleUser.picture,
          login_method: 'google'
        } as UserProfile;
        
        
      }

      // Use username from profile (lowercase for consistency)
      const username = (userProfile.username || userProfile.student_code || '').toLowerCase();

      // Check if user is blocked
      const blockCheck = await api.checkBlockedUser(username);
      if (blockCheck.blocked) {
        throw new Error(`Tài khoản đã bị chặn. Lý do: ${blockCheck.reason}`);
      }

      // Generate device fingerprint
      const fingerprint = await generateDeviceFingerprint();
      saveDeviceFingerprint(fingerprint);

      // Get device info
      const devInfo = getDeviceInfo();
      setDeviceInfo(devInfo);

      // Store in localStorage
      localStorage.setItem(STORAGE_KEYS.token, tokenToUse);
      localStorage.setItem(STORAGE_KEYS.username, username);
      localStorage.setItem(STORAGE_KEYS.role, userRole);
      localStorage.setItem(STORAGE_KEYS.sessionId, sessionId);
      localStorage.setItem('ictu_student_id', userProfile.id.toString());
      localStorage.setItem('ictu_login_method', 'google');

      setToken(tokenToUse);
      setProfile(userProfile);
      setRole(userRole);
      setIsLoggedIn(true);
      setLogoutMessage(null);

      // Log Activity with device fingerprint
      getClientIP().then(clientIP => {
        api.logLoginActivity({
          username: username,
          studentName: userProfile.full_name,
          className: userProfile.class_name || '',
          department: userProfile.department || '',
          ip_address: clientIP,
          device: `${devInfo.device} - ${devInfo.browser}`,
          browser: devInfo.browser,
          userAgent: navigator.userAgent,
          deviceFingerprint: fingerprint,
          sessionId: sessionId,
          loginMethod: 'google'
        }).catch(console.error);
      });

    } catch (err: any) {
      
      throw err;
    }
  }, []);

  /**
   * Login with Microsoft OAuth token
   * This creates a local session based on Microsoft user info
   */
  const loginWithMicrosoftToken = useCallback(async (accessToken: string, msUser: MicrosoftUser) => {
    try {
      // Try to login via ICTU API with Microsoft token
      let userProfile: UserProfile | null = null;
      let sessionId: string = '';
      let tokenToUse: string = '';
      let userRole: UserRole = UserRole.USER;

      try {
        // Try ICTU login-microsoft endpoint with both token and email
        
        const result = await api.loginWithMicrosoft(accessToken, msUser.email);
        if (result && result.profile) {
          userProfile = result.profile;
          sessionId = result.sessionId;
          tokenToUse = result.response.token;
          userRole = result.role || UserRole.USER;
          
        }
      } catch (apiError) {
        
      }

      // If ICTU API fails, create local session from Microsoft user info
      if (!userProfile) {
        
        const studentCode = msExtractStudentCode(msUser.email);
        const inferredInfo = msInferStudentInfo(msUser.email, msUser.name);
        
        sessionId = `microsoft_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        tokenToUse = `microsoft_token_${accessToken.substring(0, 20)}`;
        
        userProfile = {
          id: parseInt(studentCode.replace(/\D/g, '').slice(-6)) || Date.now(),
          username: studentCode.toLowerCase(),
          student_code: studentCode,
          full_name: msUser.name,
          email: msUser.email,
          class_name: inferredInfo.className,
          department: inferredInfo.department,
          course: inferredInfo.course,
          gender: inferredInfo.gender,
          birthday: inferredInfo.birthday,
          google_avatar: msUser.picture,
          login_method: 'microsoft'
        } as UserProfile;
        
        
      }

      // Use username from profile (lowercase for consistency)
      const username = (userProfile.username || userProfile.student_code || '').toLowerCase();

      // Check if user is blocked
      const blockCheck = await api.checkBlockedUser(username);
      if (blockCheck.blocked) {
        throw new Error(`Tài khoản đã bị chặn. Lý do: ${blockCheck.reason}`);
      }

      // Generate device fingerprint
      const fingerprint = await generateDeviceFingerprint();
      saveDeviceFingerprint(fingerprint);

      // Get device info
      const devInfo = getDeviceInfo();
      setDeviceInfo(devInfo);

      // Store in localStorage
      localStorage.setItem(STORAGE_KEYS.token, tokenToUse);
      localStorage.setItem(STORAGE_KEYS.username, username);
      localStorage.setItem(STORAGE_KEYS.role, userRole);
      localStorage.setItem(STORAGE_KEYS.sessionId, sessionId);
      localStorage.setItem('ictu_student_id', userProfile.id.toString());
      localStorage.setItem('ictu_login_method', 'microsoft');

      setToken(tokenToUse);
      setProfile(userProfile);
      setRole(userRole);
      setIsLoggedIn(true);
      setLogoutMessage(null);

      // Log Activity with device fingerprint
      getClientIP().then(clientIP => {
        api.logLoginActivity({
          username: username,
          studentName: userProfile.full_name,
          className: userProfile.class_name || '',
          department: userProfile.department || '',
          ip_address: clientIP,
          device: `${devInfo.device} - ${devInfo.browser}`,
          browser: devInfo.browser,
          userAgent: navigator.userAgent,
          deviceFingerprint: fingerprint,
          sessionId: sessionId,
          loginMethod: 'microsoft'
        }).catch(console.error);
      });

    } catch (err: any) {
      
      throw err;
    }
  }, []);

  const clearLogoutMessage = useCallback(() => setLogoutMessage(null), []);

  const contextValue = useMemo(() => ({
    isLoggedIn,
    role,
    profile,
    token,
    isLoading,
    login,
    loginWithGoogleToken,
    loginWithMicrosoftToken,
    logout,
    logoutMessage,
    clearLogoutMessage,
    deviceInfo
  }), [isLoggedIn, role, profile, token, isLoading, logoutMessage, login, loginWithGoogleToken, loginWithMicrosoftToken, logout, clearLogoutMessage, deviceInfo]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
