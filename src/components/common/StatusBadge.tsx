import React from 'react';
import clsx from 'clsx';
import { AlertCircle, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { ClassificationStatus, AlertSeverity } from '../../types';

interface StatusBadgeProps {
  status: ClassificationStatus | AlertSeverity | 'active' | 'completed' | 'pending' | 'in_transit';
  label?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, size = 'sm' }) => {
  let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
  let IconComponent = Clock;
  let defaultLabel = 'Pending';

  switch (status) {
    // Classification statuses
    case 'pending':
      badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
      IconComponent = Clock;
      defaultLabel = 'Pending Test';
      break;
    case 'hazardous':
      badgeStyle = 'bg-red-50 text-red-700 border-red-200 font-medium';
      IconComponent = AlertCircle;
      defaultLabel = 'Classified Hazardous';
      break;
    case 'non_hazardous':
      badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium';
      IconComponent = CheckCircle;
      defaultLabel = 'Classified Non-Hazardous';
      break;
    case 'awaiting_decision':
      badgeStyle = 'bg-amber-50 text-amber-800 border-amber-200 font-medium';
      IconComponent = AlertTriangle;
      defaultLabel = 'Awaiting Disposal Decision';
      break;

    // Alert severities
    case 'critical':
      badgeStyle = 'bg-red-100 text-red-800 border-red-300 font-semibold';
      IconComponent = AlertCircle;
      defaultLabel = 'Critical';
      break;
    case 'warning':
      badgeStyle = 'bg-amber-100 text-amber-800 border-amber-300 font-semibold';
      IconComponent = AlertTriangle;
      defaultLabel = 'Warning';
      break;
    case 'info':
      badgeStyle = 'bg-blue-100 text-blue-800 border-blue-200 font-medium';
      IconComponent = AlertCircle;
      defaultLabel = 'Info';
      break;

    default:
      badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
      defaultLabel = status;
  }

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full border shadow-2xs font-sans tracking-wide',
        sizeClass,
        badgeStyle
      )}
    >
      <IconComponent className={size === 'sm' ? 'w-3 h-3 shrink-0' : 'w-4 h-4 shrink-0'} />
      <span>{label || defaultLabel}</span>
    </span>
  );
};
