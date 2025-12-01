
import React, { useState, useEffect, memo, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { TestResultData } from '../types';
import { X, CheckCircle, AlertCircle, Award, BookOpen, Download, Loader2 } from 'lucide-react';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from 'docx';

interface TestDetailModalProps {
  test: TestResultData;
  onClose: () => void;
  isLoadingDetails?: boolean;
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

const TestDetailModal: React.FC<TestDetailModalProps> = ({ test, onClose, isLoadingDetails = false }) => {
  // Logic: Score >= 8.0 is Passed
  const score = typeof test.av === 'number' && !isNaN(test.av) ? test.av : 0;
  const isPassed = score >= 8;
  const isHighScore = score >= 9;
  const [isExporting, setIsExporting] = useState(false);

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
              text: `Tuần ${test.week} - Ngày nộp: ${submitDateStr}`,
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
                text: "Xuất từ hệ thống Student Portal",
                alignment: AlignmentType.CENTER,
                spacing: { before: 600 },
                children: [
                    new TextRun({ text: "Xuất từ hệ thống Student Portal", size: 16, color: "888888" })
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
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
      <style>{confettiStyles}</style>
      
      {/* Confetti Effect for High Score */}
      {isPassed && (
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

      <div className="bg-white dark:bg-slate-800 w-full md:max-w-3xl h-full md:h-auto md:max-h-[85vh] md:rounded-[2rem] shadow-2xl flex flex-col relative transition-colors z-10 animate-in slide-in-from-bottom-full md:zoom-in-95 duration-300 border-x-0 md:border border-slate-100 dark:border-slate-700">
        
        {/* Header - Fixed */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800 z-10 transition-colors shrink-0">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${isPassed ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                    <BookOpen className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">Chi tiết kết quả</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Bài kiểm tra Tuần {test.week}</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button 
                    onClick={handleExportDocx}
                    disabled={isExporting}
                    className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full transition-colors flex items-center gap-2 disabled:opacity-50"
                    title="Tải về file Word (.docx)"
                >
                    {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                    <span className="text-sm font-semibold hidden sm:inline">Tải Word</span>
                </button>
                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                <button 
                    onClick={onClose}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 bg-slate-50/50 dark:bg-slate-900/50 p-6 transition-colors">
            
            {/* Score Overview Card */}
            <div className={`rounded-3xl p-8 text-white shadow-lg mb-8 relative overflow-hidden transition-all duration-500 ${isPassed ? 'bg-gradient-to-br from-blue-600 to-indigo-700 shadow-blue-500/20' : 'bg-gradient-to-br from-red-500 to-pink-600 shadow-red-500/20'}`}>
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
            <div className="space-y-6">
                <div className="flex items-center justify-between px-1">
                     <h4 className="text-lg font-bold text-slate-800 dark:text-white">Chi tiết bài làm</h4>
                     <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-3 py-1 rounded-full shadow-sm">
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
                        <div key={i} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-6">
                          <div className="flex gap-4 mb-5">
                            <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                            </div>
                          </div>
                          <div className="space-y-3 pl-12">
                            {[1, 2, 3, 4].map(j => (
                              <div key={j} className="h-12 bg-slate-100 dark:bg-slate-700/50 rounded-xl"></div>
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
                        <div key={q.id || idx} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex gap-4 mb-5">
                                <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-lg text-sm border border-slate-200 dark:border-slate-600">
                                    {questionNum}
                                </span>
                                <div className="flex-1">
                                    {/* Render HTML content properly */}
                                    <div 
                                        className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed text-base prose prose-sm dark:prose-invert max-w-none
                                            prose-p:my-1 prose-img:rounded-lg prose-img:max-w-full prose-img:h-auto prose-img:my-2"
                                        dangerouslySetInnerHTML={{ __html: processHtmlContent(q.question_direction) }}
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-3 pl-0 md:pl-12">
                                {q.answer_option.map((opt, optIdx) => {
                                    // Chuyển id thành chữ cái
                                    const optionLetter = idToLetter(opt.id);
                                    
                                    return (
                                        <div 
                                            key={opt.id} 
                                            className="relative group p-4 rounded-xl text-sm border transition-all duration-200 flex items-center justify-between bg-white dark:bg-slate-700/50 border-slate-100 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-7 h-7 rounded-full flex items-center justify-center border text-xs font-bold transition-colors flex-shrink-0 bg-slate-50 dark:bg-slate-600 border-slate-200 dark:border-slate-500 text-slate-500 dark:text-slate-200 group-hover:border-slate-300">
                                                    {optionLetter}
                                                </div>
                                                {/* Render answer HTML content */}
                                                <div 
                                                    className="leading-snug prose prose-sm dark:prose-invert max-w-none prose-p:my-0 prose-img:max-w-[200px] prose-img:h-auto prose-img:my-1 text-slate-700 dark:text-slate-200"
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
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                        <BookOpen className="w-12 h-12 mb-3 opacity-20" />
                        <p className="font-medium">Không có dữ liệu chi tiết câu hỏi.</p>
                    </div>
                )}
            </div>
        </div>

        {/* Footer for Mobile (Sticky bottom) */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 z-10 flex gap-3 md:hidden shrink-0 pb-safe">
             <button onClick={handleExportDocx} disabled={isExporting} className="flex-1 py-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 active:scale-95">
                 {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                 Tải Word
             </button>
             <button onClick={onClose} className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 active:bg-slate-200 dark:active:bg-slate-600 font-semibold text-slate-600 dark:text-slate-300 rounded-xl transition-colors active:scale-95">
                 Đóng
             </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export default TestDetailModal;
