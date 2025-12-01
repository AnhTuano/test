
import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { AdminUserDetailedStats, ClassDetails } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthProvider';
import { X, User, Activity, BookOpen, Clock, Shield, AlertTriangle, Smartphone, LayoutDashboard, GraduationCap } from 'lucide-react';
import ClassSelector from './ClassSelector';
import TestResultsDisplay from './TestResultsDisplay';

interface AdminUserDetailModalProps {
  username: string;
  onClose: () => void;
}

const AdminUserDetailModal: React.FC<AdminUserDetailModalProps> = ({ username, onClose }) => {
  const { token } = useAuth();
  const [data, setData] = useState<AdminUserDetailedStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'academic' | 'activity'>('overview');

  // Grades Page Logic Replication
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedClassName, setSelectedClassName] = useState<string>("");
  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);

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

  // Handle Class Selection (Replicated from Grades.tsx)
  const handleClassSelected = useCallback((classId: number, className: string) => {
    if (classId === 0) {
      setSelectedClassId(null);
      setSelectedClassName("");
      setClassDetails(null);
    } else {
      setSelectedClassId(classId);
      setSelectedClassName(className);
    }
  }, []);

  // Fetch Class Details when selected (Replicated from Grades.tsx)
  useEffect(() => {
    const fetchClassData = async () => {
      if (!selectedClassId || !token) return;
      try {
        const details = await api.getClassDetails(token, selectedClassId);
        setClassDetails(details);
      } catch (err) {
        console.error("Error loading class data", err);
      }
    };
    fetchClassData();
  }, [selectedClassId, token]);


  const content = (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full md:max-w-5xl h-full md:h-auto md:max-h-[90vh] md:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-full md:zoom-in-95 duration-300 border-x-0 md:border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 z-10 shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-500/30">
                {username.charAt(0).toUpperCase()}
             </div>
             <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                   {loading ? 'Đang tải...' : data?.user.full_name}
                   {data?.user.role === 'ADMIN' && <Shield className="w-4 h-4 text-blue-500" />}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">{username}</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-6 gap-6 shrink-0 bg-white dark:bg-slate-900 overflow-x-auto no-scrollbar">
           {['overview', 'academic', 'activity'].map((tab) => (
             <button
               key={tab}
               onClick={() => setActiveTab(tab as any)}
               className={`py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                 activeTab === tab 
                 ? 'border-blue-600 text-blue-600 dark:text-blue-400' 
                 : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
               }`}
             >
               {tab === 'overview' && 'Thông tin chung'}
               {tab === 'academic' && 'Kết quả học tập'}
               {tab === 'activity' && 'Lịch sử hoạt động'}
             </button>
           ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50 dark:bg-slate-950">
          {loading ? (
             <div className="space-y-4 animate-pulse">
                <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
                    <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
                </div>
                <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
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
                       <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                             <User className="w-4 h-4" /> Hồ sơ cá nhân
                          </h4>
                          <div className="space-y-4">
                             <div className="flex justify-between border-b border-slate-50 dark:border-slate-800 pb-2">
                                <span className="text-slate-500 dark:text-slate-400">Mã sinh viên</span>
                                <span className="font-medium text-slate-900 dark:text-white font-mono">{data.user.student_code || 'N/A'}</span>
                             </div>
                             <div className="flex justify-between border-b border-slate-50 dark:border-slate-800 pb-2">
                                <span className="text-slate-500 dark:text-slate-400">Ngày sinh</span>
                                <span className="font-medium text-slate-900 dark:text-white">
                                   {data.user.birthday ? new Date(data.user.birthday).toLocaleDateString('vi-VN') : 'N/A'}
                                </span>
                             </div>
                             <div className="flex justify-between border-b border-slate-50 dark:border-slate-800 pb-2">
                                <span className="text-slate-500 dark:text-slate-400">Lớp quản lý</span>
                                <span className="font-medium text-slate-900 dark:text-white">{data.user.class_name || 'N/A'}</span>
                             </div>
                             <div className="flex justify-between pb-2">
                                <span className="text-slate-500 dark:text-slate-400">Khoa</span>
                                <span className="font-medium text-slate-900 dark:text-white">{data.user.department || 'N/A'}</span>
                             </div>
                          </div>
                       </div>

                       {/* Status Card */}
                       <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                             <Activity className="w-4 h-4" /> Trạng thái tài khoản
                          </h4>
                          
                          <div className={`p-4 rounded-xl mb-4 flex items-center gap-4 ${
                             data.user.status === 'active' 
                             ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' 
                             : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                          }`}>
                             <div className={`p-2 rounded-full ${data.user.status === 'active' ? 'bg-emerald-100 dark:bg-emerald-800' : 'bg-red-100 dark:bg-red-800'}`}>
                                {data.user.status === 'active' ? <User className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                             </div>
                             <div>
                                <div className="font-bold text-lg uppercase">{data.user.status}</div>
                                {data.user.status === 'blocked' && (
                                   <div className="text-sm opacity-90">Lý do: {data.user.blocked_reason || 'Vi phạm'}</div>
                                )}
                             </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-center">
                                  <div className="text-2xl font-bold text-slate-900 dark:text-white">{data.loginHistory.length}</div>
                                  <div className="text-xs text-slate-500">Lần đăng nhập</div>
                              </div>
                              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-center">
                                  <div className="text-2xl font-bold text-slate-900 dark:text-white">{data.academicOverview.totalTests}</div>
                                  <div className="text-xs text-slate-500">Bài kiểm tra</div>
                              </div>
                          </div>
                       </div>
                    </div>
                 </div>
               )}

               {/* ACADEMIC TAB - FULL REPLICA OF GRADES.TSX */}
               {activeTab === 'academic' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                     
                     {/* 1. Class Selector */}
                     {token && (
                        <ClassSelector
                            token={token}
                            studentId={data.user.id}
                            initialClassId={null}
                            onClassSelected={handleClassSelected}
                        />
                     )}

                     {/* 2. Class Info Card */}
                     {selectedClassId && classDetails && (
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 rounded-[2rem] shadow-lg text-white p-6 md:p-8 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="relative z-10">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <span className="bg-white/20 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 inline-block">
                                            {classDetails.kyhieu}
                                        </span>
                                        <h2 className="text-2xl md:text-3xl font-bold mb-2">{classDetails.name}</h2>
                                        <p className="text-blue-100 flex items-center gap-2">
                                            <LayoutDashboard className="w-4 h-4" />
                                            {classDetails.sotinchi} Tín chỉ
                                        </p>
                                    </div>
                                    <div className="text-right">
                                         <div className="text-blue-200 text-sm mb-1">Giảng viên</div>
                                         {classDetails.managers.map(m => (
                                             <div key={m.username} className="font-semibold text-lg">{m.display_name}</div>
                                         ))}
                                    </div>
                                </div>
                            </div>
                            {/* Decoration */}
                            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                        </div>
                     )}

                     {/* 3. Results Display */}
                     {selectedClassId && token ? (
                         <div className="bg-slate-100 dark:bg-slate-900/50 p-4 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                            <TestResultsDisplay 
                                token={token}
                                classId={selectedClassId}
                                className={selectedClassName}
                            />
                         </div>
                     ) : (
                         <div className="flex flex-col items-center justify-center py-20 text-center opacity-50 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 border-dashed">
                             <BookOpen className="w-24 h-24 text-slate-300 dark:text-slate-600 mb-4" />
                             <h3 className="text-xl font-bold text-slate-400 dark:text-slate-500">Chưa chọn môn học</h3>
                             <p className="text-slate-400 dark:text-slate-500 max-w-sm mt-2">
                                Vui lòng chọn năm học, học kỳ và môn học để xem chi tiết điểm số của sinh viên này.
                             </p>
                         </div>
                     )}
                  </div>
               )}

               {/* ACTIVITY TAB */}
               {activeTab === 'activity' && (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
                         <h4 className="text-sm font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2">
                             <Clock className="w-4 h-4" /> Lịch sử đăng nhập (10 lần gần nhất)
                         </h4>
                      </div>
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                         {data.loginHistory.map((log) => (
                            <div key={log.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex justify-between items-center">
                               <div className="flex items-center gap-4">
                                  <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500">
                                     <Smartphone className="w-5 h-5" />
                                  </div>
                                  <div>
                                     <div className="font-bold text-slate-900 dark:text-white text-sm">{log.device}</div>
                                     <div className="text-xs text-slate-500 font-mono">{log.ip_address}</div>
                                  </div>
                               </div>
                               <div className="text-right">
                                  <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
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
