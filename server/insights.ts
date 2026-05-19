export interface InsightRequest {
  answers: Record<string, string>;
  scores: Record<string, number>;
  overallScore: number;
  maturityLevel: number;
  maturityLabel: string;
  findings: { dot: string; t: string }[];
  recommendations: { t: string; d: string; tag?: string }[];
}

export interface AiInsights {
  source: 'ai' | 'smart';
  executiveSummary: string;
  strategicPriorities: string[];
  risks: string[];
  opportunities: string[];
  sectorInsight: string;
  quickWins: string[];
  consultationAgenda: string;
}

const SYSTEM_PROMPT = `You are a senior business innovation consultant at Tuinnov8, specialising in operational diagnostics and digital transformation for SMEs in Africa and emerging markets.

You receive structured output from the Business Innovation Discovery (BID) assessment. Your role is to review the scores, findings, and recommendations and produce deeper, tailored strategic insights that go beyond the template — connecting patterns across dimensions, naming trade-offs, and prioritising action.

Respond ONLY with valid JSON matching this schema (no markdown):
{
  "executiveSummary": "2-3 sentences: holistic read of the organisation's position",
  "strategicPriorities": ["3-5 specific priorities ordered by impact"],
  "risks": ["2-4 risks if gaps are not addressed"],
  "opportunities": ["2-4 growth or efficiency opportunities"],
  "sectorInsight": "1-2 sentences specific to their sector and size",
  "quickWins": ["2-3 actions achievable within 30-60 days"],
  "consultationAgenda": "1-2 sentences on what a Tuinnov8 discovery session should focus on first"
}

Be concrete, reference their answers where relevant, avoid generic fluff, and do not recommend specific vendors or products.`;

function buildUserPrompt(ctx: InsightRequest): string {
  return JSON.stringify(
    {
      organisation: ctx.answers.bizName || 'Unnamed organisation',
      sector: ctx.answers.sector,
      teamSize: ctx.answers.size,
      description: ctx.answers.bizDesc,
      priority12m: ctx.answers.priority,
      bottleneck: ctx.answers.bottleneck,
      revenueChannel: ctx.answers.revenue,
      extraContext: ctx.answers.extra,
      responses: {
        operations: ctx.answers.ops,
        dataReporting: ctx.answers.data,
        digitalReadiness: ctx.answers.digital,
        infrastructure: ctx.answers.infra,
        customerExperience: ctx.answers.cx,
      },
      scores: ctx.scores,
      overallScore: ctx.overallScore,
      maturity: { level: ctx.maturityLevel, label: ctx.maturityLabel },
      existingFindings: ctx.findings.map((f) => f.t),
      existingRecommendations: ctx.recommendations.map((r) => r.t),
    },
    null,
    2,
  );
}

function parseInsightsJson(raw: string): Omit<AiInsights, 'source'> {
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  const arr = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  const str = (v: unknown, fallback: string): string =>
    typeof v === 'string' && v.trim() ? v.trim() : fallback;

  return {
    executiveSummary: str(parsed.executiveSummary, ''),
    strategicPriorities: arr(parsed.strategicPriorities),
    risks: arr(parsed.risks),
    opportunities: arr(parsed.opportunities),
    sectorInsight: str(parsed.sectorInsight, ''),
    quickWins: arr(parsed.quickWins),
    consultationAgenda: str(parsed.consultationAgenda, ''),
  };
}

async function generateWithOpenAI(ctx: InsightRequest): Promise<AiInsights> {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.6,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(ctx) },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty response from AI provider');

  return { source: 'ai', ...parseInsightsJson(content) };
}

function weakestDimension(scores: Record<string, number>): string {
  const labels: Record<string, string> = {
    ops: 'operations & systems',
    data: 'data & reporting',
    digital: 'digital readiness',
    infra: 'infrastructure',
    cx: 'customer experience',
  };
  let minKey = 'ops';
  let minVal = scores.ops ?? 100;
  for (const [k, v] of Object.entries(scores)) {
    if (v < minVal) {
      minVal = v;
      minKey = k;
    }
  }
  return labels[minKey] || minKey;
}

function generateSmartFallback(ctx: InsightRequest): AiInsights {
  const name = ctx.answers.bizName || 'your organisation';
  const sector = ctx.answers.sector || 'your sector';
  const weak = weakestDimension(ctx.scores);
  const bottleneck = ctx.answers.bottleneck;
  const priority = ctx.answers.priority || 'operational improvement';

  const priorities: string[] = [];
  if ((ctx.scores.ops ?? 0) < 55) {
    priorities.push(
      `Stabilise core operations for ${name} by mapping manual workflows and targeting the highest-friction steps before adding new tools.`,
    );
  }
  if ((ctx.scores.data ?? 0) < 55) {
    priorities.push(
      'Establish a minimum viable management dashboard — even weekly — so leadership decisions are backed by consistent numbers.',
    );
  }
  if (bottleneck) {
    priorities.push(`Address the stated bottleneck (${bottleneck}) as the anchor for the first improvement sprint.`);
  }
  if ((ctx.scores.digital ?? 0) < 50) {
    priorities.push(
      'Run a phased digital adoption plan: one visible win in 30 days, then expand — avoid big-bang rollouts.',
    );
  }
  if ((ctx.scores.cx ?? 0) < 50 && ctx.answers.cx) {
    priorities.push(`Improve customer experience around: "${ctx.answers.cx}" — map the journey end-to-end.`);
  }
  if (priorities.length < 3) {
    priorities.push(
      `Optimise and connect existing systems in ${sector} so ${name} can scale without proportional headcount growth.`,
    );
  }

  const risks: string[] = [];
  if (ctx.overallScore < 40) {
    risks.push('Continued reliance on manual processes increases error rates and key-person dependency.');
  }
  if ((ctx.scores.data ?? 0) < 40) {
    risks.push('Decisions made without reliable data elevate the risk of slow or costly misjudgements.');
  }
  if ((ctx.scores.infra ?? 0) < 45) {
    risks.push('Infrastructure gaps may undermine returns on any digital investment.');
  }
  if (risks.length === 0) {
    risks.push('Complacency at current maturity can allow competitors with better digital channels to capture market share.');
  }

  const opportunities: string[] = [];
  if (ctx.answers.revenue === 'No online sales or booking channel') {
    opportunities.push('A direct online channel could unlock 24/7 revenue and reduce staff load on routine transactions.');
  }
  opportunities.push(
    `Sector-specific gains in ${sector} often come from better visibility and faster response — both achievable without enterprise-scale budgets.`,
  );
  if (ctx.maturityLevel <= 3) {
    opportunities.push(
      `Moving from Level ${ctx.maturityLevel} (${ctx.maturityLabel}) to the next maturity stage typically yields the highest ROI per dollar spent.`,
    );
  }

  const quickWins: string[] = [];
  if (bottleneck?.includes('paperwork') || bottleneck?.includes('data entry')) {
    quickWins.push('Digitise one repetitive form or approval step this month and measure hours saved.');
  } else {
    quickWins.push('Document the top three weekly decisions that lack data — assign one metric owner for each.');
  }
  quickWins.push('Schedule a 90-minute internal process walkthrough with frontline staff before any tool purchase.');
  if ((ctx.scores.cx ?? 0) < 65) {
    quickWins.push('Introduce a simple customer follow-up checklist or CRM trial for one team.');
  }

  return {
    source: 'smart',
    executiveSummary: `${name} scores ${ctx.overallScore}% overall (Level ${ctx.maturityLevel} — ${ctx.maturityLabel}). The diagnostic points to ${weak} as the weakest dimension relative to peers, while the stated 12-month focus on "${priority}" should guide sequencing. This analysis synthesises assessment patterns; configure an AI API key for fully personalised LLM insights.`,
    strategicPriorities: priorities.slice(0, 5),
    risks: risks.slice(0, 4),
    opportunities: opportunities.slice(0, 4),
    sectorInsight: ctx.recommendations[0]?.d || `Organisations in ${sector} benefit most from fixing operational visibility before large technology spend.`,
    quickWins: quickWins.slice(0, 3),
    consultationAgenda: `Open the Tuinnov8 discovery session with ${weak} and ${bottleneck ? `the "${bottleneck}" bottleneck` : 'process mapping'}, then validate whether "${priority}" is best served by automation, data, or customer-channel investment first.`,
  };
}

export async function generateInsights(ctx: InsightRequest): Promise<AiInsights> {
  if (process.env.OPENAI_API_KEY?.trim()) {
    try {
      return await generateWithOpenAI(ctx);
    } catch (err) {
      console.error('[AI] Provider failed, using smart fallback:', err);
    }
  }
  return generateSmartFallback(ctx);
}
