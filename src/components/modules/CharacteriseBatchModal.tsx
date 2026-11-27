import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { FormField } from '../common/FormField';
import { SludgeBatch, ClassificationStatus } from '../../types';
import { AlertTriangle, Upload, FileText, CheckCircle2, ShieldCheck } from 'lucide-react';

interface CharacteriseBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  batch: SludgeBatch | null;
  onSave: (batchId: string, updates: Partial<SludgeBatch>) => void;
}

export const CharacteriseBatchModal: React.FC<CharacteriseBatchModalProps> = ({
  isOpen,
  onClose,
  batch,
  onSave,
}) => {
  if (!batch) return null;

  const [facility, setFacility] = useState<string>(batch.facility || 'Unit 4 - Chemical Coagulation');
  const [labAnalysisId, setLabAnalysisId] = useState<string>(
    batch.labAnalysisId || `LAB-2026-${Math.floor(100 + Math.random() * 900)}`
  );
  const [sampleTestedDate, setSampleTestedDate] = useState<string>(
    batch.sampleTestedDate || new Date().toISOString().split('T')[0]
  );
  const [nablAccreditation, setNablAccreditation] = useState<string>(
    batch.nablAccreditation || 'NABL/TC-5481'
  );

  const [pH, setPH] = useState<string>(batch.pH?.toString() || '5.5');
  const [moisturePct, setMoisturePct] = useState<string>(batch.moisturePct?.toString() || '74.5');
  const [codMgKg, setCodMgKg] = useState<string>(batch.codMgKg?.toString() || '108000');
  const [oilAndGrease, setOilAndGrease] = useState<string>(batch.oilAndGreaseMgKg?.toString() || '950');
  const [chromium, setChromium] = useState<string>(batch.heavyMetals.chromium?.toString() || '75.0');
  const [nickel, setNickel] = useState<string>(batch.heavyMetals.nickel?.toString() || '38.0');
  const [copper, setCopper] = useState<string>(batch.heavyMetals.copper?.toString() || '95.0');
  const [zinc, setZinc] = useState<string>(batch.heavyMetals.zinc?.toString() || '280.0');
  const [lead, setLead] = useState<string>(batch.heavyMetals.lead?.toString() || '32.0');
  const [cadmium, setCadmium] = useState<string>(batch.heavyMetals.cadmium?.toString() || '4.2');
  const [phenol, setPhenol] = useState<string>(batch.phenolMgKg?.toString() || '55.0');
  const [sulphide, setSulphide] = useState<string>(batch.sulphideMgKg?.toString() || '40.0');
  const [tclpResult, setTclpResult] = useState<SludgeBatch['tclpResult']>(
    batch.tclpResult === 'Pending' ? 'Failed (Hazardous Leachate)' : batch.tclpResult
  );
  const [classificationStatus, setClassificationStatus] = useState<ClassificationStatus>(
    batch.classificationStatus === 'pending' ? 'hazardous' : batch.classificationStatus
  );
  const [uploadedFile, setUploadedFile] = useState<string>(
    batch.testReportFileName || `NABL_REPORT_${batch.batchId}.pdf`
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(batch.batchId, {
      facility,
      labAnalysisId,
      sampleTestedDate,
      nablAccreditation,
      pH: parseFloat(pH),
      moisturePct: moisturePct ? parseFloat(moisturePct) : null,
      codMgKg: codMgKg ? parseFloat(codMgKg) : null,
      oilAndGreaseMgKg: oilAndGrease ? parseFloat(oilAndGrease) : null,
      heavyMetals: {
        chromium: chromium ? parseFloat(chromium) : null,
        nickel: nickel ? parseFloat(nickel) : null,
        copper: copper ? parseFloat(copper) : null,
        zinc: zinc ? parseFloat(zinc) : null,
        lead: lead ? parseFloat(lead) : null,
        cadmium: cadmium ? parseFloat(cadmium) : null,
      },
      phenolMgKg: phenol ? parseFloat(phenol) : null,
      sulphideMgKg: sulphide ? parseFloat(sulphide) : null,
      tclpResult,
      classificationStatus,
      testReportFileName: uploadedFile,
      currentStage: batch.currentStage === 'Generated' ? 'Characterised' : batch.currentStage,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Laboratory Analysis & Characterisation: ${batch.batchId}`}
      description="Record laboratory assay findings, heavy metals, toxic leachate (TCLP), and regulatory classification."
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Prominent Statutory Warning Banner */}
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3.5 flex items-start gap-3 text-xs text-amber-950">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold">Statutory Compliance Notice: </span>
            COD and pH alone are not sufficient to classify sludge. Complete characterisation before selecting a disposal or recovery route. Never automatically classify sludge without required test information.
          </div>
        </div>

        {/* Lab Analysis Header Metadata */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
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
            label="Lab Analysis ID"
            name="labAnalysisId"
            value={labAnalysisId}
            onChange={e => setLabAnalysisId(e.target.value)}
            required
            helperText="NABL sample registration"
          />
          <FormField
            label="Test Completed Date"
            name="sampleTestedDate"
            type="date"
            value={sampleTestedDate}
            onChange={e => setSampleTestedDate(e.target.value)}
            required
          />
          <FormField
            label="NABL Accreditation"
            name="nablAccreditation"
            value={nablAccreditation}
            onChange={e => setNablAccreditation(e.target.value)}
            required
            helperText="Govt Approved Lab Ref"
          />
        </div>

        {/* Batch Info Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-blue-50/40 p-3 rounded-xl border border-blue-200 text-xs">
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-semibold">Batch ID</span>
            <span className="font-mono font-bold text-blue-900">{batch.batchId}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-semibold">Generation Date</span>
            <span className="font-mono text-slate-800">{batch.dateGenerated}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-semibold">Source Unit</span>
            <span className="text-slate-800 font-medium truncate block">{batch.sludgeSource}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-semibold">Quantity</span>
            <span className="font-mono font-bold text-blue-700">{batch.quantityTonnes} tonnes</span>
          </div>
        </div>

        {/* Physical & Organic Assay */}
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-3">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Physicochemical Parameters
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <FormField
              label="Sludge pH"
              name="pH"
              type="number"
              step="0.1"
              value={pH}
              onChange={e => setPH(e.target.value)}
              required
            />
            <FormField
              label="Moisture Content"
              name="moisturePct"
              type="number"
              unit="%"
              step="0.1"
              value={moisturePct}
              onChange={e => setMoisturePct(e.target.value)}
              required
            />
            <FormField
              label="Total COD"
              name="codMgKg"
              type="number"
              unit="mg/kg dry wt"
              value={codMgKg}
              onChange={e => setCodMgKg(e.target.value)}
            />
            <FormField
              label="Oil & Grease"
              name="oilAndGrease"
              type="number"
              unit="mg/kg"
              value={oilAndGrease}
              onChange={e => setOilAndGrease(e.target.value)}
            />
          </div>
        </div>

        {/* Heavy Metals Assay */}
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-3">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
            <span>Heavy Metals Profile (ICP-OES / AAS)</span>
            <span className="text-[11px] text-slate-400 lowercase font-normal">mg/kg dry solids</span>
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <FormField
              label="Total Chromium (Cr)"
              name="chromium"
              type="number"
              unit="mg/kg"
              step="0.1"
              value={chromium}
              onChange={e => setChromium(e.target.value)}
              helperText="Hazard limit: 50 mg/kg"
            />
            <FormField
              label="Nickel (Ni)"
              name="nickel"
              type="number"
              unit="mg/kg"
              step="0.1"
              value={nickel}
              onChange={e => setNickel(e.target.value)}
              helperText="Hazard limit: 50 mg/kg"
            />
            <FormField
              label="Copper (Cu)"
              name="copper"
              type="number"
              unit="mg/kg"
              step="0.1"
              value={copper}
              onChange={e => setCopper(e.target.value)}
              helperText="Hazard limit: 5000 mg/kg"
            />
            <FormField
              label="Zinc (Zn)"
              name="zinc"
              type="number"
              unit="mg/kg"
              step="0.1"
              value={zinc}
              onChange={e => setZinc(e.target.value)}
              helperText="Hazard limit: 20000 mg/kg"
            />
            <FormField
              label="Lead (Pb)"
              name="lead"
              type="number"
              unit="mg/kg"
              step="0.1"
              value={lead}
              onChange={e => setLead(e.target.value)}
              helperText="Hazard limit: 50 mg/kg"
            />
            <FormField
              label="Cadmium (Cd)"
              name="cadmium"
              type="number"
              unit="mg/kg"
              step="0.1"
              value={cadmium}
              onChange={e => setCadmium(e.target.value)}
              helperText="Hazard limit: 5 mg/kg"
            />
          </div>
        </div>

        {/* Specific Toxics & TCLP */}
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-3">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Toxic Organic Residues & TCLP Leachability
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField
              label="Phenolic Compounds"
              name="phenol"
              type="number"
              unit="mg/kg"
              value={phenol}
              onChange={e => setPhenol(e.target.value)}
            />
            <FormField
              label="Reactive Sulphide"
              name="sulphide"
              type="number"
              unit="mg/kg"
              value={sulphide}
              onChange={e => setSulphide(e.target.value)}
            />
            <FormField
              label="TCLP Leachability Result"
              name="tclpResult"
              type="select"
              value={tclpResult}
              onChange={e => setTclpResult(e.target.value as any)}
              options={[
                { value: 'Pending', label: 'Pending Test' },
                { value: 'Failed (Hazardous Leachate)', label: 'Failed (Hazardous Leachate)' },
                { value: 'Passed (Non-toxic leach)', label: 'Passed (Non-toxic leach)' },
                { value: 'Not Conducted', label: 'Not Conducted' },
              ]}
            />
          </div>
        </div>

        {/* Test Report & Classification */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-3">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Report Upload & Regulatory Classification
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Upload NABL Lab Test Report
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 flex items-center gap-2 truncate">
                  <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="truncate">{uploadedFile}</span>
                </div>
                <label className="cursor-pointer px-3 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shrink-0 flex items-center gap-1.5 shadow-2xs">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Browse</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={e => {
                      if (e.target.files?.[0]) {
                        setUploadedFile(e.target.files[0].name);
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            <FormField
              label="Regulatory Status Badge"
              name="classificationStatus"
              type="select"
              value={classificationStatus}
              onChange={e => setClassificationStatus(e.target.value as ClassificationStatus)}
              options={[
                { value: 'hazardous', label: 'Classified Hazardous (Red)' },
                { value: 'non_hazardous', label: 'Classified Non-Hazardous (Green)' },
                { value: 'awaiting_decision', label: 'Awaiting Disposal Decision (Amber)' },
                { value: 'pending', label: 'Pending Test (Grey)' },
              ]}
              helperText="CPCB Schedule II / Class A Waste"
            />
          </div>
        </div>

        {/* Footer actions */}
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
            Commit Characterisation
          </button>
        </div>
      </form>
    </Modal>
  );
};
