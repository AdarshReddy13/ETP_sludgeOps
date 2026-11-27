import React from 'react';
import { LucideIcon, HelpCircle } from 'lucide-react';
import clsx from 'clsx';

interface KPICardProps {
  title: string;
  value: string | number | null | undefined;
  unit?: string;
  change?: string;
  isPositiveChange?: boolean;
  status?: 'normal' | 'success' | 'warning' | 'danger' | 'neutral';
  icon?: LucideIcon;
  emptyPrompt?: string;
  onPromptClick?: () => void;
  tooltip?: string;
  subtitle?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  unit,
  change,
  isPositiveChange,
  status = 'neutral',
  icon: Icon,
  emptyPrompt,
  onPromptClick,
  tooltip,
  subtitle,
}) => {
  const isMissing = value === null || value === undefined || value === '—' || value === '';

  const statusStyles = {
    neutral: 'border-slate-200 bg-white hover:border-slate-300',
    normal: 'border-slate-200 bg-white hover:border-blue-300',
    success: 'border-emerald-200 bg-emerald-50/40 hover:border-emerald-300',
    warning: 'border-amber-200 bg-amber-50/40 hover:border-amber-300',
    danger: 'border-red-200 bg-red-50/40 hover:border-red-300',
  };

  const statusIconColors = {
    neutral: 'text-slate-500 bg-slate-100',
    normal: 'text-blue-600 bg-blue-50',
    success: 'text-emerald-600 bg-emerald-100',
    warning: 'text-amber-600 bg-amber-100',
    danger: 'text-red-600 bg-red-100',
  };

  return (
    <div
      className={clsx(
        'relative rounded-xl border p-4 sm:p-5 shadow-sm transition-all duration-200 flex flex-col justify-between',
        statusStyles[status]
      )}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            {title}
            {tooltip && (
              <span className="group relative cursor-pointer" title={tooltip}>
                <HelpCircle className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
              </span>
            )}
          </span>
          {Icon && (
            <div className={clsx('p-2 rounded-lg flex items-center justify-center shrink-0', statusIconColors[status])}>
              <Icon className="w-4 h-4" />
            </div>
          )}
        </div>

        {isMissing ? (
          <div className="py-2">
            <div className="text-2xl font-bold text-slate-400">Not Recorded</div>
            {emptyPrompt && (
              <button
                type="button"
                onClick={onPromptClick}
                className="mt-2 inline-flex items-center text-xs font-medium text-blue-600 hover:text-blue-700 underline underline-offset-2"
              >
                {emptyPrompt} →
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-mono">
              {value}
            </span>
            {unit && <span className="text-sm font-medium text-slate-500">{unit}</span>}
          </div>
        )}
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
        {subtitle && <span className="text-slate-500 truncate">{subtitle}</span>}
        {change && (
          <span
            className={clsx(
              'font-medium ml-auto',
              isPositiveChange ? 'text-emerald-600' : 'text-amber-600'
            )}
          >
            {change}
          </span>
        )}
      </div>
    </div>
  );
};
