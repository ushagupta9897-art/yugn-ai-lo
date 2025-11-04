import React, { useState, useEffect } from 'react';
import type { ToastMessage } from '../types';

interface ToastProps {
  toast: ToastMessage;
}

const toastConfig = {
  success: {
    icon: '✅',
    bg: 'bg-emerald-500',
  },
  error: {
    icon: '❌',
    bg: 'bg-red-500',
  },
  info: {
    icon: 'ℹ️',
    bg: 'bg-blue-500',
  },
};

const Toast: React.FC<ToastProps> = ({ toast }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // Animate in
    setIsVisible(true);
    
    // Set up timer to animate out
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 4500); // Start fade out before it's removed

    return () => clearTimeout(timer);
  }, [toast]);

  const { icon, bg } = toastConfig[toast.type];

  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-xl shadow-lg text-white font-semibold transition-all duration-300 ease-in-out ${bg} ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
      role="alert"
      aria-live="assertive"
    >
      <span>{icon}</span>
      <p>{toast.message}</p>
    </div>
  );
};

export default Toast;
