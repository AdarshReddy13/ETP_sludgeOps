import React from 'react';
import { X, Bell, CheckCircle, AlertCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { useETP } from '../../context/ETPContext';
import clsx from 'clsx';

export const NotificationsDrawer: React.FC = () => {
  const { isNotificationsOpen, setIsNotificationsOpen, alerts, acknowledgeAlert, setActivePage } = useETP();

  if (!isNotificationsOpen) return null;

  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  const warningAlerts = alerts.filter(a => a.severity === 'warning');

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs transition-opacity"
        onClick={() => setIsNotificationsOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-200">
          {/* Header */}
          <div className="p-4 sm:px-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Compliance & Unit Alerts</h3>
                <p className="text-[11px] text-slate-500">
                  {alerts.filter(a => !a.acknowledged).length} unacknowledged notifications
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsNotificationsOpen(false)}
              className="rounded-lg p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Alert list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {alerts.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <CheckCircle className="w-8 h-8 mx-auto text-emerald-500 mb-2 opacity-70" />
                <p className="text-xs font-semibold text-slate-600">All Operations Normal</p>
                <p className="text-[11px] text-slate-400 mt-1">No active critical or warning alerts detected.</p>
              </div>
            ) : (
              alerts.map(alert => {
                const isCritical = alert.severity === 'critical';
                const Icon = isCritical ? AlertCircle : AlertTriangle;

                return (
                  <div
                    key={alert.id}
                    className={clsx(
                      'rounded-xl border p-3.5 shadow-2xs transition-all text-xs flex flex-col justify-between gap-2',
                      isCritical
                        ? 'border-red-200 bg-red-50/40 text-red-950'
                        : 'border-amber-200 bg-amber-50/40 text-amber-950',
                      alert.acknowledged ? 'opacity-50 grayscale-50' : ''
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-bold flex items-center gap-1.5">
                          <Icon className={clsx('w-3.5 h-3.5', isCritical ? 'text-red-600' : 'text-amber-600')} />
                          {alert.type}
                        </span>
                        <span
                          className={clsx(
                            'text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded font-mono',
                            isCritical ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-800'
                          )}
                        >
                          {alert.severity}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 mb-1">
                        Affected: <span className="font-medium text-slate-700">{alert.affectedUnit}</span>
                      </div>

                      <p className="text-slate-700 text-[11px] leading-relaxed mb-2">{alert.message}</p>

                      <div className="rounded-md bg-white/90 p-2 border border-slate-200 text-[11px]">
                        <span className="font-semibold text-slate-800">Recommendation: </span>
                        <span className="text-slate-600">{alert.recommendedAction}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 mt-1">
                      <span className="text-[10px] text-slate-400 font-mono">{alert.timestamp}</span>
                      {!alert.acknowledged && (
                        <button
                          type="button"
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          Acknowledge
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-mono">
              CPCB Hazardous Waste Log Rule 20
            </span>
            <button
              type="button"
              onClick={() => {
                setActivePage('storage');
                setIsNotificationsOpen(false);
              }}
              className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
            >
              <span>View Storage & Disposal</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
