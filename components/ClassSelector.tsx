

import React, { useState, useEffect, memo, useMemo, useCallback } from 'react';
import { ClassStudent, ClassDetails } from '../types';
import { api } from '../services/api';
import { ClassSelectorSkeleton } from './Skeleton';
import { Calendar, TrendingUp, BookOpen, ChevronDown, Loader2 } from 'lucide-react';

interface ClassSelectorProps {
  token: string;
  studentId: number;
  initialClassId: number | null;
  onClassSelected: (classId: number, className: string) => void;
}

const ClassSelector: React.FC<ClassSelectorProps> = memo(({ token, studentId, initialClassId, onClassSelected }) => {
  // State
  const [allClasses, setAllClasses] = useState<ClassStudent[]>([]);
  const [loadingAll, setLoadingAll] = useState(true);

  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  
  const [classDetailsList, setClassDetailsList] = useState<ClassDetails[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // 1. Load All Classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const data = await api.getAllClasses(token, studentId);
        setAllClasses(data);
        setLoadingAll(false);
      } catch (err) {
        
        setLoadingAll(false);
      }
    };
    fetchClasses();
  }, [token, studentId]);

  // Pre-calculate hierarchy
  const classHierarchy = useMemo(() => {
    const hierarchy: Record<string, Set<number>> = {};
    allClasses.forEach(cls => {
      if (!hierarchy[cls.namhoc]) {
        hierarchy[cls.namhoc] = new Set();
      }
      hierarchy[cls.namhoc].add(cls.hocky);
    });
    return hierarchy;
  }, [allClasses]);

  const years = useMemo(() => Object.keys(classHierarchy).sort().reverse(), [classHierarchy]);
  const semesters = useMemo(() => selectedYear && classHierarchy[selectedYear] ? Array.from(classHierarchy[selectedYear]).sort((a: number, b: number) => a - b) : [], [classHierarchy, selectedYear]);

  // Auto-Select Logic
  useEffect(() => {
    if (!initialClassId && !selectedYear && years.length > 0) setSelectedYear(years[0]);
  }, [years, initialClassId, selectedYear]);

  useEffect(() => {
    if (!initialClassId && selectedYear && !selectedSemester && semesters.length > 0) setSelectedSemester(semesters[semesters.length - 1]);
  }, [selectedYear, semesters, initialClassId, selectedSemester]);

  // Load Details
  useEffect(() => {
    const fetchClassDetails = async () => {
      if (!selectedYear || !selectedSemester) {
        setClassDetailsList([]);
        return;
      }
      setLoadingDetails(true);
      const filtered = allClasses.filter(c => c.namhoc === selectedYear && c.hocky === selectedSemester);
      try {
        const details = await Promise.all(filtered.slice(0, 10).map(c => api.getClassDetails(token, c.class_id)));
        setClassDetailsList(details.filter((d): d is ClassDetails => d !== null));
      } catch (err) {
        
      } finally {
        setLoadingDetails(false);
      }
    };
    fetchClassDetails();
  }, [selectedYear, selectedSemester, allClasses, token]);

  // Initial ID Sync
  useEffect(() => {
    const syncWithInitialId = async () => {
      if (initialClassId && allClasses.length > 0) {
         const targetClass = allClasses.find(c => c.class_id === initialClassId);
         if (targetClass) {
            setSelectedYear(targetClass.namhoc);
            setSelectedSemester(targetClass.hocky);
            const details = await api.getClassDetails(token, initialClassId);
            if (details) setSelectedClassId(initialClassId);
         }
      }
    };
    syncWithInitialId();
  }, [initialClassId, allClasses, token]); 

  // Handlers
  const handleYearChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(e.target.value);
    setSelectedSemester(null);
    setSelectedClassId(null);
    onClassSelected(0, "");
  }, [onClassSelected]);

  const handleSemesterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = parseInt(e.target.value);
    setSelectedSemester(val);
    setSelectedClassId(null);
    onClassSelected(0, "");
  }, [onClassSelected]);

  const handleClassChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = parseInt(e.target.value);
    setSelectedClassId(val);
    if (val === 0) onClassSelected(0, "");
    else {
      const cls = classDetailsList.find(c => c.id === val);
      onClassSelected(val, cls ? cls.name : "");
    }
  }, [classDetailsList, onClassSelected]);

  if (loadingAll) return <ClassSelectorSkeleton />;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 p-5 md:p-8 transition-colors">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6 md:mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-500/20 shrink-0">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">Bộ lọc môn học</h2>
          {selectedYear && selectedSemester ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2 mt-1">
              Học kỳ {selectedSemester} <span className="w-1 h-1 rounded-full bg-slate-400"></span> {selectedYear}
            </p>
          ) : (
             <p className="text-xs text-slate-400 font-medium mt-1">Vui lòng chọn thông tin bên dưới</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        
        {/* Year */}
        <div className="relative group">
          <label className="block text-xs font-extrabold text-slate-500 dark:text-slate-400 mb-2.5 ml-1 uppercase tracking-wider">Năm học</label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none">
              <Calendar className="w-5 h-5" />
            </div>
            <select
              value={selectedYear}
              onChange={handleYearChange}
              className="w-full appearance-none bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900/50 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-900 dark:text-white font-bold rounded-2xl pl-12 pr-10 py-4 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer shadow-sm text-sm"
            >
              <option value="">-- Chọn năm --</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Semester */}
        <div className="relative group">
          <label className="block text-xs font-extrabold text-slate-500 dark:text-slate-400 mb-2.5 ml-1 uppercase tracking-wider">Học kỳ</label>
          <div className="relative">
             <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none">
              <TrendingUp className="w-5 h-5" />
            </div>
            <select
              value={selectedSemester || ''}
              onChange={handleSemesterChange}
              disabled={!selectedYear}
              className="w-full appearance-none bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900/50 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-900 dark:text-white font-bold rounded-2xl pl-12 pr-10 py-4 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm text-sm"
            >
              <option value="">-- Chọn kỳ --</option>
              {semesters.map(s => <option key={s} value={s}>Học kỳ {s}</option>)}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Class */}
        <div className="relative group">
          <label className="block text-xs font-extrabold text-slate-500 dark:text-slate-400 mb-2.5 ml-1 uppercase tracking-wider">Môn học</label>
          <div className="relative">
             <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none">
              <BookOpen className="w-5 h-5" />
            </div>
            <select
              value={selectedClassId || ''}
              onChange={handleClassChange}
              disabled={!selectedSemester}
              className="w-full appearance-none bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900/50 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-900 dark:text-white font-bold rounded-2xl pl-12 pr-10 py-4 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm truncate text-sm"
            >
              <option value="0">-- Chọn môn học --</option>
              {classDetailsList.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              {loadingDetails ? (
                 <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
              ) : (
                 <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
});

export default ClassSelector;
