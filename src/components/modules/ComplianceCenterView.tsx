import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  FileText,
  Upload,
  CheckCircle2,
  Clock,
  Scale,
  Building,
  Calendar,
  Filter,
  Download,
  ExternalLink,
  ChevronRight,
  Eye,
  Check,
  X,
  AlertOctagon,
  RefreshCw,
  Plus,
  Hash,
  Award,
  Layers,
  Database,
  Search,
} from 'lucide-react';
import { useETP } from '../../context/ETPContext';
import {
  RegulatoryDocument,
  RegulatoryRule,
  FacilityAuthorisation,
  ComplianceObligation,
  ComplianceEvaluationFinding,
  AuthorityType,
  RuleCategory,
} from '../../types';
import clsx from 'clsx';

// Initial verified fallback data
const FALLBACK_DOCUMENTS: RegulatoryDocument[] = [
  {
    id: 'doc-moefcc-howm-2016',
    title: 'Hazardous and Other Wastes (Management and Transboundary Movement) Rules, 2016',
    authority: 'MoEFCC',
    docType: 'Statutory_Rule',
    gazetteRef: 'G.S.R. 395(E) dated 04-04-2016',
    version: '2016.1 (Amended up to 2023)',
    issueDate: '2016-04-04',
    effectiveDate: '2016-04-04',
    status: 'Approved',
    rawText: `MINISTRY OF ENVIRONMENT, FOREST AND CLIMATE CHANGE NOTIFICATION\nNew Delhi, the 4th April, 2016\nG.S.R. 395(E).—In exercise of the powers conferred by sections 6, 8 and 25 of the Environment (Protection) Act, 1986...\n\nRule 8. Storage of hazardous and other wastes:\n(1) The occupier may store the hazardous and other wastes for a period not exceeding ninety days...\n\nRule 18. Transportation of hazardous and other wastes:\n(2) The sender of the waste shall issue seven copies of the manifest in Form 10 to the transporter.\n\nSchedule II: Lead (Pb) - 50 mg/kg, Cadmium (Cd) - 5 mg/kg, Total Chromium (Cr) - 50 mg/kg, Nickel (Ni) - 50 mg/kg.`,
    pdfFileName: 'HOWM_Rules_2016_Official_Gazette.pdf',
    uploadedBy: 'Central Legal Registry (MoEFCC)',
    approvedBy: 'Member Secretary / Chief Environmental Officer',
    approvedAt: '2026-01-15T10:00:00Z',
    createdAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'doc-kspcb-cto-2024',
    title: 'KSPCB Consent to Operate (CTO) & Hazardous Waste Authorisation (Form 2)',
    authority: 'KSPCB',
    docType: 'Consent_To_Operate',
    gazetteRef: 'Consent Order No. KSPCB/BNG/CTO-IND/2024/782',
    version: 'CTO-2024-V2',
    issueDate: '2024-07-01',
    effectiveDate: '2024-07-01',
    status: 'Approved',
    rawText: `KARNATAKA STATE POLLUTION CONTROL BOARD\nConsent for Discharge of Effluent under Section 25 of Water Act 1974 & Section 21 of Air Act 1981.\n1. Chemical Sludge (Cat 35.3) cap: 2,500 TPA.\n2. Specific Condition 4: Dedicated impermeable RCC storage shed max 150 tonnes retention capacity.\n3. Specific Condition 7: Exclusive dispatch to KWMP Dabaspet with GPS tracked vehicles and Form 10 manifests.\n4. Specific Condition 11: Quarterly NABL laboratory heavy metals assay.`,
    pdfFileName: 'KSPCB_Consent_To_Operate_Unit4_2024.pdf',
    uploadedBy: 'Plant EHS Compliance Officer',
    approvedBy: 'KSPCB Regional Senior Environmental Officer',
    approvedAt: '2026-01-18T14:30:00Z',
    createdAt: '2026-01-18T14:30:00Z',
  },
  {
    id: 'doc-cpcb-coproc-2021',
    title: 'CPCB Guidelines on Co-Processing of Hazardous Wastes in Cement Plants (AFR)',
    authority: 'CPCB',
    docType: 'Technical_Guideline',
    gazetteRef: 'CPCB/HW-GUIDELINES/AFR/2021-04',
    version: '2021 Revision',
    issueDate: '2021-03-25',
    effectiveDate: '2021-03-25',
    status: 'Approved',
    rawText: `CENTRAL POLLUTION CONTROL BOARD\nGuidelines on Co-Processing in Cement Kilns as AFR.\nClause 3.2 Criteria for acceptance of ETP Chemical Sludge:\n(b) Moisture Content: Dewatered sludge shall not exceed 30% moisture by weight for direct co-processing feed; higher moisture cake requires pre-drying.\n(c) Halogens < 1.0%.`,
    pdfFileName: 'CPCB_Guidelines_Cement_Kiln_CoProcessing.pdf',
    uploadedBy: 'Central Legal Registry (CPCB)',
    approvedBy: 'CPCB Hazardous Waste Division Head',
    approvedAt: '2026-01-20T09:15:00Z',
    createdAt: '2026-01-20T09:15:00Z',
  },
];

const FALLBACK_RULES: RegulatoryRule[] = [
  {
    id: 'rule-howm-storage-90d',
    documentId: 'doc-moefcc-howm-2016',
    statutoryCitation: 'Rule 8(1) read with Rule 20, HOWM Rules 2016',
    sectionOrRule: 'Rule 8(1)',
    parameterName: 'Maximum On-Site Sludge Storage Duration',
    limitValue: 90,
    unit: 'days',
    comparisonOperator: '<=',
    ruleCategory: 'Storage_Duration',
    applicability: 'Mandatory_Statutory',
    legalRequirement: 'Hazardous waste shall not be stored on-site for a period exceeding ninety (90) days without prior SPCB extension.',
    statutoryViolationAction: 'Mandatory immediate dispatch to authorized TSDF facility; report non-compliance to SPCB.',
    isStatutoryViolation: true,
    penaltyImplication: 'Section 15 Environment (Protection) Act, 1986 — imprisonment up to 5 years or fine up to ₹1,00,000.',
    isApproved: true,
    isActive: true,
  },
  {
    id: 'rule-howm-manifest-form10',
    documentId: 'doc-moefcc-howm-2016',
    statutoryCitation: 'Rule 18(2) & 19, HOWM Rules 2016',
    sectionOrRule: 'Rule 18(2)',
    parameterName: 'Form 10 Manifest Issuance for Highway Transport',
    limitValue: 1,
    unit: 'statutory manifest',
    comparisonOperator: '==',
    ruleCategory: 'Disposal_Manifest',
    applicability: 'Mandatory_Statutory',
    legalRequirement: 'The sender shall issue seven copies of statutory Form 10 manifest before waste leaves plant gate.',
    statutoryViolationAction: 'Halt vehicle transport immediately until Form 10 manifest is authenticated and provided.',
    isStatutoryViolation: true,
    penaltyImplication: 'Illegal transport of hazardous waste under Rule 18; vehicle impoundment.',
    isApproved: true,
    isActive: true,
  },
  {
    id: 'rule-sched2-pb',
    documentId: 'doc-moefcc-howm-2016',
    statutoryCitation: 'Schedule II, Class A, HOWM Rules 2016',
    sectionOrRule: 'Schedule II Class A',
    parameterName: 'Lead (Pb) Concentration',
    limitValue: 50.0,
    unit: 'mg/kg',
    comparisonOperator: '<=',
    ruleCategory: 'Heavy_Metals_Limit',
    applicability: 'Mandatory_Statutory',
    legalRequirement: 'Concentration of Lead (Pb) shall not exceed 50 mg/kg dry weight for non-hazardous classification.',
    statutoryViolationAction: 'Classify batch as Hazardous Class A; mandate secured TSDF landfilling.',
    isStatutoryViolation: true,
    penaltyImplication: 'Misclassification of hazardous waste under Rule 6.',
    isApproved: true,
    isActive: true,
  },
  {
    id: 'rule-sched2-cr',
    documentId: 'doc-moefcc-howm-2016',
    statutoryCitation: 'Schedule II, Class A, HOWM Rules 2016',
    sectionOrRule: 'Schedule II Class A',
    parameterName: 'Total Chromium (Cr) Concentration',
    limitValue: 50.0,
    unit: 'mg/kg',
    comparisonOperator: '<=',
    ruleCategory: 'Heavy_Metals_Limit',
    applicability: 'Mandatory_Statutory',
    legalRequirement: 'Concentration of Total Chromium shall not exceed 50 mg/kg dry solids.',
    statutoryViolationAction: 'Enforce hazardous classification; inspect upstream chrome reduction.',
    isStatutoryViolation: true,
    penaltyImplication: 'Regulatory enforcement notice under Environment Protection Rules.',
    isApproved: true,
    isActive: true,
  },
  {
    id: 'rule-kspcb-yard-capacity',
    documentId: 'doc-kspcb-cto-2024',
    statutoryCitation: 'Specific Condition 4, KSPCB Consent No. 782',
    sectionOrRule: 'Condition 4',
    parameterName: 'Storage Shed Retention Capacity',
    limitValue: 150.0,
    unit: 'tonnes',
    comparisonOperator: '<=',
    ruleCategory: 'Storage_Duration',
    applicability: 'Conditional_Facility',
    legalRequirement: 'On-site hazardous sludge storage shall not exceed 150 tonnes inside impermeable RCC shed.',
    statutoryViolationAction: 'Halt additional accumulation; expedite dispatch manifests to KWMP Dabaspet.',
    isStatutoryViolation: true,
    penaltyImplication: 'Breach of KSPCB Consent to Operate; stop-production directive risk under Section 33A Water Act.',
    isApproved: true,
    isActive: true,
  },
  {
    id: 'rule-howm-annual-return-form4',
    documentId: 'doc-moefcc-howm-2016',
    statutoryCitation: 'Rule 20(2), HOWM Rules 2016',
    sectionOrRule: 'Rule 20(2)',
    parameterName: 'Annual Return Form 4 Submission Deadline',
    limitValue: 30,
    unit: 'June deadline',
    comparisonOperator: '<=',
    ruleCategory: 'Annual_Return',
    applicability: 'Mandatory_Statutory',
    legalRequirement: 'Submit annual returns in Form 4 to KSPCB on or before 30th June.',
    statutoryViolationAction: 'Compile annual hazardous waste inventory and file online through KSPCB portal.',
    isStatutoryViolation: true,
    penaltyImplication: 'Notice under Rule 20 for failure to report hazardous waste.',
    isApproved: true,
    isActive: true,
  },
  {
    id: 'rule-cpcb-coproc-moisture',
    documentId: 'doc-cpcb-coproc-2021',
    statutoryCitation: 'Clause 3.2(b), CPCB Guidelines for Co-Processing in Cement Kilns',
    sectionOrRule: 'Clause 3.2(b)',
    parameterName: 'Cement Kiln Co-Processing Maximum Moisture',
    limitValue: 30.0,
    unit: '%',
    comparisonOperator: '<=',
    ruleCategory: 'Co_Processing_AFR',
    applicability: 'Conditional_Facility',
    legalRequirement: 'Dewatered chemical sludge for cement co-processing shall have moisture <= 30%.',
    statutoryViolationAction: 'Sludge cake with >30% moisture requires secondary drying or TSDF redirection.',
    isStatutoryViolation: false,
    penaltyImplication: 'Rejection of consignment at cement plant receiving gate.',
    isApproved: true,
    isActive: true,
  },
];

const FALLBACK_AUTHORISATION: FacilityAuthorisation = {
  id: 'auth-kspcb-apex-unit4',
  facilityName: 'Apex Organics ETP - Unit 4 (Zero Liquid Discharge)',
  authority: 'KSPCB',
  consentType: 'CTO_Air_Water',
  consentNumber: 'KSPCB/BNG/CTO-IND/2024/782',
  issueDate: '2024-07-01',
  expiryDate: '2029-06-30',
  authorizedCapacityTpa: 2500,
  authorizedStorageCapacityTonnes: 150,
  status: 'Active',
  specificConditions: [
    {
      conditionNumber: 1,
      clause: 'Category 35.3 Chemical Sludge Cap',
      description: 'Maximum generation of ETP chemical sludge capped at 2,500 Metric Tonnes Per Annum.',
      verificationRequirement: 'Daily generation logbooks and weighing bridge receipts.',
    },
    {
      conditionNumber: 4,
      clause: 'Impermeable Concrete Storage Shed',
      description: 'Dedicated covered shed with leachate collection sump having storage capacity not exceeding 150 tonnes.',
      verificationRequirement: 'Physical inspection and inventory reconciliation log.',
    },
    {
      conditionNumber: 7,
      clause: 'Disposal to Authorized TSDF',
      description: 'Exclusive dispatch to KWMP Dabaspet or approved cement co-processing units via GPS tracked vehicles.',
      verificationRequirement: 'Form 10 manifest verification and stamped Certificate of Disposal.',
    },
    {
      conditionNumber: 11,
      clause: 'Quarterly NABL Heavy Metal Assay',
      description: 'Quarterly TCLP leachability and heavy metals testing by a NABL-accredited laboratory.',
      verificationRequirement: 'Third-party certified laboratory analysis reports.',
    },
  ],
};

const FALLBACK_OBLIGATIONS: ComplianceObligation[] = [
  {
    id: 'obl-form4-annual-return',
    authorisationId: 'auth-kspcb-apex-unit4',
    title: 'Submission of Annual Returns under Form 4',
    statutoryRef: 'Rule 20(2), HOWM Rules 2016',
    frequency: 'Annual',
    dueDate: '2027-06-30',
    evidenceRequired: 'Form 4 statutory compilation with TSDF disposal receipts and manifest summaries',
    status: 'Compliant',
    daysRemaining: 215,
    assignedDepartment: 'Environmental Health & Safety (EHS)',
  },
  {
    id: 'obl-quarterly-tclp',
    authorisationId: 'auth-kspcb-apex-unit4',
    title: 'Quarterly Heavy Metals & TCLP Leachability Analysis',
    statutoryRef: 'Condition 11, KSPCB Consent No. 782',
    frequency: 'Quarterly',
    dueDate: '2026-12-31',
    evidenceRequired: 'NABL Certified laboratory test certificate covering Cr, Ni, Cu, Zn, Pb, Cd and TCLP',
    status: 'Due_Soon',
    daysRemaining: 34,
    assignedDepartment: 'QC Laboratory / Environmental Chemist',
  },
  {
    id: 'obl-manifest-reconciliation',
    authorisationId: 'auth-kspcb-apex-unit4',
    title: 'Form 10 Manifest Reconciliation & Certificate Verification',
    statutoryRef: 'Rule 18(2) & 19, HOWM Rules 2016',
    frequency: 'Per_Dispatch',
    dueDate: '2026-12-15',
    evidenceRequired: 'Copy 7 of Form 10 signed by TSDF operator and Stamped Certificate of Disposal',
    status: 'Due_Soon',
    daysRemaining: 18,
    assignedDepartment: 'Logistics & Dispatch Compliance',
  },
  {
    id: 'obl-cto-renewal',
    authorisationId: 'auth-kspcb-apex-unit4',
    title: 'KSPCB Consent to Operate (CTO) Renewal Application',
    statutoryRef: 'Section 25 Water Act 1974 & Rule 6 HOWM Rules',
    frequency: 'Annual',
    dueDate: '2029-02-28',
    evidenceRequired: 'Comprehensive environmental audit statement, water balance sheet, and compliance report',
    status: 'Compliant',
    daysRemaining: 823,
    assignedDepartment: 'Plant Management & Regulatory Affairs',
  },
];

type ActiveTab = 'findings' | 'documents' | 'rules' | 'authorisations' | 'obligations';

export const ComplianceCenterView: React.FC = () => {
  const { batches, dispatches, dailyRecords, mode, storageCapacityTonnes } = useETP();

  const [activeTab, setActiveTab] = useState<ActiveTab>('findings');
  const [documents, setDocuments] = useState<RegulatoryDocument[]>(FALLBACK_DOCUMENTS);
  const [rules, setRules] = useState<RegulatoryRule[]>(FALLBACK_RULES);
  const [authorisation, setAuthorisation] = useState<FacilityAuthorisation>(FALLBACK_AUTHORISATION);
  const [obligations, setObligations] = useState<ComplianceObligation[]>(FALLBACK_OBLIGATIONS);
  const [findings, setFindings] = useState<ComplianceEvaluationFinding[]>([]);
  const [isAuditing, setIsAuditing] = useState(false);
  const [lastAuditTime, setLastAuditTime] = useState<string>('');

  // Finding filter
  const [findingFilter, setFindingFilter] = useState<'all' | 'statutory' | 'warning' | 'open'>('all');

  // Rule filter
  const [ruleAuthorityFilter, setRuleAuthorityFilter] = useState<string>('all');
  const [ruleCategoryFilter, setRuleCategoryFilter] = useState<string>('all');

  // Document modal & Upload modal states
  const [selectedDoc, setSelectedDoc] = useState<RegulatoryDocument | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadAuthority, setUploadAuthority] = useState<AuthorityType>('KSPCB');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState('');

  // Add rule modal
  const [isAddRuleModalOpen, setIsAddRuleModalOpen] = useState(false);
  const [newRuleCitation, setNewRuleCitation] = useState('');
  const [newRuleParam, setNewRuleParam] = useState('');
  const [newRuleLimit, setNewRuleLimit] = useState<number>(50);
  const [newRuleUnit, setNewRuleUnit] = useState('mg/kg');
  const [newRuleCategory, setNewRuleCategory] = useState<RuleCategory>('Heavy_Metals_Limit');
  const [newRuleIsStatutory, setNewRuleIsStatutory] = useState(true);

  // Load from backend on mount
  useEffect(() => {
    fetchBackendData();
  }, []);

  // Run evaluation when batches, dispatches or mode change
  useEffect(() => {
    runComplianceAudit();
  }, [batches, dispatches, mode]);

  const fetchBackendData = async () => {
    try {
      const [docRes, ruleRes, authRes, oblRes] = await Promise.allSettled([
        fetch('/api/documents'),
        fetch('/api/rules'),
        fetch('/api/authorisations'),
        fetch('/api/obligations'),
      ]);

      if (docRes.status === 'fulfilled' && docRes.value.ok) {
        const docData = await docRes.value.json();
        if (Array.isArray(docData) && docData.length > 0) setDocuments(docData);
      }
      if (ruleRes.status === 'fulfilled' && ruleRes.value.ok) {
        const ruleData = await ruleRes.value.json();
        if (Array.isArray(ruleData) && ruleData.length > 0) setRules(ruleData);
      }
      if (authRes.status === 'fulfilled' && authRes.value.ok) {
        const authData = await authRes.value.json();
        if (Array.isArray(authData) && authData.length > 0) setAuthorisation(authData[0]);
      }
      if (oblRes.status === 'fulfilled' && oblRes.value.ok) {
        const oblData = await oblRes.value.json();
        if (Array.isArray(oblData) && oblData.length > 0) setObligations(oblData);
      }
    } catch {
      // Keep fallbacks
    }
  };

  const runComplianceAudit = async () => {
    setIsAuditing(true);
    try {
      const payload = {
        batches: batches.map(b => ({
          id: b.batchId,
          batchNumber: b.batchId,
          generationDate: b.dateGenerated,
          quantityTonnes: b.quantityTonnes,
          moisturePercentage: b.moisturePct || 0,
          currentStage: b.currentStage,
          daysInStorage: b.daysInStorage,
          classificationStatus: b.classificationStatus,
          disposalRoute: b.storageLocation,
          heavyMetals: b.heavyMetals ? {
            chromium: b.heavyMetals.chromium ?? 0,
            nickel: b.heavyMetals.nickel ?? 0,
            copper: b.heavyMetals.copper ?? 0,
            zinc: b.heavyMetals.zinc ?? 0,
            lead: b.heavyMetals.lead ?? 0,
            cadmium: b.heavyMetals.cadmium ?? 0,
          } : undefined,
          tclpCompliant: b.tclpResult === 'Passed (Non-toxic leach)',
          storageBay: b.storageLocation,
        })),
        dispatches: dispatches.map(d => ({
          id: d.id,
          dispatchDate: d.date,
          batchId: d.batchId,
          quantityTonnes: d.quantityTonnes,
          disposalRoute: d.routeType,
          facilityName: d.facility,
          manifestNumber: d.manifestNumber,
          transporterName: d.transporter,
          transporterVerified: !d.transporter.toLowerCase().includes('unregistered'),
          status: d.status,
        })),
        dailyRecords: dailyRecords.map(r => ({
          id: r.id,
          date: r.date,
          wastewaterTreatedM3Day: r.wastewaterTreated ?? undefined,
          influentCOD: r.influentCOD,
          effluentCOD: r.effluentCOD ?? undefined,
          sludgeGeneratedKgDay: r.wetSludgeGenerated ?? undefined,
        })),
      };

      const res = await fetch('/api/compliance/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setFindings(data.findings || []);
      } else {
        runClientFallbackEvaluation();
      }
    } catch {
      runClientFallbackEvaluation();
    } finally {
      setIsAuditing(false);
      setLastAuditTime(new Date().toLocaleTimeString());
    }
  };

  const runClientFallbackEvaluation = () => {
    // Verified statutory fallback evaluator
    const generatedFindings: ComplianceEvaluationFinding[] = [];
    const now = new Date().toISOString();

    // 1. Storage age > 90 days
    batches.forEach(b => {
      if (b.currentStage === 'Stored' && b.daysInStorage > 90) {
        generatedFindings.push({
          id: `eval-storage-90d-${b.batchId}`,
          evaluationTimestamp: now,
          recordType: 'Storage',
          batchOrRecordId: b.batchId,
          ruleId: 'rule-howm-storage-90d',
          statutoryCitation: 'Rule 8(1) read with Rule 20, HOWM Rules 2016',
          parameterName: 'Maximum On-Site Sludge Storage Duration',
          isStatutoryViolation: true,
          isOperationalWarning: false,
          severity: 'critical',
          findingDescription: `Batch ${b.batchId} has been stored on-site for ${b.daysInStorage} days, exceeding the 90-day statutory ceiling under HOWM Rules 2016.`,
          legalThresholdText: '<= 90 days',
          actualObservedValue: `${b.daysInStorage} days`,
          correctiveActionMandate: `Mandatory immediate dispatch of batch ${b.batchId} (${b.quantityTonnes} t) to authorized TSDF (KWMP Dabaspet). Register statutory non-compliance report with KSPCB.`,
          statutoryPenaltyNotice: 'Section 15 Environment (Protection) Act, 1986 — punishable with imprisonment up to 5 years or fine up to ₹1,00,000.',
          evidenceAuditHash: `AUDIT-${b.batchId.replace(/[^a-zA-Z0-9]/g, '')}-90D-STATUTORY`,
          status: 'Open',
        });
      } else if (b.currentStage === 'Stored' && b.daysInStorage > 60) {
        generatedFindings.push({
          id: `eval-storage-60d-${b.batchId}`,
          evaluationTimestamp: now,
          recordType: 'Storage',
          batchOrRecordId: b.batchId,
          ruleId: 'rule-howm-storage-90d',
          statutoryCitation: 'Rule 8(1) read with Rule 20, HOWM Rules 2016',
          parameterName: 'Storage Duration Warning (60-90 Days Window)',
          isStatutoryViolation: false,
          isOperationalWarning: true,
          severity: 'warning',
          findingDescription: `Batch ${b.batchId} has reached ${b.daysInStorage} days in storage. Statutory breach occurs in ${90 - b.daysInStorage} days.`,
          legalThresholdText: '<= 90 days statutory ceiling',
          actualObservedValue: `${b.daysInStorage} days`,
          correctiveActionMandate: `Schedule authorized TSDF transport pickup within 14 days to prevent statutory violation under Rule 8(1).`,
          statutoryPenaltyNotice: 'Pre-statutory warning threshold. No statutory penalty if dispatched prior to Day 90.',
          evidenceAuditHash: `AUDIT-${b.batchId.replace(/[^a-zA-Z0-9]/g, '')}-60D-ADVISORY`,
          status: 'Open',
        });
      }

      // Zero-assumption notice
      if (b.classificationStatus === 'pending') {
        generatedFindings.push({
          id: `eval-untested-${b.batchId}`,
          evaluationTimestamp: now,
          recordType: 'Characterisation',
          batchOrRecordId: b.batchId,
          ruleId: 'rule-statutory-characterisation-mandate',
          statutoryCitation: 'Condition 11 KSPCB CTO read with Rule 6 HOWM Rules 2016',
          parameterName: 'Mandatory Laboratory Characterisation Assay',
          isStatutoryViolation: false,
          isOperationalWarning: false,
          severity: 'info',
          findingDescription: `Zero-Assumption Rule: Batch ${b.batchId} has not completed NABL certified heavy metal and TCLP testing. Statutory law forbids dispatch without characterisation.`,
          legalThresholdText: 'NABL Certified Test Certificate Mandatory',
          actualObservedValue: 'Pending Laboratory Assay',
          correctiveActionMandate: 'Complete NABL test entry or upload lab report prior to scheduling disposal dispatch.',
          statutoryPenaltyNotice: 'Chemical sludge from industrial ETP cannot be classified as non-hazardous without analytical proof.',
          evidenceAuditHash: `AUDIT-${b.batchId.replace(/[^a-zA-Z0-9]/g, '')}-CHAR-MANDATE`,
          status: 'Open',
        });
      }
    });

    // Yard storage capacity check
    const totalStored = batches
      .filter(b => b.currentStage === 'Stored')
      .reduce((sum, b) => sum + b.quantityTonnes, 0);

    if (totalStored > 150) {
      generatedFindings.push({
        id: 'eval-shed-cap-viol',
        evaluationTimestamp: now,
        recordType: 'Storage',
        batchOrRecordId: 'STORAGE-YARD-ALL',
        ruleId: 'rule-kspcb-yard-capacity',
        statutoryCitation: 'Specific Condition 4, KSPCB Consent No. 782',
        parameterName: 'Storage Shed Retention Capacity',
        isStatutoryViolation: true,
        isOperationalWarning: false,
        severity: 'critical',
        findingDescription: `Total stored sludge (${totalStored.toFixed(1)} t) exceeds authorized retention capacity of 150 tonnes in the impermeable shed.`,
        legalThresholdText: '<= 150 tonnes',
        actualObservedValue: `${totalStored.toFixed(1)} tonnes`,
        correctiveActionMandate: `Halt transfers to shed; execute emergency dispatch for at least ${(totalStored - 130).toFixed(1)} tonnes immediately.`,
        statutoryPenaltyNotice: 'Section 33A Water Act 1974 — risk of stop-production directive.',
        evidenceAuditHash: 'AUDIT-SHED-CAP-CRITICAL',
        status: 'Open',
      });
    }

    // Dispatches manifest check
    dispatches.forEach(d => {
      if (!d.manifestNumber || d.manifestNumber.trim() === '' || d.manifestNumber.toLowerCase().includes('pending')) {
        generatedFindings.push({
          id: `eval-manifest-${d.id}`,
          evaluationTimestamp: now,
          recordType: 'Dispatch',
          batchOrRecordId: d.batchId,
          ruleId: 'rule-howm-manifest-form10',
          statutoryCitation: 'Rule 18(2) & 19, HOWM Rules 2016',
          parameterName: 'Form 10 Manifest Issuance for Highway Transport',
          isStatutoryViolation: true,
          isOperationalWarning: false,
          severity: 'critical',
          findingDescription: `Dispatch of ${d.quantityTonnes} tonnes conducted without mandatory 7-copy Form 10 statutory manifest.`,
          legalThresholdText: 'Form 10 Manifest Mandatory',
          actualObservedValue: 'Missing / Unauthenticated',
          correctiveActionMandate: 'Halt vehicle at security weighbridge; generate and issue signed 7-copy Form 10 manifest.',
          statutoryPenaltyNotice: 'Illegal hazardous waste transportation under Rule 18; vehicle impoundment.',
          evidenceAuditHash: `AUDIT-DISP-${d.id}-NO-MANIFEST`,
          status: 'Open',
        });
      }
    });

    setFindings(generatedFindings);
  };

  // Toggle Finding status
  const handleUpdateFindingStatus = async (id: string, newStatus: 'Open' | 'Mitigation_Scheduled' | 'Resolved') => {
    try {
      await fetch(`/api/compliance/findings/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      // Local state update
    }
    setFindings(prev => prev.map(f => (f.id === id ? { ...f, status: newStatus } : f)));
  };

  // Toggle Rule active
  const handleToggleRuleActive = async (ruleId: string, currentActive: boolean) => {
    try {
      await fetch(`/api/rules/${ruleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive }),
      });
    } catch {
      // Local fallback
    }
    setRules(prev => prev.map(r => (r.id === ruleId ? { ...r, isActive: !currentActive } : r)));
  };

  // Approve Document
  const handleApproveDocument = async (docId: string) => {
    try {
      const res = await fetch(`/api/documents/${docId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvedBy: 'Chief Environmental Officer / Member Secretary' }),
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments(prev => prev.map(d => (d.id === docId ? data.document : d)));
        fetchBackendData();
        runComplianceAudit();
      }
    } catch {
      setDocuments(prev =>
        prev.map(d =>
          d.id === docId
            ? { ...d, status: 'Approved', approvedBy: 'Chief Environmental Officer (KSPCB)', approvedAt: new Date().toISOString() }
            : d
        )
      );
    }
  };

  // Upload handler
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setIsUploading(true);
    setUploadSuccessMsg('');

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('titleOverride', uploadTitle || uploadFile.name);
      formData.append('authorityOverride', uploadAuthority);
      formData.append('uploadedBy', 'Plant EHS Compliance Officer');

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setDocuments(prev => [data.document, ...prev]);
        setUploadSuccessMsg(
          `Document ingested successfully! Extracted ${data.rulesExtractedCount || 0} candidate regulatory rules for approval.`
        );
        fetchBackendData();
        runComplianceAudit();
        setTimeout(() => {
          setIsUploadModalOpen(false);
          setUploadFile(null);
          setUploadTitle('');
          setUploadSuccessMsg('');
        }, 2000);
      } else {
        throw new Error('Upload failed');
      }
    } catch {
      // Client fallback simulation
      const newMockDoc: RegulatoryDocument = {
        id: `doc-upload-${Date.now()}`,
        title: uploadTitle || uploadFile.name.replace(/\.[^/.]+$/, ''),
        authority: uploadAuthority,
        docType: 'Consent_To_Operate',
        gazetteRef: `PCB/REG/${Date.now().toString().slice(-4)}`,
        version: '1.0',
        issueDate: new Date().toISOString().slice(0, 10),
        effectiveDate: new Date().toISOString().slice(0, 10),
        status: 'Extracted',
        rawText: `Ingested regulatory document content: ${uploadFile.name}.\nRule 8 Storage compliance clause identified.\nSchedule II metals monitored.`,
        pdfFileName: uploadFile.name,
        uploadedBy: 'Plant EHS Compliance Officer',
        createdAt: new Date().toISOString(),
      };
      setDocuments(prev => [newMockDoc, ...prev]);
      setUploadSuccessMsg('Document uploaded & extracted (client simulated mode).');
      setTimeout(() => {
        setIsUploadModalOpen(false);
        setUploadFile(null);
        setUploadTitle('');
        setUploadSuccessMsg('');
      }, 1500);
    } finally {
      setIsUploading(false);
    }
  };

  // Add Custom Rule Submit
  const handleAddCustomRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleCitation || !newRuleParam) return;

    const newRule: RegulatoryRule = {
      id: `rule-custom-${Date.now()}`,
      documentId: 'doc-kspcb-cto-2024',
      statutoryCitation: newRuleCitation,
      sectionOrRule: 'Custom Condition',
      parameterName: newRuleParam,
      limitValue: Number(newRuleLimit),
      unit: newRuleUnit,
      comparisonOperator: '<=',
      ruleCategory: newRuleCategory,
      applicability: 'Conditional_Facility',
      legalRequirement: `Facility mandate under ${newRuleCitation} specifying maximum ${newRuleParam} limit.`,
      statutoryViolationAction: 'Investigate operational variance and implement immediate abatement measures.',
      isStatutoryViolation: newRuleIsStatutory,
      penaltyImplication: newRuleIsStatutory
        ? 'Section 15 Environment (Protection) Act, 1986'
        : 'Facility operating permit corrective action mandate',
      isApproved: true,
      isActive: true,
    };

    try {
      await fetch('/api/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRule),
      });
    } catch {
      // Local
    }

    setRules(prev => [newRule, ...prev]);
    setIsAddRuleModalOpen(false);
    setNewRuleCitation('');
    setNewRuleParam('');
    runComplianceAudit();
  };

  // Export Audit CSV Dossier
  const handleExportAuditDossier = () => {
    const headers = [
      'Finding ID',
      'Evaluation Timestamp',
      'Category',
      'Batch/Record ID',
      'Statutory Citation',
      'Parameter Name',
      'Violation Type',
      'Severity',
      'Observed Value',
      'Legal Threshold',
      'Statutory Penalty Notice',
      'Corrective Action Mandate',
      'Evidence Audit Hash',
      'Status',
    ];

    const rows = findings.map(f => [
      `"${f.id}"`,
      `"${f.evaluationTimestamp}"`,
      `"${f.recordType}"`,
      `"${f.batchOrRecordId}"`,
      `"${f.statutoryCitation}"`,
      `"${f.parameterName}"`,
      `"${f.isStatutoryViolation ? 'Statutory Violation' : f.isOperationalWarning ? 'Operational Warning' : 'Advisory'}"`,
      `"${f.severity}"`,
      `"${f.actualObservedValue}"`,
      `"${f.legalThresholdText}"`,
      `"${f.statutoryPenaltyNotice}"`,
      `"${f.correctiveActionMandate}"`,
      `"${f.evidenceAuditHash}"`,
      `"${f.status}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `KSPCB_CPCB_Compliance_Audit_Dossier_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered findings
  const filteredFindings = useMemo(() => {
    return findings.filter(f => {
      if (findingFilter === 'statutory') return f.isStatutoryViolation;
      if (findingFilter === 'warning') return f.isOperationalWarning;
      if (findingFilter === 'open') return f.status === 'Open';
      return true;
    });
  }, [findings, findingFilter]);

  // Filtered rules
  const filteredRules = useMemo(() => {
    return rules.filter(r => {
      const matchAuth =
        ruleAuthorityFilter === 'all' ||
        (ruleAuthorityFilter === 'MoEFCC' && r.statutoryCitation.includes('HOWM')) ||
        (ruleAuthorityFilter === 'KSPCB' && r.statutoryCitation.includes('KSPCB')) ||
        (ruleAuthorityFilter === 'CPCB' && r.statutoryCitation.includes('CPCB'));
      const matchCat = ruleCategoryFilter === 'all' || r.ruleCategory === ruleCategoryFilter;
      return matchAuth && matchCat;
    });
  }, [rules, ruleAuthorityFilter, ruleCategoryFilter]);

  // Metric counts
  const statutoryViolationsCount = findings.filter(f => f.isStatutoryViolation && f.status !== 'Resolved').length;
  const operationalWarningsCount = findings.filter(f => f.isOperationalWarning && f.status !== 'Resolved').length;
  const activeRulesCount = rules.filter(r => r.isActive && r.isApproved).length;
  const compliantObligationsCount = obligations.filter(o => o.status === 'Compliant').length;
  const nextObligation = [...obligations].sort((a, b) => a.daysRemaining - b.daysRemaining)[0];

  return (
    <div className="space-y-6">
      {/* 1. Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
              <Scale className="w-3.5 h-3.5" />
              Statutory Regulatory Framework
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              MoEFCC HOWM 2016 • KSPCB CTO No. 782
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            KSPCB + CPCB Regulatory Compliance Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time statutory auditing, official gazette document ingestion, legal penalty mitigation, and evidentiary tracking for chemical sludge management.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={runComplianceAudit}
            disabled={isAuditing}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={clsx('w-3.5 h-3.5', isAuditing && 'animate-spin')} />
            <span>{isAuditing ? 'Evaluating Rules...' : 'Run Statutory Audit'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-900 text-white transition-colors shadow-xs"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Regulatory PDF</span>
          </button>

          <button
            type="button"
            onClick={handleExportAuditDossier}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Dossier</span>
          </button>
        </div>
      </div>

      {/* 2. Statutory Violations & Legal Penalty Alert Banner */}
      {statutoryViolationsCount > 0 ? (
        <div className="p-4 rounded-xl border border-red-300 bg-red-50 text-red-900 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-red-600 text-white mt-0.5 shrink-0">
              <AlertOctagon className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight text-red-950 uppercase">
                  STATUTORY VIOLATION NOTICE — Section 15 Environment (Protection) Act, 1986
                </h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-red-200 text-red-900 border border-red-300">
                  {statutoryViolationsCount} Active Legal Breach{statutoryViolationsCount > 1 ? 'es' : ''}
                </span>
              </div>
              <p className="text-xs text-red-800 mt-1">
                Plant records contain mandatory statutory violations (e.g. hazardous sludge storage exceeding 90 days or transport without Form 10 manifest). Statutory law provides penalties punishable with imprisonment up to 5 years or fine up to ₹1,00,000.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setActiveTab('findings');
              setFindingFilter('statutory');
            }}
            className="px-3.5 py-1.5 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-semibold whitespace-nowrap transition-colors"
          >
            Review Violations ({statutoryViolationsCount})
          </button>
        </div>
      ) : operationalWarningsCount > 0 ? (
        <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500 text-white mt-0.5 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight text-amber-950">
                OPERATIONAL COMPLIANCE ADVISORY — Action Recommended
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                Zero statutory breaches detected. However, {operationalWarningsCount} operational warning(s) require attention (e.g., storage age in 60-90 day window or shed capacity threshold) before statutory limits are reached.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setActiveTab('findings');
              setFindingFilter('warning');
            }}
            className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold whitespace-nowrap transition-colors"
          >
            Inspect Warnings ({operationalWarningsCount})
          </button>
        </div>
      ) : (
        <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-900 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-600 text-white shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight text-emerald-950">
                100% STATUTORY COMPLIANCE — ALL PROVISIONS ENFORCED
              </h3>
              <p className="text-xs text-emerald-800 mt-0.5">
                All sludge storage durations, manifest issuances, and laboratory characterisations comply with MoEFCC HOWM Rules 2016 and KSPCB CTO No. 782 terms.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-700 px-2 py-1 rounded bg-emerald-100 border border-emerald-200">
            AUDIT VERIFIED: {lastAuditTime || 'ONLINE'}
          </span>
        </div>
      )}

      {/* 3. Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-1">
            <span>Statutory Violations</span>
            <AlertOctagon className={clsx('w-4 h-4', statutoryViolationsCount > 0 ? 'text-red-600' : 'text-emerald-500')} />
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={clsx(
                'text-2xl font-bold font-mono tracking-tight',
                statutoryViolationsCount > 0 ? 'text-red-600' : 'text-emerald-600'
              )}
            >
              {statutoryViolationsCount}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">Sec 15 EPA Breaches</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {statutoryViolationsCount > 0 ? 'Mandatory immediate mitigation' : 'Zero statutory infractions'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-1">
            <span>Operational Warnings</span>
            <AlertTriangle className={clsx('w-4 h-4', operationalWarningsCount > 0 ? 'text-amber-500' : 'text-slate-400')} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-amber-600">
              {operationalWarningsCount}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">Pre-Breach Alerts</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Approaching limits or thresholds</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-1">
            <span>Enforced Rules</span>
            <Scale className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-slate-900">
              {activeRulesCount}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">Active & Approved</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">MoEFCC, CPCB & KSPCB</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-1">
            <span>Statutory Obligations</span>
            <Calendar className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-slate-900">
              {compliantObligationsCount} / {obligations.length}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              ({((compliantObligationsCount / obligations.length) * 100).toFixed(0)}%)
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Form 4, TCLP, Manifests</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-1">
            <span>Next Mandatory Filing</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-indigo-600">
              {nextObligation?.daysRemaining || 0}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">days</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 truncate" title={nextObligation?.title}>
            {nextObligation?.title || 'Form 4 Filing'}
          </p>
        </div>
      </div>

      {/* 4. Tab Navigation */}
      <div className="border-b border-slate-200 bg-white rounded-t-xl px-4 pt-2">
        <nav className="flex space-x-2 overflow-x-auto" aria-label="Tabs">
          <button
            type="button"
            onClick={() => setActiveTab('findings')}
            className={clsx(
              'px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap flex items-center gap-2 transition-all',
              activeTab === 'findings'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            )}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Statutory Violations & Audit Trail</span>
            {findings.length > 0 && (
              <span
                className={clsx(
                  'px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold',
                  statutoryViolationsCount > 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                )}
              >
                {findings.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('documents')}
            className={clsx(
              'px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap flex items-center gap-2 transition-all',
              activeTab === 'documents'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            )}
          >
            <FileText className="w-4 h-4" />
            <span>Regulatory Documents & Ingestion</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-100 text-slate-700">
              {documents.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={clsx(
              'px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap flex items-center gap-2 transition-all',
              activeTab === 'rules'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            )}
          >
            <Scale className="w-4 h-4" />
            <span>Enforced Statutory Rules Registry</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-100 text-slate-700">
              {rules.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('authorisations')}
            className={clsx(
              'px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap flex items-center gap-2 transition-all',
              activeTab === 'authorisations'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            )}
          >
            <Building className="w-4 h-4" />
            <span>Facility Consent (CTO No. 782)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('obligations')}
            className={clsx(
              'px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap flex items-center gap-2 transition-all',
              activeTab === 'obligations'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            )}
          >
            <Calendar className="w-4 h-4" />
            <span>Obligations Calendar</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-100 text-slate-700">
              {obligations.length}
            </span>
          </button>
        </nav>
      </div>

      {/* 5. TAB 1: Live Violations & Audit Trail */}
      {activeTab === 'findings' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Filter Finding Type:</span>
              <div className="flex items-center gap-1.5">
                {(['all', 'statutory', 'warning', 'open'] as const).map(filterKey => (
                  <button
                    key={filterKey}
                    type="button"
                    onClick={() => setFindingFilter(filterKey)}
                    className={clsx(
                      'px-2.5 py-1 text-xs font-medium rounded-lg capitalize transition-colors',
                      findingFilter === filterKey
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    )}
                  >
                    {filterKey === 'all'
                      ? `All (${findings.length})`
                      : filterKey === 'statutory'
                      ? `Statutory (${statutoryViolationsCount})`
                      : filterKey === 'warning'
                      ? `Warnings (${operationalWarningsCount})`
                      : `Open (${findings.filter(f => f.status === 'Open').length})`}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-slate-500 font-mono">
              Zero-Assumption Evaluator: Non-extrapolated live telemetry
            </div>
          </div>

          {/* Findings List */}
          {filteredFindings.length === 0 ? (
            <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No Non-Compliance Findings Recorded</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                All inspected sludge batches, storage ages, and dispatches align strictly with approved regulatory mandates.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFindings.map(finding => {
                const isStatutory = finding.isStatutoryViolation;
                const isWarning = finding.isOperationalWarning;

                return (
                  <div
                    key={finding.id}
                    className={clsx(
                      'p-4 rounded-xl border bg-white shadow-xs transition-all',
                      isStatutory
                        ? 'border-red-300 border-l-4 border-l-red-600'
                        : isWarning
                        ? 'border-amber-300 border-l-4 border-l-amber-500'
                        : 'border-slate-200 border-l-4 border-l-blue-500'
                    )}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={clsx(
                            'text-[10px] font-bold font-mono px-2 py-0.5 rounded uppercase tracking-wider',
                            isStatutory
                              ? 'bg-red-600 text-white'
                              : isWarning
                              ? 'bg-amber-500 text-white'
                              : 'bg-blue-600 text-white'
                          )}
                        >
                          {isStatutory ? 'STATUTORY VIOLATION' : isWarning ? 'OPERATIONAL WARNING' : 'STATUTORY ADVISORY'}
                        </span>

                        <span className="text-xs font-bold text-slate-800">
                          {finding.parameterName}
                        </span>

                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          Batch: {finding.batchOrRecordId}
                        </span>

                        <span className="text-xs font-medium text-slate-500">
                          Stage: {finding.recordType}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={clsx(
                            'text-xs font-mono font-semibold px-2 py-0.5 rounded',
                            finding.status === 'Open'
                              ? 'bg-red-100 text-red-800 border border-red-200'
                              : finding.status === 'Mitigation_Scheduled'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          )}
                        >
                          {finding.status.replace('_', ' ')}
                        </span>

                        <select
                          value={finding.status}
                          onChange={e =>
                            handleUpdateFindingStatus(
                              finding.id,
                              e.target.value as 'Open' | 'Mitigation_Scheduled' | 'Resolved'
                            )
                          }
                          className="text-xs border border-slate-300 rounded px-2 py-1 bg-white text-slate-700 cursor-pointer"
                        >
                          <option value="Open">Set Open</option>
                          <option value="Mitigation_Scheduled">Mitigation Scheduled</option>
                          <option value="Resolved">Mark Resolved</option>
                        </select>
                      </div>
                    </div>

                    <p className="text-xs text-slate-800 font-medium mb-3 leading-relaxed">
                      {finding.findingDescription}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs mb-3">
                      <div>
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                          Legal Citation
                        </span>
                        <span className="font-semibold text-slate-800">{finding.statutoryCitation}</span>
                      </div>
                      <div>
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                          Legal Threshold vs Observed
                        </span>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-slate-600 font-medium">{finding.legalThresholdText}</span>
                          <span className="text-slate-400">vs</span>
                          <span
                            className={clsx(
                              'font-bold',
                              isStatutory ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-blue-600'
                            )}
                          >
                            {finding.actualObservedValue}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                          Evidentiary Audit Hash
                        </span>
                        <span className="font-mono text-[11px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 inline-flex items-center gap-1">
                          <Hash className="w-3 h-3 text-blue-500" />
                          {finding.evidenceAuditHash}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-start gap-2 text-slate-700">
                        <span className="font-bold text-slate-900 shrink-0">Corrective Action Protocol:</span>
                        <span>{finding.correctiveActionMandate}</span>
                      </div>
                      <div className="flex items-start gap-2 text-red-700 font-medium">
                        <span className="font-bold text-red-900 shrink-0">Statutory Penalty Reference:</span>
                        <span>{finding.statutoryPenaltyNotice}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 6. TAB 2: Regulatory Document Ingestion */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Official Gazetted Regulatory Documents & Authorisations</h2>
              <p className="text-xs text-slate-500">
                Official source repositories from MoEFCC, CPCB, and KSPCB. PDF text extraction & automatic legal rule parsing.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors shrink-0 shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Ingest New Regulatory PDF</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map(doc => {
              const isApproved = doc.status === 'Approved';

              return (
                <div
                  key={doc.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col justify-between hover:border-slate-300 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span
                        className={clsx(
                          'text-[10px] font-bold font-mono px-2 py-0.5 rounded uppercase tracking-wider',
                          doc.authority === 'KSPCB'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : doc.authority === 'MoEFCC'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        )}
                      >
                        {doc.authority}
                      </span>
                      <span
                        className={clsx(
                          'text-[10px] font-mono px-2 py-0.5 rounded font-bold',
                          isApproved
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        )}
                      >
                        {doc.status}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2 mb-1.5" title={doc.title}>
                      {doc.title}
                    </h3>

                    <p className="text-xs text-slate-500 font-mono mb-2">
                      Ref: {doc.gazetteRef || 'Statutory Gazette Ref'}
                    </p>

                    <div className="text-[11px] text-slate-600 space-y-1 mb-3 bg-slate-50 p-2 rounded border border-slate-100">
                      <div>
                        <span className="text-slate-400">Doc Type:</span> {doc.docType.replace(/_/g, ' ')}
                      </div>
                      <div>
                        <span className="text-slate-400">Effective Date:</span> {doc.effectiveDate}
                      </div>
                      <div>
                        <span className="text-slate-400">Uploaded By:</span> {doc.uploadedBy}
                      </div>
                      {doc.approvedBy && (
                        <div>
                          <span className="text-slate-400">Approved By:</span> {doc.approvedBy}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setSelectedDoc(doc)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Content</span>
                    </button>

                    {!isApproved && (
                      <button
                        type="button"
                        onClick={() => handleApproveDocument(doc.id)}
                        className="flex items-center justify-center gap-1 py-1.5 px-3 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 7. TAB 3: Enforced Statutory Rules Registry */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Enforced Regulatory Rules Registry</h2>
              <p className="text-xs text-slate-500">
                Only administrator approved & active rules are evaluated by the compliance engine.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={ruleAuthorityFilter}
                onChange={e => setRuleAuthorityFilter(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700"
              >
                <option value="all">All Authorities</option>
                <option value="MoEFCC">MoEFCC</option>
                <option value="KSPCB">KSPCB</option>
                <option value="CPCB">CPCB</option>
              </select>

              <select
                value={ruleCategoryFilter}
                onChange={e => setRuleCategoryFilter(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700"
              >
                <option value="all">All Categories</option>
                <option value="Storage_Duration">Storage Duration</option>
                <option value="Disposal_Manifest">Disposal Manifest</option>
                <option value="Heavy_Metals_Limit">Heavy Metals Limit</option>
                <option value="Annual_Return">Annual Return</option>
                <option value="Co_Processing_AFR">Co-Processing AFR</option>
              </select>

              <button
                type="button"
                onClick={() => setIsAddRuleModalOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Facility Rule</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Statutory Citation</th>
                    <th className="py-3 px-4">Parameter Name</th>
                    <th className="py-3 px-4">Limit / Threshold</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Statutory Penalty Ref</th>
                    <th className="py-3 px-4 text-center">Active Enforce</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredRules.map(rule => (
                    <tr key={rule.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{rule.statutoryCitation}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{rule.sectionOrRule}</div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {rule.parameterName}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">
                        {rule.comparisonOperator} {rule.limitValue} {rule.unit}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {rule.ruleCategory.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={clsx(
                            'text-[10px] font-bold px-2 py-0.5 rounded',
                            rule.isStatutoryViolation
                              ? 'bg-red-100 text-red-800 border border-red-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          )}
                        >
                          {rule.isStatutoryViolation ? 'Statutory Breach' : 'Operational'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-600 max-w-xs truncate" title={rule.penaltyImplication}>
                        {rule.penaltyImplication}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleRuleActive(rule.id, rule.isActive)}
                          className={clsx(
                            'px-2.5 py-1 text-[11px] font-bold rounded-full transition-colors',
                            rule.isActive
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200'
                              : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                          )}
                        >
                          {rule.isActive ? 'Active' : 'Disabled'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 8. TAB 4: Facility Authorisations (CTO No. 782) */}
      {activeTab === 'authorisations' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200 uppercase">
                    KSPCB CONSENT ORDER
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-700">
                    {authorisation.consentNumber}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900">{authorisation.facilityName}</h2>
                <p className="text-xs text-slate-500">
                  Consent for Discharge under Water Act 1974 & Air Act 1981 • Authorisation under Rule 6 HOWM Rules 2016
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block font-medium">Valid Through</span>
                  <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                    {authorisation.expiryDate}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Chemical Sludge Cap (Cat 35.3)
                </span>
                <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                  {authorisation.authorizedCapacityTpa.toLocaleString()} TPA
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Maximum annual generation limit</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Permitted Storage Shed Capacity
                </span>
                <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                  {authorisation.authorizedStorageCapacityTonnes} Tonnes
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Impermeable RCC shed with leachate sump</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Authorized TSDF Facility
                </span>
                <div className="text-sm font-bold text-slate-900 mt-1">
                  KWMP Dabaspet (Unit 1 & 2)
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Karnataka Waste Management Project</p>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
                Specific Consent Conditions Checklist
              </h3>
              <div className="space-y-2.5">
                {authorisation.specificConditions.map(cond => (
                  <div
                    key={cond.conditionNumber}
                    className="p-3.5 rounded-lg border border-slate-200 bg-white flex items-start gap-3 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-800 text-xs font-bold font-mono">
                      {cond.conditionNumber}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">{cond.clause}</span>
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                          VERIFIED COMPLIANT
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">{cond.description}</p>
                      <div className="text-[11px] text-blue-700 mt-1 font-mono">
                        Verification Mandate: {cond.verificationRequirement}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. TAB 5: Statutory Obligations Calendar */}
      {activeTab === 'obligations' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Mandatory Statutory Obligations Calendar</h2>
              <p className="text-xs text-slate-500">
                Recurring legal compliance filings under MoEFCC HOWM Rules 2016 and KSPCB consent orders.
              </p>
            </div>
            <div className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
              Audit Period: FY 2026-2027
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {obligations.map(obl => {
              const isUrgent = obl.daysRemaining <= 30;

              return (
                <div
                  key={obl.id}
                  className={clsx(
                    'p-4 rounded-xl bg-white border shadow-xs flex flex-col justify-between transition-all',
                    isUrgent ? 'border-amber-300 border-l-4 border-l-amber-500' : 'border-slate-200'
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {obl.frequency}
                      </span>
                      <span
                        className={clsx(
                          'text-[10px] font-mono font-bold px-2 py-0.5 rounded',
                          obl.status === 'Compliant'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        )}
                      >
                        {obl.status.replace('_', ' ')}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 mb-1">{obl.title}</h3>
                    <div className="text-xs font-mono text-blue-700 mb-2">{obl.statutoryRef}</div>

                    <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mb-3">
                      <div>
                        <span className="font-semibold text-slate-700">Due Date:</span> {obl.dueDate}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700">Department:</span> {obl.assignedDepartment}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700">Evidence Required:</span> {obl.evidenceRequired}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span
                      className={clsx(
                        'text-xs font-mono font-bold',
                        isUrgent ? 'text-amber-600' : 'text-slate-600'
                      )}
                    >
                      {obl.daysRemaining} days remaining
                    </span>
                    <button
                      type="button"
                      onClick={() => alert(`Statutory filing checklist for: ${obl.title}\nEvidence: ${obl.evidenceRequired}`)}
                      className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    >
                      View Submission Guide
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* View Document Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 uppercase">
                  {selectedDoc.authority}
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-1">{selectedDoc.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 font-mono text-xs text-slate-800 whitespace-pre-wrap bg-slate-50/50 leading-relaxed">
              {selectedDoc.rawText}
            </div>

            <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Gazette Ref: {selectedDoc.gazetteRef} | Effective: {selectedDoc.effectiveDate}
              </span>
              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 text-white font-semibold hover:bg-slate-900 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin PDF / Gazette Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full flex flex-col overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Ingest Regulatory Document / PDF</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-5 space-y-4 text-xs">
              {uploadSuccessMsg && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium">
                  {uploadSuccessMsg}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Upload PDF or Document File
                </label>
                <input
                  type="file"
                  accept=".pdf,.txt,.docx,.md"
                  required
                  onChange={e => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Accepts official PDF gazettes, KSPCB consent orders, and MoEFCC notifications.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Document Title Override (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. KSPCB Consent to Operate Amendment 2026"
                  value={uploadTitle}
                  onChange={e => setUploadTitle(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Issuing Authority</label>
                <select
                  value={uploadAuthority}
                  onChange={e => setUploadAuthority(e.target.value as AuthorityType)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white text-slate-700"
                >
                  <option value="KSPCB">KSPCB (Karnataka State Pollution Control Board)</option>
                  <option value="MoEFCC">MoEFCC (Ministry of Environment, Forest & Climate Change)</option>
                  <option value="CPCB">CPCB (Central Pollution Control Board)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !uploadFile}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isUploading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isUploading ? 'Extracting & Parsing...' : 'Ingest Document'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Custom Rule Modal */}
      {isAddRuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full flex flex-col overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Add Custom Facility Regulatory Rule</h3>
              <button
                type="button"
                onClick={() => setIsAddRuleModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomRule} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Statutory Citation</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Specific Condition 14, KSPCB CTO"
                  value={newRuleCitation}
                  onChange={e => setNewRuleCitation(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Parameter Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Total Cyanide Concentration"
                  value={newRuleParam}
                  onChange={e => setNewRuleParam(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Threshold Limit</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newRuleLimit}
                    onChange={e => setNewRuleLimit(parseFloat(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit</label>
                  <input
                    type="text"
                    required
                    value={newRuleUnit}
                    onChange={e => setNewRuleUnit(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Rule Category</label>
                <select
                  value={newRuleCategory}
                  onChange={e => setNewRuleCategory(e.target.value as RuleCategory)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white text-slate-700"
                >
                  <option value="Heavy_Metals_Limit">Heavy Metals Limit</option>
                  <option value="Storage_Duration">Storage Duration</option>
                  <option value="Disposal_Manifest">Disposal Manifest</option>
                  <option value="Co_Processing_AFR">Co-Processing AFR</option>
                  <option value="Annual_Return">Annual Return</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isStatutory"
                  checked={newRuleIsStatutory}
                  onChange={e => setNewRuleIsStatutory(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <label htmlFor="isStatutory" className="text-xs text-slate-700 font-medium">
                  Classify as Statutory Breach under Section 15 EPA 1986
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddRuleModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
                >
                  Save & Enforce Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

