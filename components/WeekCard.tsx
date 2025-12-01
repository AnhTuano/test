
import React from 'react';
import { TestResultData } from '../types';
import ScoreRing from './ScoreRing';
import { Calendar, Clock, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

interface WeekCardProps {
  week: number;
  title: string;
  dateRange: string;
  testResults: TestResultData[];
  isLoading: boolean;
  onViewDetails: (testId: number) => void;
}

const WeekCard: React.FC<WeekCardProps> = ({ week, title, dateRange, testResults, isLoading, onViewDetails }) => {

  const formatDateShort = (dateStr: string) => {
      // Input dateStr "2024-01-15 - 2024-01-21"
      const parts = dateStr.split(' - ');
      if (parts.length !== 2) return dateStr;
      
      const format = (dStr: string) => {
         const date = new Date(dStr);
         return date.toLocaleDateString('vi-VN', { 
             day: '2-digit', 
             month: '2-digit', 
             timeZone: 'Asia/Ho_Chi_Minh' 
         });
      };
      
      return `${format(parts[0])} - ${format(parts[1])}`;
  };

  if (isLoading) {
    return <div className="bg-white h-[320px] rounded-[2.5rem] p-6 animate-pulse flex flex-col gap-4 border border-slate-200">
        <div className="h-6 w-1/3 bg-slate-100 rounded-full"></div>
        <div className="h-4 w-1/2 bg-slate-100 rounded-full"></div>
        <div className="flex-1 bg-slate-50 rounded-2xl"></div>
    </div>;
  }

  const hasTest = testResults.length > 0;
  
  // Logic to find "Best" score to display
  const bestTest = hasTest 
    ? testResults.reduce((prev, current) => (prev.av > current.av ? prev : current)) 
    : null;

  // Logic: Score >= 8.0 is Passed
  const isPassed = bestTest ? bestTest.av >= 8 : false;

  return (
    <div className={`
      bg-white rounded-[2.5rem] p-1 
      shadow-sm transition-all duration-300 flex flex-col h-full 
      border border-slate-100
      hover:-translate-y-2 hover:shadow-2xl
      ${hasTest 
         ? isPassed 
            ? 'hover:shadow-emerald-500/10 hover:border-emerald-500/20' 
            : 'hover:shadow-red-500/10 hover:border-red-500/20'
         : 'hover:shadow-blue-500/10'
      }
    `}>
        <div className="flex-1 bg-slate-50/50 rounded-[2.3rem] flex flex-col overflow-hidden relative">
            
            {/* Header */}
            <div className="p-6 pb-2 z-10">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 leading-tight">{title}</h3>
                        <div className="flex items-center gap-2 mt-2 text-slate-500 text-xs font-bold uppercase tracking-wide">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{formatDateShort(dateRange)}</span>
                        </div>
                    </div>
                    <div className="bg-white border border-slate-200 text-slate-900 font-black px-3 py-1.5 rounded-full text-[10px] uppercase tracking-wider shadow-sm">
                        Tuần {week}
                    </div>
                </div>
            </div>

            {/* Content Center */}
            <div className="p-6 pt-0 flex-1 flex flex-col items-center justify-center relative z-10">
                {!hasTest ? (
                    <div className="text-center py-6">
                         <div className="w-16 h-16 bg-white rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 text-slate-300 shadow-sm">
                            <AlertCircle className="w-8 h-8" />
                         </div>
                         <p className="text-slate-400 font-bold text-sm">Chưa có bài kiểm tra</p>
                    </div>
                ) : (
                    <>
                       {bestTest && <ScoreRing score={bestTest.av} size={130} strokeWidth={8} />}
                       
                       <div className="mt-6 w-full flex items-center justify-center gap-3">
                            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                                isPassed 
                                ? 'bg-emerald-100 text-emerald-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                                {isPassed ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                                {isPassed ? 'ĐẠT' : 'CHƯA ĐẠT'}
                            </span>
                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-500 text-xs font-bold shadow-sm">
                                <Clock className="w-3.5 h-3.5" /> {bestTest?.time}p
                            </span>
                       </div>
                    </>
                )}
            </div>

            {/* Bottom Action */}
            {hasTest && bestTest && (
                 <button 
                    onClick={() => onViewDetails(bestTest.id)}
                    className="relative z-10 w-full py-4 bg-white hover:bg-blue-600 hover:text-white text-slate-600 text-sm font-bold transition-all border-t border-slate-100 flex items-center justify-center gap-2 group-hover:border-transparent"
                >
                    Xem chi tiết
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
            )}
            
            {/* Hover Glow Background */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${
               hasTest 
               ? isPassed ? 'bg-emerald-500/5' : 'bg-red-500/5'
               : 'bg-slate-500/5'
            }`}></div>
        </div>
    </div>
  );
};

export default WeekCard;
