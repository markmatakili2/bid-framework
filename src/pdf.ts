import { appState } from './state';
import { g } from './dom';

function safeFilename(name: string): string {
  return name.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-') || 'Organisation';
}

function buildExportRoot(): HTMLElement {
  const source = g('report-body');
  if (!source?.firstElementChild) {
    throw new Error('Report is not ready yet. Complete the assessment first.');
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'pdf-export-root';
  const clone = source.cloneNode(true) as HTMLElement;
  wrapper.appendChild(clone);

  wrapper.querySelectorAll('button, .word-next-buttons, .word-ai-loading').forEach((el) => {
    el.remove();
  });

  wrapper.style.cssText =
    'position:fixed;left:-10000px;top:0;width:900px;background:#fff;z-index:-1;';
  document.body.appendChild(wrapper);
  return wrapper;
}

export async function saveReportAsPdf(): Promise<void> {
  const btn = document.querySelector<HTMLButtonElement>('.btn-print');
  const originalLabel = btn?.textContent;
  let exportRoot: HTMLElement | null = null;

  try {
    exportRoot = buildExportRoot();
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Generating PDF…';
    }

    const biz = appState.answers.bizName || 'BID-Report';
    const filename = `Tuinnov8-BID-${safeFilename(biz)}.pdf`;
    const { default: html2pdf } = await import('html2pdf.js');

    await html2pdf()
      .set({
        margin: [12, 12, 12, 12],
        filename,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          scrollY: 0,
          windowWidth: 900,
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .from(exportRoot)
      .save();
  } catch (err) {
    console.error('[PDF]', err);
    alert(err instanceof Error ? err.message : 'Could not generate PDF. Please try again.');
  } finally {
    exportRoot?.remove();
    if (btn) {
      btn.disabled = false;
      btn.textContent = originalLabel ?? '⬇ Save as PDF';
    }
  }
}
