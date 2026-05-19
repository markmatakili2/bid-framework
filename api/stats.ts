import type { IncomingMessage, ServerResponse } from 'http';
import { getStats } from '../server/store.js';
import { methodNotAllowed, sendJSON } from './_utils.js';
import { requireAdmin } from './_auth.js';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'GET') {
    methodNotAllowed(res, ['GET']);
    return;
  }

  if (!requireAdmin(req, res)) return;
  sendJSON(res, 200, getStats());
}
