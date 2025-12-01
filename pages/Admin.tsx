import React, { useState, useEffect, useTransition, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { api } from '../services/api'; // Import API to fetch settings
import { 
  LayoutDashboard, Users, Bell, Settings, LogOut, 
  ShieldAlert, GraduationCap, User, Zap, Loader2
} from 'lucide-react';

// Imported Isolated Components
import SecurityTab from '../components/SecurityTab';
import SystemTab from '../components/SystemTab';
import UsersTab from '../components/UsersTab';
import SettingsTab from '../components/SettingsTab';
import NotificationsTab from '../components/NotificationsTab';
import { DesktopClock, MobileClock } from '../components/LiveClock';

const Admin: React.FC = () => {
  const { logout, profile } = useAuth();
  const navigate = useNavigate();
  
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<'system' | 'users' | 'notifications' | 'settings' | 'security'>('system');
  
  // Settings State for Sidebar
  const [dashboardTitle, setDashboardTitle] = useState("ICTU Dashboard");

  // Removed internal clock state (currentTime, setInterval)

  // Fetch Settings for Sidebar Title
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await api.getPublicSettings();
        if (settings.dashboardTitle) setDashboardTitle(settings.dashboardTitle);
      } catch (err) {}
    };
    fetchSettings();
  }, [activeTab]); // Refetch when tab changes (in case settings were updated in Settings tab)

  const handleTabChange = (tab: typeof activeTab) => {
    startTransition(() => setActiveTab(tab));
  };

  const DesktopNavItem = ({ id, icon: Icon, label }: { id: typeof activeTab, icon: any, label: string }) => (
    <button 
      onClick={() => handleTabChange(id)} 
      className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold transition-all duration-300 group relative overflow-hidden ${
        activeTab === id 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
        : 'text-slate-600  hover:text-slate-900  hover:bg-slate-200 
      }`}
    >
        <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${activeTab === id ? 'text-white' : 'text-slate-500 group-hover:text-slate-700  />
        <span className="relative z-10">{label}</span>
    </button>
  );
  
  const MobileNavItem = ({ id, icon: Icon }: { id: typeof activeTab, icon: any }) => (
    <button 
      onClick={() => handleTabChange(id)} 
      className={`relative p-3 rounded-full transition-all duration-300 ${
        activeTab === id 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40 -translate-y-2' 
        : 'text-slate-400 hover:text-slate-600 
      }`}
    >
        <Icon className="w-6 h-6" />
        {activeTab === id && (
            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600  rounded-full opacity-0"></span>
        )}
    </button>
  );

  const renderContent = useMemo(() => {
    switch (activeTab) {
      case 'system': return <SystemTab />;
      case 'users': return <UsersTab />;
      case 'security': return <SecurityTab />;
      case 'notifications': return <NotificationsTab />;
      case 'settings': return <SettingsTab />;
      default: return null;
    }
  }, [activeTab]);


  return (
    <div className="flex h-screen bg-slate-50  font-sans overflow-hidden transition-colors selection:bg-blue-500 selection:text-white">
      
      {/* Sidebar - Minimalist Glassmorphism */}
      <aside className="hidden lg:flex w-80 flex-col bg-white  border-r border-slate-200  z-40 relative transition-colors">
         <div className="h-24 flex items-center px-8">
            <div className="flex items-center gap-3.5">
               <div className="w-10 h-10 rounded-2xl bg-slate-100  flex items-center justify-center shadow-lg shadow-blue-500/20  p-1.5">
                  <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
               </div>
               <div>
                  <h1 className="font-bold text-xl text-slate-900  leading-none tracking-tight">Admin</h1>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5 block">{dashboardTitle}</span>
               </div>
            </div>
         </div>

         <div className="flex-1 overflow-y-auto py-6 px-6 space-y-1.5 no-scrollbar">
             <div className="px-5 mb-3 mt-2 text-[10px] font-extrabold text-slate-500  uppercase tracking-widest">Hệ thống</div>
             <DesktopNavItem id="system" icon={LayoutDashboard} label="Tổng quan" />
             <DesktopNavItem id="security" icon={Zap} label="An ninh & DDoS" />
             <DesktopNavItem id="notifications" icon={Bell} label="Thông báo" />
             
             <div className="px-5 mt-8 mb-3 text-[10px] font-extrabold text-slate-500  uppercase tracking-widest">Quản lý</div>
             <DesktopNavItem id="users" icon={Users} label="Người dùng" />
             <DesktopNavItem id="settings" icon={Settings} label="Cài đặt" />
         </div>

         <div className="p-6">
             <div className="bg-slate-100  rounded-3xl p-1 border border-slate-200  backdrop-blur-sm">
                <button onClick={() => navigate('/grades')} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-slate-600  hover:bg-slate-200  hover:text-slate-900  transition-colors group">
                    <GraduationCap className="w-4 h-4 group-hover:text-blue-500  transition-colors" /> Trang Sinh viên
                </button>
                <button onClick={() => logout()} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-slate-600  hover:bg-red-100  hover:text-red-600  transition-colors group">
                    <LogOut className="w-4 h-4 group-hover:text-red-500 transition-colors" /> Đăng xuất
                </button>
             </div>
         </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-full transition-all relative">
         
         {/* Header - Unified Design - Full Width */}
         <header className="h-20 bg-white/80  backdrop-blur-2xl border-b border-slate-200  sticky top-0 z-30 flex items-center justify-between px-6 md:px-8 lg:px-12 transition-colors">
            <div>
               <h2 className="text-xl font-bold text-slate-900  hidden sm:flex items-center gap-3">
                  {activeTab === 'system' && "Tổng quan hệ thống"}
                  {activeTab === 'users' && "Quản lý người dùng"}
                  {activeTab === 'notifications' && "Thông báo & Tin tức"}
                  {activeTab === 'settings' && "Cài đặt hệ thống"}
                  {activeTab === 'security' && <><span className="text-red-600  flex items-center gap-2 animate-pulse"><ShieldAlert className="w-5 h-5" /> Trung tâm An ninh</span></>}
                  {isPending && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
               </h2>
               <div className="sm:hidden flex items-center gap-3">
                   <div className="w-9 h-9 bg-white  rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 p-1.5 border border-slate-200 
                      <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                   </div>
                   <span className="font-bold text-slate-900  Panel</span>
               </div>
            </div>
            
            <div className="flex items-center gap-3 md:gap-5">
               {/* Desktop Clock Isolated Component */}
               <DesktopClock />

               {/* Mobile Clock Isolated Component */}
               <MobileClock />

               <div className="flex items-center gap-2">
                   {/* Mobile: Show student page button since sidebar is hidden */}}
                   <button 
                     onClick={() => navigate('/grades')} 
                     className="lg:hidden flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-all font-bold text-[10px] uppercase tracking-wider shadow-lg shadow-blue-500/20 active:scale-95" 
                     title="Về trang Sinh viên"
                   >
                     <GraduationCap className="w-4 h-4" />
                   </button>
                   <button onClick={() => logout()} className="p-2.5 lg:hidden text-slate-400 hover:text-red-500 bg-slate-100  rounded-xl active:scale-95" title="Đăng xuất"><LogOut className="w-5 h-5" /></button>
               </div>
               
               <div className="hidden lg:flex items-center gap-3 border-l border-slate-200  pl-5 ml-2">
                  <div className="text-right">
                      <div className="text-sm font-bold text-slate-900 
                      <div className="text-[10px] font-bold uppercase text-slate-500">Quản trị viên</div>
                  </div>
                  <div className="w-10 h-10 bg-slate-100  rounded-xl flex items-center justify-center border border-slate-200  text-slate-500  className="w-5 h-5" /></div>
               </div>
            </div>
         </header>

         {/* Content Area - Full Width */}
         <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 pb-32 lg:pb-12 bg-slate-50  relative scroll-smooth">
            <div className={`w-full transition-all duration-300 ${isPending ? 'opacity-80 scale-[0.995]' : 'opacity-100 scale-100'}`}>
               {renderContent}
            </div>
         </main>

         {/* Floating Mobile Dock */}
         <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-auto min-w-[320px] max-w-sm">
            <nav className="bg-white/80  backdrop-blur-xl border border-slate-200/50  rounded-full shadow-2xl shadow-slate-200/50  p-3 px-6 flex justify-between items-center">
                <MobileNavItem id="system" icon={LayoutDashboard} />
                <MobileNavItem id="security" icon={Zap} />
                <MobileNavItem id="notifications" icon={Bell} />
                <MobileNavItem id="users" icon={Users} />
                <MobileNavItem id="settings" icon={Settings} />
            </nav>
         </div>
      </div>
    </div>
  );
};

export default Admin;