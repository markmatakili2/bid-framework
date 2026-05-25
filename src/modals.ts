import { sendConsultation, sendImplementation, sendFeedback } from './api/client';
import { g, gInput, gSelect } from './dom';
import { resetState } from './state';

export function openModal(): void {
  g('modal')!.classList.add('open');
}

export function closeModal(): void {
  g('modal')!.classList.remove('open');
}

export function openImplModal(): void {
  g('impl-modal')!.classList.add('open');
}

export function closeImplModal(): void {
  g('impl-modal')!.classList.remove('open');
}

export function submitImpl(): void {
  const name = gInput('i-name')?.value.trim() ?? '';
  const email = gInput('i-email')?.value.trim() ?? '';
  const phone = gInput('i-phone')?.value.trim();
  const timeline = gSelect('i-timeline')?.value;
  const budget = gSelect('i-budget')?.value;
  if (!name || !email) {
    alert('Please enter your name and email address.');
    return;
  }
  sendImplementation({ name, email, phone, timeline, budget });
  g('impl-modal-content')!.innerHTML = `
    <div class="submit-success">
      <div class="success-icon" style="background:#FEF3E2;font-size:22px">⚡</div>
      <div class="success-title">Implementation request sent!</div>
      <p class="success-sub">Thank you, ${name}. The Tuinnov8 expert team has received your request and will reach out within 24 hours to begin scoping your project based on your BID report.</p>
    </div>`;
  setTimeout(closeImplModal, 4500);
}

export function openFeedbackModal(): void {
  g('feedback-modal')!.classList.add('open');
}

export function closeFeedbackModal(): void {
  g('feedback-modal')!.classList.remove('open');
}

export function submitFeedback(): void {
  const name = gInput('f-name')?.value.trim() ?? '';
  const email = gInput('f-email')?.value.trim() ?? '';
  const message = gInput('f-message')?.value.trim() ?? '';
  if (!message) {
    alert('Please share your feedback before submitting.');
    return;
  }

  sendFeedback({ name, email, message });
  g('feedback-modal-content')!.innerHTML = `
    <div class="submit-success">
      <div class="success-icon">✓</div>
      <div class="success-title">Thanks for your feedback!</div>
      <p class="success-sub">Your message has been received. We appreciate your input and will review it as we improve the platform.</p>
    </div>`;
  setTimeout(closeFeedbackModal, 4000);
}

export function submitConsultation(): void {
  const name = gInput('m-name')?.value.trim() ?? '';
  const email = gInput('m-email')?.value.trim() ?? '';
  const phone = gInput('m-phone')?.value.trim();
  const preferredTime = gSelect('m-time')?.value;
  if (!name || !email) {
    alert('Please enter your name and email address.');
    return;
  }
  sendConsultation({ name, email, phone, preferredTime });
  g('modal-content')!.innerHTML = `
    <div class="submit-success">
      <div class="success-icon">✓</div>
      <div class="success-title">Request received!</div>
      <p class="success-sub">Thank you, ${name}. A Tuinnov8 consultant will review your assessment report and reach out within 1 business day to arrange your consultation.</p>
    </div>`;
  setTimeout(closeModal, 4000);
}

export function resetAll(): void {
  resetState();
  (g('report-page') as HTMLElement).style.display = 'none';
  (g('landing') as HTMLElement).style.display = 'flex';
  window.scrollTo(0, 0);
}
