
import React, { useState } from 'react';
import { PopupNotification } from '../types';
import { X, Info, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';

interface NotificationPopupProps {
  notification: PopupNotification;
  onClose: () => void;
  isPreview?: boolean;
}

const NotificationPopup: React.FC<NotificationPopupProps> = ({ notification, onClose, isPreview = false }) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // In preview mode, we always show it regardless of isActive status passed in props, 
  // but usually parent controls this.
  if (!notification.isActive && !isPreview) return null;

  const handleClose = () => {
    if (isPreview) {
        // Do nothing or visual feedback only in preview
        return; 
    }

    if (dontShowAgain) {
      localStorage.setItem(`hide_notif_${notification.id}`, 'true');
    }
    onClose();
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'warning': return <AlertTriangle className="w-8 h-8 text-amber-600" />;
      case 'error': return <AlertCircle className="w-8 h-8 text-red-600" />;
      case 'success': return <CheckCircle className="w-8 h-8 text-emerald-600" />;
      default: return <Info className="w-8 h-8 text-blue-600" />;
    }
  };

  const getColors = () => {
    switch (notification.type) {
      case 'warning': return { bg: 'bg-amber-50 dark:bg-amber-950', border: 'border-amber-100 dark:border-amber-900', btn: 'bg-amber-600 hover:bg-amber-700' };
      case 'error': return { bg: 'bg-red-50 dark:bg-red-950', border: 'border-red-100 dark:border-red-900', btn: 'bg-red-600 hover:bg-red-700' };
      case 'success': return { bg: 'bg-emerald-50 dark:bg-emerald-950', border: 'border-emerald-100 dark:border-emerald-900', btn: 'bg-emerald-600 hover:bg-emerald-700' };
      default: return { bg: 'bg-blue-50 dark:bg-blue-950', border: 'border-blue-100 dark:border-blue-900', btn: 'bg-blue-600 hover:bg-blue-700' };
    }
  };

  const colors = getColors();

  // Position logic: 'fixed' for real usage, 'absolute' for preview container
  const positionClasses = isPreview 
    ? "absolute inset-0 z-10" 
    : "fixed inset-0 z-[60]";
    
  // Backdrop logic: remove heavy blur in preview if desired, or keep it to simulate exactly
  const backdropClasses = isPreview
    ? "bg-slate-900/10 backdrop-blur-[1px]" // Lighter backdrop for preview
    : "bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300";

  // Modal Animation: Add spring-like feel
  const modalAnimation = !isPreview 
    ? "animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-300 ease-out" 
    : "";

  return (
    <div className={`${positionClasses} flex items-center justify-center p-4 ${backdropClasses}`}>
      <div className={`w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden relative border ${colors.border} ${modalAnimation}`}>
        
        {/* Decorative Top Bar */}
        <div className={`h-2 w-full ${colors.btn.split(' ')[0]}`}></div>

        <div className="p-8">
            <div className="flex gap-5">
                <div className={`shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center ${colors.bg}`}>
                    {getIcon()}
                </div>
                <div className="flex-1 space-y-2">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                        {notification.title}
                    </h3>
                    <div className="text-slate-600 dark:text-slate-300 text-base leading-relaxed">
                         {notification.content.split('\n').map((line, i) => (
                            <p key={i} className={i > 0 ? 'mt-2' : ''}>{line}</p>
                         ))}
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                
                <label className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative flex items-center">
                        <input 
                            type="checkbox" 
                            className="peer sr-only"
                            checked={dontShowAgain}
                            onChange={(e) => setDontShowAgain(e.target.checked)}
                        />
                        <div className="w-5 h-5 border-2 border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all flex items-center justify-center">
                             <CheckCircle className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100" />
                        </div>
                    </div>
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
                        Không hiện lại thông báo này
                    </span>
                </label>

                <button
                    onClick={handleClose}
                    className={`px-8 py-3 rounded-xl text-white font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all w-full sm:w-auto ${colors.btn}`}
                >
                    Đã hiểu
                </button>
            </div>
        </div>

        {/* Close Icon */}
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default NotificationPopup;
