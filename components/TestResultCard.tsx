
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
      <div className={`absolute inset-4 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 ${isPassed ? 'bg-emerald-400/20' : 'bg-red-400/20'
        }`}></div>

      <div className={`h-full bg-white rounded-[2.5rem] border border-slate-100 p-1 shadow-sm group-hover:shadow-xl transition-all duration-300 group-hover:-translate-y-2
        ${isPassed ? 'group-hover:shadow-emerald-500/10 group-hover:border-emerald-500/20' : 'group-hover:shadow-red-500/10 group-hover:border-red-500/20'}
      `}>
        <div className="h-full bg-slate-50/50 rounded-[2.3rem] p-4 md:p-5 lg:p-6 flex flex-col items-center relative overflow-hidden">

          {/* Top Info */}
          <div className="w-full flex justify-between items-start mb-3 md:mb-4 z-10 gap-2">
            <div className="flex flex-col gap-1.5 min-w-0">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {test.type === 'KT_DAUGIO' ? `Bài KT của tuần ${test.week}` : `Tuần ${test.week}`}
              </span>
              {/* Test Type Badge */}
              {test.type === 'KT_DAUGIO' ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-200 w-fit">
                  <svg className="w-2.5 h-2.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                  </svg>
                  <span className="whitespace-nowrap">KT 15p</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 border border-blue-200 w-fit">
                  <svg className="w-2.5 h-2.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                  </svg>
                  <span className="whitespace-nowrap">Bài tập</span>
                </span>
              )}
            </div>
            {/* Attempt Number - Only show for regular assignments, not for KT_DAUGIO */}
            {test.type !== 'KT_DAUGIO' && (
              <div className={`px-2.5 md:px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shrink-0 ${isPassed
                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                : 'bg-red-50 text-red-600 border-red-100'
                }`}>
                Lần {attemptNumber}
              </div>
            )}
          </div>

          {/* Score Center */}
          <div className="flex-1 flex flex-col items-center justify-center py-2 z-10">
            <div className="transform group-hover:scale-110 transition-transform duration-500 ease-out">
              <ScoreRing score={score} size={120} strokeWidth={8} />
            </div>
          </div>


          {/* Bottom Status - Only show for regular assignments, not for KT_DAUGIO */}
          {test.type !== 'KT_DAUGIO' && (
            <div className="w-full mt-4 flex items-center justify-center z-10">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${isPassed
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-red-100 text-red-700'
                }`}>
                {isPassed ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                {isPassed ? 'ĐẠT' : 'CHƯA ĐẠT'}
              </div>
            </div>
          )}

          {/* Hover Decor */}
          <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-500 ${isPassed ? 'bg-emerald-400' : 'bg-red-400'
            }`}></div>
        </div>
      </div>
    </div>
  );
};

export default TestResultCard;
