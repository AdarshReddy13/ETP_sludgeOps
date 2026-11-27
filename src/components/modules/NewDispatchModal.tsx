import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { FormField } from '../common/FormField';
import { SludgeBatch } from '../../types';
import { FileCheck2, Upload, AlertCircle } from 'lucide-react';

interface NewDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  batches: SludgeBatch[];
  onSave: (record: {
    batchId: string;
    date: string;
    quantityTonnes: number;
    facility: string;
    routeType: 'tsdf_landfill' | 'incineration' | 'cement_kiln' | 'recycler';
    transporter: string;
    vehicleNumber: string;
    manifestNumber: string;
    disposalCertificateFileName: string | null;
    status: 'Manifest Generated' | 'In Transit' | 'Disposed & Certificate Verified' | 'Certificate Pending';
  }) => void;
}

export const NewDispatchModal: React.FC<NewDispatchModalProps> = ({
  isOpen,
  onClose,
  batches,
  onSave,
}) => {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [batchId, setBatchId] = useState<string>(batches[0]?.batchId || 'SLG-2026-B10');
  const [quantityTonnes, setQuantityTonnes] = useState<string>('20.0');
  const [facility, setFacility] = useState<string>('Bharuch Enviro Infrastructure Ltd. (BEIL) TSDF Landfill');
  const [routeType, setRouteType] = useState<'tsdf_landfill' | 'incineration' | 'cement_kiln' | 'recycler'>('tsdf_landfill');
  const [transporter, setTransporter] = useState<string>('CleanEarth HazMat Logistics Ltd.');
  const [vehicleNumber, setVehicleNumber] = useState<string>('GJ-16-AX-8912 (GPS Enabled)');
  const [manifestNumber, setManifestNumber] = useState<string>(`MF-2026-GJ-${Math.floor(10000 + Math.random() * 90000)}`);
  const [certFileName, setCertFileName] = useState<string | null>(null);
  const [status, setStatus] = useState<any>('Manifest Generated');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      batchId,
      date,
      quantityTonnes: parseFloat(quantityTonnes) || 0,
      facility,
      routeType,
      transporter,
      vehicleNumber,
      manifestNumber,
      disposalCertificateFileName: certFileName,
      status: certFileName ? 'Disposed & Certificate Verified' : status,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Hazardous Sludge Dispatch Manifest"
      description="Issue Form 10 manifest for authorized highway transport and TSDF/co-processing gate delivery."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <FormField
            label="Dispatch Date"
            name="date"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
          />
          <FormField
            label="Dispatched Batch"
            name="batchId"
            type="select"
            value={batchId}
            onChange={e => setBatchId(e.target.value)}
            options={batches.map(b => ({
              value: b.batchId,
              label: `${b.batchId} (${b.quantityTonnes} t) [${b.classificationStatus}]`,
            }))}
            required
          />
          <FormField
            label="Quantity to Haul"
            name="quantityTonnes"
            type="number"
            unit="tonnes"
            step="0.1"
            value={quantityTonnes}
            onChange={e => setQuantityTonnes(e.target.value)}
            required
          />
        </div>

        {/* Facility & Route */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-3">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Authorised Destination Facility
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField
              label="Authorised Route"
              name="routeType"
              type="select"
              value={routeType}
              onChange={e => {
                const rt = e.target.value as any;
                setRouteType(rt);
                if (rt === 'tsdf_landfill') {
                  setFacility('Bharuch Enviro Infrastructure Ltd. (BEIL) TSDF Landfill');
                } else if (rt === 'cement_kiln') {
                  setFacility('Ambuja Cements Co-Processing Unit (AFR Kiln)');
                } else if (rt === 'incineration') {
                  setFacility('Authorized CETP Thermal Incinerator');
                } else {
                  setFacility('Authorized Heavy Metal Recovery Unit');
                }
              }}
              options={[
                { value: 'tsdf_landfill', label: 'Authorised TSDF Landfill' },
                { value: 'cement_kiln', label: 'Cement-Kiln Co-Processing (AFR)' },
                { value: 'incineration', label: 'Authorised Thermal Incinerator' },
                { value: 'recycler', label: 'Authorised Recycler (Metal Recovery)' },
              ]}
              required
            />
            <FormField
              label="Receiving Facility Name"
              name="facility"
              value={facility}
              onChange={e => setFacility(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Transport & Manifest */}
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-3">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Transport Logistics & Form 10 Manifest
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField
              label="Authorised Transporter"
              name="transporter"
              value={transporter}
              onChange={e => setTransporter(e.target.value)}
              required
            />
            <FormField
              label="GPS Vehicle Number"
              name="vehicleNumber"
              value={vehicleNumber}
              onChange={e => setVehicleNumber(e.target.value)}
              required
            />
            <FormField
              label="Form 10 Manifest No."
              name="manifestNumber"
              value={manifestNumber}
              onChange={e => setManifestNumber(e.target.value)}
              required
              helperText="Statutory tracking key"
            />
          </div>
        </div>

        {/* Certificate Upload Simulation */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Disposal Certificate Upload
          </h4>
          <div className="flex items-center gap-3">
            <div className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-600 truncate flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{certFileName || 'No certificate uploaded yet (Status: Certificate Pending)'}</span>
            </div>
            <label className="cursor-pointer px-3 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shrink-0 flex items-center gap-1.5 shadow-2xs">
              <Upload className="w-3.5 h-3.5" />
              <span>Attach Stamped Form 10</span>
              <input
                type="file"
                className="hidden"
                onChange={e => {
                  if (e.target.files?.[0]) {
                    setCertFileName(e.target.files[0].name);
                    setStatus('Disposed & Certificate Verified');
                  }
                }}
              />
            </label>
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
            Issue Manifest & Dispatch
          </button>
        </div>
      </form>
    </Modal>
  );
};
