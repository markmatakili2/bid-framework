import type { IncomingMessage, ServerResponse } from 'http';
import { createSession, verifyPassword, getAdminPassword } from '../../server/auth.js';
import { getJsonBody, methodNotAllowed, sendError, sendJSON } from '../_utils.js';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    methodNotAllowed(res, ['POST']);
    return;
  }

  const body = (await getJsonBody(req)) as { password?: string } | undefined;
  const password = body?.password;
  
  console.log('[LOGIN] Attempt with password length:', password?.length);
  console.log('[LOGIN] Expected password:', getAdminPassword());
  
  if (!password || !verifyPassword(password)) {
    console.log('[LOGIN] Failed verification for:', password);
    sendError(res, 401, 'Invalid password');
    return;
  }

  console.log('[LOGIN] Success, creating session');
  sendJSON(res, 200, { token: createSession() });
}
