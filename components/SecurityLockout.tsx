
import React, { useEffect, useState } from 'react';
import { ShieldAlert, AlertTriangle, Lock } from 'lucide-react';

interface SecurityLockoutProps {
  initialDuration?: number; // seconds
  onUnblock: () => void;
}

const SecurityLockout: React.FC<SecurityLockoutProps> = ({ initialDuration = 180, onUnblock }) => {
  const [timeLeft, setTimeLeft] = useState(initialDuration);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onUnblock();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onUnblock]);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex items-center justify-center p-4 font-mono">
      <div className="max-w-2xl w-full border-4 border-red-600 bg-red-950/20 rounded-none p-8 md:p-12 relative overflow-hidden shadow-[0_0_50px_rgba(220,38,38,0.5)] animate-in zoom-in-95 duration-300">
        
        {/* Background Animation */}
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,0,0,0.05)_50%,transparent_75%,transparent_100%)] bg-[length:250px_250px] animate-[pulse_4s_linear_infinite]"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-red-600 animate-[loading_2s_ease-in-out_infinite]"></div>

        <div className="relative z-10 flex flex-col items-center text-center">
            <div className="mb-6 relative">
                <div className="absolute inset-0 bg-red-500 blur-2xl opacity-20 animate-pulse"></div>
                <ShieldAlert className="w-24 h-24 text-red-500 animate-[bounce_1s_infinite]" />
            </div>

            <h1 className="text-6xl md:text-8xl font-black text-red-600 tracking-tighter mb-2 glitch-text">
                403
            </h1>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-8 tracking-widest uppercase border-b-2 border-red-600 pb-2">
                BLOCKED
            </h2>

            <div className="bg-slate-900/80 border border-red-900/50 p-6 rounded-xl w-full max-w-lg mb-8 backdrop-blur-sm">
                <div className="flex items-center justify-center gap-3 text-red-400 font-bold text-lg mb-2 animate-pulse">
                    <AlertTriangle className="w-5 h-5" />
                    <span>SYSTEM DETECTED DDOS ATTACK</span>
                </div>
                <p className="text-slate-400 text-sm">
                    High traffic volume detected from your IP address. <br/>
                    (Rate limit exceeded: {'>'} 5 requests/1s)
                </p>
            </div>

            <p className="text-xl text-white font-medium mb-4">
                Your IP has been banned.
            </p>

            <div className="flex items-center gap-3 text-2xl md:text-3xl font-bold text-red-500 bg-slate-900 px-6 py-3 rounded border border-red-900/50">
                <Lock className="w-6 h-6" />
                <span>Unblock in: {timeLeft}s</span>
            </div>

            <div className="mt-8 text-xs text-slate-600 uppercase tracking-widest">
                Security ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
            </div>
        </div>
      </div>

      <style>{`
        @keyframes loading {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default SecurityLockout;
