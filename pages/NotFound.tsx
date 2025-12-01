import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, Search } from 'lucide-react';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-slate-50  flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] animate-blob"></div>
         <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] animate-blob animation-delay-2000"></div>
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
      </div>

      <div className="relative z-10 text-center max-w-lg w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
         
         <div className="mb-8 relative inline-block">
            <h1 className="text-[150px] md:text-[180px] font-black text-transparent bg-clip-text bg-gradient-to-br from-slate-200 to-slate-100   leading-none select-none drop-shadow-sm">
               404
            </h1>
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="w-24 h-24 bg-white  rounded-3xl shadow-2xl border border-slate-100  flex items-center justify-center transform rotate-12 hover:rotate-0 transition-transform duration-500">
                  <Search className="w-10 h-10 text-blue-500" />
               </div>
            </div>
         </div>

         <h2 className="text-2xl md:text-3xl font-bold text-slate-900  mb-3">
            Trang không tìm thấy
         </h2>
         <p className="text-slate-500  font-medium mb-8 leading-relaxed">
            Đường dẫn bạn truy cập có thể đã bị xóa hoặc không tồn tại. Vui lòng kiểm tra lại URL.
         </p>

         <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
               onClick={() => navigate(-1)}
               className="px-8 py-3.5 rounded-2xl bg-white  text-slate-700  font-bold border border-slate-200  hover:bg-slate-50  transition-all active:scale-95 flex items-center justify-center gap-2"
            >
               <ArrowLeft className="w-4 h-4" /> Quay lại
            </button>
            <button 
               onClick={() => navigate('/grades')}
               className="px-8 py-3.5 rounded-2xl bg-blue-600 text-white font-bold shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
               <Home className="w-4 h-4" /> Về trang chủ
            </button>
         </div>

      </div>

      <div className="absolute bottom-8 text-xs font-bold text-slate-400 uppercase tracking-widest">
         ICTU Student Portal
      </div>
    </div>
  );
};

export default NotFound;