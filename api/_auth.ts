import type { IncomingMessage, ServerResponse } from 'http';
import { isValidToken } from '../server/auth.js';
import { sendError } from './_utils.js';

export function getBearerToken(req: IncomingMessage): string | undefined {
  const header = req.headers.authorization;
  if (!header || Array.isArray(header)) return undefined;
  return header.startsWith('Bearer ') ? header.slice(7) : undefined;
}

export function requireAdmin(req: IncomingMessage, res: ServerResponse): boolean {
  const token = getBearerToken(req);
  if (!isValidToken(token)) {
    sendError(res, 401, 'Unauthorized');
    return false;
  }
  return true;
}
