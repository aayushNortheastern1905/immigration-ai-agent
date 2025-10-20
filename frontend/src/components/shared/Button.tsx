import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  onClick,
  type = 'button',
}) => {
  const baseStyles = 'font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2';
  
  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-xl hover:shadow-blue-500/50 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100',
    secondary: 'bg-white text-slate-900 border-2 border-slate-200 hover:border-blue-500 hover:shadow-lg',
    outline: 'bg-transparent text-blue-600 border-2 border-blue-600 hover:bg-blue-50',
    danger: 'bg-red-600 text-white hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/50',
    ghost: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
  };
  
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {children}
    </button>
  );
};

export default Button;