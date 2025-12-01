import React from 'react';

// Base Skeleton component
export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-200 rounded ${className}`} />
);

// Card Skeleton
export const CardSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl p-6 border border-slate-200">
    <div className="flex items-center gap-4 mb-4">
      <Skeleton className="w-12 h-12 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
    <Skeleton className="h-20 w-full rounded-xl" />
  </div>
);

// Test Result Card Skeleton
export const TestResultSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl p-5 border border-slate-200">
    <div className="flex items-start justify-between mb-4">
      <div className="space-y-2">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="w-16 h-16 rounded-full" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  </div>
);

// Week Card Skeleton
export const WeekCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-3xl p-6 border border-slate-200">
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <Skeleton className="w-12 h-12 rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
      <Skeleton className="w-20 h-8 rounded-full" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <TestResultSkeleton />
      <TestResultSkeleton />
    </div>
  </div>
);

// Class Selector Skeleton
export const ClassSelectorSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl p-4 border border-slate-200">
    <div className="flex flex-wrap gap-3">
      <Skeleton className="h-12 w-32 rounded-xl" />
      <Skeleton className="h-12 w-32 rounded-xl" />
      <Skeleton className="h-12 flex-1 min-w-[200px] rounded-xl" />
    </div>
  </div>
);

// Class Details Header Skeleton
export const ClassDetailsSkeleton: React.FC = () => (
  <div className="relative w-full rounded-[2rem] overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200">
    <div className="p-6 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
      <div className="max-w-2xl w-full space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-7 w-20 rounded-full" />
          <Skeleton className="h-7 w-24 rounded-full" />
        </div>
        <Skeleton className="h-10 w-3/4" />
        <div className="flex gap-3">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
      </div>
      <div className="w-full md:w-64 bg-white/50 p-6 rounded-3xl space-y-3">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-5 w-40 rounded-lg" />
      </div>
    </div>
  </div>
);

// User Row Skeleton for Admin
export const UserRowSkeleton: React.FC = () => (
  <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200">
    <Skeleton className="w-10 h-10 rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-3 w-48" />
    </div>
    <Skeleton className="h-8 w-20 rounded-lg" />
  </div>
);

// Stats Card Skeleton for Admin
export const StatsCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl p-6 border border-slate-200">
    <div className="flex items-center justify-between mb-4">
      <Skeleton className="w-12 h-12 rounded-xl" />
      <Skeleton className="h-4 w-16" />
    </div>
    <Skeleton className="h-8 w-20 mb-2" />
    <Skeleton className="h-3 w-24" />
  </div>
);

// Login Form Skeleton
export const LoginFormSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="space-y-2">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-12 w-full rounded-2xl" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-12 w-full rounded-2xl" />
    </div>
    <Skeleton className="h-12 w-full rounded-2xl" />
    <div className="flex gap-4">
      <Skeleton className="h-12 flex-1 rounded-2xl" />
      <Skeleton className="h-12 flex-1 rounded-2xl" />
    </div>
  </div>
);

// Table Skeleton
export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="space-y-3">
    {/* Header */}
    <div className="flex gap-4 p-4 bg-slate-100 rounded-xl">
      <Skeleton className="h-4 w-8" />
      <Skeleton className="h-4 flex-1" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-20" />
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4 p-4 bg-white rounded-xl border border-slate-200">
        <Skeleton className="h-4 w-8" />
        <Skeleton className="h-4 flex-1" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>
    ))}
  </div>
);

// Full Page Loading Skeleton
export const PageLoadingSkeleton: React.FC = () => (
  <div className="min-h-screen bg-slate-50 p-4 md:p-8">
    {/* Header */}
    <div className="flex items-center justify-between mb-8 p-4 bg-white rounded-2xl border border-slate-200">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <Skeleton className="w-10 h-10 rounded-full" />
      </div>
    </div>
    
    {/* Content */}
    <div className="space-y-6">
      <ClassSelectorSkeleton />
      <ClassDetailsSkeleton />
      <div className="grid gap-6">
        <WeekCardSkeleton />
        <WeekCardSkeleton />
      </div>
    </div>
  </div>
);

export default Skeleton;
