import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './db/database.js';
import { documentRouter } from './routes/documents.js';
import { ruleRouter } from './routes/rules.js';
import { authorisationRouter } from './routes/authorisations.js';
import { obligationRouter } from './routes/obligations.js';
import { complianceRouter } from './routes/compliance.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Serve uploads folder for PDF downloads
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'ETP SludgeOps KSPCB/CPCB Regulatory Compliance Engine',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/documents', documentRouter);
app.use('/api/rules', ruleRouter);
app.use('/api/authorisations', authorisationRouter);
app.use('/api/obligations', obligationRouter);
app.use('/api/compliance', complianceRouter);

// Global Error Handler Middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Server Error Handler]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// Start server
async function start() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`[ETP Compliance Server] Running on http://127.0.0.1:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
