/**
 * ETP SludgeOps — AI Analysis Routes (/api/ai/*)
 * Proxies Groq AI requests from the React frontend.
 * The API key never leaves the backend.
 */

import { Router } from 'express';
import {
  analyzeLabReport,
  recommendDewateringSolution,
  interpretComplianceFindings,
  LabReportInput,
  DewateringInput,
  ComplianceFindingInput,
} from '../services/groqAiService.js';
import { answerWithRag, indexRagCorpus, retrieveRelevantChunks } from '../services/ragEngine.js';
import {
  checkSupabaseConnection,
  getAnalyzedReports,
  saveAnalyzedReport,
} from '../services/supabaseService.js';

export const aiRouter = Router();

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ai/analyze-lab-report
// Body: LabReportInput  → AI analysis of chemical/physical sludge properties
// ─────────────────────────────────────────────────────────────────────────────
aiRouter.post('/analyze-lab-report', async (req, res, next) => {
  try {
    const input: LabReportInput = req.body;
    if (!input || typeof input !== 'object') {
      res.status(400).json({ error: 'Request body must be a JSON object with lab parameters.' });
      return;
    }
    const model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
    const analysis = await analyzeLabReport(input);
    const storage = await saveAnalyzedReport({
      reportType: 'lab_report',
      title: `Lab Report Analysis${input.batchId ? ` - ${input.batchId}` : ''}`,
      batchId: input.batchId,
      model,
      inputPayload: input,
      analysisResult: analysis,
    });
    res.json({ success: true, analysis, model, storage });
  } catch (err: any) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ai/dewatering-recommendation
// Body: DewateringInput → AI-generated simplest dewatering prescription
// ─────────────────────────────────────────────────────────────────────────────
aiRouter.post('/dewatering-recommendation', async (req, res, next) => {
  try {
    const input: DewateringInput = req.body;
    if (!input || typeof input !== 'object') {
      res.status(400).json({ error: 'Request body must be a JSON object with sludge parameters.' });
      return;
    }
    const model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
    const recommendation = await recommendDewateringSolution(input);
    const storage = await saveAnalyzedReport({
      reportType: 'dewatering_recommendation',
      title: `Dewatering Prescription${input.batchId ? ` - ${input.batchId}` : ''}`,
      batchId: input.batchId,
      model,
      inputPayload: input,
      analysisResult: recommendation,
    });
    res.json({ success: true, recommendation, model, storage });
  } catch (err: any) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ai/compliance-summary
// Body: ComplianceFindingInput → plain-language summary of compliance violations
// ─────────────────────────────────────────────────────────────────────────────
aiRouter.post('/compliance-summary', async (req, res, next) => {
  try {
    const input: ComplianceFindingInput = req.body;
    if (!input?.findings || !Array.isArray(input.findings)) {
      res.status(400).json({ error: 'Request body must include a "findings" array.' });
      return;
    }
    const model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
    const summary = await interpretComplianceFindings(input);
    const storage = await saveAnalyzedReport({
      reportType: 'compliance_summary',
      title: `Compliance Audit Summary (${input.findings.length} findings)`,
      model,
      inputPayload: input,
      analysisResult: summary,
    });
    res.json({ success: true, summary, model, storage });
  } catch (err: any) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// RAG (Retrieval-Augmented Generation) Endpoints
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/ai/rag/query
// Body: { query: string } → Grounded answer with exact statutory citations
aiRouter.post('/rag/query', async (req, res, next) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
      res.status(400).json({ error: 'Field "query" is required as a string.' });
      return;
    }
    const response = await answerWithRag(query.trim());
    const storage = await saveAnalyzedReport({
      reportType: 'rag_query',
      title: `RAG Query: ${query.trim().slice(0, 80)}`,
      model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
      inputPayload: { query: query.trim() },
      analysisResult: response,
    });
    res.json({ success: true, ...response, storage });
  } catch (err: any) {
    next(err);
  }
});

// GET /api/ai/rag/index-status
// Returns the status of the RAG index
aiRouter.get('/rag/index-status', async (_req, res, next) => {
  try {
    const result = await indexRagCorpus();
    res.json({
      success: true,
      indexedChunksCount: result.indexedChunksCount,
      documentCount: result.documentCount,
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      mode: process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.startsWith('gsk_') ? 'Generative Groq RAG' : 'Deterministic Grounded Retriever',
    });
  } catch (err: any) {
    next(err);
  }
});

// POST /api/ai/rag/reindex
// Forces a re-index of the RAG corpus
aiRouter.post('/rag/reindex', async (_req, res, next) => {
  try {
    const result = await indexRagCorpus();
    res.json({ success: true, message: 'Corpus re-indexed successfully.', ...result });
  } catch (err: any) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ai/reports
// Lists analyzed reports stored in Supabase (with local fallback)
// ─────────────────────────────────────────────────────────────────────────────
aiRouter.get('/reports', async (_req, res, next) => {
  try {
    const result = await getAnalyzedReports();
    res.json({ success: true, ...result });
  } catch (err: any) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ai/status
// Checks if Groq API key and Supabase are configured (without exposing keys)
// ─────────────────────────────────────────────────────────────────────────────
aiRouter.get('/status', async (_req, res) => {
  const key = process.env.GROQ_API_KEY;
  const configured = !!key && key !== 'your_groq_api_key_here' && key.startsWith('gsk_');
  const sbStatus = await checkSupabaseConnection();
  res.json({
    groqConfigured: configured,
    model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
    supabaseConnected: sbStatus.connected,
    supabaseError: sbStatus.error,
    message: configured
      ? 'Groq AI is ready. All analysis endpoints are active.'
      : 'Groq API key not configured. Add GROQ_API_KEY to server/.env',
  });
});
