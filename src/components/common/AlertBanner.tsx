import React from 'react';
import { AlertTriangle, CheckCircle2, AlertCircle, Info, ShieldAlert, ArrowRight } from 'lucide-react';
import clsx from 'clsx';

export type StatusBannerState = 'green' | 'amber' | 'red';

interface StatusBannerProps {
  state: StatusBannerState;
  customTitle?: string;
  customMessage?: string;
  onActionClick?: () => void;
  actionText?: string;
}

export const StatusBanner: React.FC<StatusBannerProps> = ({
  state,
  customTitle,
  customMessage,
  onActionClick,
  actionText,
}) => {
  const configs = {
    green: {
      bg: 'bg-emerald-50 border-emerald-300 text-emerald-900',
      iconBg: 'bg-emerald-500 text-white',
      icon: CheckCircle2,
      title: 'Sludge handling within limits',
      desc: 'All coagulation parameters, storage capacity, and statutory disposal timelines conform to CPCB/SPCB guidelines.',
    },
    amber: {
      bg: 'bg-amber-50 border-amber-300 text-amber-900',
      iconBg: 'bg-amber-500 text-white',
      icon: AlertTriangle,
      title: 'Storage or dewatering attention required',
      desc: 'Elevated cake moisture, inventory above 60 days, or pending lab characterisation requires operational attention.',
    },
    red: {
      bg: 'bg-red-50 border-red-300 text-red-900',
      iconBg: 'bg-red-500 text-white',
      icon: ShieldAlert,
      title: 'Compliance or high sludge-generation risk',
      desc: 'Storage yard >80% capacity, statutory 90-day deadline approaching, or untreated acidic/extreme COD load active.',
    },
  };

  const config = configs[state];
  const Icon = config.icon;

  return (
    <div className={clsx('rounded-xl border p-4 sm:p-5 shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4', config.bg)}>
      <div className="flex items-start gap-3.5">
        <div className={clsx('p-2 rounded-xl shrink-0 shadow-xs', config.iconBg)}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold tracking-tight">
            {customTitle || config.title}
          </h4>
          <p className="text-xs mt-1 text-slate-700 max-w-2xl leading-relaxed">
            {customMessage || config.desc}
          </p>
        </div>
      </div>

      {actionText && onActionClick && (
        <button
          type="button"
          onClick={onActionClick}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-800 hover:bg-slate-100 hover:border-slate-400 shadow-2xs shrink-0 self-start md:self-auto transition-colors"
        >
          <span>{actionText}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

interface AlertCardProps {
  type: string;
  severity: 'critical' | 'warning' | 'info';
  affectedUnit: string;
  recommendedAction: string;
  message?: string;
  timestamp?: string;
  onAcknowledge?: () => void;
  isAcknowledged?: boolean;
}

export const AlertCard: React.FC<AlertCardProps> = ({
  type,
  severity,
  affectedUnit,
  recommendedAction,
  message,
  timestamp,
  onAcknowledge,
  isAcknowledged,
}) => {
  const severityStyles = {
    critical: {
      border: 'border-l-4 border-l-red-600 border-red-200 bg-red-50/40',
      badge: 'bg-red-100 text-red-800 border-red-200',
      icon: AlertCircle,
      iconColor: 'text-red-600',
    },
    warning: {
      border: 'border-l-4 border-l-amber-500 border-amber-200 bg-amber-50/40',
      badge: 'bg-amber-100 text-amber-800 border-amber-200',
      icon: AlertTriangle,
      iconColor: 'text-amber-600',
    },
    info: {
      border: 'border-l-4 border-l-blue-500 border-blue-200 bg-blue-50/40',
      badge: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: Info,
      iconColor: 'text-blue-600',
    },
  };

  const style = severityStyles[severity];
  const Icon = style.icon;

  return (
    <div
      className={clsx(
        'rounded-xl border p-4 shadow-2xs transition-all flex flex-col justify-between gap-3',
        style.border,
        isAcknowledged ? 'opacity-60 bg-slate-50 border-slate-200 border-l-slate-400' : ''
      )}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
          <div className="flex items-center gap-2">
            <Icon className={clsx('w-4 h-4 shrink-0', style.iconColor)} />
            <span className="text-xs font-bold text-slate-900">{type}</span>
          </div>
          <span className={clsx('px-2 py-0.5 rounded-full text-[11px] font-semibold border', style.badge)}>
            {severity.toUpperCase()}
          </span>
        </div>

        <div className="text-[11px] font-semibold text-slate-500 mb-1">
          Unit: <span className="text-slate-800">{affectedUnit}</span>
          {timestamp && <span className="ml-2 font-normal">({timestamp})</span>}
        </div>

        {message && <p className="text-xs text-slate-700 mb-2 leading-relaxed">{message}</p>}

        <div className="bg-white/80 rounded-lg p-2.5 border border-slate-200/80 text-xs">
          <span className="font-semibold text-slate-800">Action: </span>
          <span className="text-slate-600">{recommendedAction}</span>
        </div>
      </div>

      {onAcknowledge && !isAcknowledged && (
        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onAcknowledge}
            className="text-[11px] font-medium text-slate-600 hover:text-slate-900 hover:underline"
          >
            Acknowledge & Mark Reviewed
          </button>
        </div>
      )}
    </div>
  );
};
