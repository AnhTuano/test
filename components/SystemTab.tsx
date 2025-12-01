
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from './ToastProvider';
import { StatsCardSkeleton, TableSkeleton } from './Skeleton';
import { 
  Activity, Server, Database, Globe, Smartphone, CheckCircle, 
  Download, Trash2, TrendingUp, RefreshCw 
} from 'lucide-react';

const SystemTab: React.FC = () => {
  const toast = useToast();
  const [metrics, setMetrics] = useState<any>(null);
  const [dbStats, setDbStats] = useState<any>(null);
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [activityData, setActivityData] = useState<{date: string, value: number}[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [m, d, l] = await Promise.all([
        api.getSystemMetrics(),
        api.getDatabaseStats(),
        api.getLoginActivities(100) // Lấy 100 bản ghi gần nhất
      ]);
      setMetrics(m);
      setDbStats(d);
      setLoginHistory(l);

      // Tính toán Activity Data từ dữ liệu thật
      const days = 7;
      const activityMap = new Map<string, number>();
      
      // Khởi tạo 7 ngày gần nhất với giá trị 0
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (days - 1 - i));
        const dateKey = date.toLocaleDateString('vi-VN', {day: '2-digit', month: '2-digit'});
        activityMap.set(dateKey, 0);
      }
      
      // Đếm số lượng login theo ngày từ dữ liệu thật
      l.forEach((log: any) => {
        const logDate = new Date(log.timestamp);
        const dateKey = logDate.toLocaleDateString('vi-VN', {day: '2-digit', month: '2-digit'});
        if (activityMap.has(dateKey)) {
          activityMap.set(dateKey, (activityMap.get(dateKey) || 0) + 1);
        }
      });
      
      // Chuyển đổi Map thành Array
      const generatedActivity = Array.from(activityMap.entries()).map(([date, value]) => ({
        date,
        value
      }));
      
      setActivityData(generatedActivity);
    } catch (err) {
      
      toast.error("Lỗi tải dữ liệu hệ thống");
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (confirm("Xóa toàn bộ lịch sử đăng nhập?")) {
      setLoading(true);
      try {
        await api.adminClearLoginActivities();
        const l = await api.getLoginActivities();
        setLoginHistory(l);
        toast.success("Đã xóa lịch sử đăng nhập");
      } catch (e) {
        toast.error("Lỗi khi xóa lịch sử");
      } finally {
        setLoading(false);
      }
    }
  };

  const exportData = () => {
    if (!loginHistory || loginHistory.length === 0) {
        toast.warning("Không có dữ liệu để xuất");
        return;
    }
    const headers = ['Tài khoản', 'Địa chỉ IP', 'Thiết bị', 'Thời gian truy cập', 'Trạng thái'];
    const keys = ['username', 'ip_address', 'device', 'timestamp', 'status'];
    const formattedData = loginHistory.map(item => ({
        username: item.username,
        ip_address: item.ip_address,
        device: item.device,
        timestamp: new Date(item.timestamp).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }),
        status: item.status === 'success' ? 'Thành công' : 'Thất bại'
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
    a.setAttribute('download', `Login_History_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const renderActivityChart = () => {
    if (activityData.length === 0) return null;
    const height = 200;
    const width = 800; 
    const padding = 20;
    const maxValue = Math.max(...activityData.map(d => d.value));
    const maxVal = maxValue > 0 ? maxValue * 1.2 : 10; // Minimum scale khi không có dữ liệu
    const totalLogins = activityData.reduce((sum, d) => sum + d.value, 0);
    const points = activityData.map((d, i) => {
        const x = (i / (activityData.length - 1)) * (width - 2 * padding) + padding;
        const y = height - ((d.value / maxVal) * (height - 2 * padding)) - padding;
        return `${x},${y}`;
    }).join(' ');
    const areaPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 relative overflow-hidden group">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Lưu lượng truy cập</h3>
                        <p className="text-xs text-slate-500">Thống kê 7 ngày qua • Tổng cộng {totalLogins} lượt đăng nhập</p>
                    </div>
                </div>
            </div>
            <div className="w-full aspect-[2/1] md:aspect-[4/1] max-h-[250px]">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    {[0, 0.25, 0.5, 0.75, 1].map((tick, i) => (
                        <line key={i} x1={padding} y1={height - padding - (tick * (height - 2 * padding))} x2={width - padding} y2={height - padding - (tick * (height - 2 * padding))} stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeWidth="1" strokeDasharray="4 4" />
                    ))}
                    <polygon points={areaPoints} fill="url(#chartGradient)" />
                    <polyline points={points} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    {activityData.map((d, i) => {
                         const x = (i / (activityData.length - 1)) * (width - 2 * padding) + padding;
                         const y = height - ((d.value / maxVal) * (height - 2 * padding)) - padding;
                         return (
                             <g key={i} className="group/point">
                                 <circle cx={x} cy={y} r="4" className="fill-blue-600 stroke-white dark:stroke-slate-900 stroke-2 transition-all group-hover/point:r-6" />
                                 <g className="opacity-0 group-hover/point:opacity-100 transition-opacity pointer-events-none">
                                     <rect x={x - 20} y={y - 40} width="40" height="25" rx="6" className="fill-slate-800 dark:fill-white" />
                                     <text x={x} y={y - 24} textAnchor="middle" className="fill-white dark:fill-slate-900 text-[10px] font-bold">{d.value}</text>
                                 </g>
                                 <text x={x} y={height + 15} textAnchor="middle" className="fill-slate-400 text-[10px] font-medium hidden sm:block">{d.date}</text>
                             </g>
                         )
                    })}
                </svg>
            </div>
        </div>
    );
  };

  if (!metrics || !dbStats) return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </div>
      {/* Chart Skeleton */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 h-64">
        <div className="animate-pulse h-full flex flex-col">
          <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
          <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
        </div>
      </div>
      {/* Table Skeleton */}
      <TableSkeleton />
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header Action for Refresh */}
        <div className="flex justify-end">
             <button onClick={fetchData} disabled={loading} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all active:scale-95">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Làm mới</span>
             </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        {[
            { label: 'Thời gian vận hành', value: metrics.uptime, icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
            { label: 'Bộ nhớ RAM', value: metrics.memoryUsage, icon: Server, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
            { label: 'Kết nối hiện hành', value: dbStats.activeConnections, icon: Database, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' }
        ].map((stat, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-5">
                <div className={`p-4 rounded-2xl ${stat.bg}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wide">{stat.label}</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stat.value}</p>
                </div>
            </div>
        ))}
        </div>

        {renderActivityChart()}

        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Globe className="w-5 h-5 text-blue-500" />
                    Lịch sử hoạt động
                </h3>
                <div className="flex gap-2">
                    <button onClick={exportData} className="text-xs font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 border border-blue-200 dark:border-blue-900 active:scale-95">
                        <Download className="w-3.5 h-3.5" /> Xuất Excel
                    </button>
                    <button onClick={handleClearHistory} className="text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 border border-red-200 dark:border-red-900 active:scale-95">
                        <Trash2 className="w-3.5 h-3.5" /> Xóa lịch sử
                    </button>
                </div>
            </div>
            
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Người dùng</th>
                            <th className="px-6 py-4">Thiết bị</th>
                            <th className="px-6 py-4">Thời gian</th>
                            <th className="px-6 py-4 text-right">Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {loginHistory.map((log: any) => (
                            <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-slate-900 dark:text-white text-sm">{log.username}</div>
                                    <div className="text-xs text-slate-400 font-mono">{log.ip_address}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2">
                                        <Smartphone className="w-4 h-4 text-slate-400" />
                                        {log.device}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-slate-600 dark:text-slate-300 font-medium">{new Date(log.timestamp).toLocaleTimeString('vi-VN')}</div>
                                    <div className="text-xs text-slate-400">{new Date(log.timestamp).toLocaleDateString('vi-VN')}</div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800">
                                        <CheckCircle className="w-3 h-3" /> Thành công
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                {loginHistory.map((log: any) => (
                    <div key={log.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <div className="font-bold text-slate-900 dark:text-white text-sm">{log.username}</div>
                                <div className="text-xs text-slate-400 font-mono">{log.ip_address}</div>
                            </div>
                            <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                {new Date(log.timestamp).toLocaleTimeString('vi-VN')}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                                <div className="flex items-center gap-1 text-slate-500">
                                    <Smartphone className="w-3 h-3" />
                                    <span className="truncate max-w-[150px]">{log.device}</span>
                                </div>
                                <span className="text-emerald-600 font-bold flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" /> Thành công
                                </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

export default SystemTab;
