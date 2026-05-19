import { submitAssessment } from './api/client';
import { appState } from './state';
import { g } from './dom';
import { score, maturity, getFindings, getRecs } from './scoring';
import { buildAiSectionPlaceholder, hydrateAiInsights } from './aiReport';

export function buildReport(): void {
  const a = appState.answers;
  const scores = score();
  const mat = maturity(scores.ops, scores.digital);
  const findings = getFindings(a, scores);
  const recs = getRecs(a, scores);
  const overall = Math.round(Object.values(scores).reduce((x, y) => x + y, 0) / Object.values(scores).length);
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const scoreLabel = (v: number) => v>=68?"Strong":v>=42?"Developing":"Needs Attention";
  const dimColour  = (v: number) => v>=68?"#16A34A":v>=42?"#D97706":"#DC2626";
  const dimBadgeCss = (v: number) => v>=68
    ? "background:#F0FDF4;color:#16A34A;"
    : v>=42 ? "background:#FFFBEB;color:#D97706;"
    : "background:#FEF2F2;color:#DC2626;";

  const matLabels = ['Manual','Basic Digital','Partial Integration','Advanced Digital','Fully Integrated'];
  const matCells = [1,2,3,4,5].map(i => {
    let cls = i===mat.level ? 'active' : i<mat.level ? 'passed' : 'ahead';
    return '<div class="word-maturity-cell ' + cls + '">' + matLabels[i-1] + '</div>';
  }).join('');

  const urgLabel = overall<38?"High Priority":overall<64?"Moderate Priority":"Well Positioned";
  const urgColour = overall<38?"#DC2626":overall<64?"#D97706":"#16A34A";

  const findingColour = (d: string) => d==='ind-red'?'red':d==='ind-amber'?'amber':'green';
  const findingLabel  = (d: string) => d==='ind-red'?'Critical':d==='ind-amber'?'Advisory':'Positive';

  let html = '<div class="word-report">';

  // ── COVER ──────────────────────────────────────────
  html += '<div class="word-cover">';
  html += '<div class="word-cover-top">';
  html += '<div class="word-cover-brand"><div class="word-cover-brand-mark">&#9889;</div><span class="word-cover-brand-name">Tuinnov8</span></div>';
  html += '<div class="word-cover-tag">Business Innovation Discovery Report</div>';
  html += '<div class="word-cover-title">Operational Assessment<br>&amp; Diagnostic Report</div>';
  html += '<div class="word-cover-biz">' + (a.bizName||'Your Organisation') + '</div>';
  html += '</div>';

  html += '<div class="word-cover-body">';
  html += '<div class="word-cover-meta-grid">';
  html += '<div class="word-cover-meta-cell"><div class="word-meta-label">Organisation</div><div class="word-meta-value">' + (a.bizName||'&mdash;') + '</div></div>';
  html += '<div class="word-cover-meta-cell"><div class="word-meta-label">Sector</div><div class="word-meta-value">' + (a.sector||'&mdash;') + '</div></div>';
  html += '<div class="word-cover-meta-cell"><div class="word-meta-label">Team Size</div><div class="word-meta-value">' + (a.size||'&mdash;') + '</div></div>';
  html += '<div class="word-cover-meta-cell"><div class="word-meta-label">Report Date</div><div class="word-meta-value">' + today + '</div></div>';
  html += '<div class="word-cover-meta-cell"><div class="word-meta-label">Priority Classification</div><div class="word-meta-value" style="color:' + urgColour + '">' + urgLabel + '</div></div>';
  html += '<div class="word-cover-meta-cell"><div class="word-meta-label">12-Month Focus</div><div class="word-meta-value">' + (a.priority||'&mdash;') + '</div></div>';
  html += '</div>';

  html += '<div class="word-cover-scores">';
  html += '<div class="word-cover-score-box"><div class="word-cover-score-val accent">' + overall + '%</div><div class="word-cover-score-lbl">Overall Maturity Score</div></div>';
  html += '<div class="word-cover-score-box"><div class="word-cover-score-val">' + mat.level + ' / 5</div><div class="word-cover-score-lbl">' + mat.label + '</div></div>';
  html += '<div class="word-cover-score-box"><div class="word-cover-score-val" style="font-size:16px;padding-top:8px;color:' + urgColour + '">' + urgLabel + '</div><div class="word-cover-score-lbl">Action Priority</div></div>';
  html += '</div>';

  if(a.bizDesc) html += '<p style="font-size:13px;color:#555;line-height:1.8;font-style:italic;border-left:3px solid var(--accent);padding-left:16px;margin-bottom:28px;">&ldquo;' + a.bizDesc + '&rdquo;</p>';

  html += '<div class="word-cover-prepared">';
  html += '<div><div class="word-prepared-by">Prepared by</div><div class="word-prepared-name">Tuinnov8 &mdash; Business Innovation Discovery Framework</div><div style="font-size:11px;color:#AAA;margin-top:2px;">For internal use and consultation purposes only</div></div>';
  html += '<div class="word-confidential">Confidential</div>';
  html += '</div></div></div>';

  // ── EXECUTIVE SUMMARY ───────────────────────────────
  html += '<div class="word-page">';
  html += '<div class="word-chapter-label">Chapter 1</div>';
  html += '<div class="word-h1">Executive Summary</div><div class="word-h1-rule"></div>';
  html += '<p class="word-body">This report presents the findings of the Business Innovation Discovery (BID) assessment completed by <strong>' + (a.bizName||'the organisation') + '</strong>, operating in the <strong>' + (a.sector||'business') + '</strong> sector with a team of <strong>' + (a.size||'an undisclosed number of') + '</strong> people. The assessment was conducted using Tuinnov8\'s structured diagnostic framework, which evaluates operational maturity across five dimensions: operations and systems, customer experience, data and reporting, digital readiness, and infrastructure.</p>';
  html += '<p class="word-body">Based on the responses provided, the organisation records an overall digital maturity score of <strong>' + overall + '%</strong>, placing it at <strong>Level ' + mat.level + ' of 5 &mdash; ' + mat.label + '</strong>. This report should be read as a starting point for a more detailed consultation, not as a definitive audit. The findings below reflect patterns identified through the assessment responses and are intended to prompt structured discussion.</p>';

  html += '<div class="word-h2">Score Summary</div>';
  html += '<table class="word-summary-table"><tr><th>Dimension</th><th>Score</th><th>Classification</th><th>Response Recorded</th></tr>';
  html += '<tr><td><strong>Operations &amp; Systems</strong></td><td><strong style="color:' + dimColour(scores.ops) + '">' + Math.round(scores.ops) + '%</strong></td><td>' + scoreLabel(scores.ops) + '</td><td style="font-size:12px;color:#666">' + (a.ops||'&mdash;') + '</td></tr>';
  html += '<tr><td><strong>Customer Experience</strong></td><td><strong style="color:' + dimColour(scores.cx) + '">' + Math.round(scores.cx) + '%</strong></td><td>' + scoreLabel(scores.cx) + '</td><td style="font-size:12px;color:#666">' + (a.cx||'&mdash;') + '</td></tr>';
  html += '<tr><td><strong>Data &amp; Reporting</strong></td><td><strong style="color:' + dimColour(scores.data) + '">' + Math.round(scores.data) + '%</strong></td><td>' + scoreLabel(scores.data) + '</td><td style="font-size:12px;color:#666">' + (a.data||'&mdash;') + '</td></tr>';
  html += '<tr><td><strong>Digital Readiness</strong></td><td><strong style="color:' + dimColour(scores.digital) + '">' + Math.round(scores.digital) + '%</strong></td><td>' + scoreLabel(scores.digital) + '</td><td style="font-size:12px;color:#666">' + (a.digital||'&mdash;') + '</td></tr>';
  html += '<tr><td><strong>Infrastructure</strong></td><td><strong style="color:' + dimColour(scores.infra) + '">' + Math.round(scores.infra) + '%</strong></td><td>' + scoreLabel(scores.infra) + '</td><td style="font-size:12px;color:#666">' + (a.infra||'&mdash;') + '</td></tr>';
  html += '</table>';

  html += '<div class="word-h2">Digital Maturity Scale</div>';
  html += '<div class="word-maturity-scale">' + matCells + '</div>';
  html += '<p style="font-size:12px;color:#888;margin-top:8px;">The organisation is currently at <strong style="color:var(--navy)">Level ' + mat.level + ' &mdash; ' + mat.label + '</strong>. Movement between levels requires deliberate process change alongside any technology investment.</p>';
  html += '</div>';

  // ── DIAGNOSTIC ANALYSIS ─────────────────────────────
  html += '<div class="word-page">';
  html += '<div class="word-chapter-label">Chapter 2</div>';
  html += '<div class="word-h1">Diagnostic Analysis</div><div class="word-h1-rule"></div>';
  html += '<p class="word-body">The following analysis examines each assessment dimension. Observations are drawn from the organisation\'s responses and are intended to surface areas warranting further investigation during a consultation session.</p>';

  // Ops
  html += '<div class="word-h2">2.1 &nbsp; Operations &amp; Systems</div>';
  html += '<div class="word-dim-row"><div class="word-dim-header"><span class="word-dim-title">' + (a.ops||'&mdash;') + '</span><span class="word-dim-badge" style="' + dimBadgeCss(scores.ops) + '">' + scoreLabel(scores.ops) + ' &nbsp; ' + Math.round(scores.ops) + '%</span></div>';
  html += '<div class="word-dim-bar-track"><div class="word-dim-bar-fill" style="width:' + scores.ops + '%;background:' + dimColour(scores.ops) + '"></div></div>';
  if(scores.ops < 40) html += '<div class="word-dim-text">The organisation\'s operations are largely manual. This is not uncommon, but it creates meaningful exposure &mdash; to human error, knowledge dependency on specific individuals, and difficulty scaling without proportionally increasing headcount. The primary question a consultation would seek to answer is: <em>which processes cause the most friction, and what would it take to change them?</em></div>';
  else if(scores.ops < 65) html += '<div class="word-dim-text">Some digital tools are in use, but the picture is one of partial adoption &mdash; individual tools that work in isolation but do not yet form a coherent operational system. Information often moves between these systems manually, creating gaps and duplication. A consultation would focus on understanding how information flows across the organisation and where the most significant breaks occur.</div>';
  else html += '<div class="word-dim-text">The operational foundation is reasonably solid. The focus shifts from basic digitisation to optimisation &mdash; identifying where existing systems can be better connected and more effectively automated. A consultation would focus on the specific workflows where further refinement would yield the most meaningful return.</div>';
  html += '</div>';
  if(a.bottleneck) html += '<p class="word-body">The primary operational bottleneck identified was <strong>' + a.bottleneck + '</strong>. This will be a specific area of focus during the discovery consultation.</p>';

  // CX
  html += '<div class="word-h2">2.2 &nbsp; Customer Experience</div>';
  html += '<div class="word-dim-row"><div class="word-dim-header"><span class="word-dim-title">' + (a.cx||'&mdash;') + '</span><span class="word-dim-badge" style="' + dimBadgeCss(scores.cx) + '">' + scoreLabel(scores.cx) + ' &nbsp; ' + Math.round(scores.cx) + '%</span></div>';
  html += '<div class="word-dim-bar-track"><div class="word-dim-bar-fill" style="width:' + scores.cx + '%;background:' + dimColour(scores.cx) + '"></div></div>';
  if(scores.cx < 50) html += '<div class="word-dim-text">The customer experience challenge identified &mdash; <em>' + (a.cx||'not specified') + '</em> &mdash; is a meaningful signal. Customer-facing friction has a direct impact on retention and referral, two of the most cost-effective growth levers available. The right response depends on where in the customer journey this friction is occurring, which process mapping would clarify.</div>';
  else html += '<div class="word-dim-text">The customer experience appears generally functional, which is a strong foundation. The opportunity is to move beyond adequacy &mdash; identifying how improved channels or communication might expand what the organisation can offer without proportionally increasing cost.</div>';
  html += '</div>';

  // Data
  html += '<div class="word-h2">2.3 &nbsp; Data &amp; Reporting</div>';
  html += '<div class="word-dim-row"><div class="word-dim-header"><span class="word-dim-title">' + (a.data||'&mdash;') + '</span><span class="word-dim-badge" style="' + dimBadgeCss(scores.data) + '">' + scoreLabel(scores.data) + ' &nbsp; ' + Math.round(scores.data) + '%</span></div>';
  html += '<div class="word-dim-bar-track"><div class="word-dim-bar-fill" style="width:' + scores.data + '%;background:' + dimColour(scores.data) + '"></div></div>';
  if(scores.data < 40) html += '<div class="word-dim-text">Decisions made without timely, reliable information carry risk that accumulates quietly. The priority here is not immediately to build sophisticated analytics &mdash; it is to establish a reliable, consistent picture of what is happening in the business on a regular basis.</div>';
  else if(scores.data < 65) html += '<div class="word-dim-text">Some reporting is in place, which provides a baseline. The gap is typically in frequency, reliability, and accessibility &mdash; reports that take significant time to produce or reach decision-makers too infrequently to drive timely action. A consultation would identify what decisions currently lack data support.</div>';
  else html += '<div class="word-dim-text">Strong data visibility is in place. The next frontier is typically moving from descriptive reporting toward more forward-looking capability. A consultation would explore whether this investment is appropriate for the organisation\'s current stage.</div>';
  html += '</div>';

  // Digital
  html += '<div class="word-h2">2.4 &nbsp; Digital Readiness</div>';
  html += '<div class="word-dim-row"><div class="word-dim-header"><span class="word-dim-title">' + (a.digital||'&mdash;') + '</span><span class="word-dim-badge" style="' + dimBadgeCss(scores.digital) + '">' + scoreLabel(scores.digital) + ' &nbsp; ' + Math.round(scores.digital) + '%</span></div>';
  html += '<div class="word-dim-bar-track"><div class="word-dim-bar-fill" style="width:' + scores.digital + '%;background:' + dimColour(scores.digital) + '"></div></div>';
  if(scores.digital < 50) html += '<div class="word-dim-text">Digital adoption is most successful when phased and purposeful &mdash; anchored in solving a specific operational problem, not driven by technology in search of a use case. Any recommended path forward should prioritise visible wins that demonstrate value early and build internal confidence before larger investments are made.</div>';
  else html += '<div class="word-dim-text">There is clear appetite for digital adoption within the organisation, which is one of the most important predictors of successful implementation. The key is ensuring enthusiasm is channelled toward the areas of highest operational impact and that adoption is structured to sustain beyond the initial launch.</div>';
  html += '</div></div>';

  // ── KEY FINDINGS ────────────────────────────────────
  html += '<div class="word-page">';
  html += '<div class="word-chapter-label">Chapter 3</div>';
  html += '<div class="word-h1">Key Findings</div><div class="word-h1-rule"></div>';
  html += '<p class="word-body">The following findings are drawn from the assessment responses. They are presented in order of relative urgency and are intended to focus the agenda of a follow-up consultation session rather than to prescribe specific solutions.</p>';
  findings.forEach(f => {
    html += '<div class="word-finding ' + findingColour(f.dot) + '"><div><div class="word-finding-label">' + findingLabel(f.dot) + '</div></div><div class="word-finding-text">' + f.t + '</div></div>';
  });
  if(a.extra) {
    html += '<div class="word-h2" style="margin-top:24px;">Additional Context</div>';
    html += '<div class="word-dim-row" style="border-left:3px solid var(--accent);"><div class="word-dim-text" style="font-style:italic;">&ldquo;' + a.extra + '&rdquo;</div></div>';
    html += '<p class="word-body" style="font-size:12px;color:#888;">This context will be incorporated into the consultation brief.</p>';
  }
  html += '</div>';

  // ── AREAS FOR INVESTIGATION ─────────────────────────
  html += '<div class="word-page">';
  html += '<div class="word-chapter-label">Chapter 4</div>';
  html += '<div class="word-h1">Areas for Further Investigation</div><div class="word-h1-rule"></div>';
  html += '<p class="word-body">The following areas have been identified as warranting deeper investigation based on the assessment responses. These are not prescriptive recommendations &mdash; the specific approach, tools, and sequencing for each area will be determined through a detailed consultation and process mapping session with the Tuinnov8 team.</p>';
  html += '<p class="word-body">Each area reflects a pattern that commonly underlies operational inefficiency, unrealised growth potential, or avoidable risk. The consultation will determine which applies most directly to <strong>' + (a.bizName||'your organisation') + '</strong> and in what order they should be addressed.</p>';

  recs.forEach((r, i) => {
    html += '<div class="word-rec"><div class="word-rec-num">' + (i+1) + '</div><div class="word-rec-body">' +
      '<div class="word-rec-title">' + r.t + '</div>' +
      '<div class="word-rec-desc">' + r.d + '</div>' +
      (r.value ? '<div class="word-rec-value"><span class="word-rec-value-label">&#128200; Business Value &amp; Revenue Impact</span>' + r.value + '</div>' : '') +
      (r.tag ? '<span class="word-rec-tag">' + r.tag + '</span>' : '') +
      '</div></div>';
  });

  html += '<p class="word-body" style="margin-top:20px;font-size:12.5px;color:#666;font-style:italic;">Note: The above areas are informed by the assessment responses and sector context. They are presented as a basis for structured discussion. Tuinnov8 does not recommend specific systems, vendors, or technical approaches until a full discovery consultation has been completed.</p>';
  html += '</div>';

  // ── NEXT STEPS ──────────────────────────────────────
  html += '<div class="word-page">';
  html += '<div class="word-chapter-label">Chapter 5</div>';
  html += '<div class="word-h1">Proposed Next Steps</div><div class="word-h1-rule"></div>';
  html += '<p class="word-body">This assessment provides a structured starting point. The value of the BID framework is in what it surfaces for deeper exploration &mdash; not in the report itself. The recommended next steps for <strong>' + (a.bizName||'your organisation') + '</strong> are set out below.</p>';

  html += '<table class="word-summary-table" style="margin-bottom:28px;"><tr><th style="width:36px">#</th><th>Step</th><th>Purpose</th></tr>';
  html += '<tr><td><strong>1</strong></td><td><strong>Discovery Consultation</strong></td><td>A 90-minute structured session with a Tuinnov8 consultant to validate findings, map processes in detail, and identify the highest-priority intervention areas.</td></tr>';
  html += '<tr><td><strong>2</strong></td><td><strong>Process Mapping</strong></td><td>A detailed mapping of core operational flows &mdash; customer journey, internal communication, financial tracking, and sector-specific processes &mdash; to locate exactly where friction occurs.</td></tr>';
  html += '<tr><td><strong>3</strong></td><td><strong>Solution Design</strong></td><td>Based on consultation findings, Tuinnov8 prepares a tailored brief outlining a specific, phased approach to priority areas &mdash; including indicative timelines and investment options.</td></tr>';
  html += '<tr><td><strong>4</strong></td><td><strong>Implementation Planning</strong></td><td>A detailed implementation plan developed with relevant stakeholders, including milestones, responsibilities, and success metrics.</td></tr>';
  html += '</table>';

  html += '<div class="word-next-steps">';
  html += '<div class="word-next-label">Get Started</div>';
  html += '<div class="word-next-title">Schedule your free consultation</div>';
  html += '<div class="word-next-body">A Tuinnov8 consultant will review this report, reach out to confirm the findings, and arrange a discovery session at a time that suits you. The initial consultation is provided at no cost and carries no obligation.</div>';
  html += '<div class="word-next-contact">&#128231; &nbsp;info@tuinnov8.com &nbsp;&middot;&nbsp; &#127760; &nbsp;tuinnov8.com/consult</div>';
  html += '<div class="word-next-buttons">';
  html += '<button class="btn-cta-primary" onclick="openModal()" style="font-size:14px;padding:13px 28px;">&#128197; Schedule Consultation</button>';
  html += '<button class="btn-cta-primary" style="background:var(--accent);font-size:14px;padding:13px 28px;" onclick="openImplModal()">&#9889; Implement with Tuinnov8</button>';
  html += '<button class="btn-cta-secondary" onclick="resetAll()" style="font-size:14px;">&#8592; New Assessment</button>';
  html += '</div></div>';

  html += '<p style="font-size:11px;color:#AAA;text-align:center;margin-top:28px;line-height:1.7;">This report was generated by the Tuinnov8 Business Innovation Discovery Framework and is based solely on self-reported assessment responses. It should be read as a diagnostic starting point, not a definitive business audit. &copy; 2025 Tuinnov8. All rights reserved. Confidential.</p>';
  html += '</div></div>';
  html += buildAiSectionPlaceholder();

  g('report-body')!.innerHTML = html;
  (g('assessment-page') as HTMLElement).style.display = 'none';
  (g('report-page') as HTMLElement).style.display = 'block';
  window.scrollTo(0, 0);
  void hydrateAiInsights();

  submitAssessment({
    answers: { ...a },
    scores: { ...scores },
    overallScore: overall,
    maturityLevel: mat.level,
    maturityLabel: mat.label,
  });
}
