import type { IncomingMessage, ServerResponse } from 'http';
import { addSubmission, listSubmissions } from '../../server/store.js';
import type { SubmissionType } from '../../server/types.js';
import { getJsonBody, getQueryParams, methodNotAllowed, sendError, sendJSON } from '../_utils.js';
import { requireAdmin } from '../_auth.js';

const validTypes: SubmissionType[] = ['assessment', 'consultation', 'implementation', 'feedback'];

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method === 'POST') {
    const body = (await getJsonBody(req)) as Record<string, unknown> | undefined;
    const sessionId = typeof body?.sessionId === 'string' ? body.sessionId : undefined;
    const type = typeof body?.type === 'string' ? (body.type as SubmissionType) : undefined;
    const assessment = body?.assessment;
    const contact = body?.contact;
    const feedback = body?.feedback;

    if (!sessionId || !type || !validTypes.includes(type)) {
      sendError(res, 400, 'sessionId and valid type are required');
      return;
    }

    if (type === 'feedback') {
      const message = typeof feedback?.message === 'string' ? feedback.message.trim() : '';
      if (!message) {
        sendError(res, 400, 'Feedback message is required');
        return;
      }
    }

    try {
      const submission = addSubmission({
        sessionId,
        type,
        assessment: body?.assessment as any,
        contact: body?.contact as any,
        feedback: body?.feedback as any,
        userAgent: req.headers['user-agent']?.toString(),
      });
      sendJSON(res, 201, submission);
    } catch (error) {
      console.error('[API] submission save error:', error);
      sendError(res, 500, 'Failed to save submission');
    }
    return;
  }

  if (req.method === 'GET') {
    if (!requireAdmin(req, res)) return;
    const type = getQueryParams(req).get('type');
    const filteredType = validTypes.includes(type as SubmissionType) ? (type as SubmissionType) : undefined;
    const submissions = listSubmissions(filteredType);
    sendJSON(res, 200, submissions);
    return;
  }

  methodNotAllowed(res, ['GET', 'POST']);
}
