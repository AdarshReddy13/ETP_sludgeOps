/**
 * ETP SludgeOps — Frontend Groq AI Service
 * Calls the backend /api/ai/* endpoints — API key stays on the server.
 */

// Use relative path by default to leverage Vite proxy and avoid browser CORS / Private Network Access issues
const API_BASE = import.meta.env.VITE_API_BASE_URL !== undefined ? import.meta.env.VITE_API_BASE_URL : '';

export interface LabReportPayload {
  batchId?: string;
  pH?: number | null;
  moisturePct?: number | null;
  codMgKg?: number | null;
  oilAndGreaseMgKg?: number | null;
  phenolMgKg?: number | null;
  sulphideMgKg?: number | null;
  heavyMetals?: {
    chromium?: number | null;
    nickel?: number | null;
    lead?: number | null;
    cadmium?: number | null;
    copper?: number | null;
    zinc?: number | null;
  };
  consistency?: string | null;
  cstSeconds?: number | null;
  settleabilityMlG?: number | null;
  specificGravity?: number | null;
  tclpResults?: Record<string, number | null>;
}

export interface DewateringPayload extends LabReportPayload {
  currentDewateringMethod?: string | null;
  currentPolymerType?: string | null;
  currentPolymerDoseKgPerTonne?: number | null;
  cakeMoisturePct?: number | null;
  filtrateTssMgL?: number | null;
  volumeReductionPct?: number | null;
  handlingIssues?: string[];
}

export interface ComplianceFindingPayload {
  facilityName?: string;
  evaluationDate?: string;
  findings: Array<{
    type: string;
    severity: string;
    description: string;
    regulation?: string;
    recommendedAction?: string;
  }>;
}

async function postAI<T>(endpoint: string, body: object): Promise<T> {
  const res = await fetch(`${API_BASE}/api/ai/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `AI service error (${res.status})`);
  }
  return res.json();
}

/** Check if the backend Groq AI is configured */
export async function checkGroqStatus(): Promise<{
  groqConfigured: boolean;
  model: string;
  message: string;
}> {
  const res = await fetch(`${API_BASE}/api/ai/status`);
  if (!res.ok) throw new Error('Backend AI status check failed');
  return res.json();
}

/** Analyse chemical and physical sludge lab report */
export async function analyzeLabReport(payload: LabReportPayload): Promise<{
  analysis: string;
  model: string;
}> {
  return postAI('analyze-lab-report', payload);
}

/** Get AI-generated dewatering recommendation */
export async function getDewateringRecommendation(payload: DewateringPayload): Promise<{
  recommendation: string;
  model: string;
}> {
  return postAI('dewatering-recommendation', payload);
}

/** Get plain-language compliance summary */
export async function getComplianceSummary(payload: ComplianceFindingPayload): Promise<{
  summary: string;
  model: string;
}> {
  return postAI('compliance-summary', payload);
}

// ─────────────────────────────────────────────────────────────────────────────
// RAG (Retrieval-Augmented Generation) Client
// ─────────────────────────────────────────────────────────────────────────────

export interface RagCitation {
  citation: string;
  documentTitle: string;
  authority: string;
  sectionOrRule: string;
  snippet: string;
}

export interface RagAnswerResponse {
  success: boolean;
  query: string;
  answer: string;
  citations: RagCitation[];
  legalImplication?: string;
  confidence: number;
  retrievedChunksCount: number;
  model: string;
}

export interface RagIndexStatus {
  success: boolean;
  indexedChunksCount: number;
  documentCount: number;
  model: string;
  mode: string;
}

/** Execute a grounded RAG query against official regulatory documents & rules */
export async function queryRag(query: string): Promise<RagAnswerResponse> {
  return postAI<RagAnswerResponse>('rag/query', { query });
}

/** Fetch current RAG indexing statistics */
export async function getRagIndexStatus(): Promise<RagIndexStatus> {
  const res = await fetch(`${API_BASE}/api/ai/rag/index-status`);
  if (!res.ok) throw new Error('Failed to fetch RAG index status');
  return res.json();
}

/** Trigger reindexing of documents */
export async function reindexRag(): Promise<{ success: boolean; indexedChunksCount: number; documentCount: number }> {
  const res = await fetch(`${API_BASE}/api/ai/rag/reindex`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reindex RAG corpus');
  return res.json();
}

