import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Loading...', 
  size = 'md' 
}) => {
  const sizes = {
    sm: 'w-8 h-8 border-2',
    md: 'w-12 h-12 border-4',
    lg: 'w-16 h-16 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className={`${sizes[size]} border-blue-600 border-t-transparent rounded-full animate-spin mb-4`}></div>
      <p className="text-slate-600 font-medium">{message}</p>
    </div>
  );
};

export default LoadingSpinner;