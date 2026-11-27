import { DailyGenerationRecord, DewateringRecord, SludgeBatch, DispatchRecord, AlertItem } from '../types';

/**
 * COD load in kg/day = (COD in mg/L * wastewater flow in m³/day) / 1000
 */
export function calculateCodLoad(codMgL: number, flowM3Day: number): number {
  return (codMgL * flowM3Day) / 1000;
}

/**
 * COD removed in kg/day = Influent COD load - Effluent COD load
 */
export function calculateCodRemoved(
  influentCodMgL: number,
  effluentCodMgL: number | null,
  flowM3Day: number | null
): { kgRemoved: number | null; pctRemoved: number | null } {
  if (effluentCodMgL === null || flowM3Day === null || flowM3Day <= 0) {
    return { kgRemoved: null, pctRemoved: null };
  }

  const influentLoad = calculateCodLoad(influentCodMgL, flowM3Day);
  const effluentLoad = calculateCodLoad(effluentCodMgL, flowM3Day);
  const kgRemoved = Math.max(0, influentLoad - effluentLoad);
  const pctRemoved = influentCodMgL > 0 ? ((influentCodMgL - effluentCodMgL) / influentCodMgL) * 100 : 0;

  return {
    kgRemoved: Number(kgRemoved.toFixed(1)),
    pctRemoved: Number(pctRemoved.toFixed(1)),
  };
}

/**
 * Sludge generation factor = Wet sludge generated in kg/day / Wastewater treated in m³/day
 */
export function calculateSludgeFactor(
  wetSludgeKg: number | null,
  wastewaterM3: number | null
): number | null {
  if (wetSludgeKg === null || wastewaterM3 === null || wastewaterM3 <= 0) {
    return null;
  }
  return Number((wetSludgeKg / wastewaterM3).toFixed(2));
}

/**
 * Dry sludge = Wet sludge mass * (1 - moisture fraction)
 */
export function calculateDrySludgeMass(
  wetSludgeKg: number | null,
  moisturePct: number | null
): number | null {
  if (wetSludgeKg === null || moisturePct === null) {
    return null;
  }
  const moistureFraction = moisturePct / 100;
  const dryMass = wetSludgeKg * (1 - moistureFraction);
  return Number(dryMass.toFixed(1));
}

/**
 * Volume reduction = 1 - (Final wet sludge volume / Initial wet sludge volume)
 */
export function calculateVolumeReduction(
  initialVol: number,
  finalVol: number
): number {
  if (initialVol <= 0) return 0;
  const reduction = 1 - (finalVol / initialVol);
  return Number((Math.max(0, reduction) * 100).toFixed(1));
}

/**
 * Generates dynamic alerts based on daily records, storage, and batches
 */
export function evaluateSystemAlerts(
  records: DailyGenerationRecord[],
  batches: SludgeBatch[],
  dispatches: DispatchRecord[],
  dewatering: DewateringRecord[],
  storageCapacityTonnes: number = 150
): AlertItem[] {
  const alerts: AlertItem[] = [];

  // Check recent daily generation record
  if (records.length > 0) {
    const latest = records[0];

    // 1. pH check
    if (latest.influentPH <= 5.5) {
      alerts.push({
        id: `alert-ph-influent-${latest.id}`,
        type: 'pH Out of Operating Range',
        severity: 'warning',
        affectedUnit: 'Primary Equalisation / Flash Mixer',
        message: `Influent pH is acidic (${latest.influentPH}). Optimal chemical coagulation requires neutralization to pH 6.8 - 7.5.`,
        recommendedAction: 'Dose hydrated lime (Ca(OH)2) or caustic soda (NaOH) prior to coagulant addition to avoid floc breakup and excess coagulant usage.',
        timestamp: latest.date,
        acknowledged: false,
      });
    }

    if (latest.treatedWaterPH !== null && (latest.treatedWaterPH < 6.5 || latest.treatedWaterPH > 8.5)) {
      alerts.push({
        id: `alert-ph-treated-${latest.id}`,
        type: 'Treated Water pH Non-Compliance',
        severity: 'critical',
        affectedUnit: 'Lamella Clarifier / Final Discharge',
        message: `Treated effluent pH is ${latest.treatedWaterPH}, outside the statutory 6.5 - 8.5 discharge envelope.`,
        recommendedAction: 'Inspect coagulant dosing system for acid build-up; adjust post-neutralization dosing.',
        timestamp: latest.date,
        acknowledged: false,
      });
    }

    // 2. COD load & removal check
    if (latest.wastewaterTreated !== null) {
      const influentLoad = calculateCodLoad(latest.influentCOD, latest.wastewaterTreated);
      if (influentLoad > 10000) {
        alerts.push({
          id: `alert-cod-load-${latest.id}`,
          type: 'High Influent COD Load',
          severity: 'critical',
          affectedUnit: 'Inlet Equalisation Basin',
          message: `Extreme organic loading detected: ${influentLoad.toLocaleString()} kg COD/day (Influent COD: ${latest.influentCOD.toLocaleString()} mg/L).`,
          recommendedAction: 'Verify equalization basin buffering and adjust primary chemical dosing ratios to prevent clarifier overload.',
          timestamp: latest.date,
          acknowledged: false,
        });
      }

      if (latest.effluentCOD !== null) {
        const { pctRemoved } = calculateCodRemoved(latest.influentCOD, latest.effluentCOD, latest.wastewaterTreated);
        if (pctRemoved !== null && pctRemoved < 75) {
          alerts.push({
            id: `alert-cod-removal-${latest.id}`,
            type: 'Poor COD Removal Efficiency',
            severity: 'critical',
            affectedUnit: 'Primary Clarifier / Coagulation Unit',
            message: `COD removal efficiency dropped to ${pctRemoved}% (Target ≥ 80%).`,
            recommendedAction: 'Perform jar testing to re-determine optimal coagulant-to-flocculant ratio and rapid mix G-value.',
            timestamp: latest.date,
            acknowledged: false,
          });
        }
      }
    }

    // 3. Sludge factor check
    if (latest.wetSludgeGenerated !== null && latest.wastewaterTreated !== null) {
      const factor = calculateSludgeFactor(latest.wetSludgeGenerated, latest.wastewaterTreated);
      if (factor !== null && factor > 16) {
        alerts.push({
          id: `alert-sludge-factor-${latest.id}`,
          type: 'High Sludge Generation Factor',
          severity: 'warning',
          affectedUnit: 'Chemical Precipitation Unit',
          message: `Sludge generation is elevated at ${factor} kg wet sludge/m³ treated (Normal range: 6 - 12 kg/m³).`,
          recommendedAction: 'Audit coagulant dose to rule out excessive chemical precipitation; inspect moisture levels in unthickened slurry.',
          timestamp: latest.date,
          acknowledged: false,
        });
      }
    }

    // 4. Possible coagulant overdose
    if (latest.coagulantDose !== null && latest.coagulantDose > 550) {
      alerts.push({
        id: `alert-coagulant-overdose-${latest.id}`,
        type: 'Possible Coagulant Overdose',
        severity: 'warning',
        affectedUnit: 'Coagulation Flash Mixer',
        message: `${latest.coagulantType} dose is ${latest.coagulantDose} mg/L, exceeding economic benchmark (> 500 mg/L).`,
        recommendedAction: 'Conduct zeta-potential or jar test to optimize isoelectric point; verify metering pump calibration.',
        timestamp: latest.date,
        acknowledged: false,
      });
    }
  }

  // 5. Storage capacity check
  const storedQuantity = batches
    .filter(b => b.currentStage === 'Stored')
    .reduce((sum, b) => sum + b.quantityTonnes, 0);

  const capacityPct = (storedQuantity / storageCapacityTonnes) * 100;
  if (capacityPct >= 80) {
    alerts.push({
      id: 'alert-storage-capacity',
      type: 'Storage Above 80% Capacity',
      severity: capacityPct >= 90 ? 'critical' : 'warning',
      affectedUnit: 'Sludge Storage Yard (Shed-01)',
      message: `Hazardous sludge inventory at ${storedQuantity.toFixed(1)} tonnes (${capacityPct.toFixed(1)}% of ${storageCapacityTonnes} t capacity).`,
      recommendedAction: 'Schedule immediate dispatch manifest with authorized TSDF or cement kiln co-processor.',
      timestamp: new Date().toISOString().split('T')[0],
      acknowledged: false,
    });
  }

  // 6. Sludge age in storage & 90-day deadline
  batches.forEach(b => {
    if (b.currentStage === 'Stored') {
      if (b.daysInStorage > 75) {
        alerts.push({
          id: `alert-deadline-${b.batchId}`,
          type: 'Statutory 90-Day Deadline Approaching',
          severity: 'critical',
          affectedUnit: `Storage Bay - Batch ${b.batchId}`,
          message: `Batch ${b.batchId} has been stored for ${b.daysInStorage} days. Only ${90 - b.daysInStorage} days remaining before CPCB/SPCB non-compliance!`,
          recommendedAction: 'Expedite transporter manifest and dispatch to authorized TSDF facility immediately.',
          timestamp: b.dateGenerated,
          acknowledged: false,
        });
      } else if (b.daysInStorage > 60) {
        alerts.push({
          id: `alert-storage-age-${b.batchId}`,
          type: 'Sludge Stored > 60 Days',
          severity: 'warning',
          affectedUnit: `Storage Bay - Batch ${b.batchId}`,
          message: `Batch ${b.batchId} age is ${b.daysInStorage} days. Review disposal schedule before 90-day limit.`,
          recommendedAction: 'Confirm facility booking and finalize vehicle manifest.',
          timestamp: b.dateGenerated,
          acknowledged: false,
        });
      }

      // Missing characterisation report
      if (b.classificationStatus === 'pending' || !b.testReportFileName) {
        alerts.push({
          id: `alert-missing-report-${b.batchId}`,
          type: 'Missing Characterisation Report',
          severity: 'warning',
          affectedUnit: `QC Lab / Batch ${b.batchId}`,
          message: `Batch ${b.batchId} is stored without complete TCLP/heavy metals characterisation certificate.`,
          recommendedAction: 'Send representative composite core sample to NABL-accredited laboratory.',
          timestamp: b.dateGenerated,
          acknowledged: false,
        });
      }
    }
  });

  // 7. Dewatering performance check
  if (dewatering.length > 0) {
    const latestDew = dewatering[0];
    if (latestDew.cakeMoisturePct > 80) {
      alerts.push({
        id: `alert-dew-moisture-${latestDew.id}`,
        type: 'High Dewatered Cake Moisture',
        severity: 'warning',
        affectedUnit: `${latestDew.method} Unit`,
        message: `Cake moisture is ${latestDew.cakeMoisturePct}% (Target ≤ 75%). Elevated moisture inflates transportation and TSDF gate costs.`,
        recommendedAction: 'Increase press cycle squeezing pressure or verify polymer conditioning concentration.',
        timestamp: latestDew.date,
        acknowledged: false,
      });
    }
    if (latestDew.filtrateTssMgL > 250) {
      alerts.push({
        id: `alert-filtrate-tss-${latestDew.id}`,
        type: 'High Filtrate TSS',
        severity: 'warning',
        affectedUnit: `${latestDew.method} Filtrate Outlet`,
        message: `Filtrate suspended solids is ${latestDew.filtrateTssMgL} mg/L (Limit: 200 mg/L). Indicates filter cloth leakage or solids breakthrough.`,
        recommendedAction: 'Inspect filter press cloths for tearing or misaligned plates; check centrate clarity.',
        timestamp: latestDew.date,
        acknowledged: false,
      });
    }
  }

  // 8. Missing manifest or certificate in dispatch
  dispatches.forEach(d => {
    if (d.status === 'Certificate Pending' || !d.disposalCertificateFileName) {
      alerts.push({
        id: `alert-missing-cert-${d.id}`,
        type: 'Missing Disposal Certificate',
        severity: 'warning',
        affectedUnit: `Compliance / Dispatch ${d.manifestNumber}`,
        message: `Manifest #${d.manifestNumber} dispatched to ${d.facility} is missing final authorized disposal certificate.`,
        recommendedAction: 'Follow up with TSDF / co-processing operator for stamped Form 10 copy & certificate of destruction/burial.',
        timestamp: d.date,
        acknowledged: false,
      });
    }
    if (!d.manifestNumber) {
      alerts.push({
        id: `alert-missing-manifest-${d.id}`,
        type: 'Missing Manifest Number',
        severity: 'critical',
        affectedUnit: `Dispatch Logistics / ${d.id}`,
        message: `Dispatch ${d.id} lacks statutory hazardous waste manifest reference number.`,
        recommendedAction: 'Generate statutory Form 10 manifest prior to hazardous waste highway transport.',
        timestamp: d.date,
        acknowledged: false,
      });
    }
  });

  return alerts;
}

/**
 * Format numbers with comma grouping
 */
export function formatNumber(val: number | null | undefined, decimals = 1): string {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return val.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Export array of objects to CSV
 */
export function exportToCsv(filename: string, rows: Record<string, any>[]): void {
  if (!rows || !rows.length) return;
  const separator = ',';
  const keys = Object.keys(rows[0]);
  const csvContent =
    keys.join(separator) +
    '\n' +
    rows
      .map(row => {
        return keys
          .map(k => {
            let cell = row[k] === null || row[k] === undefined ? '' : row[k];
            cell = cell instanceof Date ? cell.toLocaleString() : cell.toString();
            cell = cell.replace(/"/g, '""');
            if (cell.search(/("|,|\n)/g) >= 0) {
              cell = `"${cell}"`;
            }
            return cell;
          })
          .join(separator);
      })
      .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
