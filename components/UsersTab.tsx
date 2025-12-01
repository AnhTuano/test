

import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { UserProfile } from '../types';
import { useToast } from './ToastProvider';
import AdminUserDetailModal from './AdminUserDetailModal';
import { StatsCardSkeleton, UserRowSkeleton } from './Skeleton';
import { 
  Search, Filter, Building, ChevronDown, FileSpreadsheet, Shield, User, 
  Mail, Calendar, Lock, Unlock, ChevronLeft, ChevronRight, GraduationCap
} from 'lucide-react';

const UsersTab: React.FC = () => {
  const toast = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'blocked'>('all');
  const [filterDepartment, setFilterDepartment] = useState('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Modal
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, selectedClass, filterStatus, filterDepartment]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const u = await api.adminGetUsers();
      setUsers(u);
    } catch (err) {
      toast.error("Lỗi tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBlock = async (e: React.MouseEvent, username: string, currentStatus: string) => {
    e.stopPropagation();
    if (currentStatus === 'active') {
      const reason = prompt("Nhập lý do chặn người dùng này:");
      if (!reason) return;
      await api.adminToggleBlockUser(username, reason);
      toast.success(`Đã chặn người dùng ${username}`);
    } else {
      if (!confirm(`Bạn có chắc chắn muốn mở khóa tài khoản "${username}" không?`)) return;
      await api.adminToggleBlockUser(username, "");
      toast.success(`Đã mở khóa cho ${username}`);
    }
    fetchUsers();
  };

  const exportData = () => {
      if (!users || users.length === 0) {
          toast.warning("Không có dữ liệu để xuất");
          return;
      }
      const headers = ['Tài khoản', 'Họ và Tên', 'Mã Sinh Viên', 'Lớp Quản Lý', 'Khoa', 'Email', 'Vai trò', 'Trạng thái', 'Ngày sinh'];
      const keys = ['username', 'full_name', 'student_code', 'class_name', 'department', 'email', 'role', 'status', 'birthday'];
      const formattedData = filteredUsers.map(item => ({
          username: item.username,
          full_name: item.full_name,
          student_code: item.student_code || '',
          class_name: item.class_name || '',
          department: item.department || '',
          email: item.email || '',
          role: item.role === 'ADMIN' ? 'Quản trị viên' : 'Sinh viên',
          status: item.status === 'active' ? 'Hoạt động' : 'Đã khóa',
          birthday: item.birthday && !isNaN(new Date(item.birthday).getTime()) 
            ? new Date(item.birthday).toLocaleDateString('vi-VN') 
            : ''
      }));
      const csvContent = [
        headers.join(','),
        ...formattedData.map(row => keys.map(key => {
            let val = (row as any)[key];
            if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
                val = `"${val.replace(/"/g, '""')}"`;
            }
            return val;
        }).join(','))
      ].join('\r\n');
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('hidden', '');
      a.setAttribute('href', url);
      a.setAttribute('download', `User_List_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
  };

  const classes = useMemo(() => Array.from(new Set(users.map(u => u.class_name).filter(Boolean) as string[])).sort(), [users]);
  const departments = useMemo(() => Array.from(new Set(users.map(u => u.department).filter(Boolean) as string[])).sort(), [users]);

  const filteredUsers = useMemo(() => {
    const term = debouncedSearchTerm.toLowerCase();
    return users.filter(u => {
      const matchesSearch = (u.username.toLowerCase().includes(term) || u.full_name.toLowerCase().includes(term) || (u.student_code && u.student_code.toLowerCase().includes(term)));
      const matchesClass = selectedClass ? u.class_name === selectedClass : true;
      const matchesStatus = filterStatus === 'all' ? true : u.status === filterStatus;
      const matchesDept = filterDepartment === 'all' ? true : u.department === filterDepartment;
      return matchesSearch && matchesClass && matchesStatus && matchesDept;
    });
  }, [users, debouncedSearchTerm, selectedClass, filterStatus, filterDepartment]);

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const stats = useMemo(() => ({
      total: users.length,
      blocked: users.filter(u => u.status === 'blocked').length,
      admins: users.filter(u => u.role === 'ADMIN').length
  }), [users]);

  if (loading && users.length === 0) return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Stats Skeleton */}
      <div className="grid grid-cols-3 gap-3 md:gap-6">
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </div>
      {/* User Rows Skeleton */}
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-4 space-y-2">
        {[...Array(6)].map((_, i) => <UserRowSkeleton key={i} />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {selectedUserForDetail && <AdminUserDetailModal username={selectedUserForDetail} onClose={() => setSelectedUserForDetail(null)} />}

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 md:gap-6">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-200 dark:border-slate-800 text-center md:text-left shadow-sm">
           <div className="text-[10px] md:text-xs font-extrabold text-slate-400 uppercase tracking-widest">Tổng User</div>
           <div className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white mt-2 tracking-tight">{stats.total}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-200 dark:border-slate-800 text-center md:text-left shadow-sm">
           <div className="text-[10px] md:text-xs font-extrabold text-slate-400 uppercase tracking-widest">Bị khóa</div>
           <div className="text-2xl md:text-4xl font-black text-red-500 mt-2 tracking-tight">{stats.blocked}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-200 dark:border-slate-800 text-center md:text-left shadow-sm">
            <div className="text-[10px] md:text-xs font-extrabold text-slate-400 uppercase tracking-widest">Quản trị</div>
            <div className="text-2xl md:text-4xl font-black text-blue-500 mt-2 tracking-tight">{stats.admins}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col xl:flex-row gap-3 bg-white dark:bg-slate-900 p-4 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
           <input type="text" placeholder="Tìm kiếm tên, mã SV..." className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-transparent dark:border-slate-800 rounded-2xl text-sm font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative min-w-[150px]">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="w-full pl-10 pr-10 py-3.5 bg-slate-50 dark:bg-slate-950 border border-transparent dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 appearance-none outline-none focus:bg-white dark:focus:bg-black focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer">
                    <option value="all">Tất cả trạng thái</option>
                    <option value="active">Đang hoạt động</option>
                    <option value="blocked">Đã khóa</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            <div className="relative min-w-[150px]">
                <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select value={filterDepartment} onChange={e => setFilterDepartment(e.target.value)} className="w-full pl-10 pr-10 py-3.5 bg-slate-50 dark:bg-slate-950 border border-transparent dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 appearance-none outline-none focus:bg-white dark:focus:bg-black focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer">
                    <option value="all">Tất cả khoa</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            <button onClick={exportData} className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-colors shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 whitespace-nowrap active:scale-95">
                <FileSpreadsheet className="w-4 h-4" /> <span className="hidden sm:inline">Xuất Excel</span>
            </button>
        </div>
      </div>

      <div className="bg-transparent md:bg-white md:dark:bg-slate-900 md:rounded-[2.5rem] md:border md:border-slate-200 md:dark:border-slate-800 md:shadow-sm overflow-hidden">
        
        {/* DESKTOP TABLE */}
        <div className="hidden md:block overflow-x-auto min-h-[400px]">
            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
                    <tr>
                        <th className="px-8 py-5 text-[10px] uppercase font-extrabold tracking-widest text-slate-400">Thành viên</th>
                        <th className="px-6 py-5 text-[10px] uppercase font-extrabold tracking-widest text-slate-400">Thông tin đào tạo</th>
                        <th className="px-6 py-5 text-center text-[10px] uppercase font-extrabold tracking-widest text-slate-400">Vai trò</th>
                        <th className="px-8 py-5 text-right text-[10px] uppercase font-extrabold tracking-widest text-slate-400">Trạng thái</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {paginatedUsers.map(user => (
                        <tr key={user.id} onClick={() => setSelectedUserForDetail(user.username)} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors group cursor-pointer">
                            
                            {/* Column 1: Identity */}
                            <td className="px-8 py-5">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-base font-bold shadow-sm shrink-0 transition-transform group-hover:scale-110 ${user.role === 'ADMIN' ? 'bg-slate-800 text-white' : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>
                                        {user.full_name.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-bold text-slate-900 dark:text-white text-base group-hover:text-blue-600 transition-colors truncate max-w-[200px]">
                                            {user.full_name}
                                        </div>
                                        <div className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mt-1 truncate max-w-[200px]">
                                            <Mail className="w-3 h-3 shrink-0" /> 
                                            <span className="truncate">{user.email || user.username}</span>
                                        </div>
                                    </div>
                                </div>
                            </td>

                            {/* Column 2: Academic Info */}
                            <td className="px-6 py-5">
                                <div className="space-y-2">
                                    <div className="flex flex-wrap gap-2">
                                        {user.student_code ? (
                                            <span className="font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700">
                                                {user.student_code}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-slate-400 italic">--</span>
                                        )}
                                        {user.class_name && (
                                            <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-lg text-xs font-bold border border-blue-100 dark:border-blue-900/50">
                                                {user.class_name}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                                        {user.department && (
                                            <div className="flex items-center gap-1.5">
                                                <Building className="w-3.5 h-3.5" />
                                                <span className="truncate max-w-[180px]">{user.department}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </td>

                            {/* Column 3: Role */}
                            <td className="px-6 py-5 text-center">
                                {user.role === 'ADMIN' ? (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 text-white shadow-lg shadow-slate-900/20">
                                        <Shield className="w-3.5 h-3.5" /> Admin
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                        <User className="w-3.5 h-3.5" /> Sinh viên
                                    </span>
                                )}
                            </td>

                            {/* Column 4: Status & Actions */}
                            <td className="px-8 py-5 text-right">
                                <div className="flex items-center justify-end gap-4">
                                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${user.status === 'active' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${user.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                        {user.status === 'active' ? 'Active' : 'Blocked'}
                                    </span>
                                    <button 
                                        onClick={(e) => handleToggleBlock(e, user.username, user.status)} 
                                        className={`p-2.5 rounded-xl transition-all border active:scale-95 ${
                                            user.status === 'active' 
                                            ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-900/10' 
                                            : 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 hover:bg-emerald-100'
                                        }`}
                                        title={user.status === 'active' ? 'Chặn tài khoản' : 'Mở khóa tài khoản'}
                                    >
                                        {user.status === 'active' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {/* MOBILE CARDS */}
        <div className="md:hidden space-y-4">
            {paginatedUsers.map(user => (
                <div key={user.id} onClick={() => setSelectedUserForDetail(user.username)} className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 active:scale-[0.98] transition-all touch-manipulation overflow-hidden">
                    
                    {/* Card Header */}
                    <div className="p-5 flex items-center gap-4 border-b border-slate-50 dark:border-slate-800/50">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold shadow-sm shrink-0 ${user.role === 'ADMIN' ? 'bg-slate-800 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                            {user.full_name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-slate-900 dark:text-white text-lg truncate">{user.full_name}</h4>
                                {user.role === 'ADMIN' && <Shield className="w-4 h-4 text-blue-600 shrink-0" />}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 truncate">
                                <Mail className="w-3.5 h-3.5 shrink-0" /> {user.email || user.username}
                            </div>
                        </div>
                    </div>

                    {/* Card Body - Grid Info */}
                    <div className="p-5 bg-slate-50/50 dark:bg-slate-950/30 grid grid-cols-2 gap-4">
                         <div className="space-y-1.5">
                            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Mã SV / Lớp</span>
                            <div className="flex flex-wrap gap-2">
                                {user.student_code ? (
                                    <span className="font-mono bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700">
                                        {user.student_code}
                                    </span>
                                ) : <span className="text-xs text-slate-400">--</span>}
                                {user.class_name && (
                                    <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-lg text-xs font-bold border border-blue-100 dark:border-blue-900/50">
                                        {user.class_name}
                                    </span>
                                )}
                            </div>
                         </div>
                         <div className="space-y-1.5">
                            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Khoa / Viện</span>
                            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                                {user.department || '--'}
                            </div>
                         </div>
                    </div>

                    {/* Card Footer */}
                    <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
                         <div className={`font-bold text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-full ${user.status === 'active' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>
                             <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                             {user.status === 'active' ? 'Đang hoạt động' : 'Đã khóa'}
                         </div>
                         <button 
                            onClick={(e) => handleToggleBlock(e, user.username, user.status)} 
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors border active:scale-95 ${
                                user.status === 'active' 
                                ? 'border-slate-200 dark:border-slate-700 text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50' 
                                : 'border-emerald-200 dark:border-emerald-800 text-emerald-600 hover:bg-emerald-50'
                            }`}
                        >
                            {user.status === 'active' ? <><Lock className="w-3.5 h-3.5" /> Chặn</> : <><Unlock className="w-3.5 h-3.5" /> Mở khóa</>}
                        </button>
                    </div>
                </div>
            ))}
        </div>

        {totalPages > 1 && (
            <div className="px-6 py-6 border-t border-slate-100 dark:border-slate-800 flex justify-center items-center gap-4 bg-slate-50/50 dark:bg-slate-900">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors shadow-sm"><ChevronLeft className="w-5 h-5" /></button>
                <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Trang {currentPage} / {totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors shadow-sm"><ChevronRight className="w-5 h-5" /></button>
            </div>
        )}
      </div>
    </div>
  );
};

export default UsersTab;
