import React from 'react';

interface ScoreDonutProps {
  score: number; // 0-100
  size?: 'normal' | 'small';
  label?: string;
}

const ScoreDonut: React.FC<ScoreDonutProps> = ({ score, size = 'normal', label }) => {
  const sizeConfig = {
    normal: {
      dimension: 80,
      stroke: 8,
      textSize: 'text-2xl',
    },
    small: {
      dimension: 64,
      stroke: 6,
      textSize: 'text-xl',
    }
  };

  const { dimension, stroke, textSize } = sizeConfig[size];
  const radius = (dimension - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getScoreColor = () => {
    if (score >= 85) return 'text-emerald-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };
  
  const scoreColor = getScoreColor();

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: dimension, height: dimension }}>
        <svg width={dimension} height={dimension} viewBox={`0 0 ${dimension} ${dimension}`}>
          <circle
            className="text-slate-200 dark:text-slate-600"
            stroke="currentColor"
            strokeWidth={stroke}
            fill="transparent"
            r={radius}
            cx={dimension / 2}
            cy={dimension / 2}
          />
          <circle
            className={`${scoreColor} transition-all duration-1000 ease-out`}
            stroke="currentColor"
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
            r={radius}
            cx={dimension / 2}
            cy={dimension / 2}
            style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
          />
        </svg>
        <span className={`absolute font-bold ${textSize} ${scoreColor}`}>
          {score}
        </span>
      </div>
      {label && <p className="text-xs font-semibold text-secondary-text-light dark:text-secondary-text-dark">{label}</p>}
    </div>
  );
};

export default ScoreDonut;
