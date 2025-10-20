import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconBgColor: string;
  badge?: {
    text: string;
    color: string;
  };
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconBgColor,
  badge,
}) => {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 ${iconBgColor} rounded-xl flex items-center justify-center`}>
          {icon}
        </div>
        {badge && (
          <span className={`text-xs font-medium px-3 py-1 rounded-full ${badge.color}`}>
            {badge.text}
          </span>
        )}
      </div>
      <div className="text-3xl font-bold text-slate-900 mb-1">{value}</div>
      <div className="text-sm text-slate-600">{title}</div>
      {subtitle && (
        <div className="text-xs text-slate-400 mt-2">{subtitle}</div>
      )}
    </div>
  );
};

export default StatCard;