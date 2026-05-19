import { SECTIONS } from './data/sections';
import { STEPS } from './data/steps';
import { appState } from './state';
const { answers } = appState;
import { g } from './dom';
import { buildReport } from './report';

export function renderSidebar(): void {
  const container = g('sidebar-steps')!;
  container.innerHTML = SECTIONS.map((s, i) => {
    const currentSection = STEPS[appState.current].section;

    let cls = 'upcoming';
    if(i === currentSection) cls = 'active';
    else if(i < currentSection) cls = 'done';

    const checkmark = i < currentSection
      ? `<svg class="step-check" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" fill="rgba(255,255,255,0.2)"/><polyline points="4.5 8.5 6.5 10.5 11.5 5.5" stroke="rgba(255,255,255,0.7)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`
      : `<div class="step-circle">${i+1}</div>`;

    return `<div class="sidebar-step ${cls}">
      ${checkmark}
      <span class="sidebar-step-label">${s.label}</span>
    </div>`;
  }).join('');

  const pct = Math.round((appState.current / STEPS.length) * 100);
  g('sidebar-fill')!.style.width = pct + '%';
  g('sidebar-pct')!.textContent = pct + '%';
}

export function renderStep(): void {
  const step = STEPS[appState.current];
  const section = SECTIONS[step.section];
  let html = '';

  html += `<div class="section-eyebrow">${section.icon} ${section.label}</div>`;
  html += `<h2 class="q-main-title">${step.q}</h2>`;
  if(step.sub) html += `<p class="q-main-sub">${step.sub}</p>`;

  if(step.type === 'options'){
    const gridClass = step.cols === 1 ? 'opts-grid single-col' : 'opts-grid';
    html += `<div class="${gridClass}">`;
    step.opts!.forEach((o) => {
      const label = typeof o === 'string' ? o : o.l;
      const sub = typeof o === 'object' && 's' in o && o.s ? o.s : '';
      const sel = answers[step.key] === label ? 'selected' : '';
      html += `<div class="opt-card ${sel}" onclick="selectOpt(this, '${label.replace(/'/g,"\\'")}', '${step.key}')">
        <div class="opt-indicator"><div class="opt-indicator-dot"></div></div>
        <div class="opt-body">
          <div class="opt-label">${label}</div>
          ${sub ? `<div class="opt-sublabel">${sub}</div>` : ''}
        </div>
      </div>`;
    });
    html += `</div>`;
  } else {
    html += `<textarea class="text-field" id="txt-inp" placeholder="${step.ph||''}">${answers[step.key]||''}</textarea>`;
  }

  html += `<div class="nav-row">
    ${appState.current > 0 ? `<button class="btn-back" onclick="prevStep()">← Back</button>` : '<span></span>'}
    <button class="btn-next ${appState.current===STEPS.length-1?'generating':''}" id="btn-next" onclick="nextStep()" ${canProceed()?'':'disabled'}>
      ${appState.current === STEPS.length-1 ? 'Generate My Report →' : 'Continue →'}
    </button>
    <span class="step-count">${appState.current+1} / ${STEPS.length}</span>
  </div>`;

  const main = g('assess-main')!;
  main.style.opacity = '0';
  main.style.transform = 'translateY(12px)';
  main.innerHTML = html;
  requestAnimationFrame(()=>{
    main.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    main.style.opacity = '1';
    main.style.transform = 'translateY(0)';
  });

  if(step.type === 'text'){
    const inp = g('txt-inp') as HTMLTextAreaElement;
    inp.addEventListener('input', () => {
      answers[step.key] = inp.value;
      (g('btn-next') as HTMLButtonElement).disabled = !canProceed();
    });
  }

  renderSidebar();
}

export function canProceed(): boolean {
  const step = STEPS[appState.current];
  if ('optional' in step && step.optional) return true;
  if(step.type === 'text') return !!(answers[step.key] && answers[step.key].trim());
  return !!answers[step.key];
}

export function selectOpt(el: HTMLElement, val: string, key: string): void {
  document.querySelectorAll('.opt-card').forEach((o) => o.classList.remove('selected'));
  el.classList.add('selected');
  answers[key] = val;
  (g('btn-next') as HTMLButtonElement).disabled = false;
}

export function nextStep(): void {
  if(appState.current === STEPS.length - 1){ buildReport(); return; }
  appState.current++;
  renderStep();
}

export function prevStep(): void {
  if(appState.current > 0){ appState.current--; renderStep(); }
}
