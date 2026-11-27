import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { FormField } from '../common/FormField';
import { ProcessStage, AlertSeverity, IssuePriority, IssueStatus, SludgeBatch } from '../../types';
import { AlertTriangle, ShieldAlert, Wrench } from 'lucide-react';

interface ReportHandlingIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  batches: SludgeBatch[];
  onSave: (issue: {
    date: string;
    facility: string;
    batchId: string;
    sludgeSource: string;
    issueType: string;
    processStage: ProcessStage;
    severity: AlertSeverity;
    priority: IssuePriority;
    problemDescription: string;
    operationalImpact: string;
    environmentalImpact: string;
    possibleCause: string;
    recommendedAction: string;
    status: IssueStatus;
  }) => void;
}

const COMMON_ISSUES = [
  {
    type: 'Filter cloth blinding',
    stage: 'Dewatering' as ProcessStage,
    cause: 'Precipitation of fine gelatinous organics or residual hydrocarbon/oil film blinding pores.',
    action: 'Perform high-pressure chemical wash of cloths; verify polymer charge density and optimize coagulant dosing.',
    opImpact: 'Cycle filtration time extended by >30 mins; chamber feed pressure spikes above operating threshold.',
    envImpact: 'Risk of filtrate cloth pinhole blowout and high suspended solids recirculation into EQ basin.',
  },
  {
    type: 'Poor cake release',
    stage: 'Dewatering' as ProcessStage,
    cause: 'Excess polymer conditioning creating sticky adhesion between cake and polypropylene cloth interface.',
    action: 'Run jar test and optimize polymer dosing to reduce interface tackiness; adjust core blow pressure.',
    opImpact: 'Operators forced to manually pry plates; turnaround time doubles.',
    envImpact: 'Increased risk of operator contact with hazardous industrial sludge cake.',
  },
  {
    type: 'Chute blockage',
    stage: 'Transport' as ProcessStage,
    cause: 'Thixotropic shearing of gelatinous cake during conveyor drop, leading to bridging at throat.',
    action: 'Install UHMW polyethylene low-friction chute liners and pneumatic vibratory knockers.',
    opImpact: 'Conveyor motor trip on over-torque; delayed haulage truck loading.',
    envImpact: 'Cake spillage around transfer bays requiring manual cleanup.',
  },
  {
    type: 'Centrate breakthrough',
    stage: 'Dewatering' as ProcessStage,
    cause: 'Centrifuge differential scroll speed mismatch and insufficient polymer reaction residence time.',
    action: 'Check polymer dose, floc formation, screen condition, and reduce feed loading by 15%.',
    opImpact: 'Recycled solids increase headworks organic load by 10-15%.',
    envImpact: 'Solids carryover to final effluent polishers if centrate sump overflows.',
  },
  {
    type: 'Belt slippage',
    stage: 'Dewatering' as ProcessStage,
    cause: 'Uneven feed slurry distribution and oil & grease film lubricating drive drums.',
    action: 'Degrease drive rolls, re-tension pneumatic guides, and inspect automatic tracking sensors.',
    opImpact: 'Immediate automated e-stop trip on limit switches; cake discharge halted.',
    envImpact: 'Slurry overflow into floor drains and wet sludge pan containment.',
  },
  {
    type: 'Poor thickening',
    stage: 'Thickening' as ProcessStage,
    cause: 'Clarifier rake torque low; insufficient settling time due to rapid hydraulic turnover.',
    action: 'Check coagulant dose, pH buffer at 7.0, sludge age, and thickener hydraulic retention time.',
    opImpact: 'Excess water fed to filter press increases cycle time from 1.5h to 2.8h per batch.',
    envImpact: 'Higher electrical energy consumption per dry tonne dewatered.',
  },
  {
    type: 'High cake moisture',
    stage: 'Storage' as ProcessStage,
    cause: 'Final squeezing diaphragm pressure maintained below 10 bar due to air booster fault.',
    action: 'Review polymer dose, feed loading, and repair press pneumatic booster pressure regulator.',
    opImpact: 'Elevates haulage freight weight by >15% and incurs TSDF stabilization penalty surcharge.',
    envImpact: 'Higher leachate generation volume in storage shed sumps.',
  },
  {
    type: 'Sticky or pasty sludge',
    stage: 'Dewatering' as ProcessStage,
    cause: 'High oil & grease content combined with elevated cake moisture (>76%) and excess anionic PAM.',
    action: 'Review upstream DAF skimming efficiency; shift to high-cationicity structured polymer.',
    opImpact: 'Severe plate adhesion and conveyor carryback on return idlers.',
    envImpact: 'Volatile organic emissions from exposed clinging sludge.',
  },
];

export const ReportHandlingIssueModal: React.FC<ReportHandlingIssueModalProps> = ({
  isOpen,
  onClose,
  batches,
  onSave,
}) => {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [facility, setFacility] = useState<string>('Unit 4 - Chemical Coagulation');
  const [batchId, setBatchId] = useState<string>(batches[0]?.batchId || 'SLG-2026-B10');
  const [sludgeSource, setSludgeSource] = useState<string>('Filter Press');
  const [selectedIssueIdx, setSelectedIssueIdx] = useState<number>(0);
  const [issueType, setIssueType] = useState<string>(COMMON_ISSUES[0].type);
  const [processStage, setProcessStage] = useState<ProcessStage>(COMMON_ISSUES[0].stage);
  const [severity, setSeverity] = useState<AlertSeverity>('critical');
  const [priority, setPriority] = useState<IssuePriority>('High');
  const [problemDescription, setProblemDescription] = useState<string>(
    'Filter press chamber cloths blinded with fine gelatinous precipitate and residual oily dyestuff film.'
  );
  const [operationalImpact, setOperationalImpact] = useState<string>(COMMON_ISSUES[0].opImpact);
  const [environmentalImpact, setEnvironmentalImpact] = useState<string>(COMMON_ISSUES[0].envImpact);
  const [possibleCause, setPossibleCause] = useState<string>(COMMON_ISSUES[0].cause);
  const [recommendedAction, setRecommendedAction] = useState<string>(COMMON_ISSUES[0].action);
  const [status, setStatus] = useState<IssueStatus>('Open');

  const handleIssueSelect = (idx: number) => {
    setSelectedIssueIdx(idx);
    const template = COMMON_ISSUES[idx];
    setIssueType(template.type);
    setProcessStage(template.stage);
    setPossibleCause(template.cause);
    setRecommendedAction(template.action);
    setOperationalImpact(template.opImpact);
    setEnvironmentalImpact(template.envImpact);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      date,
      facility,
      batchId,
      sludgeSource,
      issueType,
      processStage,
      severity,
      priority,
      problemDescription,
      operationalImpact,
      environmentalImpact,
      possibleCause,
      recommendedAction,
      status,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Report Sludge Handling Difficulty & Operational Issue"
      description="Record root-cause diagnosis, operational/environmental impact, and engineering corrective protocol."
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Quick Select Common Problem */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3.5 space-y-2">
          <label className="text-xs font-bold text-blue-900 uppercase tracking-wider block">
            Select Recognized Handling Problem (8 Industrial Benchmarks)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {COMMON_ISSUES.map((item, idx) => (
              <button
                key={item.type}
                type="button"
                onClick={() => handleIssueSelect(idx)}
                className={`p-2 rounded-lg text-xs font-semibold text-left border transition-all ${
                  selectedIssueIdx === idx
                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-blue-50'
                }`}
              >
                <div className="truncate">{item.type}</div>
                <div className={`text-[10px] ${selectedIssueIdx === idx ? 'text-blue-100' : 'text-slate-400'}`}>
                  {item.stage}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <FormField
            label="Report Date"
            name="date"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
          />
          <FormField
            label="Facility"
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
            label="Affected Batch"
            name="batchId"
            type="select"
            value={batchId}
            onChange={e => setBatchId(e.target.value)}
            options={batches.map(b => ({
              value: b.batchId,
              label: `${b.batchId} (${b.sludgeSource})`,
            }))}
            required
          />
          <FormField
            label="Sludge Source Unit"
            name="sludgeSource"
            value={sludgeSource}
            onChange={e => setSludgeSource(e.target.value)}
            required
          />
        </div>

        {/* Severity, Priority, Status */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <FormField
            label="Process Stage"
            name="processStage"
            type="select"
            value={processStage}
            onChange={e => setProcessStage(e.target.value as ProcessStage)}
            options={[
              { value: 'Thickening', label: 'Thickening' },
              { value: 'Dewatering', label: 'Dewatering' },
              { value: 'Storage', label: 'Storage' },
              { value: 'Transport', label: 'Transport' },
            ]}
          />
          <FormField
            label="Severity"
            name="severity"
            type="select"
            value={severity}
            onChange={e => setSeverity(e.target.value as AlertSeverity)}
            options={[
              { value: 'critical', label: 'Critical' },
              { value: 'warning', label: 'Warning' },
              { value: 'info', label: 'Info' },
            ]}
          />
          <FormField
            label="Priority Level"
            name="priority"
            type="select"
            value={priority}
            onChange={e => setPriority(e.target.value as IssuePriority)}
            options={[
              { value: 'High', label: 'High Priority' },
              { value: 'Medium', label: 'Medium Priority' },
              { value: 'Low', label: 'Low Priority' },
            ]}
          />
          <FormField
            label="Initial Status"
            name="status"
            type="select"
            value={status}
            onChange={e => setStatus(e.target.value as IssueStatus)}
            options={[
              { value: 'Open', label: 'Open' },
              { value: 'Under Investigation', label: 'Under Investigation' },
              { value: 'Action Scheduled', label: 'Action Scheduled' },
              { value: 'Resolved', label: 'Resolved' },
            ]}
          />
        </div>

        {/* Description & Impacts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField
            label="Problem Description"
            name="problemDescription"
            type="textarea"
            value={problemDescription}
            onChange={e => setProblemDescription(e.target.value)}
            required
          />
          <FormField
            label="Operational Impact"
            name="operationalImpact"
            type="textarea"
            value={operationalImpact}
            onChange={e => setOperationalImpact(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField
            label="Environmental & EHS Impact"
            name="environmentalImpact"
            type="textarea"
            value={environmentalImpact}
            onChange={e => setEnvironmentalImpact(e.target.value)}
            required
          />
          <FormField
            label="Possible Root Cause"
            name="possibleCause"
            type="textarea"
            value={possibleCause}
            onChange={e => setPossibleCause(e.target.value)}
            required
          />
        </div>

        <FormField
          label="Suggested Corrective Action (Engineering Protocol)"
          name="recommendedAction"
          type="textarea"
          value={recommendedAction}
          onChange={e => setRecommendedAction(e.target.value)}
          required
        />

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
            Submit Handling Issue
          </button>
        </div>
      </form>
    </Modal>
  );
};
