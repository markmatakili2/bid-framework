import { randomUUID } from 'crypto';

const sessions = new Map<string, number>();
const SESSION_MS = 24 * 60 * 60 * 1000;

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || 'tuinnov8-admin';
}

export function createSession(): string {
  const token = randomUUID();
  sessions.set(token, Date.now() + SESSION_MS);
  return token;
}

export function isValidToken(token: string | undefined): boolean {
  if (!token) return false;
  const expires = sessions.get(token);
  if (!expires) return false;
  if (Date.now() > expires) {
    sessions.delete(token);
    return false;
  }
  return true;
}

export function verifyPassword(password: string): boolean {
  return password === getAdminPassword();
}
