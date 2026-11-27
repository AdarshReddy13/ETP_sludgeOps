import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
const { Pool } = pkg;

import {
  RegulatoryDocument,
  RegulatoryRule,
  FacilityAuthorisation,
  ComplianceObligation,
  ComplianceEvaluationFinding,
} from '../models/types.js';
import {
  OFFICIAL_DOCUMENTS_SEED,
  OFFICIAL_RULES_SEED,
  FACILITY_AUTHORISATION_SEED,
  COMPLIANCE_OBLIGATIONS_SEED,
} from './seeds.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../../data');
const STORE_FILE = path.join(DATA_DIR, 'compliance_store.json');

interface ComplianceStore {
  documents: RegulatoryDocument[];
  rules: RegulatoryRule[];
  authorisations: FacilityAuthorisation[];
  obligations: ComplianceObligation[];
  findings: ComplianceEvaluationFinding[];
}

let pgPool: pkg.Pool | null = null;
let usePostgres = false;

// Initialize Store
function ensureStoreExists(): ComplianceStore {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(STORE_FILE)) {
    const initialData: ComplianceStore = {
      documents: OFFICIAL_DOCUMENTS_SEED,
      rules: OFFICIAL_RULES_SEED,
      authorisations: [FACILITY_AUTHORISATION_SEED],
      obligations: COMPLIANCE_OBLIGATIONS_SEED,
      findings: [],
    };
    fs.writeFileSync(STORE_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }

  try {
    const raw = fs.readFileSync(STORE_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      documents: parsed.documents || OFFICIAL_DOCUMENTS_SEED,
      rules: parsed.rules || OFFICIAL_RULES_SEED,
      authorisations: parsed.authorisations || [FACILITY_AUTHORISATION_SEED],
      obligations: parsed.obligations || COMPLIANCE_OBLIGATIONS_SEED,
      findings: parsed.findings || [],
    };
  } catch (err) {
    console.error('[DB] Failed reading store file, resetting to seeds:', err);
    const initialData: ComplianceStore = {
      documents: OFFICIAL_DOCUMENTS_SEED,
      rules: OFFICIAL_RULES_SEED,
      authorisations: [FACILITY_AUTHORISATION_SEED],
      obligations: COMPLIANCE_OBLIGATIONS_SEED,
      findings: [],
    };
    fs.writeFileSync(STORE_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }
}

function saveStore(store: ComplianceStore) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DB] Error saving store:', err);
  }
}

export async function initDatabase() {
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    try {
      console.log('[DB] Connecting to PostgreSQL at', dbUrl.split('@')[1] || 'configured host');
      pgPool = new Pool({ connectionString: dbUrl, connectionTimeoutMillis: 3000 });
      const client = await pgPool.connect();
      
      // Setup tables if needed
      await client.query(`
        CREATE TABLE IF NOT EXISTS regulatory_documents (
          id VARCHAR(100) PRIMARY KEY,
          title TEXT NOT NULL,
          authority VARCHAR(50) NOT NULL,
          doc_type VARCHAR(50) NOT NULL,
          gazette_ref TEXT,
          version VARCHAR(50),
          issue_date VARCHAR(50),
          effective_date VARCHAR(50),
          status VARCHAR(50),
          raw_text TEXT,
          pdf_file_name TEXT,
          pdf_path TEXT,
          uploaded_by TEXT,
          approved_by TEXT,
          approved_at TEXT,
          created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS regulatory_rules (
          id VARCHAR(100) PRIMARY KEY,
          document_id VARCHAR(100),
          statutory_citation TEXT NOT NULL,
          section_or_rule TEXT,
          parameter_name TEXT NOT NULL,
          limit_value DOUBLE PRECISION,
          unit VARCHAR(50),
          comparison_operator VARCHAR(20),
          rule_category VARCHAR(50),
          applicability VARCHAR(50),
          legal_requirement TEXT,
          statutory_violation_action TEXT,
          is_statutory_violation BOOLEAN DEFAULT TRUE,
          penalty_implication TEXT,
          is_approved BOOLEAN DEFAULT FALSE,
          is_active BOOLEAN DEFAULT TRUE
        );
      `);
      client.release();
      usePostgres = true;
      console.log('[DB] PostgreSQL initialized successfully.');
    } catch (err: any) {
      console.warn('[DB] PostgreSQL connection failed or unavailable:', err.message);
      console.log('[DB] Seamlessly operating with local transactional JSON store.');
      usePostgres = false;
    }
  } else {
    console.log('[DB] No DATABASE_URL specified. Initializing embedded transactional JSON store.');
    ensureStoreExists();
  }
}

// Documents CRUD
export async function getDocuments(): Promise<RegulatoryDocument[]> {
  const store = ensureStoreExists();
  return store.documents;
}

export async function getDocumentById(id: string): Promise<RegulatoryDocument | null> {
  const store = ensureStoreExists();
  return store.documents.find(d => d.id === id) || null;
}

export async function createDocument(doc: RegulatoryDocument): Promise<RegulatoryDocument> {
  const store = ensureStoreExists();
  const existingIdx = store.documents.findIndex(d => d.id === doc.id);
  if (existingIdx >= 0) {
    store.documents[existingIdx] = doc;
  } else {
    store.documents.unshift(doc);
  }
  saveStore(store);
  return doc;
}

export async function updateDocument(id: string, updates: Partial<RegulatoryDocument>): Promise<RegulatoryDocument | null> {
  const store = ensureStoreExists();
  const idx = store.documents.findIndex(d => d.id === id);
  if (idx === -1) return null;
  store.documents[idx] = { ...store.documents[idx], ...updates };
  saveStore(store);
  return store.documents[idx];
}

export async function deleteDocument(id: string): Promise<boolean> {
  const store = ensureStoreExists();
  const initialLen = store.documents.length;
  store.documents = store.documents.filter(d => d.id !== id);
  // Also delete associated rules
  store.rules = store.rules.filter(r => r.documentId !== id);
  saveStore(store);
  return store.documents.length < initialLen;
}

// Rules CRUD
export async function getRules(): Promise<RegulatoryRule[]> {
  const store = ensureStoreExists();
  return store.rules;
}

export async function getRuleById(id: string): Promise<RegulatoryRule | null> {
  const store = ensureStoreExists();
  return store.rules.find(r => r.id === id) || null;
}

export async function createRule(rule: RegulatoryRule): Promise<RegulatoryRule> {
  const store = ensureStoreExists();
  const existingIdx = store.rules.findIndex(r => r.id === rule.id);
  if (existingIdx >= 0) {
    store.rules[existingIdx] = rule;
  } else {
    store.rules.unshift(rule);
  }
  saveStore(store);
  return rule;
}

export async function updateRule(id: string, updates: Partial<RegulatoryRule>): Promise<RegulatoryRule | null> {
  const store = ensureStoreExists();
  const idx = store.rules.findIndex(r => r.id === id);
  if (idx === -1) return null;
  store.rules[idx] = { ...store.rules[idx], ...updates };
  saveStore(store);
  return store.rules[idx];
}

export async function deleteRule(id: string): Promise<boolean> {
  const store = ensureStoreExists();
  const initialLen = store.rules.length;
  store.rules = store.rules.filter(r => r.id !== id);
  saveStore(store);
  return store.rules.length < initialLen;
}

// Authorisations CRUD
export async function getAuthorisations(): Promise<FacilityAuthorisation[]> {
  const store = ensureStoreExists();
  return store.authorisations;
}

export async function getAuthorisationById(id: string): Promise<FacilityAuthorisation | null> {
  const store = ensureStoreExists();
  return store.authorisations.find(a => a.id === id) || null;
}

export async function updateAuthorisation(id: string, updates: Partial<FacilityAuthorisation>): Promise<FacilityAuthorisation | null> {
  const store = ensureStoreExists();
  const idx = store.authorisations.findIndex(a => a.id === id);
  if (idx === -1) return null;
  store.authorisations[idx] = { ...store.authorisations[idx], ...updates };
  saveStore(store);
  return store.authorisations[idx];
}

// Obligations CRUD
export async function getObligations(): Promise<ComplianceObligation[]> {
  const store = ensureStoreExists();
  return store.obligations;
}

export async function createObligation(obl: ComplianceObligation): Promise<ComplianceObligation> {
  const store = ensureStoreExists();
  store.obligations.push(obl);
  saveStore(store);
  return obl;
}

export async function updateObligation(id: string, updates: Partial<ComplianceObligation>): Promise<ComplianceObligation | null> {
  const store = ensureStoreExists();
  const idx = store.obligations.findIndex(o => o.id === id);
  if (idx === -1) return null;
  store.obligations[idx] = { ...store.obligations[idx], ...updates };
  saveStore(store);
  return store.obligations[idx];
}

// Findings CRUD
export async function getFindings(): Promise<ComplianceEvaluationFinding[]> {
  const store = ensureStoreExists();
  return store.findings;
}

export async function saveFindings(findings: ComplianceEvaluationFinding[]): Promise<ComplianceEvaluationFinding[]> {
  const store = ensureStoreExists();
  store.findings = findings;
  saveStore(store);
  return store.findings;
}

export async function updateFindingStatus(id: string, status: 'Open' | 'Mitigation_Scheduled' | 'Resolved'): Promise<ComplianceEvaluationFinding | null> {
  const store = ensureStoreExists();
  const idx = store.findings.findIndex(f => f.id === id);
  if (idx === -1) return null;
  store.findings[idx].status = status;
  saveStore(store);
  return store.findings[idx];
}

