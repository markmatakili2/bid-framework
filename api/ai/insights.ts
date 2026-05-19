import type { IncomingMessage, ServerResponse } from 'http';
import { generateInsights } from '../../server/insights.js';
import type { InsightRequest } from '../../server/insights.js';
import { getJsonBody, methodNotAllowed, sendError, sendJSON } from '../_utils.js';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    methodNotAllowed(res, ['POST']);
    return;
  }

  const body = (await getJsonBody(req)) as InsightRequest | undefined;
  if (!body?.scores || !body?.answers) {
    sendError(res, 400, 'Invalid assessment context');
    return;
  }

  try {
    const insights = await generateInsights(body);
    sendJSON(res, 200, insights);
  } catch (error) {
    console.error('[AI] insights error:', error);
    sendError(res, 500, 'Failed to generate insights');
  }
}
