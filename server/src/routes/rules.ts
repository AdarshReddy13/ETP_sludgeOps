import { Router } from 'express';
import { getRules, getRuleById, createRule, updateRule, deleteRule } from '../db/database.js';
import { RegulatoryRule } from '../models/types.js';

export const ruleRouter = Router();

// GET all rules (optional query filters: category, approved, active)
ruleRouter.get('/', async (req, res) => {
  try {
    let rules = await getRules();
    const { category, approved, active } = req.query;

    if (category) {
      rules = rules.filter(r => r.ruleCategory === category);
    }
    if (approved !== undefined) {
      rules = rules.filter(r => String(r.isApproved) === approved);
    }
    if (active !== undefined) {
      rules = rules.filter(r => String(r.isActive) === active);
    }

    res.json(rules);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET rule by ID
ruleRouter.get('/:id', async (req, res) => {
  try {
    const rule = await getRuleById(req.params.id);
    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }
    res.json(rule);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST create custom regulatory rule
ruleRouter.post('/', async (req, res) => {
  try {
    const newRule: RegulatoryRule = {
      ...req.body,
      id: req.body.id || `rule-${Date.now()}`,
      isApproved: req.body.isApproved !== undefined ? req.body.isApproved : true,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
    };
    const created = await createRule(newRule);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update rule
ruleRouter.put('/:id', async (req, res) => {
  try {
    const updated = await updateRule(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Rule not found' });
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE rule
ruleRouter.delete('/:id', async (req, res) => {
  try {
    const deleted = await deleteRule(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Rule not found' });
    }
    res.json({ success: true, message: 'Rule deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

