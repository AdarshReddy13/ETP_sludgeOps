import React, { useState } from 'react';
import {
  FlaskConical,
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  X,
  Droplets,
  Activity,
  Layers,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Download,
  Edit3,
  Scale,
  Sparkles,
} from 'lucide-react';
import { SludgeBatch } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { formatNumber } from '../../utils/calculations';
import { GroqAIPanel } from '../common/GroqAIPanel';
import { analyzeLabReport } from '../../services/groqService';
import clsx from 'clsx';

interface ChemicalPhysicalPropertiesModalProps {
  batch: SludgeBatch | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToDewatering?: (batchId: string) => void;
  onUpdateBatch?: (batchId: string, updates: Partial<SludgeBatch>) => void;
}

export const ChemicalPhysicalPropertiesModal: React.FC<ChemicalPhysicalPropertiesModalProps> = ({
  batch,
  isOpen,
  onClose,
  onNavigateToDewatering,
  onUpdateBatch,
}) => {
  if (!isOpen || !batch) return null;

  const [activeTab, setActiveTab] = useState<'physical' | 'chemical' | 'tclp' | 'input'>('physical');

  // Editable fields for custom lab report input
  const [editPH, setEditPH] = useState(batch.pH?.toString() || '5.5');
  const [editMoisture, setEditMoisture] = useState(batch.moisturePct?.toString() || '74.2');
  const [editCOD, setEditCOD] = useState(batch.codMgKg?.toString() || '108000');
  const [editOil, setEditOil] = useState(batch.oilAndGreaseMgKg?.toString() || '950');
  const [editCr, setEditCr] = useState(batch.heavyMetals.chromium?.toString() || '68');
  const [editNi, setEditNi] = useState(batch.heavyMetals.nickel?.toString() || '42');
  const [editPb, setEditPb] = useState(batch.heavyMetals.lead?.toString() || '38');
  const [editCd, setEditCd] = useState(batch.heavyMetals.cadmium?.toString() || '4.5');
  const [editPhenol, setEditPhenol] = useState(batch.phenolMgKg?.toString() || '48');
  const [editSulphide, setEditSulphide] = useState(batch.sulphideMgKg?.toString() || '36');
  const [editConsistency, setEditConsistency] = useState(batch.physicalProperties?.consistency || 'sticky');
  const [editCst, setEditCst] = useState(batch.physicalProperties?.cstSeconds?.toString() || '85');

  const handleSaveCustomProperties = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateBatch) return;

    onUpdateBatch(batch.batchId, {
      pH: parseFloat(editPH) || 5.5,
      moisturePct: parseFloat(editMoisture) || null,
      codMgKg: parseFloat(editCOD) || null,
      oilAndGreaseMgKg: parseFloat(editOil) || null,
      heavyMetals: {
        ...batch.heavyMetals,
        chromium: parseFloat(editCr) || null,
        nickel: parseFloat(editNi) || null,
        lead: parseFloat(editPb) || null,
        cadmium: parseFloat(editCd) || null,
      },
      phenolMgKg: parseFloat(editPhenol) || null,
      sulphideMgKg: parseFloat(editSulphide) || null,
      physicalProperties: {
        totalSolidsPct: editMoisture ? 100 - parseFloat(editMoisture) : 25.8,
        volatileSolidsPct: 64.0,
        bulkDensityKgM3: 1080,
        specificGravity: 1.08,
        consistency: editConsistency as any,
        cstSeconds: parseFloat(editCst) || 85,
        specificResistance: '2.4 x 10^12 m/kg',
        odourObservation: 'Pungent Organic Chemical / Slight Septic',
        appearance: 'Dark brown colloidal chemical sludge flocs',
      },
      chemicalProperties: {
        sludgePH: parseFloat(editPH) || 5.5,
        codMgKg: parseFloat(editCOD) || 108000,
        bodMgKg: 32000,
        oilAndGreaseMgKg: parseFloat(editOil) || 950,
        totalPhenolsMgKg: parseFloat(editPhenol) || 48,
        reactiveSulphidesMgKg: parseFloat(editSulphide) || 36,
        totalCyanideMgKg: 4.5,
        totalChloridesMgKg: 2400,
        tclpLeachateLeadMgL: 1.2,
        tclpLeachateCadmiumMgL: 0.35,
        tclpLeachateChromiumMgL: 1.8,
        calorificValueKcalKg: 2850,
        corrosivityStatus: 'Non-Corrosive (pH 2 - 12.5)',
        ignitabilityStatus: 'Non-Flammable (Flash point > 60°C)',
        reactivityStatus: 'Stable',
      },
    });

    setActiveTab('physical');
  };

  const phys = batch.physicalProperties || {
    totalSolidsPct: batch.moisturePct ? 100 - batch.moisturePct : 25.8,
    volatileSolidsPct: 62.5,
    bulkDensityKgM3: 1080,
    specificGravity: 1.08,
    consistency: (batch.oilAndGreaseMgKg && batch.oilAndGreaseMgKg > 1000 ? 'sticky' : 'pasty') as any,
    cstSeconds: 85,
    specificResistance: '2.4 x 10^12 m/kg',
    odourObservation: 'Earthy / Mild Chemical',
    appearance: 'Dark brown colloidal coagulated flocs',
  };

  const chem = batch.chemicalProperties || {
    sludgePH: batch.pH || 5.5,
    codMgKg: batch.codMgKg || 108000,
    bodMgKg: 32000,
    oilAndGreaseMgKg: batch.oilAndGreaseMgKg || 950,
    totalPhenolsMgKg: batch.phenolMgKg || 45,
    reactiveSulphidesMgKg: batch.sulphideMgKg || 38,
    totalCyanideMgKg: 4.2,
    totalChloridesMgKg: 2200,
    tclpLeachateLeadMgL: 1.2,
    tclpLeachateCadmiumMgL: 0.4,
    tclpLeachateChromiumMgL: 2.1,
    calorificValueKcalKg: 2800,
    corrosivityStatus: 'Non-Corrosive (pH 2 - 12.5)' as const,
    ignitabilityStatus: 'Non-Flammable (Flash point > 60°C)' as const,
    reactivityStatus: 'Stable' as const,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase">
                  {batch.nablAccreditation || 'NABL Accredited Test Report'}
                </span>
                <span className="text-xs font-mono font-bold text-blue-700">
                  {batch.labAnalysisId || 'LAB-ANALYSIS-PENDING'}
                </span>
                <StatusBadge status={batch.classificationStatus} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                Chemical & Physical Properties Analysis: {batch.batchId}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-2 border-b border-slate-200 bg-white">
          <button
            type="button"
            onClick={() => setActiveTab('physical')}
            className={clsx(
              'px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all',
              activeTab === 'physical'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            )}
          >
            <Droplets className="w-4 h-4" />
            <span>Physical Properties & Rheology</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('chemical')}
            className={clsx(
              'px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all',
              activeTab === 'chemical'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            )}
          >
            <Activity className="w-4 h-4" />
            <span>Chemical & Heavy Metals Profile</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tclp')}
            className={clsx(
              'px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all',
              activeTab === 'tclp'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            )}
          >
            <Scale className="w-4 h-4" />
            <span>TCLP Leachability & Statutory Limits</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('input')}
            className={clsx(
              'px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all',
              activeTab === 'input'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            )}
          >
            <Edit3 className="w-4 h-4" />
            <span>Input / Modify Lab Values</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: Physical Properties */}
          {activeTab === 'physical' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Physical Dewaterability Diagnostic: </span>
                  Physical parameters dictate floc compressibility, cloth release, and mechanical pressure transmission during filter pressing or centrifuge dewatering.
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Moisture Content
                  </span>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                    {batch.moisturePct !== null ? `${batch.moisturePct}%` : '— Awaiting Test'}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Target Cake: &lt; 65%</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Total Dry Solids (TS)
                  </span>
                  <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
                    {phys.totalSolidsPct !== null ? `${phys.totalSolidsPct}%` : '—'}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">100 - Moisture %</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Volatile Solids (VSS)
                  </span>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                    {phys.volatileSolidsPct !== null ? `${phys.volatileSolidsPct}%` : '—'}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Organic Fraction (% of TS)</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Sludge Consistency
                  </span>
                  <div className="text-base font-bold text-amber-700 mt-1 capitalize">
                    {phys.consistency || 'Sticky'}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Rheology Classification</span>
                </div>
              </div>

              {/* Advanced Rheology & Filtration */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-blue-600" />
                  Filtration Resistance & Physical Characterisation
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 block text-[11px] font-semibold">Capillary Suction Time (CST)</span>
                    <span className="font-mono font-bold text-sm text-slate-900">
                      {phys.cstSeconds ? `${phys.cstSeconds} seconds` : '—'}
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {phys.cstSeconds && phys.cstSeconds > 60
                        ? 'High bound water resistance (requires cationic polymer)'
                        : 'Rapid gravity water release'}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 block text-[11px] font-semibold">Bulk Density & Sp. Gravity</span>
                    <span className="font-mono font-bold text-sm text-slate-900">
                      {phys.bulkDensityKgM3} kg/m³ (SG: {phys.specificGravity})
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1">Typical coagulated chemical sludge density</p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 block text-[11px] font-semibold">Specific Resistance (SRF)</span>
                    <span className="font-mono font-bold text-sm text-slate-900">
                      {phys.specificResistance || '2.4 x 10^12 m/kg'}
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1">Pressure filtration benchmark</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-slate-700">Odour Observation:</span>{' '}
                    <span className="text-slate-900">{phys.odourObservation}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-slate-700">Visual Appearance:</span>{' '}
                    <span className="text-slate-900">{phys.appearance}</span>
                  </div>
                </div>
              </div>

              {/* Groq AI Lab Report Analysis */}
              <GroqAIPanel
                buttonLabel="Analyse Lab Report with Groq AI"
                onAnalyze={async () => {
                  const result = await analyzeLabReport({
                    batchId: batch.batchId,
                    pH: batch.pH,
                    moisturePct: batch.moisturePct,
                    codMgKg: batch.codMgKg,
                    oilAndGreaseMgKg: batch.oilAndGreaseMgKg,
                    phenolMgKg: batch.phenolMgKg,
                    sulphideMgKg: batch.sulphideMgKg,
                    heavyMetals: batch.heavyMetals,
                    consistency: batch.physicalProperties?.consistency,
                    cstSeconds: batch.physicalProperties?.cstSeconds,
                    specificGravity: batch.physicalProperties?.specificGravity,
                    tclpResults: {
                      Lead: batch.chemicalProperties?.tclpLeachateLeadMgL ?? null,
                      Cadmium: batch.chemicalProperties?.tclpLeachateCadmiumMgL ?? null,
                      Chromium: batch.chemicalProperties?.tclpLeachateChromiumMgL ?? null,
                    },
                  });
                  return result.analysis;
                }}
              />
            </div>
          )}

          {/* TAB 2: Chemical & Heavy Metals Profile */}
          {activeTab === 'chemical' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Sludge pH
                  </span>
                  <div className={clsx('text-xl font-bold font-mono mt-1', batch.pH <= 5.5 ? 'text-amber-600' : 'text-slate-900')}>
                    {batch.pH}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Baseline Acidic (Needs Lime)</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Sludge COD
                  </span>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                    {batch.codMgKg !== null ? formatNumber(batch.codMgKg, 0) : '—'} mg/kg
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Confirmed &gt;100k Baseline</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Oil & Grease
                  </span>
                  <div className={clsx('text-xl font-bold font-mono mt-1', (batch.oilAndGreaseMgKg || 0) > 1000 ? 'text-red-600' : 'text-slate-900')}>
                    {batch.oilAndGreaseMgKg !== null ? `${batch.oilAndGreaseMgKg} mg/kg` : '—'}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">&gt;1,000 causes cloth blinding</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Calorific Value
                  </span>
                  <div className="text-xl font-bold font-mono text-indigo-700 mt-1">
                    {chem.calorificValueKcalKg || '2,800'} kcal/kg
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">CPCB AFR criteria &gt;2,500</span>
                </div>
              </div>

              {/* Schedule II Heavy Metals Table */}
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Schedule II Heavy Metals Concentration (Dry Weight)
                  </h4>
                  <span className="text-[11px] font-mono text-slate-500">
                    MoEFCC Hazardous Waste Rules 2016 Class A
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">Parameter</th>
                        <th className="py-2.5 px-4 font-mono">Symbol</th>
                        <th className="py-2.5 px-4 font-mono">Observed Value</th>
                        <th className="py-2.5 px-4 font-mono">Statutory Limit</th>
                        <th className="py-2.5 px-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        { name: 'Total Chromium', symbol: 'Cr', val: batch.heavyMetals.chromium, limit: 50 },
                        { name: 'Nickel', symbol: 'Ni', val: batch.heavyMetals.nickel, limit: 50 },
                        { name: 'Copper', symbol: 'Cu', val: batch.heavyMetals.copper, limit: 5000 },
                        { name: 'Zinc', symbol: 'Zn', val: batch.heavyMetals.zinc, limit: 20000 },
                        { name: 'Lead', symbol: 'Pb', val: batch.heavyMetals.lead, limit: 50 },
                        { name: 'Cadmium', symbol: 'Cd', val: batch.heavyMetals.cadmium, limit: 5 },
                      ].map(m => {
                        const isExceeded = m.val !== null && m.val > m.limit;
                        return (
                          <tr key={m.symbol} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-2.5 px-4 font-semibold text-slate-800">{m.name}</td>
                            <td className="py-2.5 px-4 font-mono text-slate-500">{m.symbol}</td>
                            <td className="py-2.5 px-4 font-mono font-bold">
                              {m.val !== null ? (
                                <span className={isExceeded ? 'text-red-600' : 'text-slate-800'}>
                                  {m.val} mg/kg
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">Not tested</span>
                              )}
                            </td>
                            <td className="py-2.5 px-4 font-mono text-slate-500">≤ {m.limit} mg/kg</td>
                            <td className="py-2.5 px-4 text-center">
                              {m.val === null ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-500">
                                  Pending
                                </span>
                              ) : isExceeded ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-100 text-red-800">
                                  Exceeds Class A Limit
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                                  Within Limits
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Phenols & Sulphides */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Total Phenolic Compounds
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-mono font-bold text-base text-slate-900">
                      {batch.phenolMgKg !== null ? `${batch.phenolMgKg} mg/kg` : '—'}
                    </span>
                    <span className="text-slate-500 font-mono text-[11px]">(Limit: ≤ 50 mg/kg)</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Reactive Sulphides
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-mono font-bold text-base text-slate-900">
                      {batch.sulphideMgKg !== null ? `${batch.sulphideMgKg} mg/kg` : '—'}
                    </span>
                    <span className="text-slate-500 font-mono text-[11px]">(Limit: ≤ 50 mg/kg)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TCLP Leachability & Statutory Limits */}
          {activeTab === 'tclp' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Toxicity Characteristic Leaching Procedure (TCLP) Result
                  </h4>
                  <span
                    className={clsx(
                      'px-3 py-1 rounded-full text-xs font-bold font-mono',
                      batch.tclpResult === 'Passed (Non-toxic leach)'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : batch.tclpResult === 'Failed (Hazardous Leachate)'
                        ? 'bg-red-100 text-red-800 border border-red-300'
                        : 'bg-slate-100 text-slate-600 border border-slate-300'
                    )}
                  >
                    {batch.tclpResult}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  TCLP simulates leachate release under acidic municipal landfill conditions (EPA Method 1311). A failure mandates secured hazardous landfill containment (SLF) at an authorized TSDF or encapsulation prior to disposal.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-400 text-[11px] font-semibold block">TCLP Lead (Pb)</span>
                    <span className="font-mono font-bold text-sm text-slate-800">
                      {chem.tclpLeachateLeadMgL ? `${chem.tclpLeachateLeadMgL} mg/L` : '1.2 mg/L'}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Statutory Limit: 5.0 mg/L</span>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-400 text-[11px] font-semibold block">TCLP Cadmium (Cd)</span>
                    <span className="font-mono font-bold text-sm text-slate-800">
                      {chem.tclpLeachateCadmiumMgL ? `${chem.tclpLeachateCadmiumMgL} mg/L` : '0.4 mg/L'}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Statutory Limit: 1.0 mg/L</span>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-400 text-[11px] font-semibold block">TCLP Chromium (Cr)</span>
                    <span className="font-mono font-bold text-sm text-slate-800">
                      {chem.tclpLeachateChromiumMgL ? `${chem.tclpLeachateChromiumMgL} mg/L` : '2.1 mg/L'}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Statutory Limit: 5.0 mg/L</span>
                  </div>
                </div>
              </div>

              {/* Hazard Attributes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 font-semibold block text-[11px]">Corrosivity</span>
                  <span className="font-bold text-slate-900 mt-1 block">{chem.corrosivityStatus || 'Non-Corrosive'}</span>
                  <span className="text-[10px] text-slate-500">pH 5.5 is between 2.0 and 12.5</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 font-semibold block text-[11px]">Ignitability</span>
                  <span className="font-bold text-slate-900 mt-1 block">{chem.ignitabilityStatus || 'Non-Flammable'}</span>
                  <span className="text-[10px] text-slate-500">Flash point &gt; 60°C</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 font-semibold block text-[11px]">Reactivity</span>
                  <span className="font-bold text-slate-900 mt-1 block">{chem.reactivityStatus || 'Stable'}</span>
                  <span className="text-[10px] text-slate-500">Non-water reactive</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Input / Modify Lab Values */}
          {activeTab === 'input' && (
            <form onSubmit={handleSaveCustomProperties} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                <span className="font-bold">Enter / Modify Lab Report Parameters: </span>
                Update values directly from your laboratory analysis certificate to re-evaluate properties and compute the simplest dewatering solution.
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sludge pH</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editPH}
                    onChange={e => setEditPH(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Moisture Content (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editMoisture}
                    onChange={e => setEditMoisture(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">COD (mg/kg dry)</label>
                  <input
                    type="number"
                    value={editCOD}
                    onChange={e => setEditCOD(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Oil & Grease (mg/kg)</label>
                  <input
                    type="number"
                    value={editOil}
                    onChange={e => setEditOil(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Total Chromium (Cr)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editCr}
                    onChange={e => setEditCr(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nickel (Ni)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editNi}
                    onChange={e => setEditNi(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lead (Pb)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editPb}
                    onChange={e => setEditPb(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cadmium (Cd)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editCd}
                    onChange={e => setEditCd(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phenols (mg/kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editPhenol}
                    onChange={e => setEditPhenol(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sulphides (mg/kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editSulphide}
                    onChange={e => setEditSulphide(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Consistency</label>
                  <select
                    value={editConsistency}
                    onChange={e => setEditConsistency(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white"
                  >
                    <option value="free-flowing">Free-flowing</option>
                    <option value="sticky">Sticky</option>
                    <option value="pasty">Pasty</option>
                    <option value="oily">Oily</option>
                    <option value="gelatinous">Gelatinous</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">CST (seconds)</label>
                  <input
                    type="number"
                    value={editCst}
                    onChange={e => setEditCst(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Save & Apply Lab Report Values
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
          <div className="text-xs text-slate-500 font-mono">
            NABL Laboratory Certificate ID: {batch.labAnalysisId || 'TC-5481'}
          </div>

          <div className="flex items-center gap-2">
            {onNavigateToDewatering && (
              <button
                type="button"
                onClick={() => {
                  onNavigateToDewatering(batch.batchId);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                <span>Generate Simplest Dewatering Solution</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
