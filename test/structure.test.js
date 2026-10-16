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
  assert.match(js, /webbuilder:project:v1/);
  assert.match(js, /function renderStylePanel\(/);
  assert.match(js, /TEMPLATES/);
});

test('i tag principali del canvas sono presenti', () => {
  assert.match(html, /class="canvas"/);
  assert.match(html, /id="previewFrame"/);
});

test('Ollama punta a 127.0.0.1 (evita bug IPv6 su localhost)', () => {
  assert.match(js, /127\.0\.0\.1:11434/);
});
