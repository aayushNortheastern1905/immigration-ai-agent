import React from 'react';

interface FilterChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

const FilterChip: React.FC<FilterChipProps> = ({ label, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`
        px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300
        ${active
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }
      `}
    >
      {label}
    </button>
  );
};

export default FilterChip;