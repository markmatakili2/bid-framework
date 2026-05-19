import './styles/main.css';
import bodyHtml from './body.html?raw';
import * as consent from './consent';
import * as assessment from './assessment';
import * as modals from './modals';
import { saveReportAsPdf } from './pdf';

const api = {
  ...consent,
  ...assessment,
  ...modals,
  saveReportAsPdf,
  print: () => void saveReportAsPdf(),
};

Object.assign(window, api);

const app = document.getElementById('app');
if (app) {
  app.innerHTML = bodyHtml;
}
