import React from 'react';
import {
  LayoutDashboard,
  Factory,
  FlaskConical,
  Filter,
  Warehouse,
  DollarSign,
  AlertTriangle,
  Database,
  RefreshCw,
  X,
  Droplets,
  Building2,
  ShieldCheck,
  Box,
} from 'lucide-react';
import { useETP, PageId } from '../../context/ETPContext';
import clsx from 'clsx';

interface SidebarProps {
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onMobileClose }) => {
  const { activePage, setActivePage, mode, setMode, batches, storageCapacityTonnes, alerts } = useETP();

  const navItems: { id: PageId; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'generation', label: 'Sludge Generation', icon: Factory },
    {
      id: 'characterisation',
      label: 'Characterisation',
      icon: FlaskConical,
      badge: batches.filter(b => b.classificationStatus === 'pending').length || undefined,
    },
    { id: 'dewatering', label: 'Sludge Handling & Dewatering', icon: Filter },
    {
      id: 'storage',
      label: 'Storage & Disposal',
      icon: Warehouse,
      badge: batches.filter(b => b.currentStage === 'Stored' && b.daysInStorage > 60).length || undefined,
    },
    { id: 'cost', label: 'Cost & Route', icon: DollarSign },
    {
      id: 'compliance',
      label: 'KSPCB Compliance',
      icon: ShieldCheck,
      badge: batches.filter(b => b.currentStage === 'Stored' && b.daysInStorage > 90).length || undefined,
    },
    {
      id: 'plant3d',
      label: '3D Plant Design',
      icon: Box,
    },
  ];

  // Storage metric in sidebar
  const storedTonnes = batches
    .filter(b => b.currentStage === 'Stored')
    .reduce((sum, b) => sum + b.quantityTonnes, 0);
  const storagePct = Math.min(100, (storedTonnes / storageCapacityTonnes) * 100);

  const activeAlertsCount = alerts.filter(a => !a.acknowledged && a.severity === 'critical').length;

  const handleNavClick = (id: PageId) => {
    setActivePage(id);
    onMobileClose();
  };

  const content = (
    <div className="flex h-full flex-col justify-between bg-slate-900 text-slate-300">
      <div>
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
              <Droplets className="h-5 w-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                ETP SludgeOps
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  SaaS
                </span>
              </span>
              <p className="text-[10px] text-slate-400 font-mono tracking-wider">CPCB HAZ-WASTE READY</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onMobileClose}
            className="md:hidden text-slate-400 hover:text-white p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Plant Info Pill */}
        <div className="p-3.5 mx-3 mt-3 rounded-xl bg-slate-800/70 border border-slate-700/60 text-xs">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            <span className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              Active Unit
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">ONLINE</span>
          </div>
          <div className="font-semibold text-white truncate text-xs">Apex Organics ETP - Plant 4</div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between mt-1">
            <span>Baseline Confirmed:</span>
            <span className="font-mono text-amber-300 font-medium">COD &gt;100k | pH 5.5</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="mt-4 px-3 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={clsx(
                  'w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all text-left',
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={clsx('w-4 h-4', isActive ? 'text-white' : 'text-slate-400')} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={clsx(
                      'px-1.5 py-0.5 rounded-full text-[10px] font-bold font-mono',
                      isActive ? 'bg-white text-blue-700' : 'bg-amber-500 text-slate-900'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Metrics & State Switcher */}
      <div className="p-4 border-t border-slate-800 space-y-3">
        {/* Storage Yard Utilization Gauge */}
        <div className="rounded-lg bg-slate-800/90 p-3 border border-slate-700/60">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-slate-400 font-medium">Storage Yard Cap:</span>
            <span
              className={clsx(
                'font-mono font-bold',
                storagePct >= 80 ? 'text-red-400' : storagePct >= 60 ? 'text-amber-400' : 'text-emerald-400'
              )}
            >
              {storedTonnes.toFixed(1)} / {storageCapacityTonnes} t ({storagePct.toFixed(0)}%)
            </span>
          </div>
          <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
            <div
              className={clsx(
                'h-full rounded-full transition-all duration-300',
                storagePct >= 80 ? 'bg-red-500' : storagePct >= 60 ? 'bg-amber-500' : 'bg-emerald-500'
              )}
              style={{ width: `${storagePct}%` }}
            />
          </div>
        </div>

        {/* Mode Toggle Banner */}
        <div className="rounded-lg bg-slate-800/50 p-2.5 border border-slate-700/60 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Dataset Mode</span>
            <span
              className={clsx(
                'text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold',
                mode === 'initial'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              )}
            >
              {mode === 'initial' ? 'Confirmed 2 Pts' : 'Demo Mode'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setMode(mode === 'initial' ? 'demo' : 'initial')}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded bg-slate-700 hover:bg-slate-600 text-white text-[11px] font-medium transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Switch to {mode === 'initial' ? 'Sample Demo Data' : 'Initial 2-Point State'}</span>
          </button>
        </div>

        <div className="text-[10px] text-slate-500 text-center font-mono">
          CPCB HazWaste Rules 2016 Compliant
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30 shadow-lg">
        {content}
      </aside>

      {/* Mobile drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={onMobileClose} />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl">{content}</div>
        </div>
      )}
    </>
  );
};
