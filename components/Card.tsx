import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  [key: string]: any; // Allow other props like data-tour-id
}

const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`relative bg-surface-light dark:bg-surface-dark rounded-2xl p-6 sm:p-8 border border-border-light dark:border-border-dark shadow-md hover:shadow-lg transition-all duration-300 group animate-fade-in-up overflow-hidden ${className}`}
      {...props}
    >
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default Card;