import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
let pdfParse: any;
try {
  pdfParse = require('pdf-parse');
} catch {
  // fallback if required
}

export interface ExtractedDocumentData {
  text: string;
  totalPages: number;
  detectedTitle: string;
  detectedAuthority: 'MoEFCC' | 'CPCB' | 'KSPCB';
  detectedDocType: 'Statutory_Rule' | 'Gazette_Notification' | 'Consent_To_Operate' | 'HWA_Form_2' | 'Technical_Guideline';
  detectedGazetteRef: string;
  detectedDate: string;
}

export async function extractDocumentContent(filePath: string, originalFilename: string): Promise<ExtractedDocumentData> {
  const fileBuffer = fs.readFileSync(filePath);
  const isPdf = originalFilename.toLowerCase().endsWith('.pdf') || filePath.toLowerCase().endsWith('.pdf');

  let rawText = '';
  let totalPages = 1;

  if (isPdf && pdfParse) {
    try {
      const data = await pdfParse(fileBuffer);
      rawText = data.text || '';
      totalPages = data.numpages || 1;
    } catch (pdfErr) {
      console.warn('[PDF Extractor] Error parsing PDF directly with pdf-parse:', pdfErr);
      rawText = fileBuffer.toString('utf-8');
    }
  } else {
    rawText = fileBuffer.toString('utf-8');
  }

  // Metadata Detection Heuristics
  let detectedAuthority: 'MoEFCC' | 'CPCB' | 'KSPCB' = 'CPCB';
  if (/karnataka|kspcb|parisara\s*bhavana|dabaspet|peenya/i.test(rawText)) {
    detectedAuthority = 'KSPCB';
  } else if (/ministry\s*of\s*environment|moefcc|new\s*delhi|gazette\s*of\s*india/i.test(rawText)) {
    detectedAuthority = 'MoEFCC';
  } else if (/central\s*pollution\s*control\s*board|cpcb/i.test(rawText)) {
    detectedAuthority = 'CPCB';
  }

  let detectedDocType: 'Statutory_Rule' | 'Gazette_Notification' | 'Consent_To_Operate' | 'HWA_Form_2' | 'Technical_Guideline' = 'Statutory_Rule';
  if (/consent\s*to\s*operate|cto|consent\s*order|section\s*25/i.test(rawText)) {
    detectedDocType = 'Consent_To_Operate';
  } else if (/form\s*2|form\s*ii|authorization\s*under\s*rule\s*6/i.test(rawText)) {
    detectedDocType = 'HWA_Form_2';
  } else if (/guideline|technical|coprocessing|co-processing/i.test(rawText)) {
    detectedDocType = 'Technical_Guideline';
  } else if (/gazette|g\.s\.r\.|notification/i.test(rawText)) {
    detectedDocType = 'Gazette_Notification';
  }

  // Gazette / Reference No Detection
  let detectedGazetteRef = 'Ref Not Specified';
  const gsrMatch = rawText.match(/G\.S\.R\.\s*[0-9]+(?:\([A-Z]\))?[^\n\r,]+/i);
  const consentMatch = rawText.match(/(?:Consent\s*Order|CTO|PCB)[^\n\r]{5,40}/i);
  if (gsrMatch) {
    detectedGazetteRef = gsrMatch[0].trim();
  } else if (consentMatch) {
    detectedGazetteRef = consentMatch[0].trim();
  }

  // Date Detection
  let detectedDate = new Date().toISOString().slice(0, 10);
  const dateMatch = rawText.match(/(?:dated\s*|date:\s*)([0-9]{1,2}[-\/.][0-9]{1,2}[-\/.][0-9]{2,4}|[0-9]{4}-[0-9]{2}-[0-9]{2})/i);
  if (dateMatch) {
    detectedDate = dateMatch[1];
  }

  // Title Detection
  let detectedTitle = originalFilename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 5);
  if (lines.length > 0) {
    const candidate = lines.find(l => /notification|rules|guidelines|consent|authorisation/i.test(l));
    if (candidate && candidate.length < 120) {
      detectedTitle = candidate;
    }
  }

  return {
    text: rawText,
    totalPages,
    detectedTitle,
    detectedAuthority,
    detectedDocType,
    detectedGazetteRef,
    detectedDate,
  };
}

