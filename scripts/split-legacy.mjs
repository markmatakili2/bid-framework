import fs from 'fs';

const js = fs.readFileSync('src/legacy-app.js', 'utf8');

function slice(startMarker, endMarker) {
  const start = startMarker ? js.indexOf(startMarker) : 0;
  if (start === -1) throw new Error(`Start not found: ${startMarker}`);
  const end = endMarker ? js.indexOf(endMarker, start) : js.length;
  if (endMarker && end === -1) throw new Error(`End not found: ${endMarker}`);
  return js.slice(start, end).trim();
}

const sectionsSteps = slice('const SECTIONS', 'let current = 0');
const policies = slice('const PRIVACY_POLICY_HTML', 'function renderSidebar');
const ui = slice('function renderSidebar', '// ── SCORING');
const scoring = slice('// ── SCORING', 'function buildReport');
const report = slice('function buildReport', 'function openModal');
const modals = slice('function openModal', null);

fs.writeFileSync('src/_sectionsSteps.js', sectionsSteps);
fs.writeFileSync('src/_policies.js', policies);
fs.writeFileSync('src/_ui.js', ui);
fs.writeFileSync('src/_scoring.js', scoring);
fs.writeFileSync('src/_report.js', report);
fs.writeFileSync('src/_modals.js', modals);
console.log('Split OK');
