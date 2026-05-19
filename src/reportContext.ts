import { appState } from './state';
import { score, maturity, getFindings, getRecs } from './scoring';
import type { InsightRequest } from './types';

export function getReportContext(): InsightRequest {
  const a = appState.answers;
  const scores = score();
  const mat = maturity(scores.ops, scores.digital);
  const overallScore = Math.round(
    Object.values(scores).reduce((x, y) => x + y, 0) / Object.values(scores).length,
  );

  return {
    answers: { ...a },
    scores: { ...scores },
    overallScore,
    maturityLevel: mat.level,
    maturityLabel: mat.label,
    findings: getFindings(a, scores),
    recommendations: getRecs(a, scores).map((r) => ({
      t: r.t,
      d: r.d,
      tag: r.tag,
    })),
  };
}
