const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
const js = fs.readFileSync(path.join(root, 'app.js'), 'utf8');

test('i file base esistono e sono collegati', () => {
  assert.match(html, /style\.css/);
  assert.match(html, /app\.js/);
  assert.ok(css.length > 0, 'style.css è vuoto');
});

test('app.js non ha errori di sintassi', () => {
  assert.doesNotThrow(() => new Function(js));
});

test('gli ID usati da app.js esistono in index.html', () => {
  const ids = [
    'canvas', 'previewBtn', 'downloadBtn', 'exportAllBtn',
    'aiBtn', 'aiModal', 'aiGenerate', 'aiModel', 'aiPrompt',
    'aiRefresh', 'aiStatus', 'aiAppend',
    'undoBtn', 'redoBtn', 'saveProjectBtn', 'openProjectBtn', 'importFile',
    'styleEditor', 'clearBtn', 'sidebarBtn', 'autosaveTag', 'templates',
    // v2
    'pagesChips', 'addPageBtn', 'layersList', 'codeBtn', 'codeModal',
    'codeArea', 'codeApply', 'codeClose', 'codeCopy',
    'themeBtn', 'helpBtn', 'helpModal', 'helpClose',
    'elementSearch', 'faviconUrl', 'headCode', 'formEndpoint', 'animToggle',
    'pageTitle', 'pageDescription', 'pageBg', 'pageFont',
  ];
  for (const id of ids) {
    assert.ok(
      html.includes(`id="${id}"`) || html.includes(`id='${id}'`),
      `manca id="${id}" in index.html`
    );
  }
});

test('le nuove funzioni base sono presenti in app.js', () => {
  assert.match(js, /function undo\(/);
  assert.match(js, /function redo\(/);
  assert.match(js, /webbuilder:project:v2/);
  assert.match(js, /function renderStylePanel\(/);
  assert.match(js, /TEMPLATES/);
});

test('le funzioni v2 sono presenti in app.js', () => {
  assert.match(js, /function switchPage\(/);
  assert.match(js, /function addPage\(/);
  assert.match(js, /function removePage\(/);
  assert.match(js, /function renamePage\(/);
  assert.match(js, /function renderLayers\(/);
  assert.match(js, /function openCodeModal\(/);
  assert.match(js, /function applyTheme\(/);
  assert.match(js, /function createBlock\(/);
  assert.match(js, /function countdownScript\(/);
  assert.match(js, /function animSnippets\(/);
});

test('i blocchi e template v2 sono presenti in index.html', () => {
  for (const block of ['navbar', 'hero', 'features', 'stats', 'testimonial', 'team', 'faq', 'cta', 'newsletter', 'countdown', 'contact', 'gallery', 'pricing', 'footer']) {
    assert.ok(html.includes(`data-block="${block}"`), `manca blocco ${block}`);
  }
  for (const tpl of ['landing', 'portfolio', 'ristorante', 'evento', 'business']) {
    assert.ok(html.includes(`data-template="${tpl}"`), `manca template ${tpl}`);
  }
});

test('la tab Livelli e la barra pagine esistono', () => {
  assert.match(html, /id="layers"/);
  assert.match(html, /class="pages-bar"/);
  assert.match(html, /class="pages-chips" id="pagesChips"/);
});

test('i tag principali del canvas sono presenti', () => {
  assert.match(html, /class="canvas"/);
  assert.match(html, /id="previewFrame"/);
});

test('Ollama punta a 127.0.0.1 (evita bug IPv6 su localhost)', () => {
  assert.match(js, /127\.0\.0\.1:11434/);
});
