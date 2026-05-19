import type { AiInsights, InsightRequest } from '../types';

export async function fetchAiInsights(
  context: InsightRequest,
): Promise<AiInsights | null> {
  try {
    const res = await fetch('/api/ai/insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(context),
    });
    if (!res.ok) return null;
    return (await res.json()) as AiInsights;
  } catch {
    return null;
  }
}
