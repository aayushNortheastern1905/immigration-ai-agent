import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';

interface ConfidenceIndicatorProps {
  confidence: number; // 0.0 to 1.0
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({
  confidence,
  showLabel = true,
  size = 'md',
}) => {
  // Convert to percentage
  const percentage = Math.round(confidence * 100);

  // Determine confidence level
  const getConfidenceLevel = () => {
    if (confidence >= 0.90) {
      return {
        level: 'high',
        label: 'High Confidence',
        color: 'text-green-700',
        bg: 'bg-green-50',
        border: 'border-green-200',
        icon: <CheckCircle2 className={iconSize} />,
        dotColor: 'bg-green-500',
      };
    } else if (confidence >= 0.70) {
      return {
        level: 'medium',
        label: 'Review Recommended',
        color: 'text-yellow-700',
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        icon: <AlertTriangle className={iconSize} />,
        dotColor: 'bg-yellow-500',
      };
    } else {
      return {
        level: 'low',
        label: 'Verification Required',
        color: 'text-red-700',
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: <AlertCircle className={iconSize} />,
        dotColor: 'bg-red-500',
      };
    }
  };

  const sizes = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const iconSize = iconSizes[size];
  const sizeClass = sizes[size];
  const style = getConfidenceLevel();

  return (
    <div className="flex items-center gap-2">
      {/* Confidence Badge */}
      <span
        className={`
          inline-flex items-center gap-2 rounded-lg font-semibold border
          ${style.bg} ${style.color} ${style.border} ${sizeClass}
        `}
      >
        {style.icon}
        {showLabel ? style.label : `${percentage}%`}
      </span>

      {/* Percentage if showing label */}
      {showLabel && (
        <span className="text-sm font-medium text-slate-600">
          {percentage}%
        </span>
      )}
    </div>
  );
};

export default ConfidenceIndicator;