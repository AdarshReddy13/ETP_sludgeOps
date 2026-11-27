export type AuthorityType = 'MoEFCC' | 'CPCB' | 'KSPCB';
export type DocType = 'Statutory_Rule' | 'Gazette_Notification' | 'Consent_To_Operate' | 'HWA_Form_2' | 'Technical_Guideline';
export type DocStatus = 'Draft' | 'Extracted' | 'Under_Review' | 'Approved' | 'Archived';
export type RuleCategory = 'Storage_Duration' | 'Disposal_Manifest' | 'Heavy_Metals_Limit' | 'Effluent_Discharge' | 'Annual_Return' | 'Co_Processing_AFR';
export type RuleApplicability = 'Mandatory_Statutory' | 'Conditional_Facility' | 'Recommended_Best_Practice';
export type ObligationStatus = 'Compliant' | 'Due_Soon' | 'Overdue' | 'Exempt';

export interface RegulatoryDocument {
  id: string;
  title: string;
  authority: AuthorityType;
  docType: DocType;
  gazetteRef: string;
  version: string;
  issueDate: string;
  effectiveDate: string;
  status: DocStatus;
  rawText: string;
  pdfFileName?: string;
  pdfPath?: string;
  uploadedBy: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
}

export interface RegulatoryRule {
  id: string;
  documentId: string;
  statutoryCitation: string; // e.g. "Rule 20(1) HOWM Rules 2016"
  sectionOrRule: string; // "Rule 20"
  parameterName: string; // "Maximum Storage Duration", "Lead (Pb) Concentration", etc.
  limitValue: number;
  unit: string; // "days", "mg/kg", "mg/L", "%"
  comparisonOperator: '<=' | '>=' | '<' | '>' | '==' | '!=' | 'contains';
  ruleCategory: RuleCategory;
  applicability: RuleApplicability;
  legalRequirement: string;
  statutoryViolationAction: string;
  isStatutoryViolation: boolean; // true = statutory breach; false = operational threshold
  penaltyImplication: string; // Legal reference, e.g. "Section 15 Environment (Protection) Act 1986"
  isApproved: boolean;
  isActive: boolean;
}

export interface FacilityAuthorisation {
  id: string;
  facilityName: string;
  authority: AuthorityType;
  consentType: 'CTO_Air_Water' | 'HWA_Form_2';
  consentNumber: string;
  issueDate: string;
  expiryDate: string;
  authorizedCapacityTpa: number; // Tonnes Per Annum
  authorizedStorageCapacityTonnes: number;
  specificConditions: {
    conditionNumber: number;
    clause: string;
    description: string;
    verificationRequirement: string;
  }[];
  status: 'Active' | 'Renewal_Due' | 'Expired';
}

export interface ComplianceObligation {
  id: string;
  authorisationId?: string;
  title: string;
  statutoryRef: string; // "Rule 20(2) Form 4"
  frequency: 'Annual' | 'Quarterly' | 'Per_Dispatch' | 'Continuous';
  dueDate: string;
  evidenceRequired: string;
  status: ObligationStatus;
  daysRemaining: number;
  assignedDepartment: string;
}

export interface ComplianceEvaluationFinding {
  id: string;
  evaluationTimestamp: string;
  recordType: 'Generation' | 'Characterisation' | 'Dewatering' | 'Storage' | 'Dispatch';
  batchOrRecordId: string;
  ruleId: string;
  statutoryCitation: string;
  parameterName: string;
  isStatutoryViolation: boolean; // Distinction between legal breach and operational warning
  isOperationalWarning: boolean;
  severity: 'critical' | 'warning' | 'info';
  findingDescription: string;
  legalThresholdText: string;
  actualObservedValue: string | number;
  correctiveActionMandate: string;
  statutoryPenaltyNotice: string;
  evidenceAuditHash: string;
  status: 'Open' | 'Mitigation_Scheduled' | 'Resolved';
}

