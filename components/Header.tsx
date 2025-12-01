import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { ThemeToggle } from './ThemeToggle';
import { DesktopClock, MobileClock } from './LiveClock';
import { UserRole } from '../types';
import { GraduationCap, Shield, LogOut, User, BookOpen } from 'lucide-react';

interface HeaderProps {
  portalName: string;
  dashboardTitle: string;
}

const Header: React.FC<HeaderProps> = ({ portalName, dashboardTitle }) => {
  const { profile, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!profile) return null;

  // Kiểm tra admin bằng cả profile.role và role từ context
  const isAdmin = profile.role === UserRole.ADMIN || profile.role === 'ADMIN' || role === UserRole.ADMIN || role === 'ADMIN';
  const isOnAdminPage = location.pathname === '/admin';
  const isOnGradesPage = location.pathname === '/grades';

  return (
    <header className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 transition-colors h-16 md:h-20 flex items-center">
      <div className="w-full px-4 md:px-8 lg:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 md:w-10 md:h-10 bg-slate-100 dark:bg-slate-800 rounded-xl md:rounded-2xl flex items-center justify-center shadow-sm shrink-0 p-1.5">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div className="hidden xs:block">
            <h1 className="text-base md:text-lg font-bold text-slate-900 dark:text-white leading-tight">{portalName}</h1>
            <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider">{dashboardTitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-6">
          {/* Desktop Clock Isolated Component */}
          <DesktopClock />

          {/* Mobile Clock Isolated Component */}
          <MobileClock />

          <div className="flex items-center gap-2">
            {/* Admin Panel Button - Hiển thị khi là admin và đang ở trang grades */}
            {isAdmin && isOnGradesPage && (
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 bg-slate-800 dark:bg-slate-800 text-white rounded-xl hover:bg-slate-700 dark:hover:bg-slate-700 transition-all font-bold text-[10px] md:text-xs uppercase tracking-wider shadow-lg shadow-slate-900/20 active:scale-95"
              >
                <Shield className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="hidden sm:inline">Quản trị</span>
              </button>
            )}

            {/* Student Portal Button - Hiển thị khi là admin và đang ở trang admin */}
            {isAdmin && isOnAdminPage && (
              <button
                onClick={() => navigate('/grades')}
                className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 bg-blue-600 dark:bg-blue-600 text-white rounded-xl hover:bg-blue-500 dark:hover:bg-blue-500 transition-all font-bold text-[10px] md:text-xs uppercase tracking-wider shadow-lg shadow-blue-500/20 active:scale-95"
              >
                <BookOpen className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="hidden sm:inline">Trang sinh viên</span>
              </button>
            )}

            {/* Theme Toggle */}
            {/* <ThemeToggle className="ml-0 rounded-xl" /> */}
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-3 pl-2 sm:pl-4 sm:border-l border-slate-200 dark:border-slate-800">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight">{profile.full_name}</p>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 font-mono">{profile.student_code || "Sinh viên"}</p>
            </div>
            <div className="relative group cursor-pointer">
              <div className="w-9 h-9 md:w-10 md:h-10 bg-slate-100 dark:bg-slate-900 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-300 transition-colors group-hover:border-blue-500 group-hover:text-blue-500">
                <User className="w-5 h-5" />
              </div>
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-950 rounded-full"></div>
            </div>
            <button
              onClick={() => logout()}
              className="p-2.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors active:scale-95 ml-1"
              title="Đăng xuất"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;