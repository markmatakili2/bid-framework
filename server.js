require('dotenv').config();
const express      = require('express');
const session      = require('express-session');
const bcrypt       = require('bcryptjs');
const cors         = require('cors');
const path         = require('path');
const { Pool }     = require('pg');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── DATABASE ─────────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('render.com')
    ? { rejectUnauthorized: false }
    : false,
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS assessments (
      id         SERIAL PRIMARY KEY,
      data       JSONB NOT NULL,
      status     TEXT  DEFAULT 'new',
      notes      TEXT  DEFAULT '',
      ip         TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS consultations (
      id         SERIAL PRIMARY KEY,
      data       JSONB NOT NULL,
      status     TEXT  DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS implementations (
      id         SERIAL PRIMARY KEY,
      data       JSONB NOT NULL,
      status     TEXT  DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log('✅ Database tables ready');
}

// ── MIDDLEWARE ───────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'tuinnov8-change-this',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 8
  },
}));

// ── AUTH ─────────────────────────────────────────────────
const ADMIN_USER      = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS_HASH = bcrypt.hashSync(process.env.ADMIN_PASS || 'tuinnov8admin', 10);

function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) return next();
  res.status(401).json({ error: 'Unauthorized' });
}

// ── PUBLIC API ───────────────────────────────────────────

app.post('/api/assessment', async (req, res) => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    await pool.query('INSERT INTO assessments (data, ip) VALUES ($1, $2)', [req.body, ip]);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to save assessment' });
  }
});

app.post('/api/consultation', async (req, res) => {
  try {
    await pool.query('INSERT INTO consultations (data) VALUES ($1)', [req.body]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to save consultation' });
  }
});

app.post('/api/implementation', async (req, res) => {
  try {
    await pool.query('INSERT INTO implementations (data) VALUES ($1)', [req.body]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to save request' });
  }
});

// ── ADMIN AUTH ───────────────────────────────────────────

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && bcrypt.compareSync(password, ADMIN_PASS_HASH)) {
    req.session.authenticated = true;
    req.session.username = username;
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.post('/api/admin/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/admin/me', (req, res) => {
  res.json({
    authenticated: !!(req.session && req.session.authenticated),
    username: req.session?.username || null,
  });
});

// ── ADMIN DATA ───────────────────────────────────────────

app.get('/api/admin/stats', requireAuth, async (req, res) => {
  try {
    const [aCount, cCount, iCount, cPending, iPending, recent, sectors] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM assessments'),
      pool.query('SELECT COUNT(*) FROM consultations'),
      pool.query('SELECT COUNT(*) FROM implementations'),
      pool.query("SELECT COUNT(*) FROM consultations WHERE status='pending'"),
      pool.query("SELECT COUNT(*) FROM implementations WHERE status='pending'"),
      pool.query("SELECT COUNT(*) FROM assessments WHERE created_at > NOW() - INTERVAL '7 days'"),
      pool.query("SELECT data->>'sector' AS sector, COUNT(*) FROM assessments GROUP BY data->>'sector'"),
    ]);
    const sectorMap = {};
    sectors.rows.forEach(r => { if (r.sector) sectorMap[r.sector] = parseInt(r.count); });
    res.json({
      assessments:        parseInt(aCount.rows[0].count),
      consultations:      parseInt(cCount.rows[0].count),
      implementations:    parseInt(iCount.rows[0].count),
      newConsultations:   parseInt(cPending.rows[0].count),
      newImplementations: parseInt(iPending.rows[0].count),
      recentAssessments:  parseInt(recent.rows[0].count),
      sectors: sectorMap,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/assessments', requireAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1';
    const params = [];
    if (req.query.sector) { params.push(req.query.sector); where += ` AND data->>'sector'=$${params.length}`; }
    if (req.query.status) { params.push(req.query.status); where += ` AND status=$${params.length}`; }
    const [rows, total] = await Promise.all([
      pool.query(`SELECT id,data,status,notes,ip,created_at FROM assessments ${where} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`, params),
      pool.query(`SELECT COUNT(*) FROM assessments ${where}`, params),
    ]);
    const docs = rows.rows.map(r => ({ _id: r.id, ...r.data, status: r.status, adminNotes: r.notes, ip: r.ip, submittedAt: r.created_at }));
    res.json({ docs, total: parseInt(total.rows[0].count), page, pages: Math.ceil(total.rows[0].count / limit) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/assessments/:id', requireAuth, async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM assessments WHERE id=$1', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    const row = r.rows[0];
    res.json({ _id: row.id, ...row.data, status: row.status, adminNotes: row.notes, submittedAt: row.created_at });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/admin/assessments/:id', requireAuth, async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    await pool.query(
      'UPDATE assessments SET status=COALESCE($1,status), notes=COALESCE($2,notes) WHERE id=$3',
      [status, adminNotes, req.params.id]
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/consultations', requireAuth, async (req, res) => {
  try {
    const r = await pool.query('SELECT id,data,status,created_at FROM consultations ORDER BY created_at DESC');
    res.json({ docs: r.rows.map(row => ({ _id: row.id, ...row.data, status: row.status, submittedAt: row.created_at })) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/admin/consultations/:id', requireAuth, async (req, res) => {
  try {
    await pool.query('UPDATE consultations SET status=$1 WHERE id=$2', [req.body.status, req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/implementations', requireAuth, async (req, res) => {
  try {
    const r = await pool.query('SELECT id,data,status,created_at FROM implementations ORDER BY created_at DESC');
    res.json({ docs: r.rows.map(row => ({ _id: row.id, ...row.data, status: row.status, submittedAt: row.created_at })) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/admin/implementations/:id', requireAuth, async (req, res) => {
  try {
    await pool.query('UPDATE implementations SET status=$1 WHERE id=$2', [req.body.status, req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── SERVE PAGES ──────────────────────────────────────────
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('/{*path}', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// ── START ────────────────────────────────────────────────
initDB().then(() => {
  app.listen(PORT, () => console.log(`✅ Tuinnov8 running on port ${PORT}`));
}).catch(err => {
  console.error('Database init failed:', err.message);
  process.exit(1);
});
