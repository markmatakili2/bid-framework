import './admin.css';

interface Submission {
  id: string;
  sessionId: string;
  type: 'assessment' | 'consultation' | 'implementation';
  createdAt: string;
  assessment?: {
    answers: Record<string, string>;
    scores: Record<string, number>;
    overallScore: number;
    maturityLevel: number;
    maturityLabel: string;
  };
  contact?: {
    name: string;
    email: string;
    phone?: string;
    preferredTime?: string;
    timeline?: string;
    budget?: string;
  };
}

interface Stats {
  total: number;
  assessments: number;
  consultations: number;
  implementations: number;
  last24h: number;
  last7d: number;
}

const TOKEN_KEY = 'bid-admin-token';
let submissions: Submission[] = [];
let activeFilter: string = 'all';
let searchQuery = '';

const root = document.getElementById('admin-root')!;

function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

function setToken(token: string | null): void {
  if (token) sessionStorage.setItem(TOKEN_KEY, token);
  else sessionStorage.removeItem(TOKEN_KEY);
}

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (res.status === 401) {
    setToken(null);
    renderLogin();
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || 'Request failed');
  }
  return res.json() as Promise<T>;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function typeLabel(type: string): string {
  const map: Record<string, string> = {
    assessment: 'Assessment',
    consultation: 'Consultation',
    implementation: 'Implementation',
  };
  return map[type] || type;
}

function scoreClass(score: number): string {
  if (score >= 68) return 'high';
  if (score >= 42) return 'mid';
  return 'low';
}

function escapeHtml(s: string): string {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function renderLogin(error = ''): void {
  root.innerHTML = `
    <div class="login-screen">
      <div class="login-card">
        <div class="login-brand">
          <div class="login-mark">⚡</div>
          <div>
            <div class="login-title">Tuinnov8</div>
            <div class="login-sub">Admin Dashboard</div>
          </div>
        </div>
        <h1>Sign in</h1>
        <p class="desc">Enter your admin password to view assessment submissions and lead requests.</p>
        <form id="login-form">
          <div class="field">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" required autocomplete="current-password" />
          </div>
          <button type="submit" class="btn-primary">Sign in</button>
          <p class="login-error ${error ? 'show' : ''}" id="login-error">${escapeHtml(error)}</p>
        </form>
      </div>
    </div>`;

  document.getElementById('login-form')!.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = (document.getElementById('password') as HTMLInputElement).value;
    try {
      const { token } = await api<{ token: string }>('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
      setToken(token);
      await loadDashboard();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid password. Please try again.';
      renderLogin(message);
    }
  });
}

async function loadDashboard(): Promise<void> {
  const [stats, items] = await Promise.all([
    api<Stats>('/api/stats'),
    api<Submission[]>('/api/submissions'),
  ]);
  submissions = items;
  renderDashboard(stats);
}

function filteredSubmissions(): Submission[] {
  let list = submissions;
  if (activeFilter !== 'all') {
    list = list.filter((s) => s.type === activeFilter);
  }
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    list = list.filter((s) => {
      const biz = s.assessment?.answers?.bizName?.toLowerCase() ?? '';
      const sector = s.assessment?.answers?.sector?.toLowerCase() ?? '';
      const name = s.contact?.name?.toLowerCase() ?? '';
      const email = s.contact?.email?.toLowerCase() ?? '';
      return biz.includes(q) || sector.includes(q) || name.includes(q) || email.includes(q);
    });
  }
  return list;
}

function renderTableRows(): string {
  const list = filteredSubmissions();
  if (!list.length) {
    return `<tr><td colspan="6"><div class="empty-state"><div class="icon">📭</div><p>No submissions yet</p></div></td></tr>`;
  }
  return list
    .map((s) => {
      const biz = s.assessment?.answers?.bizName || s.contact?.name || '—';
      const email = s.contact?.email || '—';
      const sector = s.assessment?.answers?.sector || '—';
      const score = s.assessment?.overallScore;
      const scoreHtml =
        score != null
          ? `<span class="score-pill ${scoreClass(score)}">${score}%</span>`
          : '—';
      return `<tr class="clickable" data-id="${s.id}">
        <td><span class="type-badge ${s.type}">${typeLabel(s.type)}</span></td>
        <td><strong>${escapeHtml(biz)}</strong></td>
        <td>${escapeHtml(email)}</td>
        <td>${escapeHtml(sector)}</td>
        <td>${scoreHtml}</td>
        <td>${formatDate(s.createdAt)}</td>
      </tr>`;
    })
    .join('');
}

function renderDashboard(stats: Stats): void {
  root.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="sidebar-head">
          <div class="sidebar-brand">Tuinnov8</div>
          <div class="sidebar-badge">Admin</div>
        </div>
        <nav class="sidebar-nav">
          <button class="nav-item active" type="button"><span class="nav-icon">📊</span> Submissions</button>
        </nav>
        <div class="sidebar-foot">
          <button class="btn-logout" type="button" id="logout-btn">Sign out</button>
        </div>
      </aside>
      <main class="main">
        <header class="page-header">
          <div>
            <h1>Submissions</h1>
            <p>All assessments, consultations, and implementation requests from the BID tool.</p>
          </div>
          <div class="header-actions">
            <input type="search" class="search-input" id="search" placeholder="Search business, email…" />
            <button class="btn-refresh" type="button" id="refresh-btn">↻ Refresh</button>
          </div>
        </header>
        <div class="stats-grid">
          <div class="stat-card"><div class="stat-label">Total</div><div class="stat-value">${stats.total}</div><div class="stat-delta">${stats.last7d} this week</div></div>
          <div class="stat-card accent-ops"><div class="stat-label">Assessments</div><div class="stat-value">${stats.assessments}</div></div>
          <div class="stat-card accent-cx"><div class="stat-label">Consultations</div><div class="stat-value">${stats.consultations}</div></div>
          <div class="stat-card accent-leads"><div class="stat-label">Implementations</div><div class="stat-value">${stats.implementations}</div><div class="stat-delta">${stats.last24h} in last 24h</div></div>
        </div>
        <div class="panel">
          <div class="panel-head">
            <h2>Recent activity</h2>
            <div class="filter-tabs" id="filter-tabs">
              <button class="filter-tab active" data-filter="all">All</button>
              <button class="filter-tab" data-filter="assessment">Assessments</button>
              <button class="filter-tab" data-filter="consultation">Consultations</button>
              <button class="filter-tab" data-filter="implementation">Implementations</button>
            </div>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Business / Name</th>
                  <th>Email</th>
                  <th>Sector</th>
                  <th>Score</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody id="table-body">${renderTableRows()}</tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
    <div class="drawer-overlay" id="drawer-overlay">
      <div class="drawer" id="drawer">
        <div class="drawer-head">
          <div>
            <h3 id="drawer-title">Submission</h3>
            <p class="drawer-meta" id="drawer-meta"></p>
          </div>
          <button class="drawer-close" type="button" id="drawer-close">✕</button>
        </div>
        <div class="drawer-body" id="drawer-body"></div>
      </div>
    </div>`;

  document.getElementById('logout-btn')!.addEventListener('click', () => {
    setToken(null);
    renderLogin();
  });

  document.getElementById('refresh-btn')!.addEventListener('click', () => void loadDashboard());

  document.getElementById('search')!.addEventListener('input', (e) => {
    searchQuery = (e.target as HTMLInputElement).value;
    document.getElementById('table-body')!.innerHTML = renderTableRows();
    bindTableClicks();
  });

  document.getElementById('filter-tabs')!.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('.filter-tab') as HTMLButtonElement | null;
    if (!btn) return;
    activeFilter = btn.dataset.filter || 'all';
    document.querySelectorAll('.filter-tab').forEach((t) => t.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('table-body')!.innerHTML = renderTableRows();
    bindTableClicks();
  });

  bindTableClicks();
  bindDrawer();
}

function bindTableClicks(): void {
  document.querySelectorAll('tr.clickable').forEach((row) => {
    row.addEventListener('click', () => {
      const id = (row as HTMLElement).dataset.id;
      const item = submissions.find((s) => s.id === id);
      if (item) openDrawer(item);
    });
  });
}

function bindDrawer(): void {
  const overlay = document.getElementById('drawer-overlay')!;
  document.getElementById('drawer-close')!.addEventListener('click', closeDrawer);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeDrawer();
  });
}

function closeDrawer(): void {
  document.getElementById('drawer-overlay')!.classList.remove('open');
}

function openDrawer(s: Submission): void {
  document.getElementById('drawer-title')!.textContent = typeLabel(s.type);
  document.getElementById('drawer-meta')!.textContent = formatDate(s.createdAt);

  let html = '';

  if (s.contact) {
    html += `<section class="detail-section"><h4>Contact</h4><dl class="detail-grid">`;
    html += detailRow('Name', s.contact.name);
    html += detailRow('Email', s.contact.email);
    if (s.contact.phone) html += detailRow('Phone', s.contact.phone);
    if (s.contact.preferredTime) html += detailRow('Preferred time', s.contact.preferredTime);
    if (s.contact.timeline) html += detailRow('Timeline', s.contact.timeline);
    if (s.contact.budget) html += detailRow('Budget', s.contact.budget);
    html += `</dl></section>`;
  }

  if (s.assessment) {
    const a = s.assessment;
    html += `<section class="detail-section"><h4>Scores</h4>
      <div class="scores-grid">
        <div class="score-mini"><div class="val">${a.overallScore}%</div><div class="lbl">Overall</div></div>
        <div class="score-mini"><div class="val">${a.maturityLevel}/5</div><div class="lbl">Maturity</div></div>
        <div class="score-mini"><div class="val">${Math.round(a.scores.ops ?? 0)}</div><div class="lbl">Operations</div></div>
        <div class="score-mini"><div class="val">${Math.round(a.scores.data ?? 0)}</div><div class="lbl">Data</div></div>
        <div class="score-mini"><div class="val">${Math.round(a.scores.digital ?? 0)}</div><div class="lbl">Digital</div></div>
        <div class="score-mini"><div class="val">${Math.round(a.scores.cx ?? 0)}</div><div class="lbl">CX</div></div>
      </div>
      <p style="margin-top:12px;font-size:13px;color:var(--text-muted)">${escapeHtml(a.maturityLabel)}</p>
    </section>`;

    html += `<section class="detail-section"><h4>Assessment answers</h4><dl class="detail-grid">`;
    const labels: Record<string, string> = {
      bizName: 'Business name',
      sector: 'Sector',
      bizDesc: 'Description',
      size: 'Team size',
      ops: 'Operations',
      bottleneck: 'Bottleneck',
      cx: 'Customer experience',
      data: 'Data & reporting',
      revenue: 'Revenue limit',
      digital: 'Digital readiness',
      infra: 'Infrastructure',
      priority: '12-month goal',
      extra: 'Additional notes',
    };
    for (const [key, val] of Object.entries(a.answers)) {
      if (val?.trim()) html += detailRow(labels[key] || key, val);
    }
    html += `</dl></section>`;
  }

  html += `<section class="detail-section"><h4>Session</h4><dl class="detail-grid">
    ${detailRow('Session ID', s.sessionId)}
    ${detailRow('Submission ID', s.id)}
  </dl></section>`;

  document.getElementById('drawer-body')!.innerHTML = html;
  document.getElementById('drawer-overlay')!.classList.add('open');
}

function detailRow(label: string, value: string): string {
  return `<div class="detail-row"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`;
}

async function init(): Promise<void> {
  if (!getToken()) {
    renderLogin();
    return;
  }
  try {
    await loadDashboard();
  } catch {
    renderLogin();
  }
}

void init();
