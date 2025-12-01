
import React from 'react';
import { TestResultData } from '../types';
import ScoreRing from './ScoreRing';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface TestResultCardProps {
  test: TestResultData;
  attemptNumber: number;
  onClick: () => void;
}

const TestResultCard: React.FC<TestResultCardProps> = ({ test, attemptNumber, onClick }) => {
  // Ensure av is a valid number
  const score = typeof test.av === 'number' && !isNaN(test.av) ? test.av : 0;
  // Logic: Score >= 8.0 is Passed
  const isPassed = score >= 8;

  return (
    <div 
      onClick={onClick}
      className="group relative cursor-pointer"
    >
      {/* Glow Effect behind card */}
      <div className={`absolute inset-4 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 ${
          isPassed ? 'bg-emerald-400/20' : 'bg-red-400/20'
      }`}></div>

      <div className={`h-full bg-white rounded-[2.5rem] border border-slate-100 p-1 shadow-sm group-hover:shadow-xl transition-all duration-300 group-hover:-translate-y-2
        ${isPassed ? 'group-hover:shadow-emerald-500/10 group-hover:border-emerald-500/20' : 'group-hover:shadow-red-500/10 group-hover:border-red-500/20'}
      `}>
          <div className="h-full bg-slate-50/50 rounded-[2.3rem] p-5 md:p-6 flex flex-col items-center relative overflow-hidden">
            
            {/* Top Info */}
            <div className="w-full flex justify-between items-start mb-4 z-10">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Tuần {test.week}</span>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                    isPassed 
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                    : 'bg-red-50 text-red-600 border-red-100'
                }`}>
                    Lần {attemptNumber}
                </div>
            </div>

            {/* Score Center */}
            <div className="flex-1 flex flex-col items-center justify-center py-2 z-10">
                <div className="transform group-hover:scale-110 transition-transform duration-500 ease-out">
                    <ScoreRing score={score} size={120} strokeWidth={8} />
                </div>
            </div>

            {/* Bottom Status */}
            <div className="w-full mt-4 flex items-center justify-center z-10">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                    isPassed 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                    {isPassed ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {isPassed ? 'ĐẠT' : 'CHƯA ĐẠT'}
                </div>
            </div>
            
            {/* Hover Decor */}
            <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-500 ${
                 isPassed ? 'bg-emerald-400' : 'bg-red-400'
            }`}></div>
          </div>
      </div>
    </div>
  );
};

export default TestResultCard;
