import { Router } from 'express';
import { getObligations, createObligation, updateObligation } from '../db/database.js';
import { ComplianceObligation } from '../models/types.js';

export const obligationRouter = Router();

// GET all compliance obligations
obligationRouter.get('/', async (_req, res) => {
  try {
    const obs = await getObligations();
    res.json(obs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST create compliance obligation
obligationRouter.post('/', async (req, res) => {
  try {
    const newObl: ComplianceObligation = {
      ...req.body,
      id: req.body.id || `obl-${Date.now()}`,
    };
    const created = await createObligation(newObl);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update obligation
obligationRouter.put('/:id', async (req, res) => {
  try {
    const updated = await updateObligation(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Obligation not found' });
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

