
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthProvider';
import { Timer, LogOut, MousePointer2 } from 'lucide-react';

const EVENTS = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
const TIMEOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const WARNING_DURATION = 60 * 1000; // Show warning 60s before timeout

const SessionTimeout: React.FC = () => {
  const { isLoggedIn, logout } = useAuth();
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);

  // Reset timer on user activity
  const resetTimer = useCallback(() => {
    if (!showWarning) {
      setLastActivity(Date.now());
    }
  }, [showWarning]);

  // Setup event listeners
  useEffect(() => {
    if (!isLoggedIn) return;

    const handleActivity = () => resetTimer();

    EVENTS.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      EVENTS.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [isLoggedIn, resetTimer]);

  // Check timeout interval
  useEffect(() => {
    if (!isLoggedIn) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivity;

      // Check if we should show warning
      if (timeSinceLastActivity >= TIMEOUT_DURATION - WARNING_DURATION) {
         if (!showWarning) {
             setShowWarning(true);
         }
         // Update countdown
         const remaining = Math.ceil((TIMEOUT_DURATION - timeSinceLastActivity) / 1000);
         setTimeLeft(remaining);

         // Time's up
         if (remaining <= 0) {
             logout("Hết phiên làm việc (Tự động đăng xuất do không hoạt động)");
             setShowWarning(false);
         }
      } else {
         if (showWarning) setShowWarning(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isLoggedIn, lastActivity, showWarning, logout]);

  const handleExtendSession = () => {
      setLastActivity(Date.now());
      setShowWarning(false);
  };

  if (!showWarning || !isLoggedIn) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Timer className="w-8 h-8 text-amber-600" />
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 mb-2">Cảnh báo hết phiên</h3>
            <p className="text-slate-500 mb-6">
                Để bảo mật, hệ thống sẽ tự động đăng xuất sau <span className="font-bold text-red-500">{timeLeft} giây</span> nữa nếu không có hoạt động.
            </p>

            <div className="flex gap-3">
                <button 
                    onClick={() => logout("Người dùng chủ động đăng xuất")}
                    className="flex-1 py-3 px-4 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                >
                    <LogOut className="w-4 h-4" /> Đăng xuất
                </button>
                <button 
                    onClick={handleExtendSession}
                    className="flex-1 py-3 px-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
                >
                    <MousePointer2 className="w-4 h-4" /> Tiếp tục
                </button>
            </div>
        </div>
    </div>
  );
};

export default SessionTimeout;
