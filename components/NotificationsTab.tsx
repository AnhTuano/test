
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { PopupNotification } from '../types';
import { useToast } from './ToastProvider';
import { Bell, AlertTriangle, Loader2, Save } from 'lucide-react';
import NotificationPopup from './NotificationPopup';

const NotificationsTab: React.FC = () => {
  const toast = useToast();
  const [notification, setNotification] = useState<PopupNotification | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getPopupNotification().then(setNotification).catch(console.error);
  }, []);

  const containsMaliciousInput = (text: string) => /<script\b[^>]*>|javascript:|onclick=|onerror=/i.test(text);

  const handleSaveNotification = async () => {
    if (!notification) return;
    if (containsMaliciousInput(notification.title) || containsMaliciousInput(notification.content)) {
        setError("Phát hiện mã độc (XSS). Vui lòng kiểm tra lại nội dung.");
        toast.error("Nội dung không an toàn!");
        return;
    }
    setError(null);
    setSaveStatus('loading');
    try {
      await api.adminUpdatePopup(notification);
      setSaveStatus('success');
      toast.success("Đã cập nhật thông báo");
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (e) {
      toast.error("Lỗi khi cập nhật thông báo");
      setSaveStatus('idle');
    }
  };

  const applyNotificationTemplate = (type: 'info' | 'warning' | 'error' | 'success') => {
      if (!notification) return;
      setError(null);
      const templates = {
          info: { title: "Thông báo từ Nhà trường", content: "Chào mừng các bạn sinh viên quay trở lại học kỳ mới.", type: 'info' as const },
          warning: { title: "Lịch bảo trì hệ thống", content: "Hệ thống sẽ bảo trì vào 22:00 hôm nay.", type: 'warning' as const },
          error: { title: "Sự cố kết nối", content: "Hệ thống đang gặp sự cố gián đoạn kết nối.", type: 'error' as const },
          success: { title: "Cập nhật điểm thi", content: "Đã cập nhật đầy đủ điểm thi của Tuần mới.", type: 'success' as const }
      };
      setNotification({ ...notification, ...templates[type], isActive: true });
  };

  if (!notification) return <div className="p-8 text-center text-slate-400">Đang tải thông báo...</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 lg:p-8">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Bell className="w-5 h-5 text-blue-500" /> Cấu hình thông báo</h3>
                <div className="flex items-center gap-2"><span className={`text-xs font-bold px-2 py-1 rounded uppercase ${notification.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{notification.isActive ? 'Đang hiện' : 'Đã ẩn'}</span><div className={`w-3 h-3 rounded-full ${notification.isActive ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></div></div>
            </div>
            <div className="space-y-4">
                <input type="text" value={notification.title} onChange={e => setNotification({...notification, title: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-slate-900 transition-all" placeholder="Tiêu đề" />
                <textarea rows={4} value={notification.content} onChange={e => setNotification({...notification, content: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none text-slate-600 transition-all" placeholder="Nội dung" />
                <div className="grid grid-cols-2 gap-4">
                    <select value={notification.type} onChange={e => setNotification({...notification, type: e.target.value as any})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 cursor-pointer transition-all"><option value="info">Thông tin (Xanh dương)</option><option value="warning">Cảnh báo (Cam)</option><option value="error">Lỗi (Đỏ)</option><option value="success">Thành công (Xanh lá)</option></select>
                    <button onClick={() => setNotification({...notification, isActive: !notification.isActive})} className={`w-full py-3 rounded-xl font-bold transition-all border ${notification.isActive ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'}`}>{notification.isActive ? 'ĐANG BẬT' : 'ĐANG TẮT'}</button>
                </div>
                {error && <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {error}</div>}
                <button onClick={handleSaveNotification} disabled={saveStatus === 'loading'} className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-2 disabled:opacity-70">{saveStatus === 'loading' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}{saveStatus === 'success' ? 'Đã lưu thành công!' : 'Lưu thay đổi'}</button>
            </div>
        </div>
        <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Mẫu nhanh</h4>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => applyNotificationTemplate('info')} className="p-3 bg-blue-50 hover:bg-blue-100 rounded-xl text-xs font-bold text-blue-600 transition-colors">Thông tin</button>
                    <button onClick={() => applyNotificationTemplate('warning')} className="p-3 bg-amber-50 hover:bg-amber-100 rounded-xl text-xs font-bold text-amber-600 transition-colors">Bảo trì</button>
                    <button onClick={() => applyNotificationTemplate('error')} className="p-3 bg-red-50 hover:bg-red-100 rounded-xl text-xs font-bold text-red-600 transition-colors">Sự cố</button>
                    <button onClick={() => applyNotificationTemplate('success')} className="p-3 bg-emerald-50 hover:bg-emerald-100 rounded-xl text-xs font-bold text-emerald-600 transition-colors">Thành công</button>
                </div>
            </div>
            <div className="relative h-[250px] bg-slate-100 rounded-3xl border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden"><p className="absolute top-4 left-0 w-full text-center text-xs font-bold text-slate-400 uppercase tracking-widest z-0">Xem trước</p><NotificationPopup notification={notification} onClose={() => {}} isPreview={true} /></div>
        </div>
        </div>
    </div>
  );
};

export default NotificationsTab;
