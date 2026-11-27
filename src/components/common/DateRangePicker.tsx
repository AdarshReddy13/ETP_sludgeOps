import React, { useState } from 'react';
import { Calendar, ChevronDown, Check } from 'lucide-react';
import { useETP } from '../../context/ETPContext';
import clsx from 'clsx';

const PRESETS = [
  { label: 'Today', start: '2026-11-27', end: '2026-11-27' },
  { label: 'Last 7 Days', start: '2026-11-21', end: '2026-11-27' },
  { label: 'Last 30 Days', start: '2026-10-28', end: '2026-11-27' },
  { label: 'Year to Date', start: '2026-01-01', end: '2026-11-27' },
];

export const DateRangePicker: React.FC = () => {
  const { dateRange, setDateRange } = useETP();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
      >
        <Calendar className="w-3.5 h-3.5 text-slate-400" />
        <span>{dateRange.label}</span>
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 z-50 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
            <div className="text-[11px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">
              Date Filter
            </div>
            <div className="space-y-0.5">
              {PRESETS.map(preset => {
                const isSelected = dateRange.label === preset.label;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setDateRange({
                        label: preset.label,
                        startDate: preset.start,
                        endDate: preset.end,
                      });
                      setIsOpen(false);
                    }}
                    className={clsx(
                      'w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors text-left',
                      isSelected
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-700 hover:bg-slate-100'
                    )}
                  >
                    <span>{preset.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
