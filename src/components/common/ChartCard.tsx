import React from 'react';
import clsx from 'clsx';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  badge?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  emptyPrompt?: string;
  onEmptyAction?: () => void;
  isEmpty?: boolean;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  badge,
  actions,
  children,
  className,
  emptyPrompt,
  onEmptyAction,
  isEmpty,
}) => {
  return (
    <div
      className={clsx(
        'rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs flex flex-col justify-between',
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">{title}</h3>
            {badge && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>

        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      <div className="w-full flex-1 min-h-[260px] flex items-center justify-center">
        {isEmpty ? (
          <div className="text-center py-10 px-4">
            <p className="text-xs text-slate-500 mb-2">Insufficient daily data points to plot trend.</p>
            {emptyPrompt && (
              <button
                type="button"
                onClick={onEmptyAction}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline"
              >
                {emptyPrompt}
              </button>
            )}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};
