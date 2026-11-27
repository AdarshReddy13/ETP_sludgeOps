/**
 * ETP SludgeOps — Hybrid ETP Operations Sync Routes (/api/etp/*)
 * Reads/writes daily_records and sludge_batches to Supabase first,
 * with automatic local JSON fallback (server/data/etp_store.json).
 */

import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getOptionalSupabaseClient, isTableMissing } from '../services/supabaseService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCAL_ETP_STORE = path.resolve(__dirname, '../../data/etp_store.json');

export const etpRouter = Router();

interface LocalEtpStore {
  dailyRecords: any[];
  batches: any[];
}

function readLocalStore(): LocalEtpStore {
  try {
    if (fs.existsSync(LOCAL_ETP_STORE)) {
      const parsed = JSON.parse(fs.readFileSync(LOCAL_ETP_STORE, 'utf-8'));
      return {
        dailyRecords: Array.isArray(parsed.dailyRecords) ? parsed.dailyRecords : [],
        batches: Array.isArray(parsed.batches) ? parsed.batches : [],
      };
    }
  } catch (err) {
    console.warn('[ETP Sync] Failed reading local etp_store.json:', err);
  }
  return { dailyRecords: [], batches: [] };
}

function writeLocalStore(store: LocalEtpStore): void {
  try {
    const dir = path.dirname(LOCAL_ETP_STORE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(LOCAL_ETP_STORE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('[ETP Sync] Failed writing local etp_store.json:', err);
  }
}

function dailyRecordToDb(rec: any) {
  return {
    id: rec.id,
    date: rec.date,
    facility: rec.facility || 'Unit 4 - Chemical Coagulation',
    shift: rec.shift,
    wastewater_treated: rec.wastewaterTreated ?? null,
    influent_cod: rec.influentCOD,
    effluent_cod: rec.effluentCOD ?? null,
    influent_ph: rec.influentPH,
    treated_water_ph: rec.treatedWaterPH ?? null,
    coagulant_type: rec.coagulantType,
    coagulant_dose: rec.coagulantDose ?? null,
    flocculant_type: rec.flocculantType,
    flocculant_dose: rec.flocculantDose ?? null,
    sludge_source: rec.sludgeSource,
    wet_sludge_generated: rec.wetSludgeGenerated ?? null,
    sludge_moisture: rec.sludgeMoisture ?? null,
    operator: rec.operator || null,
    notes: rec.notes || null,
  };
}

function dbToDailyRecord(row: any) {
  return {
    id: row.id,
    date: row.date,
    facility: row.facility,
    shift: row.shift,
    wastewaterTreated: row.wastewater_treated,
    influentCOD: row.influent_cod,
    effluentCOD: row.effluent_cod,
    influentPH: row.influent_ph,
    treatedWaterPH: row.treated_water_ph,
    coagulantType: row.coagulant_type,
    coagulantDose: row.coagulant_dose,
    flocculantType: row.flocculant_type,
    flocculantDose: row.flocculant_dose,
    sludgeSource: row.sludge_source,
    wetSludgeGenerated: row.wet_sludge_generated,
    sludgeMoisture: row.sludge_moisture,
    operator: row.operator || undefined,
    notes: row.notes || undefined,
  };
}

function batchToDb(b: any) {
  return {
    batch_id: b.batchId,
    facility: b.facility || 'Unit 4 - Chemical Coagulation',
    lab_analysis_id: b.labAnalysisId || null,
    sample_tested_date: b.sampleTestedDate || null,
    nabl_accreditation: b.nablAccreditation || null,
    date_generated: b.dateGenerated,
    sludge_source: b.sludgeSource,
    quantity_tonnes: b.quantityTonnes,
    ph: b.pH ?? null,
    moisture_pct: b.moisturePct ?? null,
    cod_mg_kg: b.codMgKg ?? null,
    oil_and_grease_mg_kg: b.oilAndGreaseMgKg ?? null,
    heavy_metals: b.heavyMetals || {},
    phenol_mg_kg: b.phenolMgKg ?? null,
    sulphide_mg_kg: b.sulphideMgKg ?? null,
    tclp_result: b.tclpResult || 'Pending',
    test_report_file_name: b.testReportFileName || null,
    classification_status: b.classificationStatus || 'pending',
    current_stage: b.currentStage || 'Generated',
    days_in_storage: b.daysInStorage ?? 0,
    storage_location: b.storageLocation || null,
  };
}

function dbToBatch(row: any) {
  return {
    batchId: row.batch_id,
    facility: row.facility,
    labAnalysisId: row.lab_analysis_id || undefined,
    sampleTestedDate: row.sample_tested_date || undefined,
    nablAccreditation: row.nabl_accreditation || undefined,
    dateGenerated: row.date_generated,
    sludgeSource: row.sludge_source,
    quantityTonnes: row.quantity_tonnes,
    pH: row.ph,
    moisturePct: row.moisture_pct,
    codMgKg: row.cod_mg_kg,
    oilAndGreaseMgKg: row.oil_and_grease_mg_kg,
    heavyMetals: row.heavy_metals || {
      chromium: null,
      nickel: null,
      copper: null,
      zinc: null,
      lead: null,
      cadmium: null,
    },
    phenolMgKg: row.phenol_mg_kg,
    sulphideMgKg: row.sulphide_mg_kg,
    tclpResult: row.tclp_result || 'Pending',
    testReportFileName: row.test_report_file_name,
    classificationStatus: row.classification_status,
    currentStage: row.current_stage,
    daysInStorage: row.days_in_storage ?? 0,
    storageLocation: row.storage_location || '',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/etp/records — Hydrate daily_records & sludge_batches
// ─────────────────────────────────────────────────────────────────────────────
etpRouter.get('/records', async (_req, res) => {
  const sb = getOptionalSupabaseClient();
  if (sb) {
    try {
      const [dailyRes, batchRes] = await Promise.all([
        sb.from('daily_records').select('*').order('created_at', { ascending: false }).limit(200),
        sb.from('sludge_batches').select('*').order('created_at', { ascending: false }).limit(200),
      ]);

      if (!dailyRes.error && !batchRes.error) {
        return res.json({
          source: 'supabase',
          dailyRecords: (dailyRes.data || []).map(dbToDailyRecord),
          batches: (batchRes.data || []).map(dbToBatch),
        });
      }

      const err = dailyRes.error || batchRes.error;
      if (!isTableMissing(err)) {
        console.warn('[ETP Sync] Supabase read error, falling back to local:', err?.message);
      }
    } catch (err: any) {
      console.warn('[ETP Sync] Supabase unavailable, falling back to local:', err?.message);
    }
  }

  const local = readLocalStore();
  return res.json({
    source: 'local',
    dailyRecords: local.dailyRecords,
    batches: local.batches,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/etp/sync — Persist optimistic UI mutations to Supabase + local
// ─────────────────────────────────────────────────────────────────────────────
etpRouter.post('/sync', async (req, res) => {
  const { type, payload } = req.body || {};
  if (!type || !payload) {
    return res.status(400).json({ error: 'Request body must include "type" and "payload".' });
  }

  // Always update local backup store
  const local = readLocalStore();
  if (type === 'ADD_DAILY_RECORD') {
    local.dailyRecords = [payload, ...local.dailyRecords.filter((r) => r.id !== payload.id)];
  } else if (type === 'UPDATE_DAILY_RECORD') {
    local.dailyRecords = local.dailyRecords.map((r) => (r.id === payload.id ? { ...r, ...payload } : r));
  } else if (type === 'DELETE_DAILY_RECORD') {
    local.dailyRecords = local.dailyRecords.filter((r) => r.id !== payload.id);
  } else if (type === 'ADD_BATCH' || type === 'UPDATE_BATCH') {
    const idx = local.batches.findIndex((b) => b.batchId === payload.batchId);
    if (idx >= 0) {
      local.batches[idx] = { ...local.batches[idx], ...payload };
    } else {
      local.batches = [payload, ...local.batches];
    }
  }
  writeLocalStore(local);

  const sb = getOptionalSupabaseClient();
  if (!sb) {
    return res.json({ success: true, savedToSupabase: false, reason: 'Supabase not configured' });
  }

  try {
    let error: any = null;

    if (type === 'ADD_DAILY_RECORD') {
      ({ error } = await sb.from('daily_records').upsert([dailyRecordToDb(payload)], { onConflict: 'id' }));
    } else if (type === 'UPDATE_DAILY_RECORD') {
      ({ error } = await sb.from('daily_records').upsert([dailyRecordToDb(payload)], { onConflict: 'id' }));
    } else if (type === 'DELETE_DAILY_RECORD') {
      ({ error } = await sb.from('daily_records').delete().eq('id', payload.id));
    } else if (type === 'ADD_BATCH' || type === 'UPDATE_BATCH') {
      ({ error } = await sb.from('sludge_batches').upsert([batchToDb(payload)], { onConflict: 'batch_id' }));
    } else {
      return res.status(400).json({ error: `Unknown sync mutation type: ${type}` });
    }

    if (error) {
      console.warn(`[ETP Sync] Supabase ${type} failed:`, error.message);
      return res.json({ success: true, savedToSupabase: false, error: error.message });
    }

    return res.json({ success: true, savedToSupabase: true });
  } catch (err: any) {
    console.warn(`[ETP Sync] Supabase ${type} exception:`, err?.message);
    return res.json({ success: true, savedToSupabase: false, error: err?.message || String(err) });
  }
});
