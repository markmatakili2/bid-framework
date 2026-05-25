import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createSession, isValidToken, verifyPassword } from './auth.js';
import { generateInsights, type InsightRequest } from './insights.js';
import { addSubmission, getStats, getSubmission, listSubmissions } from './store.js';
import type { Submission, SubmissionType } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3001;
const isProd = process.env.NODE_ENV === 'production';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

function requireAdmin(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): void {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  if (!isValidToken(token)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}

app.post('/api/ai/insights', async (req, res) => {
  const body = req.body as InsightRequest | undefined;
  if (!body?.scores || !body?.answers) {
    res.status(400).json({ error: 'Invalid assessment context' });
    return;
  }
  try {
    const insights = await generateInsights(body);
    res.json(insights);
  } catch (err) {
    console.error('[AI] insights error:', err);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

app.post('/api/submissions', (req, res) => {
  const { sessionId, type, assessment, contact, feedback } = req.body ?? {};
  if (!sessionId || !type) {
    res.status(400).json({ error: 'sessionId and type are required' });
    return;
  }
  const validTypes: SubmissionType[] = ['assessment', 'consultation', 'implementation', 'feedback'];
  if (!validTypes.includes(type)) {
    res.status(400).json({ error: 'Invalid submission type' });
    return;
  }

  if (type === 'feedback') {
    if (!feedback || typeof feedback.message !== 'string' || !feedback.message.trim()) {
      res.status(400).json({ error: 'Feedback message is required' });
      return;
    }
  }

  const submission = addSubmission({
    sessionId,
    type,
    assessment,
    contact,
    feedback,
    userAgent: req.headers['user-agent'],
  });
  res.status(201).json(submission);
});

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body ?? {};
  if (!verifyPassword(password)) {
    res.status(401).json({ error: 'Invalid password' });
    return;
  }
  res.json({ token: createSession() });
});

app.get('/api/submissions', requireAdmin, (req, res) => {
  const type = req.query.type as SubmissionType | undefined;
  res.json(listSubmissions(type));
});

app.get('/api/submissions/:id', requireAdmin, (req, res) => {
  const item = getSubmission(req.params.id);
  if (!item) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(item);
});

app.get('/api/stats', requireAdmin, (_req, res) => {
  res.json(getStats());
});

if (isProd) {
  const dist = path.resolve(__dirname, '../dist');
  app.use(express.static(dist));
  app.get('/admin', (_req, res) => {
    res.sendFile(path.join(dist, 'admin/index.html'));
  });
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(dist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}`);
});
