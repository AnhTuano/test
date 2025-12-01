import React, { useState, useEffect } from 'react';
import { CalendarDays } from 'lucide-react';

export const DesktopClock: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="hidden md:flex items-center gap-4 pl-6 border-l border-slate-200 dark:border-slate-800 h-10">
      <div className="text-right">
        <div className="text-xl font-black text-slate-800 dark:text-white leading-none tracking-tight font-mono tabular-nums">
          {currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
        </div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
          {currentTime.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}
        </div>
      </div>
      <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-slate-100 dark:border-slate-800">
        <CalendarDays className="w-5 h-5" />
      </div>
    </div>
  );
};

export const MobileClock: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex md:hidden flex-col items-end mr-1">
      <span className="text-xs font-black text-slate-800 dark:text-white font-mono leading-none tabular-nums">
        {currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </span>
      <span className="text-[9px] font-bold text-slate-400 uppercase leading-none mt-0.5">
        {currentTime.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
      </span>
    </div>
  );
};

// Helper for greeting to avoid re-rendering main page
export const GreetingText: React.FC<{ name: string }> = ({ name }) => {
    const [greeting, setGreeting] = useState('');

    useEffect(() => {
        const updateGreeting = () => {
            const hour = new Date().getHours();
            if (hour >= 5 && hour < 12) setGreeting("Chào buổi sáng,");
            else if (hour >= 12 && hour < 18) setGreeting("Chào buổi chiều,");
            else setGreeting("Chào buổi tối,");
        };
        updateGreeting();
        // Check every minute is enough for greeting
        const timer = setInterval(updateGreeting, 60000); 
        return () => clearInterval(timer);
    }, []);

    if (!greeting) return null; // Prevent hydration mismatch flicker if using SSR, though here is CSR

    return (
        <p className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2 text-sm md:text-base">
            {greeting} <span className="font-bold text-slate-800 dark:text-slate-200">{name}</span> 👋
        </p>
    );
}