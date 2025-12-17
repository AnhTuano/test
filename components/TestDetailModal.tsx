
import React, { useState, useEffect, memo, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { TestResultData, SystemSettings } from '../types';
import { X, CheckCircle, AlertCircle, Award, BookOpen, Download, Loader2 } from 'lucide-react';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from 'docx';
import { api } from '../services/api';

interface TestDetailModalProps {
  test: TestResultData;
  onClose: () => void;
  isLoadingDetails?: boolean;
  userRole?: string;
}

// ICTU Image URL base
const ICTU_IMAGE_BASE = 'https://apps.ictu.edu.vn:9087/ionline/api/media/';

// Helper to process HTML content and fix image URLs
const processHtmlContent = (html: string): string => {
  if (!html) return '';

  // Replace image src with full ICTU URL
  // Pattern: <img src="318664" alt="318664|serverAws">
  let processed = html.replace(
    /<img\s+src="(\d+)"\s+alt="[^"]*"/g,
    `<img src="${ICTU_IMAGE_BASE}$1" alt="Hình ảnh câu hỏi" class="max-w-full h-auto rounded-lg my-2"`
  );

  // Also handle other image patterns
  processed = processed.replace(
    /src="(\d+)"/g,
    `src="${ICTU_IMAGE_BASE}$1"`
  );

  return processed;
};

// Helper to convert number id to letter (1 → A, 2 → B, etc.)
const idToLetter = (id: string | number): string => {
  const numId = typeof id === 'string' ? parseInt(id, 10) : id;
  if (!isNaN(numId) && numId >= 1 && numId <= 26) {
    return String.fromCharCode(64 + numId); // 1 → A, 2 → B, etc.
  }
  // If already a letter, return uppercase
  return String(id).toUpperCase();
};

// Helper to strip HTML tags for plain text
const stripHtml = (html: string): string => {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

// 1. Isolated Component for Score Animation to prevent re-rendering the whole modal
const AnimatedScoreDisplay = memo(({ score, isPassed }: { score: number, isPassed: boolean }) => {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = score;
    const duration = 1000; // 1 second
    const increment = end / (duration / 16); // 60fps roughly

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayScore(end);
        clearInterval(timer);
      } else {
        setDisplayScore(start);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [score]);

  return (
    <div className="text-5xl md:text-6xl font-bold tracking-tight font-mono">
      {displayScore.toFixed(1)}<span className="text-2xl md:text-3xl opacity-60 font-medium font-sans">/10</span>
    </div>
  );
});

const TestDetailModal: React.FC<TestDetailModalProps> = ({ test, onClose, isLoadingDetails = false, userRole = 'USER' }) => {
  // Logic: Score >= 8.0 is Passed
  const score = typeof test.av === 'number' && !isNaN(test.av) ? test.av : 0;
  const isPassed = score >= 8;
  const isHighScore = score >= 9;
  const [isExporting, setIsExporting] = useState(false);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Block regular users from viewing KT_DAUGIO details
  const isBlocked = test.type === 'KT_DAUGIO' && userRole === 'USER';

  // Fetch system settings for portal name
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await api.getPublicSettings();
        setSettings(data);
      } catch (error) {
        // Ignore error, use default
      }
    };
    fetchSettings();
  }, []);

  // Optimize confetti - auto hide after 3s
  useEffect(() => {
    if (isPassed) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isPassed]);

  // Format date safely with Vietnam Timezone
  const submitDateStr = new Date(test.submit_at).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh'
  });

  // CSS for Confetti
  const confettiStyles = `
    @keyframes confetti-fall {
      0% { transform: translateY(-100%) rotate(0deg); opacity: 1; }
      100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
    }
    .confetti-piece {
      position: absolute;
      width: 8px;
      height: 16px;
      top: -20px;
      opacity: 0;
      animation: confetti-fall 2.5s ease-out forwards;
      z-index: 10;
    }
  `;

  const handleExportDocx = async () => {
    setIsExporting(true);
    try {
      // Define styles and content
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            // Title
            new Paragraph({
              text: "CHI TIẾT KẾT QUẢ BÀI KIỂM TRA",
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 },
            }),
            // Subtitle
            new Paragraph({
              text: `Tuần ${test.week}`,
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),

            // Score Box (Simulated with text and borders)
            new Paragraph({
              children: [
                new TextRun({ text: "TỔNG QUAN KẾT QUẢ", bold: true, size: 28 }),
              ],
              border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "aaaaaa" } },
              spacing: { after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Điểm số: ", bold: true }),
                new TextRun({ text: `${test.av} / 10`, bold: true, color: isPassed ? "008000" : "FF0000" }),
              ],
              spacing: { before: 100 }
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Kết quả: ", bold: true }),
                new TextRun({ text: isPassed ? "ĐẠT" : "CHƯA ĐẠT" }),
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Thời gian làm bài: ", bold: true }),
                new TextRun({ text: `${test.time} phút` }),
              ],
              spacing: { after: 400 }
            }),

            // Questions Section
            new Paragraph({
              children: [
                new TextRun({ text: "CHI TIẾT CÂU HỎI", bold: true, size: 28 }),
              ],
              border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "aaaaaa" } },
              spacing: { after: 200 }
            }),

            // Map questions
            ...(test.test || []).flatMap((q, idx) => {
              const questionNum = q.question_number > 0 ? q.question_number : idx + 1;

              const options = q.answer_option.map(opt => {
                const optionLetter = idToLetter(opt.id);

                return new Paragraph({
                  children: [
                    new TextRun({
                      text: `${optionLetter}. ${stripHtml(opt.value)}`,
                    })
                  ],
                  indent: { left: 720 }, // Indent options
                  spacing: { before: 60 }
                });
              });

              return [
                new Paragraph({
                  children: [
                    new TextRun({ text: `Câu ${questionNum}: `, bold: true }),
                    new TextRun({ text: stripHtml(q.question_direction) })
                  ],
                  spacing: { before: 200, after: 100 }
                }),
                ...options
              ];
            }),

            // Footer
            new Paragraph({
              text: `Xuất từ hệ thống ${settings?.portalName || 'Student Portal'}`,
              alignment: AlignmentType.CENTER,
              spacing: { before: 600 },
              children: [
                new TextRun({ text: `Xuất từ hệ thống ${settings?.portalName || 'Student Portal'}`, size: 16, color: "888888" })
              ]
            })
          ],
        }],
      });

      // Generate Blob
      const blob = await Packer.toBlob(doc);

      // Download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Ket_qua_Tuan_${test.week}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (err) {

      alert("Có lỗi khi tạo file Word. Vui lòng thử lại.");
    } finally {
      setIsExporting(false);
    }
  };

  const content = (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <style>{confettiStyles}</style>

      {/* Confetti Effect for High Score - Auto hide after 3s */}
      {showConfetti && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="confetti-piece"
              style={{
                left: `${Math.random() * 100}%`,
                backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][Math.floor(Math.random() * 5)],
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${2 + Math.random()}s`
              }}
            />
          ))}
        </div>
      )}

      <div className="bg-white w-full md:max-w-3xl h-full md:h-auto md:max-h-[85vh] md:rounded-[2rem] shadow-2xl flex flex-col relative transition-all z-10 animate-in slide-in-from-bottom-4 md:zoom-in-98 fade-in duration-400 ease-out border-x-0 md:border border-slate-100">

        {/* Header - Fixed */}
        <div className="sticky top-0 p-5 border-b border-slate-100 flex justify-between items-center bg-white/95 backdrop-blur-lg z-20 transition-all shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isPassed ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Chi tiết kết quả</h3>
              <p className="text-sm text-slate-500 font-medium">Bài kiểm tra Tuần {test.week}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportDocx}
              disabled={isExporting}
              className="p-2 hover:bg-blue-50 text-blue-600 rounded-full transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
              title="Tải về file Word (.docx)"
            >
              {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              <span className="text-sm font-semibold hidden sm:inline">Tải Word</span>
            </button>
            <div className="h-6 w-px bg-slate-200 mx-1"></div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full transition-all active:scale-95 text-slate-400 hover:text-slate-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto scroll-smooth flex-1 bg-slate-50/50 p-6 transition-colors" style={{ WebkitOverflowScrolling: 'touch' }}>

          {isBlocked ? (
            /* Access Denied Message for Regular Users */
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-3">Không có quyền truy cập</h3>
              <p className="text-slate-600 max-w-md leading-relaxed mb-6">
                Bài kiểm tra 15 phút chỉ dành cho giảng viên và quản trị viên. Sinh viên không thể xem chi tiết bài kiểm tra này.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
              >
                Đóng
              </button>
            </div>
          ) : (
            <>
              {/* Score Overview Card */}
              <div className={`rounded-3xl p-8 text-white shadow-xl mb-6 relative overflow-hidden transition-all duration-500 ${isPassed ? 'bg-gradient-to-br from-blue-600 to-indigo-700 shadow-blue-500/10' : 'bg-gradient-to-br from-red-500 to-pink-600 shadow-red-500/10'}`}>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="text-center md:text-left">
                    <div className="flex items-center gap-2 mb-1 justify-center md:justify-start opacity-90">
                      {isHighScore && <Award className="w-5 h-5 text-yellow-300 animate-bounce" />}
                      <span className="text-sm font-semibold uppercase tracking-wider">Tổng điểm</span>
                    </div>

                    {/* Use Isolated Component */}
                    <AnimatedScoreDisplay score={score} isPassed={isPassed} />

                  </div>

                  <div className="flex gap-4 md:gap-8 bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10">
                    <div className="flex flex-col items-center px-4 w-full">
                      <div className="mb-1">
                        {isPassed ? <CheckCircle className="w-6 h-6 text-emerald-300" /> : <AlertCircle className="w-6 h-6 text-red-200" />}
                      </div>
                      <span className="text-xs font-medium uppercase opacity-80">{isPassed ? 'Đạt' : 'Chưa đạt'}</span>
                    </div>
                  </div>
                </div>

                {/* Decorative circles */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-black/10 rounded-full blur-3xl"></div>
              </div>

              {/* Questions Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-lg font-bold text-slate-800">Chi tiết bài làm</h4>
                  <span className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-sm">
                    {isLoadingDetails ? (
                      <span className="flex items-center gap-1.5">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Đang tải...
                      </span>
                    ) : (
                      `${test.test?.length || 0} Câu hỏi`
                    )}
                  </span>
                </div>

                {isLoadingDetails ? (
                  // Skeleton Loading
                  <div className="space-y-4 animate-pulse">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="bg-white border border-slate-100 rounded-2xl p-6">
                        <div className="flex gap-4 mb-5">
                          <div className="w-8 h-8 bg-slate-200 rounded-lg"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                          </div>
                        </div>
                        <div className="space-y-3 pl-12">
                          {[1, 2, 3, 4].map(j => (
                            <div key={j} className="h-12 bg-slate-100 rounded-xl"></div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : test.test && test.test.length > 0 ? (
                  test.test.map((q, idx) => {
                    // Số thứ tự câu hỏi: ưu tiên question_number, nếu là 0 thì dùng idx + 1
                    const questionNum = q.question_number > 0 ? q.question_number : idx + 1;

                    return (
                      <div
                        key={q.id || idx}
                        className="bg-white border border-slate-200/50 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:scale-[1.01] transition-all duration-200 animate-in slide-in-from-left-4 fade-in"
                        style={{
                          animationDelay: `${idx * 50}ms`,
                          animationDuration: '300ms',
                          animationFillMode: 'both'
                        }}
                      >
                        <div className="flex gap-4 mb-5">
                          <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700 font-bold rounded-lg text-sm border border-blue-100 shadow-sm">
                            {questionNum}
                          </span>
                          <div className="flex-1">
                            {/* Render HTML content properly */}
                            <div
                              className="text-slate-900 font-semibold leading-relaxed text-base prose prose-sm max-w-none
                                            prose-p:my-1 prose-img:rounded-lg prose-img:max-w-full prose-img:h-auto prose-img:my-2"
                              dangerouslySetInnerHTML={{ __html: processHtmlContent(q.question_direction) }}
                            />
                          </div>
                        </div>

                        <div className="space-y-2 pl-0 md:pl-12">
                          {q.answer_option.map((opt, optIdx) => {
                            // Chuyển id thành chữ cái
                            const optionLetter = idToLetter(opt.id);

                            return (
                              <div
                                key={opt.id}
                                className="relative group p-4 rounded-xl text-sm border transition-all duration-150 flex items-center justify-between bg-white border-slate-200 hover:border-blue-200 hover:bg-blue-50/50 hover:shadow-sm"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="w-7 h-7 rounded-full flex items-center justify-center border text-xs font-bold transition-all flex-shrink-0 bg-slate-50 border-slate-300 text-slate-600 group-hover:border-blue-400 group-hover:bg-blue-50 group-hover:text-blue-700">
                                    {optionLetter}
                                  </div>
                                  {/* Render answer HTML content */}
                                  <span
                                    className="leading-snug text-slate-700 text-sm"
                                    dangerouslySetInnerHTML={{ __html: processHtmlContent(opt.value) }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
                    <BookOpen className="w-12 h-12 mb-3 opacity-20" />
                    <p className="font-medium">Không có dữ liệu chi tiết câu hỏi.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer for Mobile (Sticky bottom) */}
        <div className="p-4 border-t border-slate-100 bg-white z-10 flex gap-3 md:hidden shrink-0 pb-safe">
          <button onClick={handleExportDocx} disabled={isExporting} className="flex-1 py-3 bg-blue-50 text-blue-600 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 active:scale-95">
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Tải Word
          </button>
          <button onClick={onClose} className="flex-1 py-3 bg-slate-100 active:bg-slate-200 font-semibold text-slate-600 rounded-xl transition-colors active:scale-95">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export default TestDetailModal;
