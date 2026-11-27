import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { FormField } from '../common/FormField';
import { useETP } from '../../context/ETPContext';
import {
  ShiftType,
  SludgeSource,
  CoagulantType,
  FlocculantType,
  DailyGenerationRecord,
} from '../../types';
import {
  calculateCodLoad,
  calculateCodRemoved,
  calculateSludgeFactor,
  calculateDrySludgeMass,
  formatNumber,
} from '../../utils/calculations';
import { Calculator, CheckCircle2, AlertCircle } from 'lucide-react';

export const AddDailyEntryModal: React.FC = () => {
  const { isAddEntryModalOpen, setIsAddEntryModalOpen, addDailyRecord } = useETP();

  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [shift, setShift] = useState<ShiftType>('Shift A (06:00 - 14:00)');
  const [wastewaterTreated, setWastewaterTreated] = useState<string>('210');
  const [influentCOD, setInfluentCOD] = useState<string>('108000'); // Baseline confirmed >100,000 mg/L
  const [effluentCOD, setEffluentCOD] = useState<string>('15200');
  const [influentPH, setInfluentPH] = useState<string>('5.5'); // Baseline confirmed 5.5
  const [treatedWaterPH, setTreatedWaterPH] = useState<string>('7.2');
  const [coagulantType, setCoagulantType] = useState<CoagulantType>('Polyaluminium Chloride (PAC)');
  const [coagulantDose, setCoagulantDose] = useState<string>('470');
  const [flocculantType, setFlocculantType] = useState<FlocculantType>('Anionic Polyacrylamide (PAM)');
  const [flocculantDose, setFlocculantDose] = useState<string>('3.5');
  const [sludgeSource, setSludgeSource] = useState<SludgeSource>('Chemical Coagulation Basin');
  const [wetSludgeGenerated, setWetSludgeGenerated] = useState<string>('2350');
  const [sludgeMoisture, setSludgeMoisture] = useState<string>('93.0');
  const [operator, setOperator] = useState<string>('Shift Lead Operator');
  const [notes, setNotes] = useState<string>('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const numFlow = wastewaterTreated ? parseFloat(wastewaterTreated) : null;
  const numInfCOD = influentCOD ? parseFloat(influentCOD) : 0;
  const numEffCOD = effluentCOD ? parseFloat(effluentCOD) : null;
  const numWetSludge = wetSludgeGenerated ? parseFloat(wetSludgeGenerated) : null;
  const numMoisture = sludgeMoisture ? parseFloat(sludgeMoisture) : null;

  // Real-time calculations
  const influentCodLoadKg = numFlow ? calculateCodLoad(numInfCOD, numFlow) : null;
  const { kgRemoved, pctRemoved } = calculateCodRemoved(numInfCOD, numEffCOD, numFlow);
  const sludgeFactor = calculateSludgeFactor(numWetSludge, numFlow);
  const drySludgeKg = calculateDrySludgeMass(numWetSludge, numMoisture);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!date) errs.date = 'Date is required';
    if (!numFlow || numFlow <= 0) errs.wastewaterTreated = 'Enter valid daily wastewater flow (> 0 m³)';
    if (!numInfCOD || numInfCOD <= 0) errs.influentCOD = 'Enter influent COD';
    if (numEffCOD !== null && numEffCOD >= numInfCOD) {
      errs.effluentCOD = 'Effluent COD cannot be higher than influent COD';
    }
    const infPhVal = parseFloat(influentPH);
    if (isNaN(infPhVal) || infPhVal < 1 || infPhVal > 14) {
      errs.influentPH = 'Valid pH is between 1 and 14';
    }
    if (treatedWaterPH) {
      const trPhVal = parseFloat(treatedWaterPH);
      if (isNaN(trPhVal) || trPhVal < 1 || trPhVal > 14) {
        errs.treatedWaterPH = 'Valid pH is between 1 and 14';
      }
    }
    if (numMoisture !== null && (numMoisture <= 0 || numMoisture >= 100)) {
      errs.sludgeMoisture = 'Sludge moisture must be between 1% and 99%';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    addDailyRecord({
      date,
      shift,
      wastewaterTreated: numFlow,
      influentCOD: numInfCOD,
      effluentCOD: numEffCOD,
      influentPH: parseFloat(influentPH),
      treatedWaterPH: treatedWaterPH ? parseFloat(treatedWaterPH) : null,
      coagulantType,
      coagulantDose: coagulantDose ? parseFloat(coagulantDose) : null,
      flocculantType,
      flocculantDose: flocculantDose ? parseFloat(flocculantDose) : null,
      sludgeSource,
      wetSludgeGenerated: numWetSludge,
      sludgeMoisture: numMoisture,
      operator,
      notes,
    });

    setIsAddEntryModalOpen(false);
  };

  return (
    <Modal
      isOpen={isAddEntryModalOpen}
      onClose={() => setIsAddEntryModalOpen(false)}
      title="Add Daily Sludge & Coagulation Log"
      description="Record wastewater flow, chemical dosages, and sludge generation for the active shift."
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Date & Shift */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="Date of Log"
            name="date"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
            error={errors.date}
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
        </div>

        {/* Section 1: Hydraulic & Chemical Water Quality */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
            <span>Hydraulic Flow & COD Quality</span>
            <span className="text-[11px] text-blue-600 lowercase font-medium">Auto-computes kg COD load</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField
              label="Wastewater Treated"
              name="wastewaterTreated"
              type="number"
              unit="m³/day"
              value={wastewaterTreated}
              onChange={e => setWastewaterTreated(e.target.value)}
              placeholder="e.g. 210"
              required
              error={errors.wastewaterTreated}
              helperText="Inlet electromagnetic flowmeter"
            />
            <FormField
              label="Influent COD"
              name="influentCOD"
              type="number"
              unit="mg/L"
              value={influentCOD}
              onChange={e => setInfluentCOD(e.target.value)}
              placeholder="e.g. 108000"
              required
              error={errors.influentCOD}
              helperText="Baseline: >100,000 mg/L"
            />
            <FormField
              label="Effluent COD"
              name="effluentCOD"
              type="number"
              unit="mg/L"
              value={effluentCOD}
              onChange={e => setEffluentCOD(e.target.value)}
              placeholder="e.g. 15200"
              error={errors.effluentCOD}
              helperText="Clarifier overflow"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <FormField
              label="Influent pH"
              name="influentPH"
              type="number"
              step="0.1"
              value={influentPH}
              onChange={e => setInfluentPH(e.target.value)}
              placeholder="5.5"
              required
              error={errors.influentPH}
              helperText="Baseline confirmed: 5.5"
            />
            <FormField
              label="Treated-Water pH"
              name="treatedWaterPH"
              type="number"
              step="0.1"
              value={treatedWaterPH}
              onChange={e => setTreatedWaterPH(e.target.value)}
              placeholder="7.2"
              error={errors.treatedWaterPH}
              helperText="Discharge envelope: 6.5 - 8.5"
            />
          </div>
        </div>

        {/* Section 2: Chemical Coagulant & Polymer Dosing */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Chemical Dosing & Sludge Source
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField
              label="Coagulant Type"
              name="coagulantType"
              type="select"
              value={coagulantType}
              onChange={e => setCoagulantType(e.target.value as CoagulantType)}
              options={[
                { value: 'Polyaluminium Chloride (PAC)', label: 'Polyaluminium Chloride (PAC)' },
                { value: 'Ferric Chloride (FeCl3)', label: 'Ferric Chloride (FeCl3)' },
                { value: 'Alum (Al2(SO4)3)', label: 'Alum (Al2(SO4)3)' },
                { value: 'Ferrous Sulphate (FeSO4)', label: 'Ferrous Sulphate (FeSO4)' },
                { value: 'Lime + Alum', label: 'Lime + Alum' },
              ]}
            />
            <FormField
              label="Coagulant Dose"
              name="coagulantDose"
              type="number"
              unit="mg/L"
              value={coagulantDose}
              onChange={e => setCoagulantDose(e.target.value)}
              placeholder="e.g. 470"
              helperText="Dosed at Flash Mixer"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField
              label="Flocculant / Polymer Type"
              name="flocculantType"
              type="select"
              value={flocculantType}
              onChange={e => setFlocculantType(e.target.value as FlocculantType)}
              options={[
                { value: 'Anionic Polyacrylamide (PAM)', label: 'Anionic Polyacrylamide (PAM)' },
                { value: 'Cationic Polyacrylamide (PAM)', label: 'Cationic Polyacrylamide (PAM)' },
                { value: 'Non-ionic Polymer', label: 'Non-ionic Polymer' },
              ]}
            />
            <FormField
              label="Flocculant Dose"
              name="flocculantDose"
              type="number"
              step="0.1"
              unit="mg/L"
              value={flocculantDose}
              onChange={e => setFlocculantDose(e.target.value)}
              placeholder="e.g. 3.5"
              helperText="Dosed at Flocculator"
            />
          </div>

          <FormField
            label="Sludge Generation Source Unit"
            name="sludgeSource"
            type="select"
            value={sludgeSource}
            onChange={e => setSludgeSource(e.target.value as SludgeSource)}
            options={[
              { value: 'Chemical Coagulation Basin', label: 'Chemical Coagulation Basin' },
              { value: 'Primary Clarifier', label: 'Primary Clarifier' },
              { value: 'Flocculation / Lamella', label: 'Flocculation / Lamella' },
              { value: 'DAF (Dissolved Air Flotation)', label: 'DAF (Dissolved Air Flotation)' },
              { value: 'Equalisation Tank Bottoms', label: 'Equalisation Tank Bottoms' },
            ]}
          />
        </div>

        {/* Section 3: Sludge Quantity & Moisture */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Wet Sludge Generation & Moisture
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField
              label="Wet Sludge Generated"
              name="wetSludgeGenerated"
              type="number"
              unit="kg/day"
              value={wetSludgeGenerated}
              onChange={e => setWetSludgeGenerated(e.target.value)}
              placeholder="e.g. 2350"
              helperText="Raw wet slurry from clarifier underflow"
            />
            <FormField
              label="Sludge Moisture Content"
              name="sludgeMoisture"
              type="number"
              step="0.1"
              unit="%"
              value={sludgeMoisture}
              onChange={e => setSludgeMoisture(e.target.value)}
              placeholder="e.g. 93.0"
              error={errors.sludgeMoisture}
              helperText="Lab oven moisture test (typically 90-95% for slurry)"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField
              label="Operator Name"
              name="operator"
              value={operator}
              onChange={e => setOperator(e.target.value)}
              placeholder="Operator name"
            />
            <FormField
              label="Shift Operational Notes"
              name="notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Jar test notes, chemical lot ID, etc."
            />
          </div>
        </div>

        {/* Real-time Calculation Summary Card */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 text-xs">
          <div className="flex items-center gap-2 font-bold text-blue-900 mb-2">
            <Calculator className="w-4 h-4 text-blue-600" />
            <span>Live Calculated Parameters</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-700">
            <div className="bg-white p-2.5 rounded-lg border border-blue-100">
              <span className="text-[10px] uppercase text-slate-400 font-semibold block">Influent COD Load</span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {influentCodLoadKg !== null ? `${formatNumber(influentCodLoadKg, 0)} kg/d` : '—'}
              </span>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-blue-100">
              <span className="text-[10px] uppercase text-slate-400 font-semibold block">COD Removed</span>
              <span className="font-mono font-bold text-emerald-700 text-sm">
                {kgRemoved !== null ? `${formatNumber(kgRemoved, 0)} kg (${pctRemoved}%)` : '—'}
              </span>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-blue-100">
              <span className="text-[10px] uppercase text-slate-400 font-semibold block">Sludge Factor</span>
              <span className="font-mono font-bold text-blue-700 text-sm">
                {sludgeFactor !== null ? `${sludgeFactor} kg/m³` : '—'}
              </span>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-blue-100">
              <span className="text-[10px] uppercase text-slate-400 font-semibold block">Dry Solids Mass</span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {drySludgeKg !== null ? `${formatNumber(drySludgeKg, 0)} kg/d` : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={() => setIsAddEntryModalOpen(false)}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
          >
            Save Daily Record
          </button>
        </div>
      </form>
    </Modal>
  );
};
