
import React from 'react';

interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'medium', className = '' }) => {
  const sizeClasses = {
    small: 'w-5 h-5 border-2',
    medium: 'w-10 h-10 border-4',
    large: 'w-16 h-16 border-4',
  };
  // Note: Removed mx-auto to make it more flexible for inline usage
  return (
    <div className={`border-gray-200 dark:border-gray-600 border-t-primary rounded-full animate-spin ${sizeClasses[size]} ${className}`}></div>
  );
};

export default Spinner;