import React, { useState, useEffect, memo } from 'react';
import { api } from '../services/api';
import { SecurityStats, SecurityLog } from '../types';
import { ShieldAlert, Radio, Lock, Unlock, RefreshCw, Users, Wifi, AlertTriangle, Shield } from 'lucide-react';
import { useToast } from '../components/ToastProvider';

// 1. Isolated Traffic Component to prevent parent re-renders
const TrafficVisualizer = memo(({ isSimulatingAttack, rps }: { isSimulatingAttack: boolean, rps: number }) => {
    const [trafficData, setTrafficData] = useState<number[]>(new Array(20).fill(10));

    useEffect(() => {
        const trafficInterval = setInterval(() => {
            setTrafficData(prev => {
                const newData = [...prev.slice(1)];
                const baseLoad = isSimulatingAttack ? 80 : 20;
                const variance = isSimulatingAttack ? 20 : 10;
                newData.push(Math.min(100, Math.max(5, baseLoad + Math.random() * variance - variance / 2)));
                return newData;
            });
        }, 500); // 500ms update
        return () => clearInterval(trafficInterval);
    }, [isSimulatingAttack]);

    return (
        <div className="mt-8">
            <div className="flex justify-between text-xs text-slate-400 mb-2 font-mono uppercase">
                <span>Lưu lượng trực tiếp (Req/giây)</span>
                <span>{rps.toLocaleString()} RPS</span>
            </div>
            <div className="h-24 flex items-end gap-1">
                {trafficData.map((height, idx) => (
                    <div
                        key={idx}
                        style={{ height: `${height}%` }}
                        className={`flex-1 rounded-t-sm transition-all duration-300 ${height > 75
                                ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                                : height > 50
                                    ? 'bg-amber-400'
                                    : 'bg-emerald-500'
                            }`}
                    ></div>
                ))}
            </div>
        </div>
    );
});

const SecurityTab: React.FC = () => {
  const toast = useToast();
  const [securityStats, setSecurityStats] = useState<SecurityStats | null>(null);
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [isSimulatingAttack, setIsSimulatingAttack] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch Security Data
  const fetchSecurityData = async () => {
    try {
      const { stats, logs } = await api.getSecurityMetrics(isSimulatingAttack);
      setSecurityStats(stats);
      setSecurityLogs(logs);
    } catch (err) {
      
    }
  };

  // Fetch Security Data Loop
  useEffect(() => {
    fetchSecurityData();
    const interval = setInterval(fetchSecurityData, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [isSimulatingAttack]);

  // Manual Refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchSecurityData();
    setIsRefreshing(false);
    toast.success("Đã cập nhật dữ liệu an ninh");
  };

  // Unblock user from security log
  const handleUnblock = async (log: SecurityLog) => {
    // Extract username from details
    const usernameMatch = log.details.match(/Tài khoản (\S+) bị khóa/);
    if (usernameMatch) {
      const username = usernameMatch[1];
      try {
        await api.unblockUser(username);
        toast.success(`Đã mở khóa tài khoản ${username}`);
        await fetchSecurityData();
      } catch (error) {
        toast.error("Lỗi khi mở khóa tài khoản");
      }
    }
  };

  // Simulate Attack Trigger
  useEffect(() => {
    let timer: any;
    if (isSimulatingAttack) {
      toast.warning("Hệ thống đang giả lập tấn công DDoS...");
      timer = setTimeout(() => {
        api.triggerSecurityLockout();
        setIsSimulatingAttack(false);
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [isSimulatingAttack, toast]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Control Panel */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl overflow-hidden relative">
        {/* Animated Background */}
        <div className={`absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 opacity-50 z-0 ${isSimulatingAttack ? 'animate-pulse bg-red-900/20' : ''}`}></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${isSimulatingAttack ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}>
              <ShieldAlert className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Giám sát An ninh</h3>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${isSimulatingAttack ? 'bg-red-500 animate-ping' : 'bg-emerald-400'}`}></div>
                <span className={`text-sm font-mono ${isSimulatingAttack ? 'text-red-400' : 'text-emerald-400'}`}>
                  {isSimulatingAttack ? 'ĐANG BỊ TẤN CÔNG (DDoS)' : 'HỆ THỐNG AN TOÀN'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsSimulatingAttack(!isSimulatingAttack)}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all border active:scale-95 ${
              isSimulatingAttack
                ? 'bg-red-600 border-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
          >
            {isSimulatingAttack ? 'Dừng giả lập' : 'Giả lập tấn công'}
          </button>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-4 py-2.5 rounded-xl font-bold text-sm transition-all border bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white active:scale-95 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>

        {/* Real-time Traffic Visualizer - ISOLATED */}
        <TrafficVisualizer isSimulatingAttack={isSimulatingAttack} rps={securityStats ? securityStats.requestsPerSecond : 0} />
      </div>
      
      {/* Stats Row */}
      {securityStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Shield className={`w-4 h-4 ${
                securityStats.threatLevel === 'critical' ? 'text-red-500' :
                  securityStats.threatLevel === 'high' ? 'text-orange-500' :
                    securityStats.threatLevel === 'medium' ? 'text-yellow-500' : 'text-emerald-500'
              }`} />
              <span className="text-[10px] font-bold text-slate-400 uppercase">Cấp độ đe dọa</span>
            </div>
            <div className={`text-xl font-black uppercase ${
              securityStats.threatLevel === 'critical' ? 'text-red-500' :
                securityStats.threatLevel === 'high' ? 'text-orange-500' :
                  securityStats.threatLevel === 'medium' ? 'text-yellow-500' : 'text-emerald-500'
              }`}>
              {securityStats.threatLevel === 'low' ? 'Thấp' :
                securityStats.threatLevel === 'medium' ? 'Trung bình' :
                  securityStats.threatLevel === 'high' ? 'Cao' : 'Nguy hiểm'}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4 text-red-500" />
              <span className="text-[10px] font-bold text-slate-400 uppercase">Tài khoản bị khóa</span>
            </div>
            <div className="text-xl font-black text-slate-800 dark:text-white">
              {securityStats.blockedIPsCount}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span className="text-[10px] font-bold text-slate-400 uppercase">Sự cố (24h)</span>
            </div>
            <div className="text-xl font-black text-slate-800 dark:text-white">
              {securityStats.totalAttacks24h.toLocaleString()}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Wifi className="w-4 h-4 text-emerald-500" />
              <span className="text-[10px] font-bold text-slate-400 uppercase">Phiên hoạt động</span>
            </div>
            <div className="text-xl font-black text-slate-800 dark:text-white">
              {securityStats.activeConnections.toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Log Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-red-500 animate-pulse" />
            Tài khoản bị khóa & Mối đe dọa
          </h3>
          <span className="text-xs text-slate-400">
            {securityLogs.length} bản ghi
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold">
              <tr>
                <th className="px-6 py-3">Thời gian</th>
                <th className="px-6 py-3">Loại</th>
                <th className="px-6 py-3">Nguồn IP</th>
                <th className="px-6 py-3">Chi tiết</th>
                <th className="px-6 py-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {securityLogs.length > 0 ? (
                securityLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="px-6 py-4 font-mono text-slate-500 dark:text-slate-400 text-xs">
                      {new Date(log.timestamp).toLocaleString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`uppercase font-bold text-xs px-2 py-1 rounded ${
                        log.type === 'ddos' ? 'text-red-500 bg-red-50 dark:bg-red-900/20' :
                          log.type === 'sql_injection' ? 'text-purple-500 bg-purple-50 dark:bg-purple-900/20' : 
                            log.type === 'brute_force' ? 'text-orange-500 bg-orange-50 dark:bg-orange-900/20' : 
                              'text-amber-500 bg-amber-50 dark:bg-amber-900/20'
                        }`}>
                        {log.type === 'ddos' ? 'DDoS' : 
                          log.type === 'brute_force' ? 'Brute Force' :
                            log.type === 'sql_injection' ? 'SQL Injection' : log.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-800 dark:text-slate-200">
                      {log.ip}
                      <div className="text-[10px] text-slate-400">{log.location}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                      {log.details}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {log.type === 'brute_force' ? (
                        <button
                          onClick={() => handleUnblock(log)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors active:scale-95"
                        >
                          <Unlock className="w-3 h-3" /> Mở khóa
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold bg-slate-900 text-white">
                          <Lock className="w-3 h-3" /> Đã chặn
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Shield className="w-12 h-12 text-emerald-500" />
                      <span className="font-medium">Hệ thống an toàn</span>
                      <span className="text-xs">Không phát hiện mối đe dọa nào gần đây.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SecurityTab;
