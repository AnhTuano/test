
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AdminUserDetailedStats } from '../types';
import { api } from '../services/api';
import { X, User, Activity, Clock, Shield, AlertTriangle, Smartphone } from 'lucide-react';

interface AdminUserDetailModalProps {
   username: string;
   onClose: () => void;
}

const AdminUserDetailModal: React.FC<AdminUserDetailModalProps> = ({ username, onClose }) => {
   const [data, setData] = useState<AdminUserDetailedStats | null>(null);
   const [loading, setLoading] = useState(true);
   const [activeTab, setActiveTab] = useState<'overview' | 'activity'>('overview');

   useEffect(() => {
      const fetchData = async () => {
         try {
            const details = await api.adminGetUserDetails(username);
            setData(details);
         } catch (err) {
            console.error(err);
         } finally {
            setLoading(false);
         }
      };
      fetchData();
   }, [username]);

   const content = (
      <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
         <div className="bg-white w-full md:max-w-5xl h-full md:h-auto md:max-h-[90vh] md:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-full md:zoom-in-95 duration-300 border-x-0 md:border border-slate-200">

            {/* Header */}
            <div className="p-4 md:p-5 border-b border-slate-100 flex justify-between items-center bg-white z-10 shrink-0">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-500/30">
                     {username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                     <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        {loading ? 'Đang tải...' : data?.user.full_name}
                        {data?.user.role === 'ADMIN' && <Shield className="w-4 h-4 text-blue-500" />}
                     </h3>
                     <p className="text-sm text-slate-500 font-mono">{username}</p>
                  </div>
               </div>
               <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
                  <X className="w-6 h-6" />
               </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-100 px-6 gap-6 shrink-0 bg-white overflow-x-auto no-scrollbar">
               {['overview', 'activity'].map((tab) => (
                  <button
                     key={tab}
                     onClick={() => setActiveTab(tab as any)}
                     className={`py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === tab
                           ? 'border-blue-600 text-blue-600'
                           : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                  >
                     {tab === 'overview' && 'Thông tin chung'}
                     {tab === 'activity' && 'Lịch sử hoạt động'}
                  </button>
               ))}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50">
               {loading ? (
                  <div className="space-y-4 animate-pulse">
                     <div className="h-32 bg-slate-200 rounded-2xl"></div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="h-24 bg-slate-200 rounded-2xl"></div>
                        <div className="h-24 bg-slate-200 rounded-2xl"></div>
                     </div>
                     <div className="h-40 bg-slate-200 rounded-2xl"></div>
                  </div>
               ) : !data ? (
                  <div className="text-center p-8 text-slate-500">Không tìm thấy dữ liệu</div>
               ) : (
                  <>
                     {/* OVERVIEW TAB */}
                     {activeTab === 'overview' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Profile Card */}
                              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                 <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <User className="w-4 h-4" /> Hồ sơ cá nhân
                                 </h4>
                                 <div className="space-y-4">
                                    <div className="flex justify-between border-b border-slate-50 pb-2">
                                       <span className="text-slate-500">Mã sinh viên</span>
                                       <span className="font-medium text-slate-900 font-mono">{data.user.student_code || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-50 pb-2">
                                       <span className="text-slate-500">Ngày sinh</span>
                                       <span className="font-medium text-slate-900">
                                          {data.user.birthday && !isNaN(new Date(data.user.birthday).getTime())
                                             ? new Date(data.user.birthday).toLocaleDateString('vi-VN')
                                             : 'N/A'}
                                       </span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-50 pb-2">
                                       <span className="text-slate-500">Giới tính</span>
                                       <span className="font-medium text-slate-900">{data.user.gender || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-50 pb-2">
                                       <span className="text-slate-500">Lớp quản lý</span>
                                       <span className="font-medium text-slate-900">{data.user.class_name || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between pb-2">
                                       <span className="text-slate-500">Khoa</span>
                                       <span className="font-medium text-slate-900">{data.user.department || 'N/A'}</span>
                                    </div>
                                 </div>
                              </div>

                              {/* Status Card */}
                              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                 <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Activity className="w-4 h-4" /> Trạng thái tài khoản
                                 </h4>

                                 <div className={`p-4 rounded-xl mb-4 flex items-center gap-4 ${data.user.status === 'active'
                                       ? 'bg-emerald-50 text-emerald-700'
                                       : 'bg-red-50 text-red-700'
                                    }`}>
                                    <div className={`p-2 rounded-full ${data.user.status === 'active' ? 'bg-emerald-100' : 'bg-red-100'}`}>
                                       {data.user.status === 'active' ? <User className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                                    </div>
                                    <div>
                                       <div className="font-bold text-lg uppercase">{data.user.status}</div>
                                       {data.user.status === 'blocked' && (
                                          <div className="text-sm opacity-90">Lý do: {data.user.blocked_reason || 'Vi phạm'}</div>
                                       )}
                                    </div>
                                 </div>

                                 <div className="bg-slate-50 p-3 rounded-xl text-center">
                                    <div className="text-2xl font-bold text-slate-900">{data.loginHistory.length}</div>
                                    <div className="text-xs text-slate-500">Lần đăng nhập</div>
                                 </div>
                              </div>
                           </div>
                        </div>
                     )}

                     {/* ACTIVITY TAB */}
                     {activeTab === 'activity' && (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
                           <div className="p-4 border-b border-slate-100 bg-slate-50">
                              <h4 className="text-sm font-bold text-slate-600 flex items-center gap-2">
                                 <Clock className="w-4 h-4" /> Lịch sử đăng nhập (10 lần gần nhất)
                              </h4>
                           </div>
                           <div className="divide-y divide-slate-100">
                              {data.loginHistory.map((log) => (
                                 <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                       <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                                          <Smartphone className="w-5 h-5" />
                                       </div>
                                       <div>
                                          <div className="font-bold text-slate-900 text-sm">{log.device}</div>
                                          <div className="text-xs text-slate-500 font-mono">{log.ip_address}</div>
                                       </div>
                                    </div>
                                    <div className="text-right">
                                       <div className="text-sm font-medium text-slate-700">
                                          {new Date(log.timestamp).toLocaleTimeString('vi-VN')}
                                       </div>
                                       <div className="text-xs text-slate-500">
                                          {new Date(log.timestamp).toLocaleDateString('vi-VN')}
                                       </div>
                                    </div>
                                 </div>
                              ))}
                              {data.loginHistory.length === 0 && (
                                 <div className="p-8 text-center text-slate-400">Không có dữ liệu</div>
                              )}
                           </div>
                        </div>
                     )}
                  </>
               )}
            </div>
         </div>
      </div>
   );

   return createPortal(content, document.body);
};

export default AdminUserDetailModal;
