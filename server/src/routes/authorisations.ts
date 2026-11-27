import { Router } from 'express';
import { getAuthorisations, getAuthorisationById, updateAuthorisation } from '../db/database.js';

export const authorisationRouter = Router();

// GET all facility authorisations
authorisationRouter.get('/', async (_req, res) => {
  try {
    const auths = await getAuthorisations();
    res.json(auths);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET authorisation by ID
authorisationRouter.get('/:id', async (req, res) => {
  try {
    const auth = await getAuthorisationById(req.params.id);
    if (!auth) {
      return res.status(404).json({ error: 'Authorisation not found' });
    }
    res.json(auth);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update authorisation terms
authorisationRouter.put('/:id', async (req, res) => {
  try {
    const updated = await updateAuthorisation(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Authorisation not found' });
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

