
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { useToast } from '../components/ToastProvider';
import { api } from '../services/api';
import { initiateGoogleLogin, isGoogleAuthConfigured } from '../services/googleAuth';
import { initiateMicrosoftLogin, isMicrosoftAuthConfigured } from '../services/microsoftAuth';
import { sanitizeUsername, hasSqlInjection, hasXssPattern } from '../utils/sanitize';
import { 
  Loader2, AlertCircle, Shield, Lock, Ban, 
  Mail, User, Eye, EyeOff, ArrowRight,
  Activity, Award
} from 'lucide-react';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState(''); 
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [systemSettings, setSystemSettings] = useState<any>(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [isAdminAccess, setIsAdminAccess] = useState(false);

  const { login, isLoggedIn, logoutMessage, clearLogoutMessage, role } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (isLoggedIn) {
      if (role === 'ADMIN') navigate('/admin', { replace: true });
      else navigate('/grades', { replace: true });
    }
  }, [isLoggedIn, navigate, role]);

  useEffect(() => {
    api.getPublicSettings().then(settings => {
      setSystemSettings(settings);
      setSettingsLoaded(true);
    }).catch(() => {
      setSettingsLoaded(true);
    });
  }, []);

  // Verify admin secret key from URL against database
  useEffect(() => {
    const urlKey = searchParams.get('key');
    if (urlKey && settingsLoaded) {
      api.verifyAdminSecretKey(urlKey).then(isValid => {
        setIsAdminAccess(isValid);
      });
    }
  }, [searchParams, settingsLoaded]);

  const handleGoogleLogin = () => {
    if (!isGoogleAuthConfigured()) {
      toast.warning("Google OAuth chưa được cấu hình");
      return;
    }
    
    setError(null);
    clearLogoutMessage();
    
    // Redirect to Google login
    initiateGoogleLogin();
  };

  const handleMicrosoftLogin = () => {
    if (!isMicrosoftAuthConfigured()) {
      toast.warning("Microsoft OAuth chưa được cấu hình. Vui lòng thêm VITE_MICROSOFT_CLIENT_ID vào .env.local");
      return;
    }
    
    setError(null);
    clearLogoutMessage();
    
    // Redirect to Microsoft login
    initiateMicrosoftLogin();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Vui lòng nhập tài khoản và mật khẩu");
      toast.warning("Vui lòng điền đầy đủ thông tin");
      return;
    }

    // Security: Check for malicious input
    if (hasSqlInjection(username) || hasXssPattern(username) || 
        hasSqlInjection(password) || hasXssPattern(password)) {
      setError("Phát hiện ký tự không hợp lệ");
      toast.error("Dữ liệu nhập không hợp lệ");
      return;
    }

    // Sanitize username
    const cleanUsername = sanitizeUsername(username);
    if (!cleanUsername) {
      setError("Tài khoản không hợp lệ");
      return;
    }
    
    setError(null);
    clearLogoutMessage();
    setLoading(true);

    try {
      await login(cleanUsername, password);
      toast.success("Đăng nhập thành công!");
    } catch (err: any) {
      setError(err.message || "Đăng nhập thất bại");
      if (!err.message?.includes("bị chặn")) {
         toast.error(err.message || "Đăng nhập thất bại");
      }
      setLoading(false);
    }
  };

  const isBlocked = (msg: string | null) => msg && msg.toLowerCase().includes("bị chặn");
  const isConcurrentLogin = (msg: string | null) => msg && (msg.toLowerCase().includes("thiết bị khác") || msg.toLowerCase().includes("nơi khác"));
  
  const getBlockReason = (msg: string) => {
    const parts = msg.split("Lý do:");
    return parts.length > 1 ? parts[1].trim() : "Vi phạm quy định chung";
  };

  const currentMessage = error || logoutMessage;
  const isBlockedState = isBlocked(currentMessage);
  const isConcurrentState = isConcurrentLogin(currentMessage);

  // Wait for settings to load before showing the form
  if (!settingsLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex w-full bg-white transition-colors duration-300 overflow-hidden">
      
      {/* LEFT SIDE: Premium Branding & Visuals (60% width on LG) */}
      <div className="hidden lg:flex lg:w-[60%] relative bg-slate-100 items-center justify-center p-16 overflow-hidden">
          
          {/* Animated Mesh Gradient Background - Optimized */}
          <div className="absolute inset-0 bg-slate-50 overflow-hidden">
             <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-[128px] opacity-30 animate-blob will-change-transform"></div>
             <div className="absolute top-0 -right-4 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-[128px] opacity-30 animate-blob animation-delay-2000 will-change-transform"></div>
             <div className="absolute -bottom-32 left-20 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-[128px] opacity-30 animate-blob animation-delay-4000 will-change-transform"></div>
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 brightness-100 contrast-150"></div>
          </div>

          <div className="relative z-10 w-full max-w-2xl flex flex-col items-center text-center">
             
             <div className="relative w-full h-[400px] mb-12 animate-float perspective-1000">
                 
                 <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[320px] bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl shadow-2xl p-6 flex flex-col gap-4 transform rotate-y-6 rotate-x-6 hover:rotate-0 transition-all duration-700">
                     <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div className="flex gap-2">
                           <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                           <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                           <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                        </div>
                        <div className="h-2 w-20 bg-slate-200 rounded-full"></div>
                     </div>
                     <div className="flex-1 flex items-end gap-2 px-2 pb-2">
                        {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                           <div key={i} className="flex-1 bg-gradient-to-t from-blue-400/40 to-blue-500/80 rounded-t-lg relative group" style={{ height: `${h}%` }}>
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded">
                                 {h}%
                              </div>
                           </div>
                        ))}
                     </div>
                 </div>

                 <div className="absolute top-0 right-10 w-48 bg-white/90 backdrop-blur-2xl border border-slate-200 rounded-2xl p-4 shadow-xl animate-float animation-delay-2000">
                    <div className="flex items-center gap-3 mb-2">
                       <div className="p-2 bg-emerald-100 rounded-lg">
                          <Award className="w-5 h-5 text-emerald-600" />
                       </div>
                       <div className="text-xs text-emerald-700 font-medium">GPA Cao nhất</div>
                    </div>
                    <div className="text-3xl font-bold text-slate-800 tracking-tight">3.92</div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full mt-3 overflow-hidden">
                       <div className="w-[92%] h-full bg-emerald-500 rounded-full"></div>
                    </div>
                 </div>

                 <div className="absolute bottom-0 left-10 w-56 bg-white/90 backdrop-blur-2xl border border-slate-200 rounded-2xl p-4 shadow-xl animate-float animation-delay-4000">
                     <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-blue-700 font-bold uppercase">Hoạt động</span>
                        <Activity className="w-4 h-4 text-blue-600" />
                     </div>
                     <div className="space-y-3">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-[10px] text-blue-700 font-bold">W1</div>
                           <div className="flex-1">
                              <div className="h-1.5 w-16 bg-slate-300 rounded-full mb-1"></div>
                              <div className="h-1.5 w-8 bg-slate-200 rounded-full"></div>
                           </div>
                        </div>
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-[10px] text-purple-700 font-bold">W2</div>
                           <div className="flex-1">
                              <div className="h-1.5 w-20 bg-slate-300 rounded-full mb-1"></div>
                              <div className="h-1.5 w-12 bg-slate-200 rounded-full"></div>
                           </div>
                        </div>
                     </div>
                 </div>

             </div>
          </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="w-full lg:w-[40%] flex flex-col justify-center px-6 sm:px-12 md:px-20 bg-white relative overflow-y-auto">

          <div className="w-full max-w-md mx-auto space-y-8 animate-in slide-in-from-right-8 duration-700 fade-in py-10 lg:py-0">
              
              <div className="space-y-2">
                 <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight break-words">
                    {isBlockedState ? "Tài khoản bị hạn chế" : isConcurrentState ? "Phiên đăng nhập hết hạn" : (systemSettings?.loginTitle || "Chào mừng trở lại")}
                 </h2>
                 <p className="text-sm sm:text-base text-slate-500 font-medium break-words">
                    {isConcurrentState ? "Tài khoản đang được sử dụng ở nơi khác" : (systemSettings?.loginSubtitle || "Nhập thông tin xác thực để truy cập.")}
                 </p>
              </div>

              {isBlockedState && currentMessage ? (
                  <div className="bg-red-50 border border-red-100 p-6 rounded-2xl space-y-4">
                      <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-600 shrink-0">
                              <Ban className="w-6 h-6" />
                          </div>
                          <div>
                             <p className="text-xs font-bold text-red-600 uppercase tracking-wider">Trạng thái khóa</p>
                             <p className="font-bold text-slate-900">{getBlockReason(currentMessage)}</p>
                          </div>
                      </div>
                      <div className="flex gap-3 pt-2">
                          <a href={`mailto:${systemSettings?.contactEmail}`} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-bold hover:bg-slate-50 transition-colors">
                              <Mail className="w-4 h-4" /> Gửi hỗ trợ
                          </a>
                          <button onClick={() => { setError(null); clearLogoutMessage(); }} className="px-4 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">
                             Quay lại
                          </button>
                      </div>
                  </div>
              ) : (
                 <>
                    {logoutMessage && (
                        <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-sm font-medium text-amber-900">{logoutMessage}</p>
                        </div>
                    )}
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 animate-in shake">
                            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                            <p className="text-sm font-medium text-red-900">{error}</p>
                        </div>
                    )}
                    {systemSettings?.maintenanceMode && (
                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
                            <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                            <p className="text-sm font-medium text-blue-900">
                              {isAdminAccess 
                                ? "Chế độ bảo trì - Đăng nhập Admin" 
                                : "Hệ thống đang bảo trì kỹ thuật. Vui lòng quay lại sau."}
                            </p>
                        </div>
                    )}

                    {/* Login Form - Hide when maintenance mode is ON (except for admin access via secret URL) */}
                    {(!systemSettings?.maintenanceMode || isAdminAccess) && (!systemSettings?.disableStandardLogin || isAdminAccess) ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-slate-700 ml-1">Tài khoản</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <input 
                                            type="text" 
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold text-slate-900 placeholder:text-slate-400 appearance-none"
                                            placeholder="Mã sinh viên / Username"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center ml-1">
                                       <label className="text-sm font-bold text-slate-700">Mật khẩu</label>
                                    </div>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                            <Lock className="w-5 h-5" />
                                        </div>
                                        <input 
                                            type={showPassword ? "text" : "password"} 
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full appearance-none pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold text-slate-900 placeholder:text-slate-400"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 rounded-md hover:bg-slate-100 transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-2xl shadow-xl shadow-blue-500/20 transition-all hover:shadow-blue-500/30 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
                            >
                                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                                    <>
                                        Đăng nhập <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </form>
                    ) : (
                        <div className="text-center py-10 px-6 bg-slate-50 rounded-3xl border border-slate-200 border-dashed">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400 shadow-sm border border-slate-100">
                                <Lock className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-2">Đăng nhập tạm khóa</h3>
                            <div className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto"
                                dangerouslySetInnerHTML={{ __html: systemSettings?.disableLoginMessage || "Vui lòng sử dụng SSO." }}
                            />
                        </div>
                    )}

                    {/* SSO Buttons - Hide when maintenance mode is ON */}
                    {!systemSettings?.maintenanceMode && (
                      <>
                        <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                            <div className="relative flex justify-center"><span className="bg-white px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Hoặc đăng nhập với</span></div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                type="button" 
                                onClick={handleGoogleLogin}
                                className="flex items-center justify-center gap-3 h-12 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all font-bold text-sm text-slate-700 hover:border-slate-300 group active:scale-95"
                            >
                                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                </svg>
                                Google
                            </button>
                            <button 
                                type="button" 
                                onClick={handleMicrosoftLogin}
                                className="flex items-center justify-center gap-3 h-12 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all font-bold text-sm text-slate-700 hover:border-slate-300 group active:scale-95"
                            >
                                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 21 21">
                                    <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                                    <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                                    <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                                    <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
                                </svg>
                                Microsoft
                            </button>
                        </div>
                      </>
                    )}
                 </>
              )}
              
              <div className="pt-6 text-center">
                  <p className="text-xs font-semibold text-slate-400">
                    {systemSettings?.copyrightText || "© 2025 ICTU Student Portal. Powered by React."}
                  </p>
              </div>
          </div>
      </div>
    </div>
  );
};

export default Login;
