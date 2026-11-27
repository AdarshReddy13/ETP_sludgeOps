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
    const analysis = await analyzeLabReport(input);
    res.json({ success: true, analysis, model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile' });
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
    const recommendation = await recommendDewateringSolution(input);
    res.json({ success: true, recommendation, model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile' });
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
    const summary = await interpretComplianceFindings(input);
    res.json({ success: true, summary, model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile' });
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
    res.json({ success: true, ...response });
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
// GET /api/ai/status
// Checks if Groq API key is configured (without exposing the key)
// ─────────────────────────────────────────────────────────────────────────────
aiRouter.get('/status', (_req, res) => {
  const key = process.env.GROQ_API_KEY;
  const configured = !!key && key !== 'your_groq_api_key_here' && key.startsWith('gsk_');
  res.json({
    groqConfigured: configured,
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    message: configured
      ? 'Groq AI is ready. All three analysis endpoints are active.'
      : 'Groq API key not configured. Add GROQ_API_KEY to server/.env',
  });
});
