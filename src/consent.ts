import { g } from './dom';
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
