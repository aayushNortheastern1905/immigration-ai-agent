import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
}

const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  hover = true,
  padding = 'md' 
}) => {
  const paddings = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div 
      className={`
        bg-white rounded-2xl border border-slate-200 
        ${hover ? 'hover:shadow-lg hover:border-blue-200 transition-all duration-300' : ''}
        ${paddings[padding]}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default Card;