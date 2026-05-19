import fs from 'fs';

const html = fs.readFileSync('index.html', 'utf8');
const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
const bodyStart = html.indexOf('<body>') + 6;
const scriptStart = html.indexOf('<script>');
const consentStart = html.indexOf('<!-- ── CONSENT MODAL');
const bodyMain = html.slice(bodyStart, scriptStart);
const consentPolicy = html.slice(consentStart, html.indexOf('</body>'));

fs.mkdirSync('src/styles', { recursive: true });
fs.mkdirSync('src/data', { recursive: true });
fs.writeFileSync('src/styles/main.css', styleMatch[1].trim());
fs.writeFileSync('src/body.html', bodyMain.trim() + '\n\n' + consentPolicy.trim());
fs.writeFileSync('src/legacy-app.js', scriptMatch[1].trim());
console.log('Extracted:', {
  css: styleMatch[1].length,
  body: bodyMain.length + consentPolicy.length,
  js: scriptMatch[1].length,
});
