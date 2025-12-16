

import React, { useState, useEffect, useMemo, useRef, lazy, Suspense } from 'react';
import { TestResultData } from '../types';
import { api } from '../services/api';
import { useTestResults } from '../hooks/useApi';
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
  const userRole = profile?.role || 'USER';
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

    // Hide KT_DAUGIO (15-minute tests) from regular users
    if (userRole === 'USER') {
      res = res.filter(r => r.type !== 'KT_DAUGIO');
    }

    if (selectedWeek !== 'all') {
      res = res.filter(r => r.week === selectedWeek);
    }
    // Sort for display: Latest week first, then latest attempt
    return [...res].sort((a, b) => {
      if (a.week !== b.week) return b.week - a.week;
      return b.attempt - a.attempt;
    });
  }, [processedResults, selectedWeek, userRole]);


  // Handlers
  const handleViewDetails = async (testId: number) => {
    // Reset previous errors related to details
    if (error && error !== "Không thể tải danh sách kết quả.") {
      setError(null);
    }

    // Tìm test từ danh sách đã có để mở modal ngay lập tức
    const basicTest = processedResults.find(r => r.id === testId);

    // Block regular users from viewing KT_DAUGIO details
    if (basicTest && basicTest.type === 'KT_DAUGIO' && userRole === 'USER') {
      setError('Bạn không có quyền xem chi tiết bài kiểm tra này.');
      return;
    }

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

      {/* Improved Filter Bar - More Compact */}
      <div className="mb-8 flex justify-center">
        <div className="inline-flex items-center gap-2 bg-white border border-slate-200 shadow-lg rounded-2xl p-2">
          {/* Filter Icon */}
          <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
            <Filter className="w-4 h-4" />
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-slate-200"></div>

          {/* Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-[calc(100vw-200px)] px-1">
            <button
              onClick={() => setSelectedWeek('all')}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200
                     ${selectedWeek === 'all'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                  : 'text-slate-600 hover:bg-slate-50'
                }`}
            >
              Tất cả
            </button>
            {weeks.map(w => (
              <button
                key={w}
                onClick={() => setSelectedWeek(w)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200
                         ${selectedWeek === w
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                    : 'text-slate-600 hover:bg-slate-50'
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <TestResultSkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          {displayResults.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5 animate-in fade-in duration-500">
              {displayResults.map(test => (
                <TestResultCard
                  key={test.id}
                  test={test}
                  attemptNumber={test.attempt}
                  onClick={() => handleViewDetails(test.id)}
                  userRole={userRole}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200 animate-in zoom-in-95 duration-500">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-5 shadow-inner">
                <Search className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Không tìm thấy dữ liệu</h3>
              <p className="text-slate-500 text-sm text-center max-w-xs leading-relaxed">
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
            userRole={userRole}
          />
        </Suspense>
      )}
    </div>
  );
};

export default TestResultsDisplay;
