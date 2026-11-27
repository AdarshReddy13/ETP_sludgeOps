import React, { useState } from 'react';
import {
  Warehouse,
  Truck,
  Plus,
  AlertTriangle,
  Clock,
  ShieldAlert,
  FileCheck2,
  FileText,
  Calendar,
  Layers,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { useETP } from '../../context/ETPContext';
import { KPICard } from '../common/KPICard';
import { DataTable, Column } from '../common/DataTable';
import { NewDispatchModal } from './NewDispatchModal';
import { DispatchRecord, SludgeBatch } from '../../types';
import { formatNumber } from '../../utils/calculations';
import clsx from 'clsx';

export const StorageDisposalView: React.FC = () => {
  const {
    batches,
    dispatches,
    storageCapacityTonnes,
    addDispatchRecord,
    alerts,
    setActivePage,
  } = useETP();

  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [selectedBatchForTimeline, setSelectedBatchForTimeline] = useState<string>(
    batches[0]?.batchId || ''
  );

  // Storage calculations
  const storedBatches = batches.filter(b => b.currentStage === 'Stored');
  const storedQuantityTonnes = storedBatches.reduce((sum, b) => sum + b.quantityTonnes, 0);
  const storagePct = (storedQuantityTonnes / storageCapacityTonnes) * 100;

  const oldestDays = storedBatches.length > 0 ? Math.max(...storedBatches.map(b => b.daysInStorage)) : 0;
  const daysRemaining90 = Math.max(0, 90 - oldestDays);

  const pendingDisposalBatches = batches.filter(
    b => b.currentStage === 'Stored' && b.classificationStatus !== 'pending'
  );

  // Module alerts
  const storageAlerts = alerts.filter(
    a =>
      a.type.includes('Storage') ||
      a.type.includes('Deadline') ||
      a.type.includes('Stored > 60') ||
      a.type.includes('Certificate') ||
      a.type.includes('Manifest') ||
      a.type.includes('Missing Characterisation')
  );

  // Selected batch for timeline
  const activeTimelineBatch = batches.find(b => b.batchId === selectedBatchForTimeline) || batches[0] || null;

  // Dispatch table columns
  const dispatchColumns: Column<DispatchRecord>[] = [
    {
      key: 'date',
      header: 'Date & Manifest No.',
      render: r => (
        <div>
          <div className="font-semibold text-slate-900 font-mono">{r.date}</div>
          <div className="text-[11px] font-mono text-blue-700 font-medium">
            Form 10: {r.manifestNumber}
          </div>
        </div>
      ),
    },
    {
      key: 'batchId',
      header: 'Dispatched Batch',
      render: r => <span className="font-mono text-slate-700 font-semibold">{r.batchId}</span>,
    },
    {
      key: 'quantityTonnes',
      header: 'Quantity (t)',
      align: 'right',
      render: r => <span className="font-mono font-bold text-slate-900">{r.quantityTonnes} t</span>,
    },
    {
      key: 'facility',
      header: 'Authorised Disposal Facility',
      render: r => (
        <div>
          <div className="font-medium text-slate-900 text-xs">{r.facility}</div>
          <div className="text-[10px] text-slate-500 uppercase font-mono">{r.routeType.replace('_', ' ')}</div>
        </div>
      ),
    },
    {
      key: 'transporter',
      header: 'Transporter & GPS Vehicle',
      render: r => (
        <div>
          <div className="text-slate-800 text-xs">{r.transporter}</div>
          <div className="text-[11px] font-mono text-slate-500">{r.vehicleNumber}</div>
        </div>
      ),
    },
    {
      key: 'disposalCertificateFileName',
      header: 'Disposal Certificate',
      align: 'center',
      render: r =>
        r.disposalCertificateFileName ? (
          <a
            href={`#cert-${r.id}`}
            onClick={e => {
              e.preventDefault();
              alert(`Viewing stamped certificate of destruction/burial: ${r.disposalCertificateFileName}`);
            }}
            className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold hover:underline"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{r.disposalCertificateFileName}</span>
          </a>
        ) : (
          <span className="text-amber-600 font-medium text-[11px] inline-flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            Certificate Pending
          </span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: r => (
        <span
          className={clsx(
            'px-2 py-0.5 rounded-full text-[10px] font-bold font-mono',
            r.status === 'Disposed & Certificate Verified'
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-amber-100 text-amber-800'
          )}
        >
          {r.status}
        </span>
      ),
    },
  ];

  // Traceability stages
  const stages: { key: SludgeBatch['currentStage']; label: string; desc: string }[] = [
    { key: 'Generated', label: 'Generated', desc: 'Raw underflow slurry pumped' },
    { key: 'Characterised', label: 'Characterised', desc: 'NABL TCLP assay verified' },
    { key: 'Dewatered', label: 'Dewatered', desc: 'Filter press cake (≤75% moisture)' },
    { key: 'Stored', label: 'Stored', desc: 'Impermeable shed (<90 days)' },
    { key: 'Disposed', label: 'Disposed', desc: 'TSDF / Kiln Form 10 certified' },
  ];

  const getStageIndex = (stage: SludgeBatch['currentStage']): number => {
    return stages.findIndex(s => s.key === stage);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Warehouse className="w-5 h-5 text-blue-600" />
            Storage & Disposal
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Hazardous waste storage yard monitoring, 90-day statutory countdown, Form 10 manifest issuance and disposal certification.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsDispatchModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs self-start sm:self-auto transition-colors"
        >
          <Truck className="w-4 h-4" />
          <span>New Dispatch Manifest</span>
        </button>
      </div>

      {/* Storage & Compliance Alerts */}
      {storageAlerts.length > 0 && (
        <div className="space-y-2">
          {storageAlerts.map(alt => (
            <div
              key={alt.id}
              className={clsx(
                'p-3.5 rounded-xl border flex items-start gap-3 text-xs',
                alt.severity === 'critical'
                  ? 'bg-red-50 border-red-300 text-red-950'
                  : 'bg-amber-50 border-amber-300 text-amber-950'
              )}
            >
              <AlertTriangle
                className={clsx('w-4 h-4 shrink-0 mt-0.5', alt.severity === 'critical' ? 'text-red-600' : 'text-amber-600')}
              />
              <div className="flex-1">
                <span className="font-bold">{alt.type}: </span>
                <span>{alt.message} </span>
                <span className="text-slate-600 italic">Action: {alt.recommendedAction}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Current Sludge Inventory"
          value={formatNumber(storedQuantityTonnes, 1)}
          unit="tonnes"
          icon={Warehouse}
          status={storagePct >= 80 ? 'danger' : storagePct >= 60 ? 'warning' : 'normal'}
          subtitle={`Total capacity: ${storageCapacityTonnes} tonnes`}
        />

        <KPICard
          title="Storage Yard Utilization"
          value={`${storagePct.toFixed(1)}%`}
          icon={Layers}
          status={storagePct >= 80 ? 'danger' : storagePct >= 60 ? 'warning' : 'success'}
          subtitle="Warning threshold: 80%"
        />

        <KPICard
          title="Oldest Sludge Age in Storage"
          value={oldestDays}
          unit="days"
          icon={Clock}
          status={oldestDays > 75 ? 'danger' : oldestDays > 60 ? 'warning' : 'normal'}
          subtitle="Rule 20 statutory audit limit"
        />

        <KPICard
          title="90-Day Disposal Deadline"
          value={daysRemaining90}
          unit="days remaining"
          icon={Calendar}
          status={daysRemaining90 <= 15 ? 'danger' : daysRemaining90 <= 30 ? 'warning' : 'success'}
          subtitle="Mandatory CPCB dispatch timeline"
        />
      </div>

      {/* Batch Traceability Timeline */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              Batch Traceability Timeline
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              End-to-end chain of custody: Generated → Characterised → Dewatered → Stored → Disposed
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Select Batch:</span>
            <select
              value={activeTimelineBatch?.batchId || ''}
              onChange={e => setSelectedBatchForTimeline(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white font-mono text-slate-800"
            >
              {batches.map(b => (
                <option key={b.batchId} value={b.batchId}>
                  {b.batchId} ({b.currentStage})
                </option>
              ))}
            </select>
          </div>
        </div>

        {activeTimelineBatch ? (
          <div className="py-2">
            {/* Batch Info Snippet */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs mb-6 font-mono">
              <div>
                Batch: <span className="font-bold text-blue-700">{activeTimelineBatch.batchId}</span>
              </div>
              <div>
                Qty: <span className="font-bold text-slate-900">{activeTimelineBatch.quantityTonnes} t</span>
              </div>
              <div>
                Source: <span className="text-slate-800">{activeTimelineBatch.sludgeSource}</span>
              </div>
              <div>
                Location: <span className="text-slate-700">{activeTimelineBatch.storageLocation || 'Shed 01'}</span>
              </div>
              <div>
                Age: <span className="font-bold text-amber-600">{activeTimelineBatch.daysInStorage} days</span>
              </div>
            </div>

            {/* Stepper Timeline */}
            <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-2 px-2">
              {stages.map((stage, idx) => {
                const currentStageIdx = getStageIndex(activeTimelineBatch.currentStage);
                const isPassed = idx < currentStageIdx;
                const isCurrent = idx === currentStageIdx;

                return (
                  <div key={stage.key} className="flex-1 flex md:flex-col items-center gap-3 md:gap-2 text-left md:text-center w-full">
                    {/* Circle Node */}
                    <div
                      className={clsx(
                        'w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all z-10',
                        isPassed
                          ? 'bg-emerald-600 text-white ring-4 ring-emerald-50'
                          : isCurrent
                          ? 'bg-blue-600 text-white ring-4 ring-blue-100 animate-pulse'
                          : 'bg-slate-200 text-slate-500'
                      )}
                    >
                      {isPassed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                    </div>

                    <div>
                      <div
                        className={clsx(
                          'text-xs font-bold',
                          isCurrent ? 'text-blue-700' : isPassed ? 'text-emerald-800' : 'text-slate-400'
                        )}
                      >
                        {stage.label}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 max-w-[140px] md:mx-auto">
                        {stage.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-xs">No batches available.</div>
        )}
      </div>

      {/* Pending Disposal Batches List */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Pending Disposal Batches in Storage Yard</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Characterised hazardous waste stored awaiting transport manifest execution
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
            {pendingDisposalBatches.length} ready for dispatch
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {pendingDisposalBatches.length === 0 ? (
            <div className="col-span-full py-8 text-center text-slate-400 text-xs">
              No batches currently pending disposal in storage yard.
            </div>
          ) : (
            pendingDisposalBatches.map(b => (
              <div
                key={b.batchId}
                className={clsx(
                  'rounded-xl border p-3.5 shadow-2xs flex flex-col justify-between gap-3 text-xs',
                  b.daysInStorage > 60 ? 'border-amber-300 bg-amber-50/30' : 'border-slate-200 bg-slate-50/50'
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono font-bold text-slate-900">{b.batchId}</span>
                    <span className="font-mono font-bold text-blue-700">{b.quantityTonnes} t</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mb-1">
                    Generated: <span className="font-mono text-slate-700">{b.dateGenerated}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mb-2">
                    Storage Age: <span className="font-mono font-bold text-amber-700">{b.daysInStorage} days</span>
                    <span className="text-slate-400 ml-1">({90 - b.daysInStorage} d to limit)</span>
                  </div>
                  <div className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-200">
                    <div>Moisture: {b.moisturePct ? `${b.moisturePct}%` : '—'}</div>
                    <div>TCLP: {b.tclpResult}</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsDispatchModalOpen(true)}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs transition-colors shadow-2xs"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Issue Dispatch Manifest</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Dispatch History Table */}
      <DataTable
        title="Authorised Dispatch History & Form 10 Manifests"
        subtitle="Permanent statutory log of off-site hazardous waste transports to authorised TSDF landfills and cement kilns"
        columns={dispatchColumns}
        data={dispatches}
        searchKey="manifestNumber"
        exportFileName="etp_dispatch_manifest_log.csv"
        emptyMessage="No dispatches recorded yet."
        actions={
          <button
            type="button"
            onClick={() => setIsDispatchModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Dispatch</span>
          </button>
        }
      />

      <NewDispatchModal
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
        batches={batches}
        onSave={rec => addDispatchRecord(rec)}
      />
    </div>
  );
};
