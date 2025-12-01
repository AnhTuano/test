import React, { useEffect, useState } from 'react';

interface ScoreRingProps {
  score: number;        // 0-10
  size?: number;        // Default: 120
  strokeWidth?: number; // Default: 12
}

const ScoreRing: React.FC<ScoreRingProps> = ({ score, size = 120, strokeWidth = 10 }) => {
  const [offset, setOffset] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Ensure score is a valid number between 0-10
  const validScore = typeof score === 'number' && !isNaN(score) ? Math.min(10, Math.max(0, score)) : 0;

  useEffect(() => {
    const progressOffset = circumference - (validScore / 10) * circumference;
    // Small delay to trigger animation
    const timer = setTimeout(() => {
      setOffset(progressOffset);
    }, 100);
    return () => clearTimeout(timer);
  }, [validScore, circumference]);

  const getColor = (s: number) => {
    if (s >= 8) return '#10b981'; // Green-500
    if (s >= 5) return '#f59e0b'; // Amber-500
    return '#ef4444';             // Red-500
  };

  const color = getColor(validScore);
  
  // Format display score with 1 decimal place if needed
  const displayScore = Number.isInteger(validScore) ? validScore : validScore.toFixed(1);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Circle with color tint */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="transition-colors"
          stroke={color}
          strokeOpacity={0.15}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Foreground Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round" 
          style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center animate-in fade-in zoom-in duration-700">
        <span className="text-3xl font-extrabold text-slate-800 dark:text-white transition-colors tracking-tight">{displayScore}</span>
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">/ 10 điểm</span>
      </div>
    </div>
  );
};

export default ScoreRing;