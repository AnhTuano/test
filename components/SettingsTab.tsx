

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { api } from '../services/api';
import { SystemSettings } from '../types';
import { useToast } from './ToastProvider';
import { Settings, Shield, Loader2, Save, Type, Mail, Globe, AlertTriangle, LucideIcon } from 'lucide-react';

// Moved outside to prevent re-creation on every render
interface SettingInputProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon?: LucideIcon;
  placeholder?: string;
  id: string;
}

const SettingInput = memo(({ label, value, onChange, icon: Icon, placeholder, id }: SettingInputProps) => (
  <div className="space-y-2">
     <label htmlFor={id} className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">{label}</label>
     <div className="relative group">
        {Icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none"><Icon className="w-5 h-5" /></div>}
        <input 
          id={id}
          type="text" 
          value={value} 
          onChange={onChange} 
          className={`w-full ${Icon ? 'pl-12' : 'pl-4'} pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 border border-transparent dark:border-slate-800 rounded-2xl focus:bg-white dark:focus:bg-black focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 shadow-sm`}
          placeholder={placeholder} 
        />
     </div>
  </div>
));

SettingInput.displayName = 'SettingInput';

const SettingsTab: React.FC = () => {
  const toast = useToast();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    api.adminGetSettings().then(setSettings).catch(console.error);
  }, []);

  // Use useCallback to prevent onChange handlers from being recreated
  // MUST be before any conditional returns to follow Rules of Hooks
  const handlePortalNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(prev => prev ? {...prev, portalName: e.target.value} : prev);
  }, []);

  const handleDashboardTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(prev => prev ? {...prev, dashboardTitle: e.target.value} : prev);
  }, []);

  const handleContactEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(prev => prev ? {...prev, contactEmail: e.target.value} : prev);
  }, []);

  const handleCopyrightChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(prev => prev ? {...prev, copyrightText: e.target.value} : prev);
  }, []);

  const handleSaveSettings = useCallback(async () => {
    if (settings) {
      setSaveStatus('loading');
      try {
        await api.adminUpdateSettings(settings);
        setSaveStatus('success');
        toast.success("Đã lưu cấu hình hệ thống");
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (e) {
        toast.error("Lỗi khi lưu cấu hình");
        setSaveStatus('idle');
      }
    }
  }, [settings, toast]);

  const handleFactoryReset = useCallback(async () => {
    if (!confirm("Khôi phục cài đặt gốc? Mọi thay đổi sẽ bị mất.")) return;
    setSaveStatus('loading');
    const defaultSettings: SystemSettings = {
        maintenanceMode: false, socialLoginOnly: false, disableStandardLogin: false,
        disableLoginMessage: "Chức năng đăng nhập bằng tài khoản/mật khẩu đang tạm khóa.",
        portalName: "Student Portal", dashboardTitle: "ICTU Dashboard",
        loginTitle: "Chào mừng trở lại", loginSubtitle: "Cổng thông tin sinh viên ICTU",
        contactEmail: "admin@ictu.edu.vn", contactZalo: "0987654321", appVersion: "v1.0.0", copyrightText: "© 2025 ICTU",
        aboutTitle: "ICTU Student Portal", aboutDescription: "Hệ thống theo dõi kết quả học tập."
    };
    try {
        await api.adminUpdateSettings(defaultSettings);
        setSettings(defaultSettings);
        setSaveStatus('success');
        toast.success("Đã khôi phục cài đặt gốc");
        setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (e) {
        toast.error("Lỗi khi khôi phục");
        setSaveStatus('idle');
    }
  }, [toast]);

  const insertFormatting = useCallback((startTag: string, endTag: string) => {
    if (!messageInputRef.current) return;
    setSettings(prev => {
      if (!prev) return prev;
      const textarea = messageInputRef.current!;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = prev.disableLoginMessage;
      const newText = text.substring(0, start) + startTag + text.substring(start, end) + endTag + text.substring(end);
      setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + startTag.length, end + startTag.length);
      }, 0);
      return {...prev, disableLoginMessage: newText};
    });
  }, []);

  if (!settings) return <div className="p-8 text-center text-slate-400 flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* General Config */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm p-6 lg:p-8 flex flex-col h-full">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-3 mb-8">
                <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600">
                    <Settings className="w-5 h-5" />
                </div>
                Cấu hình chung
            </h3>
            <div className="space-y-6 flex-1">
                <SettingInput 
                    id="portalName"
                    label="Tên cổng (Main Title)" 
                    value={settings.portalName} 
                    onChange={handlePortalNameChange}
                    icon={Globe}
                    placeholder="Ví dụ: Student Portal"
                />
                <SettingInput 
                    id="dashboardTitle"
                    label="Tiêu đề phụ (Dashboard Title)" 
                    value={settings.dashboardTitle} 
                    onChange={handleDashboardTitleChange}
                    icon={Type}
                    placeholder="Ví dụ: ICTU Dashboard"
                />
                <SettingInput 
                    id="contactEmail"
                    label="Email hỗ trợ" 
                    value={settings.contactEmail} 
                    onChange={handleContactEmailChange}
                    icon={Mail}
                    placeholder="support@ictu.edu.vn"
                />
                <SettingInput 
                    id="copyrightText"
                    label="Copyright (Footer)" 
                    value={settings.copyrightText || ''} 
                    onChange={handleCopyrightChange}
                    icon={Type}
                    placeholder="© 2025 ICTU Student Portal"
                />
                
                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center group cursor-pointer" onClick={() => setSettings({...settings, maintenanceMode: !settings.maintenanceMode})}>
                        <div>
                            <label className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">Chế độ bảo trì</label>
                            <p className="text-xs text-slate-500">Chỉ Admin mới có thể đăng nhập</p>
                        </div>
                        <div className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${settings.maintenanceMode ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
                            <div className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-300 ${settings.maintenanceMode ? 'translate-x-6' : ''}`}></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Login Config */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm p-6 lg:p-8 flex flex-col h-full">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-3 mb-8">
                <div className="p-2.5 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-purple-600">
                    <Shield className="w-5 h-5" />
                </div>
                Cấu hình đăng nhập
            </h3>
            
            <div className="space-y-6 flex-1">
                <div className="bg-slate-50 dark:bg-slate-950/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center cursor-pointer" onClick={() => setSettings({...settings, disableStandardLogin: !settings.disableStandardLogin})}>
                        <div>
                            <label className="text-sm font-bold text-slate-900 dark:text-white">Tắt đăng nhập thường</label>
                            <p className="text-xs text-slate-500">Chỉ cho phép đăng nhập qua SSO (Google/Microsoft)</p>
                        </div>
                        <div className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${settings.disableStandardLogin ? 'bg-purple-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
                            <div className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-300 ${settings.disableStandardLogin ? 'translate-x-6' : ''}`}></div>
                        </div>
                    </div>
                </div>

                {settings.disableStandardLogin && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                        <div className="flex justify-between items-center px-1">
                             <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Thông báo hiển thị</label>
                             <div className="flex gap-2">
                                <button onClick={() => insertFormatting('<b>', '</b>')} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-bold transition-colors">B</button>
                                <button onClick={() => insertFormatting('<i>', '</i>')} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs italic transition-colors">I</button>
                                <button onClick={() => insertFormatting('<br/>', '')} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs transition-colors">↵</button>
                             </div>
                        </div>
                        <textarea 
                            ref={messageInputRef} 
                            rows={5} 
                            value={settings.disableLoginMessage} 
                            onChange={e => setSettings({...settings, disableLoginMessage: e.target.value})} 
                            className="w-full px-5 py-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none text-sm font-medium text-slate-700 dark:text-slate-300 transition-all resize-none" 
                        />
                        <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-500 px-2">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            <p>Thông báo này sẽ hiện thay thế cho form đăng nhập.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
        </div>

        {/* Floating Action Bar */}
        <div className="sticky bottom-6 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-2 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-black/50 flex items-center justify-between max-w-2xl mx-auto">
            <button 
                onClick={handleFactoryReset} 
                className="px-6 py-3 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
            >
                Khôi phục mặc định
            </button>
            <button 
                onClick={handleSaveSettings} 
                disabled={saveStatus === 'loading'} 
                className="px-8 py-3 bg-slate-900 dark:bg-white hover:bg-blue-600 dark:hover:bg-blue-400 text-white dark:text-slate-900 font-bold rounded-[1.5rem] shadow-lg transition-all active:scale-95 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {saveStatus === 'loading' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {saveStatus === 'success' ? 'Đã lưu!' : 'Lưu thay đổi'}
            </button>
        </div>
    </div>
  );
};

export default SettingsTab;
