import fs from 'fs';
import path from 'path';

const root = process.cwd();

function read(name) {
  return fs.readFileSync(path.join(root, 'src', name), 'utf8');
}

// sections + steps
const sectionsSteps = read('_sectionsSteps.js');
const stepsIdx = sectionsSteps.indexOf('const STEPS');
const sectionsPart = sectionsSteps.slice(0, stepsIdx).replace(/^const SECTIONS/, 'export const SECTIONS');
const stepsPart = sectionsSteps.slice(stepsIdx).replace(/^const STEPS/, 'export const STEPS');

fs.writeFileSync(path.join(root, 'src/data/sections.ts'), sectionsPart.trim() + '\n');
fs.writeFileSync(path.join(root, 'src/data/steps.ts'), stepsPart.trim() + '\n');

// policies
const policies = read('_policies.js')
  .replace(/^const PRIVACY_POLICY_HTML/, 'export const PRIVACY_POLICY_HTML')
  .replace(/^const TERMS_HTML/, 'export const TERMS_HTML');
fs.writeFileSync(path.join(root, 'src/data/policies.ts'), policies.trim() + '\n');

// scoring — strip leading comment, export functions
const scoring = read('_scoring.js')
  .replace(/^\/\/ ── SCORING[^\n]*\n/, '')
  .replace(/^function /gm, 'export function ');
fs.writeFileSync(path.join(root, 'src/scoring.ts'), `import type { Answers, Scores } from './types';\n\n${scoring}\n`);

// report
const report = read('_report.js').replace(/^function buildReport/, 'export function buildReport');
fs.writeFileSync(path.join(root, 'src/report.ts'), report.trim() + '\n');

// modals
const modals = read('_modals.js').replace(/^function /gm, 'export function ');
fs.writeFileSync(path.join(root, 'src/modals.ts'), modals.trim() + '\n');

// ui / assessment flow
const ui = read('_ui.js').replace(/^function /gm, 'export function ');
fs.writeFileSync(
  path.join(root, 'src/assessment.ts'),
  `import { SECTIONS } from './data/sections';
import { STEPS } from './data/steps';
import { current, answers, setCurrent } from './state';
import { g } from './dom';
import { buildReport } from './report';

${ui}
`,
);

// consent (from legacy before policies)
const legacy = read('legacy-app.js');
const consentEnd = legacy.indexOf('const PRIVACY_POLICY_HTML');
const consentBlock = legacy.slice(legacy.indexOf('let current = 0'), consentEnd).trim();
const consentFns = consentBlock
  .replace(/^let current = 0;\nlet answers = {};\n\n/, '')
  .replace(/^function /gm, 'export function ')
  .replace(/renderSidebar\(\)/g, 'import("./assessment").then(m => m.renderSidebar())')
  .replace(/renderStep\(\)/g, 'import("./assessment").then(m => m.renderStep())');

// Simpler: put consent in consent.ts with direct imports
const consentSrc = `import { g } from './dom';
import { PRIVACY_POLICY_HTML, TERMS_HTML } from './data/policies';
import { renderSidebar, renderStep } from './assessment';

export function startAssessment() {
  g('consent-overlay')!.classList.add('open');
}

export function agreeConsent() {
  g('consent-overlay')!.classList.remove('open');
  (g('landing') as HTMLElement).style.display = 'none';
  (g('assessment-page') as HTMLElement).style.display = 'block';
  renderSidebar();
  renderStep();
}

export function declineConsent() {
  g('consent-overlay')!.classList.remove('open');
}

export function toggleCheck(id: string) {
  const box = g(id)!;
  box.classList.toggle('checked');
  (g('btn-agree') as HTMLButtonElement).disabled = !box.classList.contains('checked');
}

export function openPolicy(tab: 'privacy' | 'terms') {
  g('policy-overlay')!.classList.add('open');
  switchTab(tab);
}

export function closePolicy() {
  g('policy-overlay')!.classList.remove('open');
}

export function switchTab(tab: 'privacy' | 'terms') {
  document.querySelectorAll('.policy-tab').forEach((t) => t.classList.remove('active'));
  g('tab-' + tab)!.classList.add('active');
  g('policy-modal-title')!.textContent = tab === 'privacy' ? 'Privacy Policy' : 'Terms of Service';
  g('policy-content')!.innerHTML = tab === 'privacy' ? PRIVACY_POLICY_HTML : TERMS_HTML;
}
`;
fs.writeFileSync(path.join(root, 'src/consent.ts'), consentSrc);

console.log('TypeScript modules generated');
