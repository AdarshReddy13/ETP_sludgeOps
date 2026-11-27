import { RegulatoryDocument, RegulatoryRule, FacilityAuthorisation, ComplianceObligation } from '../models/types.js';

export const OFFICIAL_DOCUMENTS_SEED: RegulatoryDocument[] = [
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
    rawText: `MINISTRY OF ENVIRONMENT, FOREST AND CLIMATE CHANGE NOTIFICATION
New Delhi, the 4th April, 2016
G.S.R. 395(E).—In exercise of the powers conferred by sections 6, 8 and 25 of the Environment (Protection) Act, 1986 (29 of 1986), the Central Government hereby makes the following rules:

Rule 8. Storage of hazardous and other wastes:
(1) The occupier may store the hazardous and other wastes for a period not exceeding ninety days and shall maintain a record of sale, transfer, storage of such wastes and make these records available for inspection:
Provided that the State Pollution Control Board may extend the said period of ninety days in following cases, namely:
(i) small generators up to ten tonnes per annum;
(ii) occupiers who do not have access to any common treatment, storage and disposal facility.

Rule 18. Transportation of hazardous and other wastes:
(1) The transport and handling of hazardous and other wastes shall be in accordance with the provisions of the rules and guidelines issued by the Central Pollution Control Board.
(2) The sender of the waste shall issue seven copies of the manifest in Form 10 to the transporter.

Rule 20. Submission of Annual Returns:
(2) The occupier handling hazardous wastes shall submit annual returns to the State Pollution Control Board in Form 4 on or before the 30th day of June following the financial year to which that return relates.

Schedule II: List of waste constituents with concentration limits:
Class A:
Lead (Pb) - 50 mg/kg
Cadmium (Cd) - 5 mg/kg
Total Chromium (Cr) - 50 mg/kg
Nickel (Ni) - 50 mg/kg
Copper (Cu) - 5,000 mg/kg
Zinc (Zn) - 20,000 mg/kg
Cyanide - 50 mg/kg
Phenolic compounds - 50 mg/kg`,
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
    rawText: `KARNATAKA STATE POLLUTION CONTROL BOARD
"Parisara Bhavana", Church Street, Bengaluru - 560001
Consent for Discharge of Effluent under Section 25 of Water Act 1974 & Section 21 of Air Act 1981 and Authorisation under Rule 6 of Hazardous and Other Wastes Rules 2016.

1. Consent is granted to M/s Quadcore Unit 4, Dabaspet Industrial Area, Bengaluru Rural.
2. The quantity of Chemical Sludge from Wastewater Treatment (Schedule I, Cat 35.3) shall not exceed 2,500 TPA.
3. Specific Condition 4: The industry shall store the dewatered hazardous sludge on an impermeable pucca concrete platform with a dedicated leachate collection sump having an on-site retention capacity not exceeding 150 tonnes.
4. Specific Condition 7: The industry shall dispatch dewatered sludge exclusively to the authorized TSDF facility (Karnataka Waste Management Project - KWMP Dabaspet) with GPS tracked authorized vehicles and Form 10 manifests.
5. Specific Condition 11: Sludge characterization with heavy metals and TCLP leachability shall be conducted quarterly through a NABL-accredited or KSPCB-recognized laboratory.`,
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
    rawText: `CENTRAL POLLUTION CONTROL BOARD (Ministry of Environment, Forest & Climate Change)
Guidelines on Co-Processing of Hazardous and Other Wastes in Cement Kilns as Alternative Fuel and Raw Material (AFR).

Clause 3.2 Criteria for acceptance of ETP Chemical Sludge:
(a) Net Calorific Value: Recommended > 2,500 kcal/kg for thermal substitution.
(b) Moisture Content: Dewatered sludge shall not exceed 30% moisture by weight for direct co-processing feed; higher moisture cake requires pre-drying.
(c) Total Chlorine & Halogens: Shall not exceed 1.0% to avoid corrosion of kiln pre-calciner.
(d) Heavy Metals: Total mercury (Hg) < 10 mg/kg, Total Cadmium + Thallium < 100 mg/kg.`,
    pdfFileName: 'CPCB_Guidelines_Cement_Kiln_CoProcessing.pdf',
    uploadedBy: 'Central Legal Registry (CPCB)',
    approvedBy: 'CPCB Hazardous Waste Division Head',
    approvedAt: '2026-01-20T09:15:00Z',
    createdAt: '2026-01-20T09:15:00Z',
  },
];

export const OFFICIAL_RULES_SEED: RegulatoryRule[] = [
  // 1. Statutory 90-Day Storage Limit (MoEFCC Rule 8/20)
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
    legalRequirement: 'Hazardous waste shall not be stored on-site for a period exceeding ninety (90) days from generation date without prior SPCB written extension.',
    statutoryViolationAction: 'Mandatory immediate dispatch to authorized TSDF facility; register non-compliance incident report to SPCB.',
    isStatutoryViolation: true,
    penaltyImplication: 'Violation of Section 15 Environment (Protection) Act, 1986 — punishable with imprisonment up to 5 years or fine up to ₹1,00,000.',
    isApproved: true,
    isActive: true,
  },

  // 2. Form 10 Manifest Requirement (MoEFCC Rule 18 & 19)
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
    legalRequirement: 'The sender shall issue seven copies of statutory manifest in Form 10 before hazardous waste departs plant gate for transport.',
    statutoryViolationAction: 'Halt vehicle transport immediately; generate Form 10 manifest with authorized transporter registration and TSDF destination.',
    isStatutoryViolation: true,
    penaltyImplication: 'Illegal transport of hazardous waste under Rule 18; seizure of vehicle and suspension of hazardous waste authorization.',
    isApproved: true,
    isActive: true,
  },

  // 3. Schedule II Heavy Metals - Lead (Pb) Limit
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
    legalRequirement: 'Concentration of Lead (Pb) in sludge shall not exceed 50 mg/kg dry weight for non-hazardous classification; concentrations exceeding 50 mg/kg classify sludge as Hazardous Class A.',
    statutoryViolationAction: 'Classify batch as Hazardous Class A; mandate secured TSDF landfilling or stabilization prior to containment.',
    isStatutoryViolation: true,
    penaltyImplication: 'Misclassification of hazardous waste under Rule 6.',
    isApproved: true,
    isActive: true,
  },

  // 4. Schedule II Heavy Metals - Total Chromium (Cr) Limit
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
    legalRequirement: 'Concentration of Total Chromium shall not exceed 50 mg/kg dry solids. Levels above 50 mg/kg mandate hazardous classification.',
    statutoryViolationAction: 'Enforce hazardous classification; inspect upstream chrome reduction/precipitation stage.',
    isStatutoryViolation: true,
    penaltyImplication: 'Regulatory enforcement notice under Environment Protection Rules.',
    isApproved: true,
    isActive: true,
  },

  // 5. Schedule II Heavy Metals - Cadmium (Cd) Limit
  {
    id: 'rule-sched2-cd',
    documentId: 'doc-moefcc-howm-2016',
    statutoryCitation: 'Schedule II, Class A, HOWM Rules 2016',
    sectionOrRule: 'Schedule II Class A',
    parameterName: 'Cadmium (Cd) Concentration',
    limitValue: 5.0,
    unit: 'mg/kg',
    comparisonOperator: '<=',
    ruleCategory: 'Heavy_Metals_Limit',
    applicability: 'Mandatory_Statutory',
    legalRequirement: 'Concentration of Cadmium (Cd) shall not exceed 5.0 mg/kg dry weight. High bioaccumulation potential.',
    statutoryViolationAction: 'Isolate affected batch; conduct leachability assessment (TCLP); designate for secured hazardous landfill.',
    isStatutoryViolation: true,
    penaltyImplication: 'Hazardous Waste Rule 6 statutory violation.',
    isApproved: true,
    isActive: true,
  },

  // 6. Schedule II Heavy Metals - Nickel (Ni) Limit
  {
    id: 'rule-sched2-ni',
    documentId: 'doc-moefcc-howm-2016',
    statutoryCitation: 'Schedule II, Class A, HOWM Rules 2016',
    sectionOrRule: 'Schedule II Class A',
    parameterName: 'Nickel (Ni) Concentration',
    limitValue: 50.0,
    unit: 'mg/kg',
    comparisonOperator: '<=',
    ruleCategory: 'Heavy_Metals_Limit',
    applicability: 'Mandatory_Statutory',
    legalRequirement: 'Concentration of Nickel (Ni) shall not exceed 50 mg/kg dry solids.',
    statutoryViolationAction: 'Designate batch as hazardous; evaluate metal recovery or TSDF stabilization route.',
    isStatutoryViolation: true,
    penaltyImplication: 'Schedule II concentration limit breach.',
    isApproved: true,
    isActive: true,
  },

  // 7. KSPCB Specific Condition 4: Maximum Storage Shed Capacity
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
    legalRequirement: 'On-site hazardous sludge storage inventory shall not exceed authorized capacity of 150 tonnes inside impermeable RCC shed.',
    statutoryViolationAction: 'Halt additional sludge accumulation; expedite emergency dispatch manifests to KWMP Dabaspet.',
    isStatutoryViolation: true,
    penaltyImplication: 'Breach of KSPCB Consent to Operate; risk of stop-production directive under Section 33A Water Act.',
    isApproved: true,
    isActive: true,
  },

  // 8. Form 4 Annual Returns Filing Due Date (June 30)
  {
    id: 'rule-howm-annual-return-form4',
    documentId: 'doc-moefcc-howm-2016',
    statutoryCitation: 'Rule 20(2), HOWM Rules 2016',
    sectionOrRule: 'Rule 20(2)',
    parameterName: 'Annual Return Form 4 Submission Deadline',
    limitValue: 30, // June 30
    unit: 'June deadline',
    comparisonOperator: '<=',
    ruleCategory: 'Annual_Return',
    applicability: 'Mandatory_Statutory',
    legalRequirement: 'Occupier shall submit annual returns in Form 4 to KSPCB on or before the 30th day of June following financial year.',
    statutoryViolationAction: 'Compile annual hazardous waste inventory, manifests and TSDF disposal certificates and file online through KSPCB portal.',
    isStatutoryViolation: true,
    penaltyImplication: 'Notice under Rule 20 for failure to report hazardous waste generation and disposal.',
    isApproved: true,
    isActive: true,
  },

  // 9. CPCB Cement Kiln Co-Processing Moisture Threshold (< 30%)
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
    legalRequirement: 'Dewatered chemical sludge intended for cement kiln co-processing (AFR) shall have moisture content not exceeding 30% by weight.',
    statutoryViolationAction: 'Sludge cake with >30% moisture cannot be accepted for direct kiln feeding; apply thermal/solar drying or route to TSDF landfill.',
    isStatutoryViolation: false, // Technical facility acceptance criteria, not penal statutory violation
    penaltyImplication: 'Rejection of waste shipment by cement plant operator at gate.',
    isApproved: true,
    isActive: true,
  },
];

export const FACILITY_AUTHORISATION_SEED: FacilityAuthorisation = {
  id: 'auth-kspcb-apex-unit4',
  facilityName: 'Quadcore - Unit 4 (Zero Liquid Discharge)',
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

export const COMPLIANCE_OBLIGATIONS_SEED: ComplianceObligation[] = [
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

