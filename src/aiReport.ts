import { fetchAiInsights } from './api/ai';
import { g } from './dom';
import { getReportContext } from './reportContext';
import type { AiInsights } from './types';

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildAiSectionPlaceholder(): string {
  return `
    <div class="word-page" id="ai-insights-section">
      <div class="word-h1">Possible Solutions</div>
      <div class="word-h1-rule"></div>
      <p class="word-body">This section offers a more human-friendly summary of the report and practical solutions that close the gaps identified by your assessment.</p>
      <div id="ai-insights-mount" class="word-ai-mount">
        <div class="word-ai-loading">
          <div class="word-ai-spinner"></div>
          <div class="word-ai-loading-text">Refining your report language...</div>
          <div class="word-ai-loading-sub">Creating clear insights and gap-focused actions</div>
        </div>
      </div>
    </div>
  `;
}

function renderSolutions(items: { title: string; explanation: string }[]): string {
  if (!items.length) return '<p class="word-body">No solutions available at this time.</p>';
  return `<div class="word-solutions-list">${items
    .map(
      (item) =>
        `<div class="word-solution-card"><div class="word-solution-title">${esc(item.title)}</div><p class="word-solution-explanation">${esc(item.explanation)}</p></div>`,
    )
    .join('')}</div>`;
}

function renderInsights(insights: AiInsights): string {
  return `
    <div class="word-ai-source">Report rewrite and gap-focused solutions</div>
    <div class="word-ai-grid">
      <div class="word-ai-card word-ai-card-wide">
        <div class="word-ai-card-title">What this means</div>
        <p class="word-ai-paragraph">${esc(insights.humanRewrite)}</p>
      </div>
      <div class="word-ai-card word-ai-card-wide">
        <div class="word-ai-card-title">Possible Solutions</div>
        ${renderSolutions(insights.possibleSolutions)}
      </div>
    </div>
  `;
}

export async function hydrateAiInsights(): Promise<void> {
  const mount = g('ai-insights-mount');
  if (!mount) return;
  const context = getReportContext();
  const insights = await fetchAiInsights(context);
  if (!insights) {
    mount.innerHTML = `
      <div class="word-ai-error">
        Unable to generate AI insights right now. Please try again in a moment.
      </div>
    `;
    return;
  }
  mount.innerHTML = renderInsights(insights);
}