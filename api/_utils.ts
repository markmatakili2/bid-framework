import type { IncomingMessage, ServerResponse } from 'http';

export interface ApiRequest extends IncomingMessage {
  body?: unknown;
}

export function sendJSON(res: ServerResponse, status: number, payload: unknown): void {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

export function sendError(res: ServerResponse, status: number, message: string): void {
  sendJSON(res, status, { error: message });
}

export function methodNotAllowed(res: ServerResponse, allowed: string[]): void {
  res.setHeader('allow', allowed.join(', '));
  sendError(res, 405, `Method not allowed. Use ${allowed.join(', ')}.`);
}

export async function getJsonBody(req: ApiRequest): Promise<any> {
  if (req.body !== undefined) {
    return req.body;
  }

  const chunks: Uint8Array[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }

  if (chunks.length === 0) {
    return undefined;
  }

  const raw = Buffer.concat(chunks).toString('utf8');
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

export function getQueryParams(req: ApiRequest): URLSearchParams {
  const url = new URL(req.url ?? '/', 'http://localhost');
  return url.searchParams;
}

export function getPathParameter(req: ApiRequest, segmentIndex: number): string | undefined {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const segments = url.pathname.split('/').filter(Boolean);
  return segments[segmentIndex];
}
