export type ShiftType = 'Shift A (06:00 - 14:00)' | 'Shift B (14:00 - 22:00)' | 'Shift C (22:00 - 06:00)' | 'General (09:00 - 18:00)';

export type SludgeSource = 
  | 'Primary Clarifier' 
  | 'Chemical Coagulation Basin' 
  | 'Flocculation / Lamella' 
  | 'DAF (Dissolved Air Flotation)' 
  | 'Equalisation Tank Bottoms';

export type CoagulantType = 
  | 'Polyaluminium Chloride (PAC)' 
  | 'Ferric Chloride (FeCl3)' 
  | 'Alum (Al2(SO4)3)' 
  | 'Ferrous Sulphate (FeSO4)' 
  | 'Lime + Alum';

export type FlocculantType = 
  | 'Anionic Polyacrylamide (PAM)' 
  | 'Cationic Polyacrylamide (PAM)' 
  | 'Non-ionic Polymer';

export type ClassificationStatus = 
  | 'pending' 
  | 'hazardous' 
  | 'non_hazardous' 
  | 'awaiting_decision';

export type DewateringMethod = 
  | 'Filter Press' 
  | 'Belt Filter Press' 
  | 'Centrifuge' 
  | 'Drying Bed' 
  | 'None';

export type SludgeConsistency = 'free-flowing' | 'sticky' | 'pasty' | 'oily';

export type HandlingDifficultyBadge = 'normal' | 'attention' | 'critical';

export type AlertSeverity = 'critical' | 'warning' | 'info';

export type ProcessStage = 'Thickening' | 'Dewatering' | 'Storage' | 'Transport';

export type IssuePriority = 'High' | 'Medium' | 'Low';

export type IssueStatus = 'Open' | 'Under Investigation' | 'Action Scheduled' | 'Resolved';

export interface AlertItem {
  id: string;
  type: string;
  severity: AlertSeverity;
  affectedUnit: string;
  message: string;
  recommendedAction: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface DailyGenerationRecord {
  id: string;
  date: string; // YYYY-MM-DD
  facility?: string;
  shift: ShiftType;
  wastewaterTreated: number | null; // m³/day
  influentCOD: number; // mg/L (>100,000 mg/L)
  effluentCOD: number | null; // mg/L
  influentPH: number; // 5.5 baseline
  treatedWaterPH: number | null;
  coagulantType: CoagulantType;
  coagulantDose: number | null; // mg/L
  flocculantType: FlocculantType;
  flocculantDose: number | null; // mg/L
  sludgeSource: SludgeSource;
  wetSludgeGenerated: number | null; // kg/day
  sludgeMoisture: number | null; // % (e.g. 92.5)
  operator?: string;
  notes?: string;
}

export interface HeavyMetalsProfile {
  chromium: number | null; // mg/kg
  nickel: number | null; // mg/kg
  copper: number | null; // mg/kg
  zinc: number | null; // mg/kg
  lead: number | null; // mg/kg
  cadmium: number | null; // mg/kg
}

export interface SludgePhysicalProperties {
  totalSolidsPct: number | null; // % (e.g. 25.8%)
  volatileSolidsPct: number | null; // % VSS of TS (e.g. 64.0%)
  bulkDensityKgM3: number | null; // kg/m³ (e.g. 1080)
  specificGravity: number | null; // e.g. 1.08
  consistency: SludgeConsistency | 'gelatinous' | null;
  cstSeconds: number | null; // Capillary Suction Time in seconds
  specificResistance: string | null; // e.g. "2.4 x 10^12 m/kg"
  odourObservation: string | null; // e.g. "Earthy / Mild Chemical", "Strong Septic"
  appearance: string | null; // e.g. "Dark brown colloidal coagulated flocs"
}

export interface SludgeChemicalProperties {
  sludgePH: number | null; // e.g. 5.5
  codMgKg: number | null; // e.g. 108000
  bodMgKg: number | null; // e.g. 32000
  oilAndGreaseMgKg: number | null; // e.g. 950
  totalPhenolsMgKg: number | null; // e.g. 45
  reactiveSulphidesMgKg: number | null; // e.g. 38
  totalCyanideMgKg: number | null; // e.g. < 5
  totalChloridesMgKg: number | null; // e.g. 2400
  tclpLeachateLeadMgL: number | null; // e.g. 1.2
  tclpLeachateCadmiumMgL: number | null; // e.g. 0.4
  tclpLeachateChromiumMgL: number | null; // e.g. 2.1
  calorificValueKcalKg: number | null; // e.g. 2800
  corrosivityStatus: 'Non-Corrosive (pH 2 - 12.5)' | 'Corrosive (pH < 2 or > 12.5)' | null;
  ignitabilityStatus: 'Non-Flammable (Flash point > 60°C)' | 'Flammable' | null;
  reactivityStatus: 'Stable' | 'Water Reactive' | 'Sulphide/Cyanide Releasing' | null;
}

export interface SludgeBatch {
  batchId: string;
  facility?: string;
  labAnalysisId?: string;
  sampleTestedDate?: string;
  nablAccreditation?: string;
  dateGenerated: string;
  sludgeSource: SludgeSource;
  quantityTonnes: number;
  pH: number;
  moisturePct: number | null;
  codMgKg: number | null;
  oilAndGreaseMgKg: number | null;
  heavyMetals: HeavyMetalsProfile;
  phenolMgKg: number | null;
  sulphideMgKg: number | null;
  tclpResult: 'Passed (Non-toxic leach)' | 'Failed (Hazardous Leachate)' | 'Pending' | 'Not Conducted';
  testReportFileName: string | null;
  classificationStatus: ClassificationStatus;
  calorificValueKcalKg?: number | null;
  physicalProperties?: SludgePhysicalProperties;
  chemicalProperties?: SludgeChemicalProperties;
  currentStage: 'Generated' | 'Characterised' | 'Dewatered' | 'Stored' | 'Disposed';
  storageLocation?: string;
  daysInStorage: number;
}

export interface HandlingIssueItem {
  id: string;
  date: string;
  facility?: string;
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
}

export interface DewateringRecord {
  id: string;
  date: string;
  facility?: string;
  batchId: string;
  method: DewateringMethod;
  sludgeFeedVolumeM3: number; // m³
  sludgeFeedSolidsPct: number; // % (e.g. 4.5%)
  polymerType: string;
  polymerDoseKgPerTonne: number; // kg/tonne dry solids
  dewateredCakeTonnes: number; // tonnes
  cakeMoisturePct: number; // %
  filtrateTssMgL: number; // mg/L
  initialSludgeVolumeM3: number; // m³
  finalSludgeVolumeM3: number; // m³
  sludgeOdour: string; // e.g. "Normal / Earthy", "Slight Sulphidic", "Strong Septic"
  sludgeConsistency: SludgeConsistency;
  handlingIssueObserved: string; // e.g. "Cloth Blinding", "Poor Cake Release / Sticking"
  handlingDifficulty: HandlingDifficultyBadge;
  operator?: string;
}

export interface DispatchRecord {
  id: string;
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
}

export interface CostParameters {
  coagulantCostPerKg: number; // ₹/kg (PAC approx 22 ₹/kg)
  polymerCostPerKg: number; // ₹/kg (PAM approx 280 ₹/kg)
  transportCostPerTonne: number; // ₹/tonne (approx 1200 ₹/tonne to TSDF)
  tsdfLandfillCostPerTonne: number; // ₹/tonne (approx 2400 ₹/tonne)
  incinerationCostPerTonne: number; // ₹/tonne (approx 7500 ₹/tonne)
  cementKilnCostPerTonne: number; // ₹/tonne (approx 1800 ₹/tonne)
  recyclerCostPerTonne: number; // ₹/tonne (approx 2100 ₹/tonne)
}

export interface DisposalRouteEvaluation {
  route: string;
  costPerTonne: number;
  volumeReduction: 'Low' | 'Medium' | 'High';
  complianceStatus: string;
  recommendation: 'Recommended' | 'Conditional' | 'Not Compliant';
  rationale: string;
}

// ----------------------------------------------------
// KSPCB + CPCB Regulatory Compliance Types
// ----------------------------------------------------

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
  statutoryCitation: string;
  sectionOrRule: string;
  parameterName: string;
  limitValue: number;
  unit: string;
  comparisonOperator: '<=' | '>=' | '<' | '>' | '==' | '!=' | 'contains';
  ruleCategory: RuleCategory;
  applicability: RuleApplicability;
  legalRequirement: string;
  statutoryViolationAction: string;
  isStatutoryViolation: boolean;
  penaltyImplication: string;
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
  authorizedCapacityTpa: number;
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
  statutoryRef: string;
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
  isStatutoryViolation: boolean;
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

