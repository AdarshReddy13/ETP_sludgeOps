import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { FormField } from '../common/FormField';
import {
  DewateringMethod,
  SludgeBatch,
  SludgeConsistency,
  HandlingDifficultyBadge,
} from '../../types';
import { calculateVolumeReduction } from '../../utils/calculations';
import { Calculator, AlertTriangle, ShieldAlert } from 'lucide-react';
import clsx from 'clsx';

interface AddDewateringModalProps {
  isOpen: boolean;
  onClose: () => void;
  batches: SludgeBatch[];
  onSave: (record: {
    date: string;
    batchId: string;
    method: DewateringMethod;
    sludgeFeedVolumeM3: number;
    sludgeFeedSolidsPct: number;
    polymerType: string;
    polymerDoseKgPerTonne: number;
    dewateredCakeTonnes: number;
    cakeMoisturePct: number;
    filtrateTssMgL: number;
    initialSludgeVolumeM3: number;
    finalSludgeVolumeM3: number;
    sludgeOdour: string;
    sludgeConsistency: SludgeConsistency;
    handlingIssueObserved: string;
    handlingDifficulty: HandlingDifficultyBadge;
    operator?: string;
  }) => void;
}

export const AddDewateringModal: React.FC<AddDewateringModalProps> = ({
  isOpen,
  onClose,
  batches,
  onSave,
}) => {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [batchId, setBatchId] = useState<string>(batches[0]?.batchId || 'SLG-2026-B12');
  const [method, setMethod] = useState<DewateringMethod>('Filter Press');
  const [sludgeFeedVolume, setSludgeFeedVolume] = useState<string>('95');
  const [sludgeFeedSolids, setSludgeFeedSolids] = useState<string>('4.5');
  const [polymerType, setPolymerType] = useState<string>('Cationic Polyacrylamide (0.2% Solution)');
  const [polymerDose, setPolymerDose] = useState<string>('3.8');
  const [dewateredCakeTonnes, setDewateredCakeTonnes] = useState<string>('18.4');
  const [cakeMoisturePct, setCakeMoisturePct] = useState<string>('74.0');
  const [filtrateTssMgL, setFiltrateTssMgL] = useState<string>('145');
  const [initialSludgeVolume, setInitialSludgeVolume] = useState<string>('95');
  const [finalSludgeVolume, setFinalSludgeVolume] = useState<string>('17.5');
  
  // New Handling & Consistency Fields
  const [sludgeOdour, setSludgeOdour] = useState<string>('Normal / Earthy');
  const [sludgeConsistency, setSludgeConsistency] = useState<SludgeConsistency>('free-flowing');
  const [handlingIssueObserved, setHandlingIssueObserved] = useState<string>('None (Clean plate release)');
  const [operator, setOperator] = useState<string>('Anil Kumar (Dewatering Lead)');

  const initVol = parseFloat(initialSludgeVolume) || 0;
  const finVol = parseFloat(finalSludgeVolume) || 0;
  const volumeReductionPct = calculateVolumeReduction(initVol, finVol);

  // Compute Handling Difficulty automatically based on fields
  const cMoisture = parseFloat(cakeMoisturePct) || 0;
  const fTSS = parseFloat(filtrateTssMgL) || 0;
  const pDose = parseFloat(polymerDose) || 0;

  let computedDifficulty: HandlingDifficultyBadge = 'normal';
  if (
    cMoisture > 78 ||
    fTSS > 250 ||
    sludgeConsistency === 'oily' ||
    sludgeConsistency === 'sticky' ||
    handlingIssueObserved.includes('Cloth Blind') ||
    handlingIssueObserved.includes('Breakthrough') ||
    handlingIssueObserved.includes('Clogging')
  ) {
    computedDifficulty = 'critical';
  } else if (
    cMoisture > 75 ||
    fTSS > 180 ||
    pDose > 4.5 ||
    sludgeConsistency === 'pasty' ||
    sludgeOdour.includes('Sulphidic') ||
    sludgeOdour.includes('Septic') ||
    handlingIssueObserved.includes('Slight')
  ) {
    computedDifficulty = 'attention';
  }

  const [handlingDifficulty, setHandlingDifficulty] = useState<HandlingDifficultyBadge>(computedDifficulty);

  // Sync computed when fields change
  React.useEffect(() => {
    setHandlingDifficulty(computedDifficulty);
  }, [computedDifficulty]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      date,
      batchId,
      method,
      sludgeFeedVolumeM3: parseFloat(sludgeFeedVolume) || 0,
      sludgeFeedSolidsPct: parseFloat(sludgeFeedSolids) || 0,
      polymerType,
      polymerDoseKgPerTonne: parseFloat(polymerDose) || 0,
      dewateredCakeTonnes: parseFloat(dewateredCakeTonnes) || 0,
      cakeMoisturePct: parseFloat(cakeMoisturePct) || 0,
      filtrateTssMgL: parseFloat(filtrateTssMgL) || 0,
      initialSludgeVolumeM3: initVol,
      finalSludgeVolumeM3: finVol,
      sludgeOdour,
      sludgeConsistency,
      handlingIssueObserved,
      handlingDifficulty,
      operator,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Log Sludge Handling & Dewatering Run"
      description="Record mechanical volume reduction, cake dryness, feed solids, sludge consistency and observed handling difficulties."
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Core batch & equipment */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <FormField
            label="Run Date"
            name="date"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
          />
          <FormField
            label="Feed Sludge Batch"
            name="batchId"
            type="select"
            value={batchId}
            onChange={e => setBatchId(e.target.value)}
            options={batches.map(b => ({
              value: b.batchId,
              label: `${b.batchId} (${b.quantityTonnes} t)`,
            }))}
            required
          />
          <FormField
            label="Dewatering Method"
            name="method"
            type="select"
            value={method}
            onChange={e => setMethod(e.target.value as DewateringMethod)}
            options={[
              { value: 'Filter Press', label: 'Recessed Plate Filter Press' },
              { value: 'Belt Filter Press', label: 'Continuous Belt Press' },
              { value: 'Centrifuge', label: 'Decanter Centrifuge' },
              { value: 'Drying Bed', label: 'Solar / Sand Drying Bed' },
              { value: 'None', label: 'None (Direct Liquid Haul)' },
            ]}
            required
          />
        </div>

        {/* Section 1: Hydraulic Volumes & Feed Solids */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-3">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
            <span>Hydraulic Volumes & Feed Thickening</span>
            <span className="text-[11px] text-blue-600 font-medium">Vol Reduction = 1 - (Final / Initial)</span>
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <FormField
              label="Sludge Feed Volume"
              name="sludgeFeedVolume"
              type="number"
              unit="m³"
              value={sludgeFeedVolume}
              onChange={e => {
                setSludgeFeedVolume(e.target.value);
                setInitialSludgeVolume(e.target.value);
              }}
              required
            />
            <FormField
              label="Sludge Feed Solids"
              name="sludgeFeedSolids"
              type="number"
              step="0.1"
              unit="%"
              value={sludgeFeedSolids}
              onChange={e => setSludgeFeedSolids(e.target.value)}
              helperText="Typical: 3.0 - 5.0%"
              required
            />
            <FormField
              label="Final Sludge Volume"
              name="finalSludgeVolume"
              type="number"
              unit="m³"
              value={finalSludgeVolume}
              onChange={e => setFinalSludgeVolume(e.target.value)}
              required
            />
            <FormField
              label="Dewatered Cake Mass"
              name="dewateredCakeTonnes"
              type="number"
              unit="tonnes"
              step="0.1"
              value={dewateredCakeTonnes}
              onChange={e => setDewateredCakeTonnes(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Section 2: Conditioning & Cake Quality */}
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-3">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Conditioning Polymer & Dewatered Cake Quality
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField
              label="Polymer Conditioning Dose"
              name="polymerDose"
              type="number"
              unit="kg/tonne dry solids"
              step="0.1"
              value={polymerDose}
              onChange={e => setPolymerDose(e.target.value)}
              helperText="Benchmark: 3.0 - 4.5 kg/t"
            />
            <FormField
              label="Cake Moisture"
              name="cakeMoisturePct"
              type="number"
              unit="%"
              step="0.1"
              value={cakeMoisturePct}
              onChange={e => setCakeMoisturePct(e.target.value)}
              required
              helperText="Target: ≤ 75%"
            />
            <FormField
              label="Filtrate / Centrate TSS"
              name="filtrateTssMgL"
              type="number"
              unit="mg/L"
              value={filtrateTssMgL}
              onChange={e => setFiltrateTssMgL(e.target.value)}
              helperText="Limit: < 200 mg/L"
              required
            />
          </div>
        </div>

        {/* Section 3: Sludge Handling Difficulties, Consistency & Odour */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/30 p-3.5 space-y-3">
          <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center justify-between">
            <span>Handling Difficulties, Consistency & Odour Observation</span>
            <span className="text-[11px] text-amber-700 font-medium">Thickening, Dewatering, Storage & Transport</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField
              label="Sludge Consistency"
              name="sludgeConsistency"
              type="select"
              value={sludgeConsistency}
              onChange={e => setSludgeConsistency(e.target.value as SludgeConsistency)}
              options={[
                { value: 'free-flowing', label: 'Free-flowing (Normal clean discharge)' },
                { value: 'pasty', label: 'Pasty (Viscous, sticks to blades)' },
                { value: 'sticky', label: 'Sticky (Adheres tightly to filter cloth)' },
                { value: 'oily', label: 'Oily (Hydrocarbon film, blind screens)' },
              ]}
              required
              helperText="Determines cake discharge and transport chute flow"
            />

            <FormField
              label="Sludge Odour Observation"
              name="sludgeOdour"
              type="select"
              value={sludgeOdour}
              onChange={e => setSludgeOdour(e.target.value)}
              options={[
                { value: 'Normal / Earthy', label: 'Normal / Earthy (Fresh chemical sludge)' },
                { value: 'Slight Sulphidic / Organic', label: 'Slight Sulphidic (Mild septic onset)' },
                { value: 'Strong Septic / Pungent Odour', label: 'Strong Septic / Pungent (Anaerobic decay in hopper)' },
                { value: 'Ammonia / Chemical Fumes', label: 'Ammonia / Chemical Fumes (High pH / amine residue)' },
              ]}
              required
              helperText="Evaluates septicity & storage odor risk"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <FormField
              label="Handling Issue Observed"
              name="handlingIssueObserved"
              type="select"
              value={handlingIssueObserved}
              onChange={e => setHandlingIssueObserved(e.target.value)}
              options={[
                { value: 'None (Clean plate release)', label: 'None (Normal smooth cake discharge)' },
                { value: 'Cloth Blinding / Filter Screen Clogging', label: 'Cloth Blinding / Filter Screen Clogging' },
                { value: 'Poor Cake Release / Manual Scraping Required', label: 'Poor Cake Release / Manual Scraping Required' },
                { value: 'Chute Blockage / Squeegee Drag', label: 'Chute Blockage / Squeegee Drag' },
                { value: 'Centrate Solids Breakthrough & Foaming', label: 'Centrate Solids Breakthrough & Foaming' },
                { value: 'Severe Belt Slippage / Tracking Loss', label: 'Severe Belt Slippage / Tracking Loss' },
                { value: 'Septic Gas Evolution in Hopper', label: 'Septic Gas Evolution in Hopper' },
              ]}
              required
            />

            <FormField
              label="Operator Evaluated Difficulty Badge"
              name="handlingDifficulty"
              type="select"
              value={handlingDifficulty}
              onChange={e => setHandlingDifficulty(e.target.value as HandlingDifficultyBadge)}
              options={[
                { value: 'normal', label: 'Green: Normal handling' },
                { value: 'attention', label: 'Amber: Attention required' },
                { value: 'critical', label: 'Red: Critical handling issue' },
              ]}
              helperText="System auto-evaluated from cake moisture & consistency"
            />
          </div>
        </div>

        {/* Live Calculation Preview */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-blue-900 font-bold">
            <Calculator className="w-4 h-4 text-blue-600" />
            <span>Calculated Volume Reduction:</span>
            <span className="font-mono text-base text-blue-700 ml-1">{volumeReductionPct}%</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-600 font-medium">Difficulty Level:</span>
            <span
              className={clsx(
                'px-2.5 py-0.5 rounded-full text-xs font-bold font-mono',
                handlingDifficulty === 'normal'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : handlingDifficulty === 'attention'
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : 'bg-red-100 text-red-800 border border-red-200'
              )}
            >
              {handlingDifficulty === 'normal'
                ? 'Normal Handling'
                : handlingDifficulty === 'attention'
                ? 'Attention Required'
                : 'Critical Handling Issue'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
          >
            Save Handling & Dewatering Run
          </button>
        </div>
      </form>
    </Modal>
  );
};
