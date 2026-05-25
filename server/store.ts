import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { randomUUID } from 'crypto';
import type { DashboardStats, Submission, SubmissionType } from './types.js';

const isServerless = Boolean(process.env.VERCEL);
const DATA_DIR = process.env.DATA_PATH
  ? path.resolve(process.env.DATA_PATH)
  : isServerless
  ? path.join(os.tmpdir(), 'bid-framework-data')
  : path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'submissions.json');

function ensureStore(): Submission[] {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]', 'utf8');
    return [];
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw) as Submission[];
  } catch {
    return [];
  }
}

function saveAll(items: Submission[]): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2), 'utf8');
}

export function listSubmissions(type?: SubmissionType): Submission[] {
  const items = ensureStore();
  const sorted = items.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  if (!type) return sorted;
  return sorted.filter((s) => s.type === type);
}

export function getSubmission(id: string): Submission | undefined {
  return ensureStore().find((s) => s.id === id);
}

export function addSubmission(
  data: Omit<Submission, 'id' | 'createdAt'>,
): Submission {
  const items = ensureStore();
  const submission: Submission = {
    ...data,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
  };
  items.push(submission);
  saveAll(items);
  return submission;
}

export function getStats(): DashboardStats {
  const items = ensureStore();
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const week = 7 * day;

  return {
    total: items.length,
    assessments: items.filter((s) => s.type === 'assessment').length,
    consultations: items.filter((s) => s.type === 'consultation').length,
    implementations: items.filter((s) => s.type === 'implementation').length,
    feedback: items.filter((s) => s.type === 'feedback').length,
    last24h: items.filter((s) => now - new Date(s.createdAt).getTime() < day).length,
    last7d: items.filter((s) => now - new Date(s.createdAt).getTime() < week).length,
  };
}
