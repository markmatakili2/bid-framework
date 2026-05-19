import type { IncomingMessage, ServerResponse } from 'http';
import { createSession, verifyPassword } from '../../server/auth.js';
import { getJsonBody, methodNotAllowed, sendError, sendJSON } from '../_utils.js';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    methodNotAllowed(res, ['POST']);
    return;
  }

  const body = (await getJsonBody(req)) as { password?: string } | undefined;
  if (!body?.password || !verifyPassword(body.password)) {
    sendError(res, 401, 'Invalid password');
    return;
  }

  sendJSON(res, 200, { token: createSession() });
}
