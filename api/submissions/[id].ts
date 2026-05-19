import type { IncomingMessage, ServerResponse } from 'http';
import { getSubmission } from '../../server/store.js';
import { getPathParameter, methodNotAllowed, sendError, sendJSON } from '../_utils.js';
import { requireAdmin } from '../_auth.js';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'GET') {
    methodNotAllowed(res, ['GET']);
    return;
  }

  if (!requireAdmin(req, res)) return;
  const id = getPathParameter(req, 2);
  if (!id) {
    sendError(res, 400, 'Submission ID is required');
    return;
  }

  const submission = getSubmission(id);
  if (!submission) {
    sendError(res, 404, 'Not found');
    return;
  }

  sendJSON(res, 200, submission);
}
