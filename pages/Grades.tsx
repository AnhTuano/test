
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ClassSelector from '../components/ClassSelector';
import TestResultsDisplay from '../components/TestResultsDisplay';
import NotificationPopup from '../components/NotificationPopup';
import Header from '../components/Header';
import { api } from '../services/api';
import { ClassDetails, PopupNotification } from '../types';
import { useAuth } from '../components/AuthProvider';
import { LayoutDashboard, BookOpen, Sparkles } from 'lucide-react';
import { GreetingText } from '../components/LiveClock';

const Grades: React.FC = () => {
  const { token, profile } = useAuth();
  const studentId = profile?.id || 0;

  const location = useLocation();
  const navigate = useNavigate();

  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedClassName, setSelectedClassName] = useState<string>("");
  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);

  const [popupNotification, setPopupNotification] = useState<PopupNotification | null>(null);
  const [showPopup, setShowPopup] = useState(false);

  const [portalName, setPortalName] = useState("Student Portal");
  const [dashboardTitle, setDashboardTitle] = useState("ICTU Dashboard");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await api.getPublicSettings();
        if (settings.portalName) setPortalName(settings.portalName);
        if (settings.dashboardTitle) setDashboardTitle(settings.dashboardTitle);
      } catch (err) { }
    };
    fetchSettings();
  }, []);

  const initialClassId = React.useMemo(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('classId');
    return id ? parseInt(id) : null;
  }, [location.search]);

  const handleClassSelected = useCallback((classId: number, className: string) => {
    if (classId === 0) {
      setSelectedClassId(null);
      setSelectedClassName("");
      setClassDetails(null);
    } else {
      setSelectedClassId(classId);
      setSelectedClassName(className);
      navigate(`/grades?classId=${classId}`, { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const fetchClassData = async () => {
      if (!selectedClassId || !token) return;

      try {
        const details = await api.getClassDetails(token, selectedClassId);
        setClassDetails(details);
      } catch (err) {

      }
    };

    fetchClassData();
  }, [selectedClassId, token]);

  useEffect(() => {
    const fetchNotification = async () => {
      try {
        const notif = await api.getPopupNotification();
        if (notif && notif.isActive) {
          const seenKey = `seen_notif_${notif.id}`;
          const hasSeen = sessionStorage.getItem(seenKey);

          if (!hasSeen) {
            setPopupNotification(notif);
            setShowPopup(true);
          }
        }
      } catch (err) {

      }
    };
    fetchNotification();
  }, []);

  const handleClosePopup = () => {
    setShowPopup(false);
    if (popupNotification) {
      sessionStorage.setItem(`seen_notif_${popupNotification.id}`, 'true');
    }
  };

  if (!token || !profile) return null;

  return (
    <div className="min-h-screen bg-slate-50 transition-colors pb-24 font-sans selection:bg-blue-500 selection:text-white">

      {showPopup && popupNotification && (
        <NotificationPopup notification={popupNotification} onClose={handleClosePopup} />
      )}

      <Header portalName={portalName} dashboardTitle={dashboardTitle} />

      <main className="w-full px-4 sm:px-6 md:px-8 lg:px-12 py-6 md:py-12">

        <div className="mb-8 md:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">Kết quả học tập</h1>
            <GreetingText name={profile.full_name} />
          </div>
        </div>

        <div className="mb-8 md:mb-10">
          <ClassSelector
            token={token}
            studentId={studentId}
            initialClassId={initialClassId}
            onClassSelected={handleClassSelected}
          />
        </div>

        {selectedClassId && classDetails && (
          <div className="relative w-full rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200/50 mb-10 md:mb-12 group transition-all transform-gpu border border-slate-200">
            {/* Dynamic Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden">
              <div className="absolute top-0 right-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-blue-400/30 rounded-full mix-blend-multiply filter blur-[60px] md:blur-[80px] opacity-40 animate-blob will-change-transform"></div>
              <div className="absolute bottom-0 left-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-indigo-400/30 rounded-full mix-blend-multiply filter blur-[60px] md:blur-[80px] opacity-40 animate-blob animation-delay-2000 will-change-transform"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] md:w-[400px] h-[250px] md:h-[400px] bg-purple-400/30 rounded-full mix-blend-multiply filter blur-[60px] md:blur-[80px] opacity-30 animate-blob animation-delay-4000 will-change-transform"></div>
            </div>

            <div className="relative z-10 p-6 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-8">
              <div className="max-w-2xl w-full">
                <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-3 md:mb-4">
                  <span className="bg-blue-100 backdrop-blur-md border border-blue-200 text-blue-700 px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider shadow-sm">
                    {classDetails.kyhieu}
                  </span>
                  <span className="bg-emerald-100 backdrop-blur-md border border-emerald-200 text-emerald-700 px-3 py-1 md:px-3 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" /> Đang học
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-4 md:mb-5 tracking-tight leading-tight text-slate-900">{classDetails.name}</h2>
                <div className="flex flex-wrap items-center gap-3 md:gap-4 text-slate-600 font-medium text-sm md:text-base">
                  <p className="flex items-center gap-2 bg-white/70 px-3 py-1.5 md:px-4 md:py-2 rounded-xl border border-slate-200 hover:bg-white transition-colors cursor-default shadow-sm">
                    <LayoutDashboard className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                    {classDetails.sotinchi} Tín chỉ
                  </p>
                  <p className="flex items-center gap-2 bg-white/70 px-3 py-1.5 md:px-4 md:py-2 rounded-xl border border-slate-200 hover:bg-white transition-colors cursor-default shadow-sm">
                    <BookOpen className="w-4 h-4 md:w-5 md:h-5 text-indigo-600" />
                    Học kỳ {classDetails.hocky}
                  </p>
                </div>
              </div>

              <div className="w-full md:w-auto bg-white/80 backdrop-blur-2xl border border-slate-200 p-5 md:p-6 rounded-3xl md:text-right shadow-lg">
                <div className="text-blue-600 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-2 md:mb-3">Giảng viên phụ trách</div>
                {classDetails.managers.map(m => (
                  <div key={m.username} className="font-bold text-xl md:text-2xl tracking-tight leading-tight mb-1 text-slate-900">{m.display_name}</div>
                ))}
                <div className="inline-block bg-slate-100 px-3 py-1 rounded-lg text-[10px] md:text-xs text-slate-600 font-mono mt-1">{classDetails.managers[0]?.email}</div>
              </div>
            </div>
          </div>
        )}

        {selectedClassId ? (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            <TestResultsDisplay
              token={token}
              classId={selectedClassId}
              className={selectedClassName}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 md:py-28 text-center animate-in zoom-in-95 duration-500 bg-white rounded-[2.5rem] border border-dashed border-slate-200 mx-auto max-w-4xl">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <BookOpen className="w-8 h-8 md:w-10 md:h-10 text-slate-300" />
            </div>
            <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-2">Chưa chọn môn học</h3>
            <p className="text-slate-500 max-w-sm text-sm leading-relaxed mx-auto px-4">
              Vui lòng chọn năm học, học kỳ và môn học từ bộ lọc phía trên để xem kết quả chi tiết.
            </p>
          </div>
        )}

      </main>
    </div>
  );
};

export default Grades;
