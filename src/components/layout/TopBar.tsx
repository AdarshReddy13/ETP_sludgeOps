import React, { useState } from 'react';
import { Menu, Bell, Plus, Building, ShieldCheck, Scale } from 'lucide-react';
import { useETP } from '../../context/ETPContext';
import { DateRangePicker } from '../common/DateRangePicker';
import { RagAssistantModal } from '../common/RagAssistantModal';

interface TopBarProps {
  onOpenMobileSidebar: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenMobileSidebar }) => {
  const { setIsAddEntryModalOpen, alerts, isNotificationsOpen, setIsNotificationsOpen } = useETP();
  const [isRagModalOpen, setIsRagModalOpen] = useState(false);

  const unreadAlertsCount = alerts.filter(a => !a.acknowledged).length;
  const criticalCount = alerts.filter(a => !a.acknowledged && a.severity === 'critical').length;

  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-6 backdrop-blur-md">
        {/* Left: Mobile hamburger & Plant name */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
              <Building className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-none">
                  Apex Organics ETP <span className="font-normal text-slate-400">|</span> Unit 4
                </h1>
                <span className="hidden lg:inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3 h-3" />
                  Pollution Control Compliant
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block mt-0.5">
                Chemical Coagulation-Flocculation Sludge Operations & Disposal
              </p>
            </div>
          </div>
        </div>

        {/* Right: Date-range picker, RAG button, Notification Bell, Add Daily Entry Button */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="hidden sm:block">
            <DateRangePicker />
          </div>

          {/* RAG Knowledge Engine Shortcut */}
          <button
            type="button"
            onClick={() => setIsRagModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-100 transition-colors cursor-pointer"
            title="Open Regulatory RAG Knowledge Engine"
          >
            <Scale className="h-3.5 w-3.5 text-slate-700" />
            <span className="hidden md:inline">Regulatory RAG</span>
          </button>

          {/* Notification bell */}
          <button
            type="button"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
            title="View active notifications and compliance alerts"
          >
            <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
            {unreadAlertsCount > 0 && (
              <span
                className={`absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-2xs ${
                  criticalCount > 0 ? 'bg-red-500 ring-2 ring-white animate-pulse' : 'bg-amber-500'
                }`}
              >
                {unreadAlertsCount}
              </span>
            )}
          </button>

          {/* Primary CTA: Add Daily Entry */}
          <button
            type="button"
            onClick={() => setIsAddEntryModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 active:bg-blue-800 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Daily Entry</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </header>

      {/* RAG Knowledge Assistant Modal */}
      <RagAssistantModal
        isOpen={isRagModalOpen}
        onClose={() => setIsRagModalOpen(false)}
      />
    </>
  );
};

