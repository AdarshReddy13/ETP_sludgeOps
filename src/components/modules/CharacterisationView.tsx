import React, { useState, useMemo } from 'react';
import {
  FlaskConical,
  AlertTriangle,
  Upload,
  FileText,
  CheckCircle,
  Plus,
  Filter,
  Building,
  ShieldAlert,
  ShieldCheck,
  Clock,
  Layers,
  FileCheck2,
  ExternalLink,
  Droplets,
  Sparkles,
} from 'lucide-react';
import { useETP } from '../../context/ETPContext';
import { DataTable, Column } from '../common/DataTable';
import { StatusBadge } from '../common/StatusBadge';
import { KPICard } from '../common/KPICard';
import { CharacteriseBatchModal } from './CharacteriseBatchModal';
import { ChemicalPhysicalPropertiesModal } from './ChemicalPhysicalPropertiesModal';
import { SludgeBatch, ClassificationStatus } from '../../types';
import { formatNumber } from '../../utils/calculations';
import clsx from 'clsx';

export const CharacterisationView: React.FC = () => {
  const { batches, characteriseBatch, addBatch, updateBatch, setActivePage } = useETP();

  const [selectedBatchForModal, setSelectedBatchForModal] = useState<SludgeBatch | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBatchForProperties, setSelectedBatchForProperties] = useState<SludgeBatch | null>(null);
  const [isPropertiesModalOpen, setIsPropertiesModalOpen] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [selectedMetalFilter, setSelectedMetalFilter] = useState<string>('all');
  const [viewingReportBatch, setViewingReportBatch] = useState<SludgeBatch | null>(null);

  // Filter batches
  const filteredBatches = useMemo(() => {
    return batches.filter(b => {
      if (selectedFacility !== 'all' && (b.facility || 'Unit 4 - Chemical Coagulation') !== selectedFacility) return false;
      if (selectedStatusFilter !== 'all' && b.classificationStatus !== selectedStatusFilter) return false;
      if (selectedMetalFilter === 'flagged') {
        const hm = b.heavyMetals;
        const hasHeavy = (hm.chromium && hm.chromium > 50) || (hm.lead && hm.lead > 50) || (hm.cadmium && hm.cadmium > 5);
        if (!hasHeavy) return false;
      }
      if (selectedMetalFilter === 'tclp_failed') {
        if (b.tclpResult !== 'Failed (Hazardous Leachate)') return false;
      }
      return true;
    });
  }, [batches, selectedFacility, selectedStatusFilter, selectedMetalFilter]);

  // Competitor Reference Metric Counts
  const totalLabAnalyses = batches.filter(b => b.labAnalysisId || b.classificationStatus !== 'pending').length;
  const nonHazardousCount = batches.filter(b => b.classificationStatus === 'non_hazardous').length;
  const hazardousCount = batches.filter(b => b.classificationStatus === 'hazardous').length;
  const awaitingDecisionCount = batches.filter(b => b.classificationStatus === 'awaiting_decision').length;
  const pendingTestCount = batches.filter(b => b.classificationStatus === 'pending').length;

  const handleOpenCharacterise = (batch: SludgeBatch) => {
    setSelectedBatchForModal(batch);
    setIsModalOpen(true);
  };

  const handleCreateNewLabEntry = () => {
    const newBatchId = `SLG-2026-B${String(batches.length + 1).padStart(2, '0')}`;
    const newBatch: SludgeBatch = {
      batchId: newBatchId,
      facility: selectedFacility !== 'all' ? selectedFacility : 'Unit 4 - Chemical Coagulation',
      labAnalysisId: `LAB-2026-${Math.floor(100 + Math.random() * 900)}`,
      sampleTestedDate: new Date().toISOString().split('T')[0],
      nablAccreditation: 'NABL/TC-5481',
      dateGenerated: new Date().toISOString().split('T')[0],
      sludgeSource: 'Chemical Coagulation Basin',
      quantityTonnes: 15.0,
      pH: 5.5,
      moisturePct: null,
      codMgKg: 108000,
      oilAndGreaseMgKg: null,
      heavyMetals: { chromium: null, nickel: null, copper: null, zinc: null, lead: null, cadmium: null },
      phenolMgKg: null,
      sulphideMgKg: null,
      tclpResult: 'Pending',
      testReportFileName: null,
      classificationStatus: 'pending',
      currentStage: 'Generated',
      daysInStorage: 0,
      storageLocation: 'Wet Sludge Holding Hopper',
    };
    addBatch(newBatch);
    setSelectedBatchForModal(newBatch);
    setIsModalOpen(true);
  };

  const columns: Column<SludgeBatch>[] = [
    {
      key: 'batchId',
      header: 'Batch ID & Lab Ref',
      render: r => (
        <div>
          <span className="font-mono font-bold text-blue-700">{r.batchId}</span>
          <div className="text-[11px] font-mono text-slate-600 font-semibold">
            {r.labAnalysisId ? r.labAnalysisId : 'Lab Pending'}
          </div>
          <div className="text-[10px] text-slate-400 font-mono">{r.sampleTestedDate || r.dateGenerated}</div>
        </div>
      ),
    },
    {
      key: 'facility',
      header: 'Facility & Source',
      render: r => (
        <div>
          <span className="font-medium text-slate-900 text-xs block">{r.sludgeSource}</span>
          <span className="text-[11px] text-blue-700 font-medium">{r.facility || 'Unit 4 - Chemical Coagulation'}</span>
        </div>
      ),
    },
    {
      key: 'quantityTonnes',
      header: 'Quantity (t)',
      align: 'right',
      render: r => <span className="font-mono font-bold text-slate-900">{r.quantityTonnes} t</span>,
    },
    {
      key: 'physicochemical',
      header: 'Physicochemical (pH / Moisture / COD)',
      render: r => (
        <div className="font-mono text-xs space-y-0.5">
          <div>
            pH: <span className={clsx('font-bold', r.pH <= 5.5 ? 'text-amber-600' : 'text-slate-800')}>{r.pH}</span> |{' '}
            M: <span className="text-slate-700">{r.moisturePct !== null ? `${r.moisturePct}%` : '—'}</span>
          </div>
          <div className="text-[11px] text-slate-500">
            COD: <span className="font-semibold text-slate-800">{r.codMgKg !== null ? formatNumber(r.codMgKg, 0) : '—'}</span> mg/kg
          </div>
        </div>
      ),
    },
    {
      key: 'heavyMetals',
      header: 'Heavy Metals (Cr / Ni / Pb / Cd)',
      render: r => {
        const hm = r.heavyMetals;
        const hasMetals = hm.chromium !== null || hm.nickel !== null || hm.lead !== null;
        if (!hasMetals) return <span className="text-slate-400 italic text-xs">Awaiting lab assay</span>;
        return (
          <div className="font-mono text-[11px] text-slate-700 space-y-0.5">
            <div>
              Cr: <span className={clsx('font-semibold', hm.chromium && hm.chromium > 50 ? 'text-red-600 font-bold' : '')}>{hm.chromium ?? '—'}</span> |{' '}
              Ni: <span className={clsx('font-semibold', hm.nickel && hm.nickel > 50 ? 'text-red-600 font-bold' : '')}>{hm.nickel ?? '—'}</span>
            </div>
            <div>
              Pb: <span className={clsx('font-semibold', hm.lead && hm.lead > 50 ? 'text-red-600 font-bold' : '')}>{hm.lead ?? '—'}</span> |{' '}
              Cd: <span className={clsx('font-semibold', hm.cadmium && hm.cadmium > 5 ? 'text-red-600 font-bold' : '')}>{hm.cadmium ?? '—'}</span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'toxics',
      header: 'Phenol / Sulphide',
      render: r => {
        if (r.phenolMgKg === null && r.sulphideMgKg === null) {
          return <span className="text-slate-400 italic text-xs">—</span>;
        }
        return (
          <div className="font-mono text-[11px] text-slate-700 space-y-0.5">
            <div>Phenol: <span className="font-semibold">{r.phenolMgKg ?? '—'}</span> mg/kg</div>
            <div>Sulphide: <span className="font-semibold">{r.sulphideMgKg ?? '—'}</span> mg/kg</div>
          </div>
        );
      },
    },
    {
      key: 'tclpResult',
      header: 'TCLP Leachability',
      align: 'center',
      render: r => (
        <span
          className={clsx(
            'px-2 py-0.5 rounded-full text-[10px] font-bold font-mono',
            r.tclpResult === 'Passed (Non-toxic leach)'
              ? 'bg-emerald-100 text-emerald-800'
              : r.tclpResult === 'Failed (Hazardous Leachate)'
              ? 'bg-red-100 text-red-800'
              : 'bg-slate-100 text-slate-600'
          )}
        >
          {r.tclpResult}
        </span>
      ),
    },
    {
      key: 'testReport',
      header: 'Report Access',
      align: 'center',
      render: r =>
        r.testReportFileName ? (
          <button
            type="button"
            onClick={() => setViewingReportBatch(r)}
            className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-semibold hover:underline"
          >
            <FileText className="w-3.5 h-3.5 text-blue-500" />
            <span className="truncate max-w-[85px]">{r.testReportFileName}</span>
          </button>
        ) : (
          <span className="text-slate-400 text-[11px] italic">No Report</span>
        ),
    },
    {
      key: 'classificationStatus',
      header: 'Classification Status',
      align: 'center',
      render: r => <StatusBadge status={r.classificationStatus} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: r => (
        <div className="flex items-center justify-end gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setSelectedBatchForProperties(r);
              setIsPropertiesModalOpen(true);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
            title="Show full chemical and physical properties from lab report"
          >
            <Droplets className="w-3 h-3 text-emerald-600" />
            <span>Chemical & Physical Properties</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenCharacterise(r)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
          >
            <FlaskConical className="w-3 h-3" />
            <span>{r.classificationStatus === 'pending' ? 'Characterise' : 'Edit Lab Data'}</span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-blue-600" />
            Sludge Characterisation & Laboratory Registry
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Certified NABL laboratory assay register, heavy metals profiling, TCLP leachability determination, and CPCB Schedule II classification.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => {
              setSelectedBatchForProperties(batches[0] || null);
              setIsPropertiesModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Droplets className="w-4 h-4" />
            <span>Show Chemical & Physical Properties</span>
          </button>

          <button
            type="button"
            onClick={handleCreateNewLabEntry}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Laboratory Test Entry</span>
          </button>
        </div>
      </div>

      {/* Mandatory Statutory Warning Banner */}
      <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4 sm:p-5 shadow-xs flex items-start gap-4">
        <div className="p-2.5 rounded-xl bg-amber-500 text-white shrink-0 shadow-xs">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-amber-950">
            Mandatory Statutory Warning & Classification Protocol
          </h4>
          <p className="text-xs sm:text-sm text-amber-900 mt-1 leading-relaxed">
            “COD and pH alone are not sufficient to classify sludge. Complete characterisation before selecting a disposal or recovery route. Never automatically classify sludge as hazardous or non-hazardous without the required test information.”
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2 text-xs">
            <span className="font-semibold text-slate-700">Required Analytical Battery:</span>
            <span className="px-2 py-0.5 rounded bg-white/90 border border-amber-200 text-amber-950 font-mono">
              TCLP Leachable Toxics
            </span>
            <span className="px-2 py-0.5 rounded bg-white/90 border border-amber-200 text-amber-950 font-mono">
              Cr, Ni, Cu, Zn, Pb, Cd (ICP-OES)
            </span>
            <span className="px-2 py-0.5 rounded bg-white/90 border border-amber-200 text-amber-950 font-mono">
              Reactive Sulphide & Phenol
            </span>
            <span className="px-2 py-0.5 rounded bg-white/90 border border-amber-200 text-amber-950 font-mono">
              NABL Certificate Upload
            </span>
          </div>
        </div>
      </div>

      {/* Competitor Reference 4 Key KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Laboratory Analyses */}
        <KPICard
          title="Total Lab Analyses"
          value={totalLabAnalyses}
          unit="Certified Assays"
          icon={FlaskConical}
          status="normal"
          subtitle={`${batches.length} total batches generated`}
        />

        {/* Non-Hazardous Biosolids Count */}
        <KPICard
          title="Non-Hazardous Biosolids"
          value={nonHazardousCount}
          unit="Batches Cleared"
          icon={ShieldCheck}
          status="success"
          subtitle="Meets Schedule II clearance limits"
        />

        {/* Hazardous Sludge Flagged Count */}
        <KPICard
          title="Hazardous Sludge Flagged"
          value={hazardousCount}
          unit="Batches Flagged"
          icon={ShieldAlert}
          status="danger"
          subtitle="Requires TSDF / Co-Processing"
        />

        {/* Awaiting Disposal Decision Count */}
        <KPICard
          title="Awaiting Decision"
          value={awaitingDecisionCount}
          unit={`${pendingTestCount} pending lab`}
          icon={Clock}
          status={awaitingDecisionCount > 0 ? 'warning' : 'neutral'}
          subtitle="Pending facility acceptance"
        />
      </div>

      {/* Filter Toolbar (Facility, Compliance Status, Metals) */}
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

          {/* Compliance Status Filter */}
          <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 text-xs">
            <select
              value={selectedStatusFilter}
              onChange={e => setSelectedStatusFilter(e.target.value)}
              className="bg-transparent border-0 text-slate-700 text-xs font-medium focus:outline-hidden"
            >
              <option value="all">All Compliance Statuses</option>
              <option value="pending">Pending Test (Grey)</option>
              <option value="hazardous">Classified Hazardous (Red)</option>
              <option value="non_hazardous">Classified Non-Hazardous (Green)</option>
              <option value="awaiting_decision">Awaiting Disposal Decision (Amber)</option>
            </select>
          </div>

          {/* Heavy Metals Filter */}
          <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 text-xs">
            <select
              value={selectedMetalFilter}
              onChange={e => setSelectedMetalFilter(e.target.value)}
              className="bg-transparent border-0 text-slate-700 text-xs font-medium focus:outline-hidden"
            >
              <option value="all">All Chemical Profiles</option>
              <option value="flagged">Heavy Metals Exceeding Limit</option>
              <option value="tclp_failed">Failed TCLP Leachable</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-mono">
          Showing <span className="font-semibold text-slate-800">{filteredBatches.length}</span> of {batches.length} registered batches
        </div>
      </div>

      {/* Historical Laboratory Results & Batch-Wise Registry Table */}
      <DataTable
        title="Historical Laboratory Test Results & Batch Characterisation Records"
        subtitle="Certified assays with heavy metal spectra, toxic leachability, and linked NABL laboratory report certificates"
        columns={columns}
        data={filteredBatches}
        searchKey="batchId"
        exportFileName="sludge_characterisation_laboratory_registry.csv"
        actions={
          <button
            type="button"
            onClick={handleCreateNewLabEntry}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Lab Entry</span>
          </button>
        }
      />

      {/* Characterise Batch Modal */}
      <CharacteriseBatchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        batch={selectedBatchForModal}
        onSave={(batchId, updates) => characteriseBatch(batchId, updates)}
      />

      {/* Report Preview Modal */}
      {viewingReportBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-emerald-600" />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">NABL Laboratory Report</h4>
                  <p className="text-[11px] text-slate-500 font-mono">{viewingReportBatch.testReportFileName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingReportBatch(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-[11px]">
              <div><strong>Batch ID:</strong> {viewingReportBatch.batchId}</div>
              <div><strong>Laboratory Ref:</strong> {viewingReportBatch.labAnalysisId || 'NABL/TC-5481/2026'}</div>
              <div><strong>Accreditation:</strong> {viewingReportBatch.nablAccreditation || 'ISO/IEC 17025:2017 Certified'}</div>
              <div><strong>Sample Date:</strong> {viewingReportBatch.sampleTestedDate || viewingReportBatch.dateGenerated}</div>
              <div><strong>Facility:</strong> {viewingReportBatch.facility || 'Unit 4 - Chemical Coagulation'}</div>
              <div><strong>Classification:</strong> <StatusBadge status={viewingReportBatch.classificationStatus} /></div>
              <div><strong>TCLP Result:</strong> {viewingReportBatch.tclpResult}</div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  alert(`Downloading certified PDF copy of ${viewingReportBatch.testReportFileName}`);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-2xs"
              >
                Download Certified Certificate (PDF)
              </button>
              <button
                type="button"
                onClick={() => setViewingReportBatch(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Chemical and Physical Properties Modal */}
      <ChemicalPhysicalPropertiesModal
        isOpen={isPropertiesModalOpen}
        onClose={() => setIsPropertiesModalOpen(false)}
        batch={selectedBatchForProperties}
        onNavigateToDewatering={() => setActivePage('dewatering')}
        onUpdateBatch={updateBatch}
      />
    </div>
  );
};
