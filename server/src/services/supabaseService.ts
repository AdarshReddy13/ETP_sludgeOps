import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCAL_REPORTS_FILE = path.resolve(__dirname, '../../data/analyzed_reports.json');

let cachedClient: SupabaseClient | null = null;

const PLACEHOLDER_PATTERNS = [
  /YOUR[-_]PROJECT/i,
  /YOUR[-_]SECRET/i,
  /YOUR[-_]API[-_]KEY/i,
  /<[^>]+>/,
  /\[[^\]]+\]/,
  /placeholder/i,
  /changeme/i,
  /example/i,
];

export function isPlaceholder(val: string | undefined | null): boolean {
  if (!val) return true;
  const trimmed = val.trim();
  if (trimmed === '') return true;
  return PLACEHOLDER_PATTERNS.some((p) => p.test(trimmed));
}

export function isTableMissing(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as { code?: string; message?: string };
  const code = err.code || '';
  const msg = err.message || '';
  return (
    code === 'PGRST204' ||
    code === 'PGRST205' ||
    code === '42P01' ||
    msg.includes('schema cache') ||
    msg.includes('Could not find the table') ||
    (msg.includes('relation') && msg.includes('does not exist'))
  );
}

function ensureSupabaseEnvLoaded(): void {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
    const backendEnvPath = path.resolve(__dirname, '../../../backend/.env');
    if (fs.existsSync(backendEnvPath)) {
      dotenv.config({ path: backendEnvPath });
    }
  }
}

export function getOptionalSupabaseClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  ensureSupabaseEnvLoaded();

  const url = process.env.SUPABASE_URL?.trim();
  const key = (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)?.trim();

  if (isPlaceholder(url) || isPlaceholder(key)) {
    return null;
  }

  cachedClient = createClient(url!, key!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cachedClient;
}

export function getSupabaseClient(): SupabaseClient {
  const client = getOptionalSupabaseClient();
  if (!client) {
    throw new Error('SUPABASE_URL or SUPABASE_SECRET_KEY is not configured in server/.env or backend/.env');
  }
  return client;
}

export async function checkSupabaseConnection(): Promise<{ connected: boolean; error: string | null }> {
  try {
    const sb = getSupabaseClient();
    const { error } = await sb.from('plants').select('id').limit(1);
    if (error) {
      return { connected: false, error: error.message.slice(0, 300) };
    }
    return { connected: true, error: null };
  } catch (err: any) {
    return { connected: false, error: (err?.message || String(err)).slice(0, 300) };
  }
}

export type ReportType =
  | 'lab_report'
  | 'dewatering_recommendation'
  | 'compliance_summary'
  | 'rag_query'
  | 'regulatory_document';

export interface AnalyzedReportInput {
  reportType: ReportType;
  title: string;
  batchId?: string;
  facility?: string;
  model?: string;
  inputPayload: unknown;
  analysisResult: unknown;
}

export interface SaveReportResult {
  savedToSupabase: boolean;
  reportId?: string | number;
  error?: string;
}

function saveLocalBackup(entry: Record<string, unknown>): void {
  try {
    const dir = path.dirname(LOCAL_REPORTS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    let existing: Record<string, unknown>[] = [];
    if (fs.existsSync(LOCAL_REPORTS_FILE)) {
      existing = JSON.parse(fs.readFileSync(LOCAL_REPORTS_FILE, 'utf-8'));
    }
    existing.unshift({ id: `local-${Date.now()}`, ...entry });
    fs.writeFileSync(LOCAL_REPORTS_FILE, JSON.stringify(existing.slice(0, 100), null, 2), 'utf-8');
  } catch (err) {
    console.error('[SupabaseService] Local backup write failed:', err);
  }
}

export async function saveAnalyzedReport(input: AnalyzedReportInput): Promise<SaveReportResult> {
  const row = {
    report_type: input.reportType,
    title: input.title,
    batch_id: input.batchId || null,
    facility: input.facility || 'Quadcore - Unit 4',
    model: input.model || process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
    input_payload: input.inputPayload,
    analysis_result: input.analysisResult,
    created_at: new Date().toISOString(),
  };

  try {
    const sb = getSupabaseClient();
    const { data, error } = await sb
      .from('analyzed_reports')
      .insert([row])
      .select('id')
      .single();

    if (error) {
      console.warn('[SupabaseService] Could not insert into analyzed_reports:', error.message);
      saveLocalBackup(row);
      return { savedToSupabase: false, error: error.message };
    }

    return { savedToSupabase: true, reportId: data?.id };
  } catch (err: any) {
    const msg = err?.message || String(err);
    console.warn('[SupabaseService] Supabase unavailable, saved local backup:', msg);
    saveLocalBackup(row);
    return { savedToSupabase: false, error: msg };
  }
}

export async function getAnalyzedReports(limit = 50): Promise<{ source: 'supabase' | 'local'; reports: unknown[] }> {
  try {
    const sb = getSupabaseClient();
    const { data, error } = await sb
      .from('analyzed_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!error && data) {
      return { source: 'supabase', reports: data };
    }
  } catch {
    // Fall back to local store
  }

  if (fs.existsSync(LOCAL_REPORTS_FILE)) {
    const local = JSON.parse(fs.readFileSync(LOCAL_REPORTS_FILE, 'utf-8'));
    return { source: 'local', reports: Array.isArray(local) ? local.slice(0, limit) : [] };
  }

  return { source: 'local', reports: [] };
}
