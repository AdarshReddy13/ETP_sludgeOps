import crypto from 'crypto';
import {
  RegulatoryRule,
  FacilityAuthorisation,
  ComplianceEvaluationFinding,
} from '../models/types.js';
import { getRules, getAuthorisations, saveFindings } from '../db/database.js';

export interface EvaluationInput {
  batches: Array<{
    id: string;
    batchNumber: string;
    generationDate: string;
    quantityTonnes: number;
    moisturePercentage: number;
    currentStage: string;
    daysInStorage: number;
    classificationStatus: string;
    disposalRoute?: string;
    heavyMetals?: {
      chromium: number;
      nickel: number;
      copper: number;
      zinc: number;
      lead: number;
      cadmium: number;
    };
    tclpCompliant?: boolean;
    storageBay?: string;
  }>;
  dispatches?: Array<{
    id: string;
    dispatchDate: string;
    batchId: string;
    quantityTonnes: number;
    disposalRoute: string;
    facilityName: string;
    manifestNumber: string;
    transporterName: string;
    transporterVerified: boolean;
    status: string;
  }>;
  dailyRecords?: Array<{
    id: string;
    date: string;
    wastewaterTreatedM3Day?: number;
    influentCOD?: number;
    effluentCOD?: number;
    sludgeGeneratedKgDay?: number;
  }>;
}

function generateAuditHash(ruleId: string, subjectId: string, timestamp: string, value: any): string {
  const content = `${ruleId}:${subjectId}:${timestamp}:${JSON.stringify(value)}`;
  return 'AUDIT-' + crypto.createHash('sha256').update(content).digest('hex').slice(0, 16).toUpperCase();
}

export async function runComplianceEvaluation(input: EvaluationInput): Promise<ComplianceEvaluationFinding[]> {
  const allRules = await getRules();
  const approvedRules = allRules.filter(r => r.isApproved && r.isActive);
  const authorisations = await getAuthorisations();
  const cto = authorisations[0];

  const findings: ComplianceEvaluationFinding[] = [];
  const now = new Date().toISOString();

  const batches = input.batches || [];
  const dispatches = input.dispatches || [];

  // 1. Evaluate Storage Duration Rule (MoEFCC Rule 8(1))
  const storageRule = approvedRules.find(r => r.ruleCategory === 'Storage_Duration' && r.sectionOrRule.includes('8'));
  const storedBatches = batches.filter(b => b.currentStage === 'Stored');

  for (const batch of storedBatches) {
    const age = batch.daysInStorage || 0;

    if (age > 90) {
      findings.push({
        id: `finding-viol-storage-90d-${batch.id}`,
        evaluationTimestamp: now,
        recordType: 'Storage',
        batchOrRecordId: batch.batchNumber,
        ruleId: storageRule?.id || 'rule-howm-storage-90d',
        statutoryCitation: storageRule?.statutoryCitation || 'Rule 8(1) read with Rule 20, HOWM Rules 2016',
        parameterName: 'Maximum On-Site Sludge Storage Duration',
        isStatutoryViolation: true,
        isOperationalWarning: false,
        severity: 'critical',
        findingDescription: `Batch ${batch.batchNumber} has been stored on-site for ${age} days, exceeding the 90-day statutory ceiling under HOWM Rules 2016.`,
        legalThresholdText: '<= 90 days',
        actualObservedValue: `${age} days`,
        correctiveActionMandate: `Mandatory immediate dispatch of batch ${batch.batchNumber} (${batch.quantityTonnes} t) to authorized TSDF (KWMP Dabaspet). Submit statutory non-compliance report to KSPCB within 24 hours.`,
        statutoryPenaltyNotice: 'Section 15 Environment (Protection) Act, 1986 — punishable with imprisonment up to 5 years or fine up to ₹1,00,000.',
        evidenceAuditHash: generateAuditHash('storage-90d', batch.id, now, age),
        status: 'Open',
      });
    } else if (age > 60) {
      findings.push({
        id: `finding-warn-storage-60d-${batch.id}`,
        evaluationTimestamp: now,
        recordType: 'Storage',
        batchOrRecordId: batch.batchNumber,
        ruleId: storageRule?.id || 'rule-howm-storage-90d',
        statutoryCitation: storageRule?.statutoryCitation || 'Rule 8(1) read with Rule 20, HOWM Rules 2016',
        parameterName: 'Storage Duration Warning (60-90 Days Window)',
        isStatutoryViolation: false,
        isOperationalWarning: true,
        severity: 'warning',
        findingDescription: `Batch ${batch.batchNumber} has reached ${age} days in storage. Statutory breach will occur in ${90 - age} days.`,
        legalThresholdText: '<= 90 days statutory ceiling',
        actualObservedValue: `${age} days`,
        correctiveActionMandate: `Schedule authorized TSDF transport pickup within 14 days to prevent statutory violation under Rule 8(1).`,
        statutoryPenaltyNotice: 'Pre-statutory warning threshold. No statutory penalty if dispatched prior to Day 90.',
        evidenceAuditHash: generateAuditHash('storage-60d', batch.id, now, age),
        status: 'Open',
      });
    }
  }

  // 2. Evaluate Facility Shed Retention Capacity (Condition 4 KSPCB CTO)
  const capacityRule = approvedRules.find(r => r.ruleCategory === 'Storage_Duration' && r.limitValue >= 100);
  const totalStoredTonnes = storedBatches.reduce((acc, b) => acc + (b.quantityTonnes || 0), 0);
  const yardCap = cto?.authorizedStorageCapacityTonnes || capacityRule?.limitValue || 150;

  if (totalStoredTonnes > yardCap) {
    findings.push({
      id: `finding-viol-shed-capacity-${Date.now()}`,
      evaluationTimestamp: now,
      recordType: 'Storage',
      batchOrRecordId: 'STORAGE-YARD-ALL',
      ruleId: capacityRule?.id || 'rule-kspcb-yard-capacity',
      statutoryCitation: 'Specific Condition 4, KSPCB Consent No. 782',
      parameterName: 'Storage Shed Retention Capacity',
      isStatutoryViolation: true,
      isOperationalWarning: false,
      severity: 'critical',
      findingDescription: `Total stored sludge inventory (${totalStoredTonnes.toFixed(1)} t) exceeds authorized retention capacity of ${yardCap} tonnes in the impermeable shed.`,
      legalThresholdText: `<= ${yardCap} tonnes`,
      actualObservedValue: `${totalStoredTonnes.toFixed(1)} tonnes`,
      correctiveActionMandate: `Cease transferring dewatered sludge cakes to storage shed. Execute emergency dispatch for at least ${(totalStoredTonnes - yardCap + 20).toFixed(1)} tonnes immediately.`,
      statutoryPenaltyNotice: 'Section 33A Water Act 1974 & Section 21 Air Act 1981 — risk of Stop-Production and Power Disconnection directives.',
      evidenceAuditHash: generateAuditHash('shed-cap', 'yard', now, totalStoredTonnes),
      status: 'Open',
    });
  } else if (totalStoredTonnes > yardCap * 0.8) {
    findings.push({
      id: `finding-warn-shed-capacity-${Date.now()}`,
      evaluationTimestamp: now,
      recordType: 'Storage',
      batchOrRecordId: 'STORAGE-YARD-ALL',
      ruleId: capacityRule?.id || 'rule-kspcb-yard-capacity',
      statutoryCitation: 'Specific Condition 4, KSPCB Consent No. 782',
      parameterName: 'Storage Shed Capacity Advisory (>80%)',
      isStatutoryViolation: false,
      isOperationalWarning: true,
      severity: 'warning',
      findingDescription: `Storage shed is at ${((totalStoredTonnes / yardCap) * 100).toFixed(0)}% capacity (${totalStoredTonnes.toFixed(1)} t / ${yardCap} t).`,
      legalThresholdText: `<= ${yardCap} tonnes`,
      actualObservedValue: `${totalStoredTonnes.toFixed(1)} tonnes`,
      correctiveActionMandate: 'Trigger proactive logistics dispatch planning before shed reaches full capacity.',
      statutoryPenaltyNotice: 'Operational advisory.',
      evidenceAuditHash: generateAuditHash('shed-warn', 'yard', now, totalStoredTonnes),
      status: 'Open',
    });
  }

  // 3. Evaluate Heavy Metal Concentrations & Statutory Classification (Schedule II Class A)
  const heavyMetalRules = approvedRules.filter(r => r.ruleCategory === 'Heavy_Metals_Limit');

  for (const batch of batches) {
    if (batch.heavyMetals) {
      const metalsMap: Record<string, number> = {
        'Lead (Pb)': batch.heavyMetals.lead,
        'Cadmium (Cd)': batch.heavyMetals.cadmium,
        'Total Chromium (Cr)': batch.heavyMetals.chromium,
        'Nickel (Ni)': batch.heavyMetals.nickel,
        'Copper (Cu)': batch.heavyMetals.copper,
        'Zinc (Zn)': batch.heavyMetals.zinc,
      };

      for (const rule of heavyMetalRules) {
        for (const [mName, mValue] of Object.entries(metalsMap)) {
          if (rule.parameterName.toLowerCase().includes(mName.toLowerCase().split(' ')[0]) && mValue !== undefined) {
            if (mValue > rule.limitValue) {
              const misclassified = batch.classificationStatus === 'non-hazardous';
              findings.push({
                id: `finding-heavy-metal-${batch.id}-${mName.replace(/[^a-zA-Z]/g, '')}`,
                evaluationTimestamp: now,
                recordType: 'Characterisation',
                batchOrRecordId: batch.batchNumber,
                ruleId: rule.id,
                statutoryCitation: rule.statutoryCitation,
                parameterName: `${mName} Concentration`,
                isStatutoryViolation: misclassified,
                isOperationalWarning: !misclassified,
                severity: misclassified ? 'critical' : 'warning',
                findingDescription: misclassified
                  ? `Statutory Misclassification: Batch ${batch.batchNumber} has ${mName} of ${mValue} ${rule.unit} (exceeding ${rule.limitValue} ${rule.unit}) but is marked as non-hazardous.`
                  : `Batch ${batch.batchNumber} has elevated ${mName} (${mValue} ${rule.unit} > ${rule.limitValue} ${rule.unit}). Mandates Schedule II Class A hazardous handling.`,
                legalThresholdText: `<= ${rule.limitValue} ${rule.unit}`,
                actualObservedValue: `${mValue} ${rule.unit}`,
                correctiveActionMandate: misclassified
                  ? `Immediately reclassify Batch ${batch.batchNumber} to 'Classified Hazardous' (Schedule II Class A). Route exclusively to authorized TSDF secured landfill or stabilization.`
                  : `Ensure secured landfilling or metal stabilization at KWMP Dabaspet.`,
                statutoryPenaltyNotice: misclassified
                  ? 'Severe statutory violation under Rule 6 HOWM Rules 2016 for unauthorized handling of misclassified hazardous waste.'
                  : 'Statutory compliance mandate under Schedule II.',
                evidenceAuditHash: generateAuditHash(rule.id, batch.id, now, mValue),
                status: 'Open',
              });
            }
          }
        }
      }
    } else {
      // Zero-Assumption Policy check: If batch is uncharacterized
      findings.push({
        id: `finding-untested-${batch.id}`,
        evaluationTimestamp: now,
        recordType: 'Characterisation',
        batchOrRecordId: batch.batchNumber,
        ruleId: 'rule-statutory-characterisation-mandate',
        statutoryCitation: 'Condition 11 KSPCB CTO read with Rule 6 HOWM Rules 2016',
        parameterName: 'Mandatory Laboratory Characterisation Assay',
        isStatutoryViolation: false,
        isOperationalWarning: false,
        severity: 'info',
        findingDescription: `Zero-Assumption Rule: Batch ${batch.batchNumber} has not undergone NABL certified heavy metal and TCLP testing. Statutory law forbids dispatch without characterisation.`,
        legalThresholdText: 'NABL Certified Test Certificate Mandatory',
        actualObservedValue: 'Pending Laboratory Assay',
        correctiveActionMandate: 'Complete NABL test entry or upload lab report prior to scheduling disposal dispatch.',
        statutoryPenaltyNotice: 'Chemical sludge from industrial ETP cannot be classified as non-hazardous without analytical proof.',
        evidenceAuditHash: generateAuditHash('char-mandate', batch.id, now, 'UNTESTED'),
        status: 'Open',
      });
    }
  }

  // 4. Evaluate Dispatches & Form 10 Manifests (MoEFCC Rule 18 & 19)
  const manifestRule = approvedRules.find(r => r.ruleCategory === 'Disposal_Manifest');

  for (const disp of dispatches) {
    if (!disp.manifestNumber || disp.manifestNumber.trim() === '' || disp.manifestNumber.toLowerCase().includes('pending')) {
      findings.push({
        id: `finding-viol-manifest-${disp.id}`,
        evaluationTimestamp: now,
        recordType: 'Dispatch',
        batchOrRecordId: disp.batchId,
        ruleId: manifestRule?.id || 'rule-howm-manifest-form10',
        statutoryCitation: manifestRule?.statutoryCitation || 'Rule 18(2) & 19, HOWM Rules 2016',
        parameterName: 'Form 10 Manifest Issuance for Highway Transport',
        isStatutoryViolation: true,
        isOperationalWarning: false,
        severity: 'critical',
        findingDescription: `Dispatch of ${disp.quantityTonnes} tonnes (Batch ${disp.batchId}) conducted without mandatory 7-copy Form 10 statutory manifest.`,
        legalThresholdText: 'Form 10 Manifest Mandatory',
        actualObservedValue: 'Missing / Unauthenticated',
        correctiveActionMandate: 'Halt vehicle at security weighbridge; generate and issue signed 7-copy Form 10 manifest with authorized transporter registration.',
        statutoryPenaltyNotice: 'Illegal hazardous waste transportation under Rule 18; vehicle impoundment and cancellation of authorization.',
        evidenceAuditHash: generateAuditHash('form-10', disp.id, now, 'NO_MANIFEST'),
        status: 'Open',
      });
    }

    if (disp.transporterVerified === false) {
      findings.push({
        id: `finding-viol-transporter-${disp.id}`,
        evaluationTimestamp: now,
        recordType: 'Dispatch',
        batchOrRecordId: disp.batchId,
        ruleId: 'rule-kspcb-transporter-auth',
        statutoryCitation: 'Condition 7, KSPCB Consent No. 782',
        parameterName: 'Authorized Hazardous Waste Carrier Registration',
        isStatutoryViolation: true,
        isOperationalWarning: false,
        severity: 'critical',
        findingDescription: `Transporter ${disp.transporterName || 'Unregistered'} lacks verified GPS-tracking authorization for hazardous cargo.`,
        legalThresholdText: 'SPCB Authorized Transporter Mandatory',
        actualObservedValue: 'Unverified Transporter',
        correctiveActionMandate: 'Assign only KSPCB-registered hazardous waste carrier with functional GPS telemetry.',
        statutoryPenaltyNotice: 'Breach of Consent Specific Condition 7.',
        evidenceAuditHash: generateAuditHash('transporter-auth', disp.id, now, disp.transporterName),
        status: 'Open',
      });
    }
  }

  // 5. Evaluate Co-Processing Moisture Limits (CPCB Guidelines Clause 3.2)
  const coprocMoistureRule = approvedRules.find(r => r.ruleCategory === 'Co_Processing_AFR');
  if (coprocMoistureRule) {
    for (const batch of batches) {
      if (batch.disposalRoute && batch.disposalRoute.toLowerCase().includes('cement') && (batch.moisturePercentage || 0) > coprocMoistureRule.limitValue) {
        findings.push({
          id: `finding-warn-coproc-moisture-${batch.id}`,
          evaluationTimestamp: now,
          recordType: 'Dewatering',
          batchOrRecordId: batch.batchNumber,
          ruleId: coprocMoistureRule.id,
          statutoryCitation: coprocMoistureRule.statutoryCitation,
          parameterName: 'Cement Kiln Co-Processing Maximum Moisture',
          isStatutoryViolation: false,
          isOperationalWarning: true,
          severity: 'warning',
          findingDescription: `Batch ${batch.batchNumber} has cake moisture of ${batch.moisturePercentage}%, exceeding the 30% CPCB threshold for direct cement kiln co-processing.`,
          legalThresholdText: '<= 30.0%',
          actualObservedValue: `${batch.moisturePercentage}%`,
          correctiveActionMandate: 'Apply secondary thermal or solar drying before dispatch, or re-route to secured TSDF landfill.',
          statutoryPenaltyNotice: 'Consignment rejection by cement plant receiving gate.',
          evidenceAuditHash: generateAuditHash(coprocMoistureRule.id, batch.id, now, batch.moisturePercentage),
          status: 'Open',
        });
      }
    }
  }

  // Save findings to DB store
  await saveFindings(findings);
  return findings;
}

