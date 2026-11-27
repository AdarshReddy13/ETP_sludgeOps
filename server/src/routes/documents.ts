import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  getDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  createRule,
  getRules,
  updateRule,
} from '../db/database.js';
import { extractDocumentContent } from '../services/pdfExtractor.js';
import { extractRulesFromText } from '../services/ruleExtractor.js';
import { RegulatoryDocument } from '../models/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.resolve(__dirname, '../../uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_'));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB limit
});

export const documentRouter = Router();

// GET all documents
documentRouter.get('/', async (_req, res) => {
  try {
    const docs = await getDocuments();
    res.json(docs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET document by ID
documentRouter.get('/:id', async (req, res) => {
  try {
    const doc = await getDocumentById(req.params.id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json(doc);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST upload and ingest document
documentRouter.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { uploadedBy, authorityOverride, docTypeOverride, titleOverride } = req.body;

    // Extract text and metadata
    const extracted = await extractDocumentContent(file.path, file.originalname);

    const docId = `doc-upload-${Date.now()}`;
    const newDoc: RegulatoryDocument = {
      id: docId,
      title: titleOverride || extracted.detectedTitle,
      authority: authorityOverride || extracted.detectedAuthority,
      docType: docTypeOverride || extracted.detectedDocType,
      gazetteRef: extracted.detectedGazetteRef,
      version: '1.0 (Extracted)',
      issueDate: extracted.detectedDate,
      effectiveDate: extracted.detectedDate,
      status: 'Extracted',
      rawText: extracted.text,
      pdfFileName: file.originalname,
      pdfPath: `/uploads/${file.filename}`,
      uploadedBy: uploadedBy || 'Admin EHS Compliance Officer',
      createdAt: new Date().toISOString(),
    };

    await createDocument(newDoc);

    // Extract candidate rules
    const extractedRules = extractRulesFromText(docId, extracted.text);
    for (const rule of extractedRules) {
      await createRule(rule);
    }

    res.status(201).json({
      success: true,
      document: newDoc,
      rulesExtractedCount: extractedRules.length,
      extractedRules,
    });
  } catch (err: any) {
    console.error('[Document Upload Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// POST approve document
documentRouter.post('/:id/approve', async (req, res) => {
  try {
    const { approvedBy } = req.body;
    const doc = await getDocumentById(req.params.id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const updated = await updateDocument(req.params.id, {
      status: 'Approved',
      approvedBy: approvedBy || 'Admin Environmental Officer / Member Secretary',
      approvedAt: new Date().toISOString(),
    });

    // Also activate associated extracted rules if requested
    const allRules = await getRules();
    const docRules = allRules.filter(r => r.documentId === req.params.id);
    for (const r of docRules) {
      await updateRule(r.id, { isApproved: true, isActive: true });
    }

    res.json({
      success: true,
      document: updated,
      approvedRulesCount: docRules.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE document
documentRouter.delete('/:id', async (req, res) => {
  try {
    const deleted = await deleteDocument(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json({ success: true, message: 'Document and associated rules removed' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

