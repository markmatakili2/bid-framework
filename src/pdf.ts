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
  
  // Clone the report content
  const clone = source.cloneNode(true) as HTMLElement;
  
  // Remove interactive elements but keep all content
  clone.querySelectorAll('button').forEach((el) => {
    el.remove();
  });
  clone.querySelectorAll('.word-next-buttons').forEach((el) => {
    el.remove();
  });
  clone.querySelectorAll('.word-ai-loading').forEach((el) => {
    el.remove();
  });
  
  wrapper.appendChild(clone);

  // Position off-screen but keep it in document flow for proper rendering
  wrapper.style.cssText =
    'position:absolute;left:-9999px;top:0;width:900px;background:#fff;z-index:-1;color:#000;padding:0;margin:0;';

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

    // Wait for content to settle and images to load
    await new Promise(resolve => setTimeout(resolve, 200));

    const reportEl = exportRoot.querySelector('.word-report');
    const element = (reportEl || exportRoot) as HTMLElement;
    
    await html2pdf()
      .set({
        margin: [10, 10, 10, 10],
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: '#ffffff',
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait',
        },
      })
      .from(element)
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
