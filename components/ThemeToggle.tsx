

import React from 'react';
import { useTheme } from './ThemeProvider';
import { Moon, Sun } from 'lucide-react';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-lg transition-colors border ${
        theme === 'dark' 
          ? 'bg-slate-800 text-yellow-400 border-slate-700 hover:bg-slate-700' 
          : 'bg-white text-slate-500 hover:bg-slate-50 border-slate-200 hover:text-blue-600'
      } ${className}`}
      title={theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
    >
      {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
};
