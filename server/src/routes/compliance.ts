import { Router } from 'express';
import { runComplianceEvaluation, EvaluationInput } from '../services/complianceEngine.js';
import { getFindings, updateFindingStatus } from '../db/database.js';

export const complianceRouter = Router();

// POST evaluate compliance engine
complianceRouter.post('/evaluate', async (req, res) => {
  try {
    const input: EvaluationInput = req.body;
    const findings = await runComplianceEvaluation(input);

    const statutoryViolationsCount = findings.filter(f => f.isStatutoryViolation).length;
    const operationalWarningsCount = findings.filter(f => f.isOperationalWarning).length;
    const criticalCount = findings.filter(f => f.severity === 'critical').length;

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      statutoryViolationsCount,
      operationalWarningsCount,
      criticalCount,
      totalFindings: findings.length,
      findings,
    });
  } catch (err: any) {
    console.error('[Compliance Evaluation Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// GET current findings
complianceRouter.get('/findings', async (_req, res) => {
  try {
    const findings = await getFindings();
    res.json(findings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update finding status (e.g. mark Mitigation_Scheduled or Resolved)
complianceRouter.put('/findings/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await updateFindingStatus(req.params.id, status);
    if (!updated) {
      return res.status(404).json({ error: 'Finding not found' });
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

