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

function listItems(items: string[], cls: string): string {
  if (!items.length) return '';
  return `<ul class="word-ai-list ${cls}">${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
}

export function buildAiSectionPlaceholder(): string {
  return `
    <div class="word-page word-ai-page" id="ai-insights-section">
      <div class="word-ai-header">
        <span class="word-ai-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2a4 4 0 0 1 4 4v1h1a3 3 0 0 1 0 6h-1v1a4 4 0 0 1-8 0v-1H7a3 3 0 0 1 0-6h1V6a4 4 0 0 1 4-4z"></path>
            <circle cx="9" cy="12" r="1"></circle>
            <circle cx="15" cy="12" r="1"></circle>
          </svg>
          AI-Powered Analysis
        </span>
      </div>
      <div class="word-h1">Strategic Insights</div>
      <div class="word-h1-rule"></div>
      <div id="ai-insights-mount" class="word-ai-mount">
        <div class="word-ai-loading">
          <div class="word-ai-spinner"></div>
          <div class="word-ai-loading-text">Analysing your assessment with AI...</div>
          <div class="word-ai-loading-sub">Reviewing scores, findings, and sector context</div>
        </div>
      </div>
    </div>
  `;
}

function renderInsights(insights: AiInsights): string {
  const sourceLabel = insights.source === 'ai' ? 'Live AI model output' : 'Smart fallback analysis';
  return `
    <div class="word-ai-source">${sourceLabel}</div>
    <div class="word-ai-grid">
      <div class="word-ai-card word-ai-card-wide">
        <div class="word-ai-card-title">Executive Read</div>
        <p class="word-ai-paragraph">${esc(insights.executiveSummary)}</p>
      </div>
      <div class="word-ai-card">
        <div class="word-ai-card-title">Strategic Priorities</div>
        ${listItems(insights.strategicPriorities, 'priorities')}
      </div>
      <div class="word-ai-card">
        <div class="word-ai-card-title">Immediate Risks</div>
        ${listItems(insights.risks, 'risks')}
      </div>
      <div class="word-ai-card">
        <div class="word-ai-card-title">Key Opportunities</div>
        ${listItems(insights.opportunities, 'opportunities')}
      </div>
      <div class="word-ai-card">
        <div class="word-ai-card-title">Quick Wins (30-60 days)</div>
        ${listItems(insights.quickWins, 'wins')}
      </div>
      <div class="word-ai-card word-ai-card-wide">
        <div class="word-ai-card-title">Sector Insight</div>
        <p class="word-ai-paragraph">${esc(insights.sectorInsight)}</p>
        <div class="word-ai-card-title" style="margin-top:12px;">Discovery Agenda</div>
        <p class="word-ai-paragraph">${esc(insights.consultationAgenda)}</p>
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