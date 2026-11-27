import React, { useState, useMemo } from 'react';
import {
  Filter,
  Plus,
  Percent,
  Droplet,
  Layers,
  AlertTriangle,
  Zap,
  Activity,
  ShieldAlert,
  Gauge,
  CheckCircle2,
  Clock,
  Building,
  Wrench,
  Check,
  FileSpreadsheet,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useETP } from '../../context/ETPContext';
import { KPICard } from '../common/KPICard';
import { DataTable, Column } from '../common/DataTable';
import { ChartCard } from '../common/ChartCard';
import { AddDewateringModal } from './AddDewateringModal';
import { ReportHandlingIssueModal } from './ReportHandlingIssueModal';
import {
  DewateringRecord,
  HandlingIssueItem,
  HandlingDifficultyBadge,
  ProcessStage,
  IssueStatus,
  IssuePriority,
  AlertSeverity,
} from '../../types';
import { calculateVolumeReduction, formatNumber } from '../../utils/calculations';
import clsx from 'clsx';

export const DewateringView: React.FC = () => {
  const {
    dewateringRecords,
    batches,
    handlingIssues,
    addDewateringRecord,
    addHandlingIssue,
    updateHandlingIssue,
    storageCapacityTonnes,
    setActivePage,
  } = useETP();

  const [isAddDewateringModalOpen, setIsAddDewateringModalOpen] = useState(false);
  const [isReportIssueModalOpen, setIsReportIssueModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'troubleshooting' | 'runs' | 'register'>('troubleshooting');

  // Filter States
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [facilityFilter, setFacilityFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Latest Dewatering Run Stats
  const latest = dewateringRecords[0] || null;
  const cakeMoisture = latest?.cakeMoisturePct ?? null;
  const initialVol = latest?.initialSludgeVolumeM3 ?? 0;
  const finalVol = latest?.finalSludgeVolumeM3 ?? 0;
  const volumeReductionPct = latest ? calculateVolumeReduction(initialVol, finalVol) : null;
  const filtrateTss = latest?.filtrateTssMgL ?? null;
  const polymerConsumption = latest?.polymerDoseKgPerTonne ?? null;

  // Storage metric
  const storedTonnes = batches
    .filter(b => b.currentStage === 'Stored')
    .reduce((sum, b) => sum + b.quantityTonnes, 0);
  const storagePct = (storedTonnes / storageCapacityTonnes) * 100;

  // Sludge handling difficulty score calculation (0 to 100)
  let difficultyScore = 20; // baseline healthy
  if (cakeMoisture !== null) {
    if (cakeMoisture > 80) difficultyScore += 30;
    else if (cakeMoisture > 75) difficultyScore += 15;
  }
  if (filtrateTss !== null) {
    if (filtrateTss > 250) difficultyScore += 25;
    else if (filtrateTss > 200) difficultyScore += 15;
  }
  if (latest?.sludgeConsistency === 'oily' || latest?.sludgeConsistency === 'sticky') {
    difficultyScore += 25;
  } else if (latest?.sludgeConsistency === 'pasty') {
    difficultyScore += 15;
  }
  if (latest?.sludgeFeedSolidsPct && latest.sludgeFeedSolidsPct < 3.5) {
    difficultyScore += 15;
  }
  if (storagePct >= 80) {
    difficultyScore += 15;
  }
  difficultyScore = Math.min(100, Math.max(0, difficultyScore));

  const scoreLabel =
    difficultyScore > 65
      ? 'Critical Difficulty (Red)'
      : difficultyScore > 40
      ? 'Attention Required (Amber)'
      : 'Normal Handling (Green)';

  const scoreStatus: 'success' | 'warning' | 'danger' =
    difficultyScore > 65 ? 'danger' : difficultyScore > 40 ? 'warning' : 'success';

  // Filtered handling issues
  const filteredIssues = useMemo(() => {
    return handlingIssues.filter(issue => {
      if (stageFilter !== 'all' && issue.processStage !== stageFilter) return false;
      if (statusFilter !== 'all' && issue.status !== statusFilter) return false;
      if (facilityFilter !== 'all' && (issue.facility || 'Unit 4 - Chemical Coagulation') !== facilityFilter) return false;
      if (priorityFilter !== 'all' && issue.priority !== priorityFilter) return false;
      return true;
    });
  }, [handlingIssues, stageFilter, statusFilter, facilityFilter, priorityFilter]);

  // Competitor Reference Metric Counts
  const activeOpenCount = handlingIssues.filter(i => i.status === 'Open').length;
  const inProgressCount = handlingIssues.filter(i => i.status === 'Under Investigation' || i.status === 'Action Scheduled').length;
  const resolvedCount = handlingIssues.filter(i => i.status === 'Resolved').length;
  const criticalEhsCount = handlingIssues.filter(i => i.severity === 'critical' && i.status !== 'Resolved').length;

  // Chart data
  const chartData = [...dewateringRecords].reverse().map(d => ({
    date: d.date.slice(5),
    batchId: d.batchId,
    moisture: d.cakeMoisturePct,
    volumeReduction: calculateVolumeReduction(d.initialSludgeVolumeM3, d.finalSludgeVolumeM3),
    filtrateTss: d.filtrateTssMgL,
    polymerDose: d.polymerDoseKgPerTonne,
    feedSolids: d.sludgeFeedSolidsPct,
  }));

  // Helper for Difficulty Badges
  const renderDifficultyBadge = (difficulty: HandlingDifficultyBadge) => {
    switch (difficulty) {
      case 'normal':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Normal handling
          </span>
        );
      case 'attention':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono bg-amber-50 text-amber-800 border border-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Attention required
          </span>
        );
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono bg-red-50 text-red-800 border border-red-300">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            Critical handling issue
          </span>
        );
    }
  };

  // Columns for Dewatering Operational Runs
  const dewateringColumns: Column<DewateringRecord>[] = [
    {
      key: 'date',
      header: 'Date & Batch',
      render: r => (
        <div>
          <div className="font-semibold text-slate-900 font-mono">{r.date}</div>
          <div className="text-[11px] font-mono text-blue-700 font-semibold">{r.batchId}</div>
          <div className="text-[10px] text-slate-400">{r.facility || 'Unit 4 - Chemical Coagulation'}</div>
        </div>
      ),
    },
    {
      key: 'method',
      header: 'Method',
      render: r => (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-medium text-xs">
          {r.method}
        </span>
      ),
    },
    {
      key: 'feedVolumes',
      header: 'Feed Vol & Solids',
      align: 'right',
      render: r => (
        <div className="text-right">
          <span className="font-mono font-medium text-slate-900">{r.sludgeFeedVolumeM3} m³</span>
          <div className="text-[11px] text-slate-500 font-mono">{r.sludgeFeedSolidsPct}% solids</div>
        </div>
      ),
    },
    {
      key: 'cakeOutput',
      header: 'Cake Mass & Moisture',
      align: 'right',
      render: r => (
        <div className="text-right">
          <span className="font-mono font-bold text-blue-700">{r.dewateredCakeTonnes} t</span>
          <div
            className={clsx(
              'text-[11px] font-mono font-bold',
              r.cakeMoisturePct <= 75 ? 'text-emerald-600' : 'text-amber-600'
            )}
          >
            {r.cakeMoisturePct}% moisture
          </div>
        </div>
      ),
    },
    {
      key: 'volumeReduction',
      header: 'Vol Reduction',
      align: 'right',
      render: r => {
        const red = calculateVolumeReduction(r.initialSludgeVolumeM3, r.finalSludgeVolumeM3);
        return (
          <span
            className={clsx(
              'font-mono font-bold text-xs px-2 py-0.5 rounded-full',
              red >= 75 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            )}
          >
            {red}%
          </span>
        );
      },
    },
    {
      key: 'filtrateTssMgL',
      header: 'Filtrate TSS',
      align: 'right',
      render: r => (
        <span
          className={clsx(
            'font-mono',
            r.filtrateTssMgL > 200 ? 'text-red-600 font-bold' : 'text-slate-700'
          )}
        >
          {r.filtrateTssMgL} mg/L
        </span>
      ),
    },
    {
      key: 'consistency',
      header: 'Consistency & Odour',
      render: r => (
        <div>
          <span
            className={clsx(
              'capitalize font-semibold text-xs',
              r.sludgeConsistency === 'free-flowing'
                ? 'text-emerald-700'
                : r.sludgeConsistency === 'pasty'
                ? 'text-amber-700'
                : 'text-red-700'
            )}
          >
            {r.sludgeConsistency}
          </span>
          <div className="text-[11px] text-slate-500 truncate max-w-[130px]">{r.sludgeOdour}</div>
        </div>
      ),
    },
    {
      key: 'handlingIssueObserved',
      header: 'Handling Issue Observed',
      render: r => (
        <div className="text-xs text-slate-700 max-w-[160px] truncate" title={r.handlingIssueObserved}>
          {r.handlingIssueObserved}
        </div>
      ),
    },
    {
      key: 'handlingDifficulty',
      header: 'Handling Difficulty',
      align: 'center',
      render: r => renderDifficultyBadge(r.handlingDifficulty),
    },
  ];

  // Columns for Handling Issues Register
  const registerColumns: Column<HandlingIssueItem>[] = [
    {
      key: 'date',
      header: 'Date & Batch ID',
      render: r => (
        <div>
          <div className="font-semibold text-slate-900 font-mono">{r.date}</div>
          <button
            type="button"
            onClick={() => setActivePage('storage')}
            className="text-[11px] font-mono text-blue-700 font-bold hover:underline flex items-center gap-1"
            title="View batch in Storage & Disposal"
          >
            <span>{r.batchId}</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </button>
        </div>
      ),
    },
    {
      key: 'processStage',
      header: 'Stage & Source',
      render: r => (
        <div>
          <span className="font-semibold text-slate-900 text-xs block">{r.processStage}</span>
          <span className="text-[11px] text-slate-500">{r.sludgeSource}</span>
        </div>
      ),
    },
    {
      key: 'issueType',
      header: 'Issue Type',
      render: r => (
        <div>
          <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
            <AlertTriangle
              className={clsx(
                'w-3.5 h-3.5 shrink-0',
                r.severity === 'critical' ? 'text-red-600' : 'text-amber-600'
              )}
            />
            {r.issueType}
          </span>
          <div className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">{r.problemDescription}</div>
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      align: 'center',
      render: r => (
        <span
          className={clsx(
            'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono',
            r.priority === 'High'
              ? 'bg-red-100 text-red-800'
              : r.priority === 'Medium'
              ? 'bg-amber-100 text-amber-800'
              : 'bg-blue-100 text-blue-800'
          )}
        >
          {r.priority}
        </span>
      ),
    },
    {
      key: 'possibleCause',
      header: 'Root Cause Diagnosis',
      render: r => <span className="text-slate-700 text-xs line-clamp-2">{r.possibleCause}</span>,
    },
    {
      key: 'recommendedAction',
      header: 'Suggested Action',
      render: r => (
        <span className="text-slate-800 font-medium text-xs bg-slate-50 p-1.5 rounded border border-slate-200 block line-clamp-2">
          {r.recommendedAction}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Resolution Status',
      align: 'center',
      render: r => (
        <select
          value={r.status}
          onChange={e => updateHandlingIssue(r.id, { status: e.target.value as IssueStatus })}
          className={clsx(
            'text-[11px] font-semibold font-mono rounded-lg px-2 py-1 border transition-colors cursor-pointer',
            r.status === 'Resolved'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : r.status === 'Under Investigation'
              ? 'bg-blue-50 text-blue-800 border-blue-300'
              : r.status === 'Action Scheduled'
              ? 'bg-amber-50 text-amber-800 border-amber-300'
              : 'bg-slate-50 text-slate-800 border-slate-300'
          )}
        >
          <option value="Open">Open</option>
          <option value="Under Investigation">Under Investigation</option>
          <option value="Action Scheduled">Action Scheduled</option>
          <option value="Resolved">Resolved</option>
        </select>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Filter className="w-5 h-5 text-blue-600" />
            Sludge Handling Difficulty & Operational Troubleshooting
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Identify, diagnose, and resolve sludge handling difficulties during thickening, dewatering, storage, and transport with explainable engineering root causes.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsReportIssueModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
          >
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Report Handling Issue</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddDewateringModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Log Dewatering Run</span>
          </button>
        </div>
      </div>

      {/* Competitor Reference 4 Key Metric KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* KPI 1: Active Open Issues */}
        <KPICard
          title="Active Open Issues"
          value={activeOpenCount}
          unit="Unresolved"
          icon={AlertTriangle}
          status={activeOpenCount > 0 ? 'warning' : 'success'}
          subtitle="Immediate attention required"
        />

        {/* KPI 2: In-Progress Actions */}
        <KPICard
          title="In-Progress Actions"
          value={inProgressCount}
          unit="Investigating / Scheduled"
          icon={Wrench}
          status="normal"
          subtitle="Engineering protocol deployed"
        />

        {/* KPI 3: Resolved Difficulties */}
        <KPICard
          title="Resolved Difficulties"
          value={resolvedCount}
          unit="Bottlenecks Solved"
          icon={CheckCircle2}
          status="success"
          subtitle="Cycle efficiency restored"
        />

        {/* KPI 4: Critical EHS Safety Alerts */}
        <KPICard
          title="Critical EHS Alerts"
          value={criticalEhsCount}
          unit="High Priority"
          icon={ShieldAlert}
          status={criticalEhsCount > 0 ? 'danger' : 'success'}
          subtitle="Centrate / spillage / gas risk"
        />
      </div>

      {/* Secondary Operational KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-100/60 p-3 rounded-xl border border-slate-200">
        <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs">
          <span className="text-[10px] text-slate-400 font-semibold uppercase block">Cake Moisture</span>
          <span className="font-mono font-bold text-slate-900 text-lg">
            {cakeMoisture !== null ? `${cakeMoisture}%` : '—'}
          </span>
          <span className="text-[10px] text-slate-500 block">Target: ≤ 75%</span>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs">
          <span className="text-[10px] text-slate-400 font-semibold uppercase block">Volume Reduction</span>
          <span className="font-mono font-bold text-emerald-700 text-lg">
            {volumeReductionPct !== null ? `${volumeReductionPct}%` : '—'}
          </span>
          <span className="text-[10px] text-slate-500 block">1 - (V_fin / V_init)</span>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs">
          <span className="text-[10px] text-slate-400 font-semibold uppercase block">Filtrate TSS Clarity</span>
          <span className="font-mono font-bold text-slate-900 text-lg">
            {filtrateTss !== null ? `${filtrateTss} mg/L` : '—'}
          </span>
          <span className="text-[10px] text-slate-500 block">Benchmark &lt; 200 mg/L</span>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs">
          <span className="text-[10px] text-slate-400 font-semibold uppercase block">Handling Difficulty Score</span>
          <span className="font-mono font-bold text-amber-700 text-lg">
            {difficultyScore} / 100
          </span>
          <span className="text-[10px] text-slate-500 block">{scoreLabel}</span>
        </div>
      </div>

      {/* Filter Toolbar (Process Stage, Status, Facility, Priority) */}
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mr-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Filter By:</span>
          </div>

          {/* Process Stage Filter */}
          <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-xs">
            <span className="text-slate-400 font-medium text-[11px]">Stage:</span>
            <select
              value={stageFilter}
              onChange={e => setStageFilter(e.target.value)}
              className="bg-transparent border-0 text-slate-700 text-xs font-semibold focus:outline-hidden"
            >
              <option value="all">All Process Stages</option>
              <option value="Thickening">Thickening</option>
              <option value="Dewatering">Dewatering</option>
              <option value="Storage">Storage</option>
              <option value="Transport">Transport</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-xs">
            <span className="text-slate-400 font-medium text-[11px]">Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-transparent border-0 text-slate-700 text-xs font-semibold focus:outline-hidden"
            >
              <option value="all">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Under Investigation">Under Investigation</option>
              <option value="Action Scheduled">Action Scheduled</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          {/* Facility Filter */}
          <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-xs">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={facilityFilter}
              onChange={e => setFacilityFilter(e.target.value)}
              className="bg-transparent border-0 text-slate-700 text-xs font-semibold focus:outline-hidden"
            >
              <option value="all">All Facilities</option>
              <option value="Unit 4 - Chemical Coagulation">Unit 4 - Chemical Coagulation</option>
              <option value="Unit 2 - Primary Neutralization">Unit 2 - Primary Neutralization</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-xs">
            <span className="text-slate-400 font-medium text-[11px]">Priority:</span>
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              className="bg-transparent border-0 text-slate-700 text-xs font-semibold focus:outline-hidden"
            >
              <option value="all">All Priorities</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-mono">
          Showing <span className="font-semibold text-slate-800">{filteredIssues.length}</span> issues
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('troubleshooting')}
          className={clsx(
            'px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2',
            activeTab === 'troubleshooting'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          )}
        >
          <Wrench className="w-4 h-4" />
          <span>Individual Troubleshooting Cards ({filteredIssues.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('runs')}
          className={clsx(
            'px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2',
            activeTab === 'runs'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          )}
        >
          <Filter className="w-4 h-4" />
          <span>Dewatering Run Logs ({dewateringRecords.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('register')}
          className={clsx(
            'px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2',
            activeTab === 'register'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          )}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Handling Issues Master Register (Table View)</span>
        </button>
      </div>

      {/* TAB 1: Individual Troubleshooting Cards for the 8 Handling Problems */}
      {activeTab === 'troubleshooting' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>Engineering Root-Cause Diagnostics across 8 benchmark handling difficulties:</span>
            <span className="font-mono">Explainable Physical-Chemical Assessment</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredIssues.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400 text-xs rounded-xl border border-dashed border-slate-300">
                No handling issues match the current filter criteria.
              </div>
            ) : (
              filteredIssues.map(issue => {
                const isCritical = issue.severity === 'critical';
                const isResolved = issue.status === 'Resolved';

                return (
                  <div
                    key={issue.id}
                    className={clsx(
                      'rounded-xl border p-5 shadow-2xs transition-all flex flex-col justify-between gap-4 text-xs',
                      isResolved
                        ? 'border-slate-200 bg-slate-50/60 opacity-80'
                        : isCritical
                        ? 'border-red-300 bg-white ring-1 ring-red-100'
                        : 'border-amber-300 bg-white ring-1 ring-amber-100'
                    )}
                  >
                    <div>
                      {/* Card Header: Stage, Priority, Severity & Status */}
                      <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={clsx(
                              'px-2 py-0.5 rounded-md text-[10px] font-bold uppercase font-mono',
                              issue.processStage === 'Dewatering'
                                ? 'bg-blue-100 text-blue-800'
                                : issue.processStage === 'Thickening'
                                ? 'bg-purple-100 text-purple-800'
                                : issue.processStage === 'Storage'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            )}
                          >
                            {issue.processStage}
                          </span>

                          <span
                            className={clsx(
                              'px-2 py-0.5 rounded-md text-[10px] font-bold font-mono',
                              isCritical ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                            )}
                          >
                            {issue.severity.toUpperCase()}
                          </span>

                          <span
                            className={clsx(
                              'px-2 py-0.5 rounded-md text-[10px] font-mono',
                              issue.priority === 'High'
                                ? 'bg-red-50 text-red-700 font-bold border border-red-200'
                                : 'bg-slate-100 text-slate-700'
                            )}
                          >
                            {issue.priority} Priority
                          </span>
                        </div>

                        {/* Interactive Status Selector */}
                        <select
                          value={issue.status}
                          onChange={e => updateHandlingIssue(issue.id, { status: e.target.value as IssueStatus })}
                          className={clsx(
                            'text-[11px] font-bold font-mono rounded-lg px-2.5 py-1 border cursor-pointer',
                            issue.status === 'Resolved'
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              : issue.status === 'Under Investigation'
                              ? 'bg-blue-100 text-blue-900 border-blue-300'
                              : issue.status === 'Action Scheduled'
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-slate-100 text-slate-900 border-slate-300'
                          )}
                        >
                          <option value="Open">Status: Open</option>
                          <option value="Under Investigation">Status: Under Investigation</option>
                          <option value="Action Scheduled">Status: Action Scheduled</option>
                          <option value="Resolved">Status: Resolved ✓</option>
                        </select>
                      </div>

                      {/* Problem Title & Date/Batch Reference */}
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mt-1">
                        <AlertTriangle className={clsx('w-4 h-4 shrink-0', isCritical ? 'text-red-600' : 'text-amber-600')} />
                        {issue.issueType}
                      </h3>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono mt-1 mb-2">
                        <span>Reported: {issue.date}</span>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={() => setActivePage('storage')}
                          className="text-blue-600 font-semibold hover:underline flex items-center gap-1"
                          title="Trace Batch in Storage & Disposal"
                        >
                          <span>Batch: {issue.batchId}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </button>
                        <span>•</span>
                        <span>Unit: {issue.facility || 'Unit 4'}</span>
                      </div>

                      {/* Problem Description */}
                      <p className="text-slate-800 text-xs leading-relaxed mb-3">
                        {issue.problemDescription}
                      </p>

                      {/* Operational & Environmental Impact Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">Operational Impact</span>
                          <span className="text-slate-700 text-[11px] leading-tight block mt-0.5">
                            {issue.operationalImpact}
                          </span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">Environmental / EHS Impact</span>
                          <span className="text-slate-700 text-[11px] leading-tight block mt-0.5">
                            {issue.environmentalImpact}
                          </span>
                        </div>
                      </div>

                      {/* Root Cause Diagnosis */}
                      <div className="bg-amber-50/40 p-2.5 rounded-lg border border-amber-200/80 mb-2">
                        <span className="text-[10px] uppercase font-bold text-amber-900 block">
                          Possible Root Cause Diagnosis
                        </span>
                        <span className="text-slate-800 text-xs leading-relaxed block mt-0.5">
                          {issue.possibleCause}
                        </span>
                      </div>

                      {/* Suggested Corrective Actions */}
                      <div className="bg-blue-50/40 p-2.5 rounded-lg border border-blue-200/80">
                        <span className="text-[10px] uppercase font-bold text-blue-900 block">
                          Suggested Corrective Action (Engineering Protocol)
                        </span>
                        <span className="text-slate-800 text-xs leading-relaxed block mt-0.5 font-medium">
                          {issue.recommendedAction}
                        </span>
                      </div>
                    </div>

                    {/* Card Footer: Quick Status Switcher */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                      <span className="text-slate-400 font-mono">ID: {issue.id}</span>
                      {issue.status !== 'Resolved' ? (
                        <button
                          type="button"
                          onClick={() => updateHandlingIssue(issue.id, { status: 'Resolved' })}
                          className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 hover:underline"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Mark Mitigated & Resolved</span>
                        </button>
                      ) : (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Issue Resolved & Verified</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Dewatering Run Logs with Analytics Charts */}
      {activeTab === 'runs' && (
        <div className="space-y-5">
          {/* Charts: Dewatering Performance & Handling */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ChartCard
              title="Volume Reduction & Cake Moisture Trend"
              subtitle="Solid-liquid mechanical compression across recent runs"
              badge="Mechanical Performance"
              isEmpty={dewateringRecords.length === 0}
              emptyPrompt="Log dewatering runs to visualize volume reduction efficiency"
              onEmptyAction={() => setIsAddDewateringModalOpen(true)}
            >
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="volumeReduction" fill="#10b981" radius={[4, 4, 0, 0]} name="Volume Reduction %" />
                  <Bar dataKey="moisture" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Cake Moisture %" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title="Filtrate TSS Clarity & Feed Solids"
              subtitle="Monitors cloth blinding, screen tears, and primary thickening efficiency"
              badge="Thickening & Clarity"
              isEmpty={dewateringRecords.length === 0}
              emptyPrompt="Log press runs to plot filtrate TSS and solids"
              onEmptyAction={() => setIsAddDewateringModalOpen(true)}
            >
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="tssGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit=" mg/L" />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area
                    type="monotone"
                    dataKey="filtrateTss"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#tssGradient)"
                    name="Filtrate TSS (mg/L)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <DataTable
            title="Dewatering Operational Run Logs with Handling Difficulty Badges"
            subtitle="Batch-wise records of equipment cycle, feed solids, cake moisture, consistency, and observed difficulty"
            columns={dewateringColumns}
            data={dewateringRecords}
            searchKey="batchId"
            exportFileName="sludge_handling_and_dewatering_runs.csv"
            emptyMessage="No dewatering operational runs recorded yet."
            actions={
              <button
                type="button"
                onClick={() => setIsAddDewateringModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Run</span>
              </button>
            }
          />
        </div>
      )}

      {/* TAB 3: Handling Issues Master Register Table */}
      {activeTab === 'register' && (
        <DataTable
          title="Sludge Handling Issues Register & Corrective Actions"
          subtitle="Detailed tracking of thickening, dewatering, storage, and transport bottlenecks with possible cause and root-cause actions"
          columns={registerColumns}
          data={filteredIssues}
          searchKey="issueType"
          exportFileName="sludge_handling_issues_register.csv"
          emptyMessage="No handling issues found matching criteria."
          actions={
            <button
              type="button"
              onClick={() => setIsReportIssueModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Report Issue</span>
            </button>
          }
        />
      )}

      {/* Modals */}
      <AddDewateringModal
        isOpen={isAddDewateringModalOpen}
        onClose={() => setIsAddDewateringModalOpen(false)}
        batches={batches}
        onSave={rec => addDewateringRecord(rec)}
      />

      <ReportHandlingIssueModal
        isOpen={isReportIssueModalOpen}
        onClose={() => setIsReportIssueModalOpen(false)}
        batches={batches}
        onSave={issue => addHandlingIssue(issue)}
      />
    </div>
  );
};
