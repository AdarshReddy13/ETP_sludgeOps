import React, { useState, useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Plus,
  Factory,
  Layers,
  Activity,
  Calculator,
  AlertTriangle,
  Building,
  Calendar,
  Filter,
  Trash2,
  TrendingUp,
  Droplet,
  ShieldAlert,
  Search,
} from 'lucide-react';
import { useETP } from '../../context/ETPContext';
import { DataTable, Column } from '../common/DataTable';
import { ChartCard } from '../common/ChartCard';
import { KPICard } from '../common/KPICard';
import { FormField } from '../common/FormField';
import {
  calculateCodLoad,
  calculateCodRemoved,
  calculateSludgeFactor,
  calculateDrySludgeMass,
  formatNumber,
} from '../../utils/calculations';
import {
  ShiftType,
  SludgeSource,
  CoagulantType,
  FlocculantType,
  DailyGenerationRecord,
} from '../../types';
import clsx from 'clsx';

export const SludgeGenerationView: React.FC = () => {
  const { dailyRecords, addDailyRecord, deleteDailyRecord, alerts, setIsAddEntryModalOpen } = useETP();

  // Filter States
  const [selectedFacility, setSelectedFacility] = useState<string>('all');
  const [selectedShift, setSelectedShift] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [showInlineForm, setShowInlineForm] = useState(false);

  // Quick Inline Entry State
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [shift, setShift] = useState<ShiftType>('Shift A (06:00 - 14:00)');
  const [facility, setFacility] = useState<string>('Unit 4 - Chemical Coagulation');
  const [wastewaterTreated, setWastewaterTreated] = useState<string>('210');
  const [influentCOD, setInfluentCOD] = useState<string>('108000');
  const [effluentCOD, setEffluentCOD] = useState<string>('15000');
  const [influentPH, setInfluentPH] = useState<string>('5.5');
  const [treatedWaterPH, setTreatedWaterPH] = useState<string>('7.2');
  const [coagulantType, setCoagulantType] = useState<CoagulantType>('Polyaluminium Chloride (PAC)');
  const [coagulantDose, setCoagulantDose] = useState<string>('460');
  const [flocculantType, setFlocculantType] = useState<FlocculantType>('Anionic Polyacrylamide (PAM)');
  const [flocculantDose, setFlocculantDose] = useState<string>('3.5');
  const [sludgeSource, setSludgeSource] = useState<SludgeSource>('Chemical Coagulation Basin');
  const [wetSludgeGenerated, setWetSludgeGenerated] = useState<string>('2300');
  const [sludgeMoisture, setSludgeMoisture] = useState<string>('93.0');

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Filtered records
  const filteredRecords = useMemo(() => {
    return dailyRecords.filter(r => {
      if (selectedFacility !== 'all' && (r.facility || 'Unit 4 - Chemical Coagulation') !== selectedFacility) return false;
      if (selectedShift !== 'all' && r.shift !== selectedShift) return false;
      if (selectedSource !== 'all' && r.sludgeSource !== selectedSource) return false;
      return true;
    });
  }, [dailyRecords, selectedFacility, selectedShift, selectedSource]);

  // Totalized Metrics over filtered records (strictly respecting nulls)
  const validFlowRecords = filteredRecords.filter(r => r.wastewaterTreated !== null && r.wastewaterTreated > 0);
  const totalWastewaterTreated = validFlowRecords.length > 0
    ? validFlowRecords.reduce((sum, r) => sum + (r.wastewaterTreated || 0), 0)
    : null;

  const validSludgeRecords = filteredRecords.filter(r => r.wetSludgeGenerated !== null && r.wetSludgeGenerated > 0);
  const totalWetSludgeKg = validSludgeRecords.length > 0
    ? validSludgeRecords.reduce((sum, r) => sum + (r.wetSludgeGenerated || 0), 0)
    : null;
  const totalWetSludgeTonnes = totalWetSludgeKg !== null ? Number((totalWetSludgeKg / 1000).toFixed(2)) : null;

  const validDryRecords = filteredRecords.filter(
    r => r.wetSludgeGenerated !== null && r.sludgeMoisture !== null
  );
  const totalNetDrySolidsKg = validDryRecords.length > 0
    ? validDryRecords.reduce((sum, r) => {
        const dry = calculateDrySludgeMass(r.wetSludgeGenerated, r.sludgeMoisture);
        return sum + (dry || 0);
      }, 0)
    : null;
  const totalNetDrySolidsTonnes = totalNetDrySolidsKg !== null ? Number((totalNetDrySolidsKg / 1000).toFixed(2)) : null;

  // Average sludge generation rate: total wet sludge kg / total flow m3
  const avgSludgeGenRate = totalWetSludgeKg !== null && totalWastewaterTreated !== null && totalWastewaterTreated > 0
    ? Number((totalWetSludgeKg / totalWastewaterTreated).toFixed(2))
    : null;

  // Anomaly Detection: inspect filtered records for statistical or regulatory anomalies
  const detectedAnomalies = useMemo(() => {
    const anomalies: { date: string; shift: string; title: string; description: string; type: 'warning' | 'danger' }[] = [];

    filteredRecords.forEach(r => {
      // 1. Sludge factor spike
      if (r.wetSludgeGenerated && r.wastewaterTreated) {
        const factor = calculateSludgeFactor(r.wetSludgeGenerated, r.wastewaterTreated);
        if (factor && factor > 11.5) {
          anomalies.push({
            date: r.date,
            shift: r.shift,
            title: `Sludge Factor Surge (${factor} kg/m³)`,
            description: `Sludge production elevated by +${Math.round(((factor - 10.5) / 10.5) * 100)}% above baseline. Possible chemical over-precipitation or excessive underflow pumping.`,
            type: 'warning',
          });
        }
      }

      // 2. Low COD removal
      if (r.influentCOD && r.effluentCOD && r.wastewaterTreated) {
        const { pctRemoved } = calculateCodRemoved(r.influentCOD, r.effluentCOD, r.wastewaterTreated);
        if (pctRemoved !== null && pctRemoved < 87.0) {
          anomalies.push({
            date: r.date,
            shift: r.shift,
            title: `Suboptimal COD Removal (${pctRemoved}%)`,
            description: `Removal efficiency fell below 87.0% statutory benchmark. Clarifier overflow organic carryover observed.`,
            type: 'danger',
          });
        }
      }

      // 3. Acidic feed deviation
      if (r.influentPH <= 5.4) {
        anomalies.push({
          date: r.date,
          shift: r.shift,
          title: `Low pH Acid Shock (${r.influentPH})`,
          description: `Influent pH reached ${r.influentPH}. Requires increased hydrated lime / NaOH buffering before coagulant addition.`,
          type: 'warning',
        });
      }
    });

    return anomalies;
  }, [filteredRecords]);

  // Chart data
  const chartData = [...filteredRecords].reverse().map(r => {
    const { kgRemoved: remKg } = calculateCodRemoved(r.influentCOD, r.effluentCOD, r.wastewaterTreated);
    const sFactor = calculateSludgeFactor(r.wetSludgeGenerated, r.wastewaterTreated);
    return {
      date: r.date.slice(5),
      wastewaterM3: r.wastewaterTreated || 0,
      wetSludgeKg: r.wetSludgeGenerated || 0,
      codRemovedKg: remKg || 0,
      coagulantDose: r.coagulantDose || 0,
      sludgeFactor: sFactor || 0,
      moisturePct: r.sludgeMoisture || 0,
    };
  });

  const handleInlineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    const flowVal = parseFloat(wastewaterTreated);
    if (!flowVal || flowVal <= 0) errors.wastewaterTreated = 'Enter valid flow';
    const infVal = parseFloat(influentCOD);
    if (!infVal || infVal <= 0) errors.influentCOD = 'Enter influent COD';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    addDailyRecord({
      date,
      facility,
      shift,
      wastewaterTreated: flowVal,
      influentCOD: infVal,
      effluentCOD: effluentCOD ? parseFloat(effluentCOD) : null,
      influentPH: parseFloat(influentPH),
      treatedWaterPH: treatedWaterPH ? parseFloat(treatedWaterPH) : null,
      coagulantType,
      coagulantDose: coagulantDose ? parseFloat(coagulantDose) : null,
      flocculantType,
      flocculantDose: flocculantDose ? parseFloat(flocculantDose) : null,
      sludgeSource,
      wetSludgeGenerated: wetSludgeGenerated ? parseFloat(wetSludgeGenerated) : null,
      sludgeMoisture: sludgeMoisture ? parseFloat(sludgeMoisture) : null,
      operator: 'Current Shift Operator',
    });

    setShowInlineForm(false);
  };

  const columns: Column<DailyGenerationRecord>[] = [
    {
      key: 'date',
      header: 'Date & Facility',
      render: r => (
        <div>
          <div className="font-semibold text-slate-900 font-mono">{r.date}</div>
          <div className="text-[11px] text-blue-700 font-medium">{r.facility || 'Unit 4 - Chemical Coagulation'}</div>
          <div className="text-[10px] text-slate-400">{r.shift}</div>
        </div>
      ),
    },
    {
      key: 'sludgeSource',
      header: 'Source Unit',
      render: r => <span className="font-medium text-slate-800 text-xs">{r.sludgeSource}</span>,
    },
    {
      key: 'wastewaterTreated',
      header: 'Flow (m³/d)',
      align: 'right',
      render: r => (
        <span className="font-mono font-medium text-slate-900">
          {r.wastewaterTreated !== null ? formatNumber(r.wastewaterTreated, 0) : '—'}
        </span>
      ),
    },
    {
      key: 'influentCOD',
      header: 'Inf COD (mg/L)',
      align: 'right',
      render: r => (
        <span className="font-mono font-bold text-red-600">
          {formatNumber(r.influentCOD, 0)}
        </span>
      ),
    },
    {
      key: 'effluentCOD',
      header: 'Eff COD (mg/L)',
      align: 'right',
      render: r => (
        <span className="font-mono text-slate-700">
          {r.effluentCOD !== null ? formatNumber(r.effluentCOD, 0) : '—'}
        </span>
      ),
    },
    {
      key: 'pH',
      header: 'pH (Inf / Eff)',
      align: 'center',
      render: r => (
        <span className="font-mono text-xs">
          <span className="text-amber-600 font-bold">{r.influentPH}</span> /{' '}
          <span className="text-emerald-700 font-bold">{r.treatedWaterPH ?? '—'}</span>
        </span>
      ),
    },
    {
      key: 'coagulant',
      header: 'Coagulant & Dose',
      render: r => (
        <div>
          <div className="text-slate-800 font-medium truncate max-w-[150px] text-xs">{r.coagulantType}</div>
          <div className="text-[11px] text-slate-500 font-mono">
            {r.coagulantDose ? `${r.coagulantDose} mg/L` : '—'}
          </div>
        </div>
      ),
    },
    {
      key: 'wetSludgeGenerated',
      header: 'Wet Sludge (kg/d)',
      align: 'right',
      render: r => (
        <span className="font-mono font-bold text-blue-700">
          {r.wetSludgeGenerated !== null ? formatNumber(r.wetSludgeGenerated, 0) : '—'}
        </span>
      ),
    },
    {
      key: 'sludgeMoisture',
      header: 'Moisture (%)',
      align: 'right',
      render: r => (
        <span className="font-mono text-slate-700">
          {r.sludgeMoisture !== null ? `${r.sludgeMoisture}%` : '—'}
        </span>
      ),
    },
    {
      key: 'sludgeFactor',
      header: 'Factor (kg/m³)',
      align: 'right',
      render: r => {
        const factor = calculateSludgeFactor(r.wetSludgeGenerated, r.wastewaterTreated);
        return (
          <span
            className={clsx(
              'font-mono font-bold text-xs',
              factor && factor > 11.5 ? 'text-amber-600' : 'text-slate-900'
            )}
          >
            {factor !== null ? `${factor}` : '—'}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      render: r => (
        <button
          type="button"
          onClick={() => deleteDailyRecord(r.id)}
          className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors"
          title="Delete log entry"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Factory className="w-5 h-5 text-blue-600" />
            Wastewater & Sludge Generation Tracker
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Track daily hydraulic flow, chemical coagulant dosage stoichiometry, wet mass accumulation and generation anomaly detection.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setShowInlineForm(!showInlineForm)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
          >
            <span>{showInlineForm ? 'Hide Quick Form' : 'Quick Entry Form'}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsAddEntryModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Daily Entry</span>
          </button>
        </div>
      </div>

      {/* Competitor Reference 4 Key KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Wastewater Treated Total */}
        <KPICard
          title="Wastewater Treated Total"
          value={totalWastewaterTreated !== null ? formatNumber(totalWastewaterTreated, 0) : null}
          unit="m³ Total"
          icon={Droplet}
          status={totalWastewaterTreated ? 'normal' : 'neutral'}
          subtitle={`${validFlowRecords.length} shifts recorded`}
          emptyPrompt="Enter wastewater flow"
          onPromptClick={() => setIsAddEntryModalOpen(true)}
        />

        {/* KPI 2: Total Wet Sludge Produced */}
        <KPICard
          title="Total Wet Sludge Produced"
          value={totalWetSludgeTonnes !== null ? formatNumber(totalWetSludgeTonnes, 1) : null}
          unit="tonnes"
          icon={Layers}
          status={totalWetSludgeTonnes ? 'normal' : 'neutral'}
          subtitle={totalWetSludgeKg ? `${formatNumber(totalWetSludgeKg, 0)} kg total wet mass` : 'Coagulation underflow'}
          emptyPrompt="Record sludge mass"
          onPromptClick={() => setIsAddEntryModalOpen(true)}
        />

        {/* KPI 3: Net Dry Solids */}
        <KPICard
          title="Net Dry Solids"
          value={totalNetDrySolidsTonnes !== null ? formatNumber(totalNetDrySolidsTonnes, 2) : null}
          unit="tonnes solids"
          icon={Calculator}
          status="normal"
          subtitle="Formula: Wet mass × (1 - moisture)"
          emptyPrompt="Add moisture reading"
          onPromptClick={() => setIsAddEntryModalOpen(true)}
        />

        {/* KPI 4: Average Sludge Generation Rate */}
        <KPICard
          title="Avg Sludge Generation Rate"
          value={avgSludgeGenRate !== null ? avgSludgeGenRate : null}
          unit="kg wet / m³"
          icon={TrendingUp}
          status={avgSludgeGenRate && avgSludgeGenRate > 11.5 ? 'warning' : 'success'}
          subtitle="Benchmark: 9.5 - 11.2 kg/m³"
          emptyPrompt="Requires flow & sludge"
          onPromptClick={() => setIsAddEntryModalOpen(true)}
        />
      </div>

      {/* Filter Toolbar (Facility, Shift, Source) */}
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mr-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Filters:</span>
          </div>

          {/* Facility Filter */}
          <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 text-xs">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedFacility}
              onChange={e => setSelectedFacility(e.target.value)}
              className="bg-transparent border-0 text-slate-700 text-xs font-medium focus:outline-hidden"
            >
              <option value="all">All Facilities</option>
              <option value="Unit 4 - Chemical Coagulation">Unit 4 - Chemical Coagulation</option>
              <option value="Unit 2 - Primary Neutralization">Unit 2 - Primary Neutralization</option>
            </select>
          </div>

          {/* Shift Filter */}
          <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedShift}
              onChange={e => setSelectedShift(e.target.value)}
              className="bg-transparent border-0 text-slate-700 text-xs font-medium focus:outline-hidden"
            >
              <option value="all">All Shifts</option>
              <option value="Shift A (06:00 - 14:00)">Shift A (Morning)</option>
              <option value="Shift B (14:00 - 22:00)">Shift B (Evening)</option>
              <option value="Shift C (22:00 - 06:00)">Shift C (Night)</option>
              <option value="General (09:00 - 18:00)">General Shift</option>
            </select>
          </div>

          {/* Sludge Source Filter */}
          <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 text-xs">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedSource}
              onChange={e => setSelectedSource(e.target.value)}
              className="bg-transparent border-0 text-slate-700 text-xs font-medium focus:outline-hidden"
            >
              <option value="all">All Sources</option>
              <option value="Chemical Coagulation Basin">Chemical Coagulation Basin</option>
              <option value="Primary Clarifier">Primary Clarifier</option>
              <option value="Flocculation / Lamella">Flocculation / Lamella</option>
              <option value="DAF (Dissolved Air Flotation)">DAF</option>
              <option value="Equalisation Tank Bottoms">Equalisation Tank Bottoms</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-mono">
          Showing <span className="font-semibold text-slate-800">{filteredRecords.length}</span> of {dailyRecords.length} daily logs
        </div>
      </div>

      {/* Generation Analytics & Anomaly Detection Panel */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              Generation Analytics & Anomaly Detection
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Identifies sudden shifts in sludge yield, chemical overdose and unbuffered raw influent spikes.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
            {detectedAnomalies.length} anomalies flagged
          </span>
        </div>

        {/* Anomaly Callout Badges */}
        {detectedAnomalies.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {detectedAnomalies.slice(0, 3).map((anom, idx) => (
              <div
                key={idx}
                className={clsx(
                  'rounded-xl border p-3 text-xs flex flex-col justify-between gap-2',
                  anom.type === 'danger'
                    ? 'border-red-200 bg-red-50/50 text-red-950'
                    : 'border-amber-200 bg-amber-50/50 text-amber-950'
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className={clsx('w-3.5 h-3.5', anom.type === 'danger' ? 'text-red-600' : 'text-amber-600')} />
                      {anom.title}
                    </span>
                    <span className="font-mono text-[10px] text-slate-500">{anom.date}</span>
                  </div>
                  <p className="text-slate-700 text-[11px] leading-relaxed">{anom.description}</p>
                </div>
                <div className="text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-200/60">
                  Detected in {anom.shift}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Analytics Dual Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
          {/* Chart 1: Daily Wastewater & Sludge Generation Analytics */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="font-bold text-slate-800">Wastewater Flow vs Wet Sludge Mass</span>
              <span className="text-[10px] text-slate-500 font-mono">Flow (m³) | Sludge (kg)</span>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="flow" orientation="left" tick={{ fontSize: 11 }} unit=" m³" />
                <YAxis yAxisId="sludge" orientation="right" tick={{ fontSize: 11 }} unit=" kg" />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="flow" dataKey="wastewaterM3" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Wastewater (m³/d)" />
                <Line yAxisId="sludge" type="monotone" dataKey="wetSludgeKg" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4 }} name="Wet Sludge (kg/d)" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 2: Sludge Generation Factor Trend */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="font-bold text-slate-800">Sludge Factor (kg/m³) vs Coagulant Dose</span>
              <span className="text-[10px] text-slate-500 font-mono">Benchmark: 10.5 kg/m³</span>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="factor" orientation="left" tick={{ fontSize: 11 }} unit=" kg/m³" />
                <YAxis yAxisId="dose" orientation="right" tick={{ fontSize: 11 }} unit=" ppm" />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="dose" dataKey="coagulantDose" fill="#f59e0b" radius={[4, 4, 0, 0]} name="PAC Dose (ppm)" />
                <Line yAxisId="factor" type="monotone" dataKey="sludgeFactor" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} name="Sludge Factor (kg/m³)" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Daily Entry Inline Form (Collapsible) */}
      {showInlineForm && (
        <div className="rounded-xl border border-blue-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-600" />
              Quick Daily Generation Entry Form
            </h3>
            <span className="text-[11px] text-slate-400">Values update analytics live</span>
          </div>

          <form onSubmit={handleInlineSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <FormField
                label="Date"
                name="date"
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
              />
              <FormField
                label="Facility / Unit"
                name="facility"
                type="select"
                value={facility}
                onChange={e => setFacility(e.target.value)}
                options={[
                  { value: 'Unit 4 - Chemical Coagulation', label: 'Unit 4 - Chemical Coagulation' },
                  { value: 'Unit 2 - Primary Neutralization', label: 'Unit 2 - Primary Neutralization' },
                ]}
              />
              <FormField
                label="Shift"
                name="shift"
                type="select"
                value={shift}
                onChange={e => setShift(e.target.value as ShiftType)}
                options={[
                  { value: 'Shift A (06:00 - 14:00)', label: 'Shift A (06:00 - 14:00)' },
                  { value: 'Shift B (14:00 - 22:00)', label: 'Shift B (14:00 - 22:00)' },
                  { value: 'Shift C (22:00 - 06:00)', label: 'Shift C (22:00 - 06:00)' },
                  { value: 'General (09:00 - 18:00)', label: 'General (09:00 - 18:00)' },
                ]}
              />
              <FormField
                label="Wastewater Treated"
                name="wastewaterTreated"
                type="number"
                unit="m³/day"
                value={wastewaterTreated}
                onChange={e => setWastewaterTreated(e.target.value)}
                required
                error={formErrors.wastewaterTreated}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <FormField
                label="Influent COD"
                name="influentCOD"
                type="number"
                unit="mg/L"
                value={influentCOD}
                onChange={e => setInfluentCOD(e.target.value)}
                required
                error={formErrors.influentCOD}
              />
              <FormField
                label="Effluent COD"
                name="effluentCOD"
                type="number"
                unit="mg/L"
                value={effluentCOD}
                onChange={e => setEffluentCOD(e.target.value)}
              />
              <FormField
                label="Influent pH"
                name="influentPH"
                type="number"
                step="0.1"
                value={influentPH}
                onChange={e => setInfluentPH(e.target.value)}
                required
              />
              <FormField
                label="Treated-water pH"
                name="treatedWaterPH"
                type="number"
                step="0.1"
                value={treatedWaterPH}
                onChange={e => setTreatedWaterPH(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <FormField
                label="Coagulant Type"
                name="coagulantType"
                type="select"
                value={coagulantType}
                onChange={e => setCoagulantType(e.target.value as CoagulantType)}
                options={[
                  { value: 'Polyaluminium Chloride (PAC)', label: 'PAC' },
                  { value: 'Ferric Chloride (FeCl3)', label: 'Ferric Chloride' },
                  { value: 'Alum (Al2(SO4)3)', label: 'Alum' },
                  { value: 'Ferrous Sulphate (FeSO4)', label: 'Ferrous Sulphate' },
                ]}
              />
              <FormField
                label="Coagulant Dose"
                name="coagulantDose"
                type="number"
                unit="mg/L"
                value={coagulantDose}
                onChange={e => setCoagulantDose(e.target.value)}
              />
              <FormField
                label="Wet Sludge Generated"
                name="wetSludgeGenerated"
                type="number"
                unit="kg/day"
                value={wetSludgeGenerated}
                onChange={e => setWetSludgeGenerated(e.target.value)}
              />
              <FormField
                label="Sludge Moisture"
                name="sludgeMoisture"
                type="number"
                step="0.1"
                unit="%"
                value={sludgeMoisture}
                onChange={e => setSludgeMoisture(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowInlineForm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
              >
                Commit Daily Entry
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Historical Sludge Generation Records Table */}
      <DataTable
        title="Historical Sludge Generation Records"
        subtitle="Complete log of chemical feed rates, hydraulic loads, pH balances, and sludge generation factors"
        columns={columns}
        data={filteredRecords}
        searchKey="date"
        exportFileName="historical_sludge_generation_records.csv"
        actions={
          <button
            type="button"
            onClick={() => setIsAddEntryModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Entry</span>
          </button>
        }
      />
    </div>
  );
};
