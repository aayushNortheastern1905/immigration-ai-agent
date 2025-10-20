import React from 'react';

interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number';
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  error?: string;
  icon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({
  type = 'text',
  label,
  placeholder,
  value,
  onChange,
  required = false,
  error,
  icon,
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`
            w-full px-4 py-3 border rounded-xl outline-none transition-all
            ${icon ? 'pl-12' : ''}
            ${error 
              ? 'border-red-300 focus:ring-2 focus:ring-red-500' 
              : 'border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            }
          `}
        />
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default Input;