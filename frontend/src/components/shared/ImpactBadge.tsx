import React from 'react';
import { AlertCircle, TrendingUp, CheckCircle2 } from 'lucide-react';

interface ImpactBadgeProps {
  level: 'high' | 'medium' | 'low';
}

const ImpactBadge: React.FC<ImpactBadgeProps> = ({ level }) => {
  const styles = {
    high: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
      icon: <AlertCircle className="w-4 h-4" />,
    },
    medium: {
      bg: 'bg-yellow-50',
      text: 'text-yellow-700',
      border: 'border-yellow-200',
      icon: <TrendingUp className="w-4 h-4" />,
    },
    low: {
      bg: 'bg-green-50',
      text: 'text-green-700',
      border: 'border-green-200',
      icon: <CheckCircle2 className="w-4 h-4" />,
    },
  };

  const style = styles[level];

  return (
    <span className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-semibold border ${style.bg} ${style.text} ${style.border}`}>
      {style.icon}
      {level.charAt(0).toUpperCase() + level.slice(1)} Impact
    </span>
  );
};

export default ImpactBadge;