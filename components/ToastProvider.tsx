import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  addToast: (message: string, type: ToastType) => void;
  removeToast: (id: string) => void;
  toast: {
    success: (message: string) => void;
    error: (message: string) => void;
    warning: (message: string) => void;
    info: (message: string) => void;
  }
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context.toast;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 3000); // Auto remove after 3 seconds
  }, [removeToast]);

  const toastHelpers = {
    success: (msg: string) => addToast(msg, 'success'),
    error: (msg: string) => addToast(msg, 'error'),
    warning: (msg: string) => addToast(msg, 'warning'),
    info: (msg: string) => addToast(msg, 'info'),
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast, toast: toastHelpers }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`
              pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-md min-w-[300px] max-w-sm animate-in slide-in-from-right-full duration-300
              ${t.type === 'success' ? 'bg-white/90 border-emerald-100 text-emerald-800' : ''}
              ${t.type === 'error' ? 'bg-white/90 border-red-100 text-red-800' : ''}
              ${t.type === 'warning' ? 'bg-white/90 border-amber-100 text-amber-800' : ''}
              ${t.type === 'info' ? 'bg-white/90 border-blue-100 text-blue-800' : ''}
            `}
          >
            <div className={`
              p-1 rounded-full shrink-0
              ${t.type === 'success' ? 'bg-emerald-100' : ''}
              ${t.type === 'error' ? 'bg-red-100' : ''}
              ${t.type === 'warning' ? 'bg-amber-100' : ''}
              ${t.type === 'info' ? 'bg-blue-100' : ''}
            `}>
              {t.type === 'success' && <CheckCircle className="w-5 h-5" />}
              {t.type === 'error' && <AlertCircle className="w-5 h-5" />}
              {t.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
              {t.type === 'info' && <Info className="w-5 h-5" />}
            </div>
            
            <p className="text-sm font-medium flex-1">{t.message}</p>
            
            <button 
              onClick={() => removeToast(t.id)}
              className="p-1 hover:bg-black/5 rounded-full transition-colors opacity-60 hover:opacity-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
