

import React, { useState, useEffect, useMemo, useRef, lazy, Suspense } from 'react';
import { TestResultData } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthProvider';
import TestResultCard from './TestResultCard';
import { WeekCardSkeleton, TestResultSkeleton } from './Skeleton';
import { Filter, XCircle, Search } from 'lucide-react';

// Lazy load modal for better initial load
const TestDetailModal = lazy(() => import('./TestDetailModal'));

interface TestResultsDisplayProps {
  token: string;
  classId: number | null;
  className: string;
}

const TestResultsDisplay: React.FC<TestResultsDisplayProps> = ({ token, classId, className }) => {
  const { profile } = useAuth();
  const [results, setResults] = useState<TestResultData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter State
  const [selectedWeek, setSelectedWeek] = useState<number | 'all'>('all');
  
  // Modal State
  const [selectedTestId, setSelectedTestId] = useState<number | null>(null);
  const [detailedTest, setDetailedTest] = useState<TestResultData | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Fetch All Results
  useEffect(() => {
    const fetchResults = async () => {
      if (!classId) return;
      setLoading(true);
      setError(null);
      try {
        const data = await api.getAllTestResultsForClass(token, classId);
        setResults(data);
      } catch (err) {
        
        setError("Không thể tải danh sách kết quả.");
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [classId, token, className, profile?.username]);

  // 2. Process Data: Add "attempt" number and group
  const processedResults = useMemo(() => {
    // Group by week
    const byWeek: Record<number, TestResultData[]> = {};
    results.forEach(r => {
      if (!byWeek[r.week]) byWeek[r.week] = [];
      byWeek[r.week].push(r);
    });
    
    // Flatten with attempt info
    const processed: (TestResultData & { attempt: number })[] = [];
    Object.keys(byWeek).forEach(w => {
      const weekNum = Number(w);
      // Sort by submit date ascending to determine attempt number
      const weekResults = byWeek[weekNum].sort((a, b) => 
        new Date(a.submit_at).getTime() - new Date(b.submit_at).getTime()
      );
      
      weekResults.forEach((r, idx) => {
        processed.push({ ...r, attempt: idx + 1 });
      });
    });
    
    return processed;
  }, [results]);

  // 3. Derived Weeks for Filter
  const weeks = useMemo(() => {
    const w = new Set(results.map(r => r.week));
    return Array.from(w).sort((a, b) => Number(a) - Number(b));
  }, [results]);

  // 4. Filtered List
  const displayResults = useMemo(() => {
    let res = processedResults;
    if (selectedWeek !== 'all') {
      res = res.filter(r => r.week === selectedWeek);
    }
    // Sort for display: Latest week first, then latest attempt
    return [...res].sort((a, b) => {
      if (a.week !== b.week) return b.week - a.week;
      return b.attempt - a.attempt;
    });
  }, [processedResults, selectedWeek]);


  // Handlers
  const handleViewDetails = async (testId: number) => {
    // Reset previous errors related to details
    if (error && error !== "Không thể tải danh sách kết quả.") {
      setError(null);
    }
    
    // Tìm test từ danh sách đã có để mở modal ngay lập tức
    const basicTest = processedResults.find(r => r.id === testId);
    if (basicTest) {
      // Mở modal ngay với dữ liệu cơ bản (không có chi tiết câu hỏi)
      setDetailedTest(basicTest);
      setSelectedTestId(testId);
    }
    
    // Sau đó load thêm chi tiết câu hỏi ở background
    setIsLoadingDetails(true);
    try {
      const detail = await api.getTestDetails(token, testId);
      setDetailedTest(detail);
    } catch (err: any) {
      
      // Nếu không load được chi tiết, vẫn giữ modal mở với dữ liệu cơ bản
      // Chỉ hiển thị lỗi nhẹ, không đóng modal
      
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedTestId(null);
    setDetailedTest(null);
  };

  if (!classId) return null;

  return (
    <div className="relative min-h-[500px]">
      
      {/* Floating Filter Bar */}
      <div className="sticky top-20 md:top-24 z-30 mb-6 md:mb-8 flex justify-center pointer-events-none px-4">
          <div className="pointer-events-auto bg-white/70 backdrop-blur-xl border border-white/50 shadow-lg shadow-slate-200/50 p-1.5 rounded-full flex items-center gap-1.5 max-w-[95vw] md:max-w-full overflow-hidden animate-in slide-in-from-top-4 duration-500">
             
             <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                <Filter className="w-4 h-4" />
             </div>
             
             <div className="h-4 w-px bg-slate-200 mx-1"></div>

             <div 
                ref={scrollRef}
                className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-full px-1"
             >
                <button
                    onClick={() => setSelectedWeek('all')}
                    className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all duration-300
                    ${selectedWeek === 'all' 
                        ? 'bg-slate-900 text-white shadow-md' 
                        : 'text-slate-500 hover:bg-slate-100'
                    }`}
                >
                    Tất cả
                </button>
                {weeks.map(w => (
                    <button
                        key={w}
                        onClick={() => setSelectedWeek(w)}
                        className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all duration-300
                        ${selectedWeek === w 
                            ? 'bg-slate-900 text-white shadow-md' 
                            : 'text-slate-500 hover:bg-slate-100'
                        }`}
                    >
                        Tuần {w}
                    </button>
                ))}
             </div>
          </div>
      </div>

      {/* Error Message Toast */}
      {error && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
           <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3">
             <div className="bg-red-100 p-1.5 rounded-full">
               <XCircle className="w-5 h-5" />
             </div>
             <p className="font-medium text-sm pr-2">{error}</p>
             <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
               <span className="sr-only">Close</span>
               <XCircle className="w-4 h-4" />
             </button>
           </div>
        </div>
      )}

      {/* Content Area */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <TestResultSkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          {displayResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-4 md:gap-6 animate-in fade-in duration-500">
              {displayResults.map(test => (
                <TestResultCard 
                  key={test.id} 
                  test={test} 
                  attemptNumber={test.attempt}
                  onClick={() => handleViewDetails(test.id)} 
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 animate-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner rotate-3 hover:rotate-6 transition-transform">
                <Search className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2 tracking-tight">Không tìm thấy dữ liệu</h3>
              <p className="text-slate-400 font-medium text-sm text-center max-w-xs leading-relaxed">
                 {error === "Không thể tải danh sách kết quả." 
                    ? "Đã xảy ra lỗi kết nối. Vui lòng thử lại sau." 
                    : "Chưa có bài kiểm tra nào phù hợp với bộ lọc hiện tại."}
              </p>
            </div>
          )}
        </>
      )}

      {/* Details Modal - Lazy loaded */}
      {selectedTestId && detailedTest && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>}>
          <TestDetailModal 
            test={detailedTest} 
            onClose={handleCloseModal} 
            isLoadingDetails={isLoadingDetails}
          />
        </Suspense>
      )}
    </div>
  );
};

export default TestResultsDisplay;
