import React, { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/AuthProvider';
import { ThemeProvider } from './components/ThemeProvider';
import { ToastProvider } from './components/ToastProvider';
import ProtectedRoute from './components/ProtectedRoute';
import { PageLoadingSkeleton } from './components/Skeleton';
import ErrorBoundary from './components/ErrorBoundary';
import { UserRole } from './types';
import SecurityLockout from './components/SecurityLockout';
import SessionTimeout from './components/SessionTimeout';
import { api } from './services/api';
import { initDevToolsBlocker } from './utils/devToolsBlocker';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/queryClient';

// Lazy load pages for better performance
const Login = lazy(() => import('./pages/Login'));
const Grades = lazy(() => import('./pages/Grades'));
const Admin = lazy(() => import('./pages/Admin'));
const NotFound = lazy(() => import('./pages/NotFound'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));

const App: React.FC = () => {
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutDuration, setLockoutDuration] = useState(180);

  useEffect(() => {
    // Initialize DevTools blocker (production only)
    initDevToolsBlocker();

    const handleLockout = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.duration) {
        setLockoutDuration(customEvent.detail.duration);
      }
      setIsLockedOut(true);
    };

    window.addEventListener('security-lockout', handleLockout);
    return () => window.removeEventListener('security-lockout', handleLockout);
  }, []);

  const handleUnblock = () => {
    setIsLockedOut(false);
    api.resetSecurityLockout();
  };

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              {isLockedOut && <SecurityLockout initialDuration={lockoutDuration} onUnblock={handleUnblock} />}
              {/* Security Session Monitor */}
              <SessionTimeout />

              <BrowserRouter>
                <Suspense fallback={<PageLoadingSkeleton />}>
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />

                    <Route element={<ProtectedRoute allowedRoles={[UserRole.USER, UserRole.ADMIN]} />}>
                      <Route path="/grades" element={<Grades />} />
                    </Route>

                    <Route element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]} />}>
                      <Route path="/admin" element={<Admin />} />
                    </Route>

                    <Route path="/" element={<Navigate to="/login" replace />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
        {/* React Query DevTools - only show in development (localhost) */}
        {(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;