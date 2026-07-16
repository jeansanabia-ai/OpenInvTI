#!/usr/bin/env node
// Teste E2E do OpenInvTI — valida sintaxe + simula fluxo via jsdom
// Uso: node test/e2e.js  (rodar dentro da pasta C:\OpenInvTI / /c/OpenInvTI)

const fs = require('fs');
const path = require('path');
const root = process.cwd();

let pass = 0, fail = 0;
const fails = [];
function test(name, fn) {
  try {
    const r = fn();
    if (r === false) { fail++; fails.push(name); console.log('  X ' + name); }
    else { pass++; console.log('  OK ' + name); }
  } catch (e) {
    fail++;
    const msg = (e.message || e).toString().substring(0, 250);
    fails.push(name + ': ' + msg);
    console.log('  X ' + name + '\n      ' + msg);
  }
}
process.on('unhandledRejection', () => {});

console.log('\n=== 1. SINTAXE DOS ARQUIVOS ===');
test('app.js parse OK', () => { new Function(fs.readFileSync(path.join(root, 'app.js'), 'utf8')); });
test('sw.js parse OK', () => { new Function(fs.readFileSync(path.join(root, 'sw.js'), 'utf8')); });

console.log('\n=== 2. INTEGRIDADE DO HTML ===');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
test('HTML tem <script src="app.js">', () => /<script src="app.js(\?v=[\d.]+)?">/.test(html));
test('HTML tem #cameraModal',         () => /id="cameraModal"/.test(html));
test('HTML tem #toast',               () => /id="toast"/.test(html));
test('HTML tem #cfgQuickFar',         () => /id="cfgQuickFar"/.test(html));
test('HTML fecha </body> e </html>',  () => html.includes('</body>') && html.includes('</html>'));
test('HTML tem CDN tesseract',        () => html.includes('tesseract'));
test('HTML tem CDN exceljs',          () => html.includes('exceljs'));

console.log('\n=== 3. CONSISTENCIA DE VERSAO ===');
const appJs = fs.readFileSync(path.join(root,'app.js'),'utf8');
const swJs = fs.readFileSync(path.join(root,'sw.js'),'utf8');
const appV = (appJs.match(/APP_VERSION\s*=\s*'([^']+)'/) || [])[1];
const swV  = (swJs.match(/openinvti-v([\d.]+)-prod/) || [])[1];
const htmlV = (html.match(/v(\d+\.\d+\.\d+)<\/div>/) || [])[1];
console.log('  app.js:', appV, '| sw.js:', swV, '| index.html:', htmlV);
test('Versoes batem entre app.js e sw.js', () => appV === swV);
test('Versoes batem entre app.js e index.html', () => appV === htmlV);

console.log('\n=== 4. FLUXO E2E (jsdom) ===');
let jsdom;
try { jsdom = require('jsdom'); }
catch (e) {
  try { jsdom = require(path.join(root,'test','node_modules','jsdom')); }
  catch (e2) { try { jsdom = require('/tmp/node_modules/jsdom'); } catch (e3) { jsdom = null; } }
}

if (!jsdom) {
  console.log('  ! jsdom nao instalado - testes E2E pulados.');
  console.log('  Pra instalar: cd test && npm install jsdom');
  console.log('\nResumo: ' + pass + ' OK, ' + fail + ' FAIL');
  process.exit(fail > 0 ? 1 : 0);
}

const cleanHtml = html.replace('<script src="app.js"></script>', '<!-- inj -->');
const dom = new jsdom.JSDOM(cleanHtml, {
  url: 'https://jeansanabia-ai.github.io/OpenInvTI/',
  runScripts: 'dangerously',
  pretendToBeVisual: true,
});
const w = dom.window, d = w.document;

// Stub robusto de IndexedDB
const fakeStore = {
  get: () => { const r={}; setTimeout(() => r.onsuccess && r.onsuccess({target:{result:null}}), 0); return r; },
  put: () => { const r={}; setTimeout(() => r.onsuccess && r.onsuccess({}), 0); return r; },
  add: () => { const r={}; setTimeout(() => r.onsuccess && r.onsuccess({}), 0); return r; },
  getAll: () => { const r={}; setTimeout(() => r.onsuccess && r.onsuccess({target:{result:[]}}), 0); return r; },
  delete: () => { const r={}; setTimeout(() => r.onsuccess && r.onsuccess({}), 0); return r; },
};
const fakeTx = { objectStore: () => fakeStore, oncomplete: null };
const fakeDb = { transaction: () => fakeTx, createObjectStore: () => fakeStore, objectStoreNames: { contains: () => true } };
w.indexedDB = {
  open: () => {
    const r = {};
    setTimeout(() => {
      try { r.onupgradeneeded && r.onupgradeneeded({ target: { result: fakeDb } }); } catch (e) {}
      try { r.onsuccess && r.onsuccess({ target: { result: fakeDb } }); } catch (e) {}
    }, 0);
    return r;
  }
};
w.navigator.serviceWorker = { register: () => Promise.resolve({}), ready: Promise.resolve({}) };
w.matchMedia = () => ({ matches:false, addEventListener:() => {}, removeEventListener:() => {} });

const errosJS = [];
w.addEventListener('error', (e) => errosJS.push(e.message || String(e)));
w.console.error = (...a) => errosJS.push('console.error: ' + a.map(x => String(x).substring(0,150)).join(' '));

try {
  const s = d.createElement('script');
  s.textContent = appJs;
  d.body.appendChild(s);
} catch (e) { errosJS.push('Inject: ' + e.message); }

setTimeout(() => {
  try { d.dispatchEvent(new w.Event('DOMContentLoaded', { bubbles: true })); } catch (e) {}
  setTimeout(() => {
    test('subtitulo mostra versao correta', () => d.getElementById('topSub').textContent.includes('v' + appV));
    test('botao verde existe no DOM', () => !!d.getElementById('cfgQuickFar'));
    test('botao verde grava localStorage com Farmanguinhos', () => {
      d.getElementById('cfgQuickFar').click();
      const cfg = w.localStorage.getItem('openinvti-config');
      if (!cfg) return false;
      const obj = JSON.parse(cfg);
      return obj.empresa.nome === 'Farmanguinhos' && obj.setup_done === true;
    });
    test('todos botoes criticos existem', () => {
      const ids = ['cfgSalvar','cfgResetar','cfgQuickFar','btnStart','btnImport','btnAnalytics','btnCopilot','wizNext','wizBack','wizBarcode'];
      const miss = ids.filter(id => !d.getElementById(id));
      if (miss.length) throw new Error('faltando: ' + miss.join(','));
      return true;
    });
    test('sem erros JS fatais', () => {
      const fatais = errosJS.filter(e => {
        if (/Not implemented:.*(navigation|HTMLCanvas|HTMLMedia)/.test(e)) return false;
        if (/objectStoreNames|transaction|getCapabilities|getUserMedia/.test(e)) return false;
        return true;
      });
      if (fatais.length === 0) return true;
      throw new Error(fatais.slice(0,2).join(' | '));
    });

    console.log('\n=== RESUMO ===');
    console.log('  OK: ' + pass);
    console.log('  X : ' + fail);
    if (fail > 0) {
      console.log('\nFALHAS:');
      fails.forEach(f => console.log('  - ' + f));
      process.exit(1);
    }
    console.log('\nTUDO OK - seguro pra deploy.\n');
    process.exit(0);
  }, 800);
}, 500);
