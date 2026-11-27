import React from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  Droplets,
  Activity,
  ShieldAlert,
  Calendar,
  Layers,
  TrendingDown,
  Warehouse,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';
import { useETP } from '../../context/ETPContext';
import { KPICard } from '../common/KPICard';
import { StatusBanner } from '../common/AlertBanner';
import { ChartCard } from '../common/ChartCard';
import { DataTable, Column } from '../common/DataTable';
import { AlertItem } from '../../types';
import {
  calculateCodRemoved,
  calculateSludgeFactor,
  formatNumber,
} from '../../utils/calculations';
import clsx from 'clsx';

export const DashboardView: React.FC = () => {
  const {
    dailyRecords,
    batches,
    alerts,
    storageCapacityTonnes,
    setIsAddEntryModalOpen,
    acknowledgeAlert,
    loadSampleProductionData,
    mode,
    setActivePage,
  } = useETP();

  const latestRecord = dailyRecords[0] || null;

  // Key KPI values
  const wastewaterTreated = latestRecord?.wastewaterTreated ?? null;
  const influentCOD = latestRecord?.influentCOD ?? 108000;
  const effluentCOD = latestRecord?.effluentCOD ?? null;

  const { kgRemoved, pctRemoved } = calculateCodRemoved(influentCOD, effluentCOD, wastewaterTreated);
  const wetSludgeGenerated = latestRecord?.wetSludgeGenerated ?? null;
  const sludgeFactor = calculateSludgeFactor(wetSludgeGenerated, wastewaterTreated);

  // Storage metrics
  const storedBatches = batches.filter(b => b.currentStage === 'Stored');
  const storedTonnes = storedBatches.reduce((sum, b) => sum + b.quantityTonnes, 0);
  const storagePct = (storedTonnes / storageCapacityTonnes) * 100;

  // Next disposal deadline
  const oldestBatchDays = storedBatches.length > 0 ? Math.max(...storedBatches.map(b => b.daysInStorage)) : 0;
  const daysRemainingDeadline = Math.max(0, 90 - oldestBatchDays);

  // Determine system banner status
  // Green: “Sludge handling within limits”
  // Amber: “Storage or dewatering attention required”
  // Red: “Compliance or high sludge-generation risk”
  let bannerState: 'green' | 'amber' | 'red' = 'green';
  if (storagePct >= 80 || daysRemainingDeadline <= 15 || alerts.some(a => !a.acknowledged && a.severity === 'critical')) {
    bannerState = 'red';
  } else if (storagePct >= 60 || daysRemainingDeadline <= 30 || alerts.some(a => !a.acknowledged && a.severity === 'warning')) {
    bannerState = 'amber';
  }

  // Chart dataset prepared from records (reversed so chronological left-to-right)
  const chartData = [...dailyRecords].reverse().map(r => {
    const { kgRemoved: remKg } = calculateCodRemoved(r.influentCOD, r.effluentCOD, r.wastewaterTreated);
    const sFactor = calculateSludgeFactor(r.wetSludgeGenerated, r.wastewaterTreated);
    return {
      date: r.date.slice(5), // MM-DD
      influentCOD: r.influentCOD,
      effluentCOD: r.effluentCOD || 0,
      wetSludgeKg: r.wetSludgeGenerated || 0,
      codRemovedKg: remKg || 0,
      sludgeFactor: sFactor || 0,
      flow: r.wastewaterTreated || 0,
    };
  });

  const isInitialOnly = mode === 'initial' || (dailyRecords.length === 1 && dailyRecords[0].wastewaterTreated === null);

  // Alerts table columns
  const alertColumns: Column<AlertItem>[] = [
    {
      key: 'type',
      header: 'Alert Type',
      render: r => (
        <span className="font-semibold text-slate-900 flex items-center gap-1.5">
          {r.type}
        </span>
      ),
    },
    {
      key: 'severity',
      header: 'Severity',
      align: 'center',
      render: r => (
        <span
          className={clsx(
            'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono',
            r.severity === 'critical'
              ? 'bg-red-100 text-red-800 border border-red-200'
              : r.severity === 'warning'
              ? 'bg-amber-100 text-amber-800 border border-amber-200'
              : 'bg-blue-100 text-blue-800 border border-blue-200'
          )}
        >
          {r.severity}
        </span>
      ),
    },
    {
      key: 'affectedUnit',
      header: 'Affected Unit / Batch',
      render: r => <span className="font-mono text-slate-700">{r.affectedUnit}</span>,
    },
    {
      key: 'recommendedAction',
      header: 'Recommended Action',
      render: r => <span className="text-slate-600 line-clamp-1">{r.recommendedAction}</span>,
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: r => (
        <button
          type="button"
          onClick={() => acknowledgeAlert(r.id)}
          disabled={r.acknowledged}
          className={clsx(
            'text-[11px] font-medium px-2 py-1 rounded transition-colors',
            r.acknowledged
              ? 'text-slate-400 cursor-not-allowed'
              : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
          )}
        >
          {r.acknowledged ? 'Acknowledged' : 'Resolve / Review'}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Onboarding Card (Mandatory Prompt for initial 2-point state) */}
      {isInitialOnly && (
        <div className="rounded-2xl border-2 border-blue-400/80 bg-gradient-to-r from-blue-50 via-indigo-50/50 to-white p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-blue-600 text-white shadow-xs shrink-0">
                <Info className="w-6 h-6" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold mb-1.5">
                  Initial Plant Baseline Active
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  COD and pH have been recorded.
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                  Add daily wastewater flow, sludge volume and sludge moisture to calculate sludge generation per m³, storage forecasts and disposal recommendations.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsAddEntryModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
              >
                <span>Add Daily Entry Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={loadSampleProductionData}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Load Sample Production Run</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Status Banner */}
      <StatusBanner
        state={bannerState}
        actionText="View Storage Yard & Dispatches"
        onActionClick={() => setActivePage('storage')}
      />

      {/* 3. KPI Cards Grid (8 Cards per requirement) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Wastewater treated today */}
        <KPICard
          title="Wastewater Treated Today"
          value={wastewaterTreated !== null ? formatNumber(wastewaterTreated, 0) : null}
          unit="m³/day"
          icon={Droplets}
          status={wastewaterTreated ? 'normal' : 'neutral'}
          emptyPrompt="Enter today's flow"
          onPromptClick={() => setIsAddEntryModalOpen(true)}
          subtitle="Inlet electromagnetic meter"
        />

        {/* KPI 2: Influent COD */}
        <KPICard
          title="Influent COD"
          value={formatNumber(influentCOD, 0)}
          unit="mg/L"
          icon={Activity}
          status="danger"
          change="> 100,000 mg/L Baseline"
          subtitle="Flash mixer raw influent"
          tooltip="Confirmed baseline high-strength chemical organic wastewater"
        />

        {/* KPI 3: Effluent COD */}
        <KPICard
          title="Effluent COD"
          value={effluentCOD !== null ? formatNumber(effluentCOD, 0) : null}
          unit="mg/L"
          icon={TrendingDown}
          status={effluentCOD ? 'success' : 'neutral'}
          emptyPrompt="Add lab report"
          onPromptClick={() => setIsAddEntryModalOpen(true)}
          subtitle="Clarified overflow"
        />

        {/* KPI 4: COD Removed */}
        <KPICard
          title="COD Removed"
          value={kgRemoved !== null ? `${formatNumber(kgRemoved, 0)} kg/d` : null}
          unit={pctRemoved !== null ? `(${pctRemoved}%)` : ''}
          icon={Activity}
          status={pctRemoved && pctRemoved >= 80 ? 'success' : pctRemoved ? 'warning' : 'neutral'}
          emptyPrompt="Awaiting flow & effluent"
          onPromptClick={() => setIsAddEntryModalOpen(true)}
          subtitle="Influent load minus effluent load"
        />

        {/* KPI 5: Wet Sludge Generated */}
        <KPICard
          title="Wet Sludge Generated"
          value={wetSludgeGenerated !== null ? formatNumber(wetSludgeGenerated, 0) : null}
          unit="kg/day"
          icon={Layers}
          status={wetSludgeGenerated ? 'normal' : 'neutral'}
          emptyPrompt="Record underflow mass"
          onPromptClick={() => setIsAddEntryModalOpen(true)}
          subtitle="Coagulation underflow slurry"
        />

        {/* KPI 6: Sludge Generation Factor */}
        <KPICard
          title="Sludge Generation Factor"
          value={sludgeFactor !== null ? sludgeFactor : null}
          unit="kg wet / m³"
          icon={Layers}
          status={sludgeFactor && sludgeFactor > 15 ? 'warning' : sludgeFactor ? 'success' : 'neutral'}
          emptyPrompt="Requires flow & sludge"
          onPromptClick={() => setIsAddEntryModalOpen(true)}
          subtitle="Wet sludge / wastewater treated"
        />

        {/* KPI 7: Sludge in Storage */}
        <KPICard
          title="Sludge in Storage"
          value={formatNumber(storedTonnes, 1)}
          unit={`tonnes (${storagePct.toFixed(0)}%)`}
          icon={Warehouse}
          status={storagePct >= 80 ? 'danger' : storagePct >= 60 ? 'warning' : 'normal'}
          subtitle={`Capacity: ${storageCapacityTonnes} tonnes`}
        />

        {/* KPI 8: Next Disposal Deadline */}
        <KPICard
          title="Disposal Deadline"
          value={daysRemainingDeadline}
          unit="days left"
          icon={Calendar}
          status={daysRemainingDeadline <= 15 ? 'danger' : daysRemainingDeadline <= 30 ? 'warning' : 'success'}
          subtitle="Statutory 90-day CPCB limit"
          tooltip="Hazardous waste must be dispatched to authorized TSDF within 90 days of generation"
        />
      </div>

      {/* 4. Charts Grid (4 Charts per requirement) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart 1: Influent vs Effluent COD Trend */}
        <ChartCard
          title="Influent vs Effluent COD Trend"
          subtitle="High-strength raw COD vs clarifier treated COD (mg/L)"
          badge="Water Quality"
          isEmpty={isInitialOnly}
          emptyPrompt="Add daily logs to visualize COD reduction trend"
          onEmptyAction={() => setIsAddEntryModalOpen(true)}
        >
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="infGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="effGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v / 1000}k`} />
              <Tooltip
                formatter={(val: any, name: any) => [
                  `${Number(val).toLocaleString()} mg/L`,
                  name === 'influentCOD' ? 'Influent COD' : 'Effluent COD',
                ]}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area
                type="monotone"
                dataKey="influentCOD"
                stroke="#ef4444"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#infGradient)"
                name="Influent COD"
              />
              <Area
                type="monotone"
                dataKey="effluentCOD"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#effGradient)"
                name="Effluent COD"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Chart 2: Daily Wet Sludge Generation */}
        <ChartCard
          title="Daily Wet Sludge Generation"
          subtitle="Raw chemical coagulation slurry generated per shift (kg/day)"
          badge="Sludge Volume"
          isEmpty={isInitialOnly}
          emptyPrompt="Record daily underflow to plot sludge production"
          onEmptyAction={() => setIsAddEntryModalOpen(true)}
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v} kg`} />
              <Tooltip formatter={(val: any) => [`${Number(val).toLocaleString()} kg/day`, 'Wet Sludge']} />
              <Bar dataKey="wetSludgeKg" fill="#2563eb" radius={[4, 4, 0, 0]} name="Wet Sludge (kg/day)" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Chart 3: COD Removed vs Sludge Generated */}
        <ChartCard
          title="COD Removed vs Sludge Generated"
          subtitle="Relationship between organic mass removed (kg) and precipitation mass (kg)"
          badge="Stoichiometry"
          isEmpty={isInitialOnly}
          emptyPrompt="Requires both COD removal and sludge data"
          onEmptyAction={() => setIsAddEntryModalOpen(true)}
        >
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar
                yAxisId="left"
                dataKey="codRemovedKg"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                name="COD Removed (kg/d)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="wetSludgeKg"
                stroke="#6366f1"
                strokeWidth={2.5}
                dot={{ r: 4 }}
                name="Sludge Generated (kg/d)"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Chart 4: Storage Capacity Used */}
        <ChartCard
          title="Hazardous Sludge Storage Capacity"
          subtitle={`Current inventory: ${storedTonnes.toFixed(1)} t / ${storageCapacityTonnes} t (Threshold: 80%)`}
          badge="Containment Yard"
        >
          <div className="w-full flex flex-col justify-center space-y-4 px-4 py-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Storage Yard Shed-01 Utilization</span>
              <span
                className={clsx(
                  'font-mono font-bold text-sm',
                  storagePct >= 80 ? 'text-red-600' : storagePct >= 60 ? 'text-amber-600' : 'text-emerald-600'
                )}
              >
                {storagePct.toFixed(1)}% Filled
              </span>
            </div>

            {/* Visual Gauge Bar */}
            <div className="relative h-6 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200">
              <div
                className={clsx(
                  'h-full rounded-full transition-all duration-500',
                  storagePct >= 80 ? 'bg-red-500' : storagePct >= 60 ? 'bg-amber-500' : 'bg-emerald-500'
                )}
                style={{ width: `${Math.min(100, storagePct)}%` }}
              />
              {/* 80% Threshold Line */}
              <div
                className="absolute top-0 bottom-0 border-r-2 border-red-700 border-dashed z-10"
                style={{ left: '80%' }}
                title="80% CPCB Statutory Warning Limit"
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>0 t (Empty)</span>
              <span className="font-semibold text-red-600">80% Warning Limit ({storageCapacityTonnes * 0.8} t)</span>
              <span>{storageCapacityTonnes} t (Max Cap)</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200 text-xs">
                <span className="text-[10px] uppercase text-slate-500 font-semibold block">Active Stored Batches</span>
                <span className="font-mono font-bold text-slate-900">{storedBatches.length} batches</span>
              </div>
              <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200 text-xs">
                <span className="text-[10px] uppercase text-slate-500 font-semibold block">Oldest Batch Age</span>
                <span className="font-mono font-bold text-amber-600">{oldestBatchDays} days</span>
              </div>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* 5. Alerts Table */}
      <DataTable
        title="Active Operational & Compliance Alerts"
        subtitle="Real-time threshold triggers across coagulation, neutralization, dewatering and statutory disposal"
        columns={alertColumns}
        data={alerts}
        searchKey="type"
        exportFileName="etp_alerts_log.csv"
        emptyMessage="No active unit or regulatory alerts! All parameters within tolerance."
      />
    </div>
  );
};
