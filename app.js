const canvas = document.getElementById('canvas');
const elementList = document.querySelectorAll('.element-item');
const blockList = document.querySelectorAll('.block-item');
const navBtns = document.querySelectorAll('.nav-btn');
const tabContents = document.querySelectorAll('.tab-content');
const previewBtn = document.getElementById('previewBtn');
const downloadBtn = document.getElementById('downloadBtn');
const exportAllBtn = document.getElementById('exportAllBtn');
const previewModal = document.getElementById('previewModal');
const previewModalClose = document.getElementById('previewModalClose');
const previewFrame = document.getElementById('previewFrame');
const pageTitle = document.getElementById('pageTitle');
const pageDescription = document.getElementById('pageDescription');
const pageBg = document.getElementById('pageBg');
const pageFont = document.getElementById('pageFont');
const styleEditor = document.getElementById('styleEditor');
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
const saveProjectBtn = document.getElementById('saveProjectBtn');
const openProjectBtn = document.getElementById('openProjectBtn');
const importFile = document.getElementById('importFile');
const clearBtn = document.getElementById('clearBtn');
const sidebarBtn = document.getElementById('sidebarBtn');
const autosaveTag = document.getElementById('autosaveTag');
const pagesChips = document.getElementById('pagesChips');
const addPageBtn = document.getElementById('addPageBtn');
const layersList = document.getElementById('layersList');
const codeBtn = document.getElementById('codeBtn');
const codeModal = document.getElementById('codeModal');
const codeArea = document.getElementById('codeArea');
const codeApply = document.getElementById('codeApply');
const codeClose = document.getElementById('codeClose');
const codeCopy = document.getElementById('codeCopy');
const themeBtn = document.getElementById('themeBtn');
const helpBtn = document.getElementById('helpBtn');
const helpModal = document.getElementById('helpModal');
const helpClose = document.getElementById('helpClose');
const elementSearch = document.getElementById('elementSearch');
const faviconInput = document.getElementById('faviconUrl');
const headCode = document.getElementById('headCode');
const endpointInput = document.getElementById('formEndpoint');
const animToggle = document.getElementById('animToggle');

const STORAGE_KEY = 'webbuilder:project:v2';
const THEME_KEY = 'webbuilder:theme';
const HISTORY_MAX = 60;

let selectedElement = null;
let dragCounter = 0;
let history = [];
let historyIndex = -1;
let histTimer = null;
let autosaveTimer = null;
let dropIndicator = null;
let textToolbar = null;
let project = null;

// ===================== HELPERS =====================
function generateId() {
    return 'el-' + Math.random().toString(36).slice(2, 11);
}

function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeAttr(s) { return esc(s); }

function toast(msg, kind) {
    let t = document.getElementById('toast');
    if (!t) {
        t = document.createElement('div');
        t.id = 'toast';
        document.body.appendChild(t);
    }
    t.textContent = msg;
    t.className = 'toast show' + (kind ? ' ' + kind : '');
    clearTimeout(t._h);
    t._h = setTimeout(() => { t.className = 'toast'; }, 2600);
}

function slugify(name) {
    return String(name || 'pagina').toLowerCase().normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'pagina';
}

function px(n) { return Math.round(n) || 0; }

function toHex(color) {
    if (!color || color === 'transparent' || color === 'rgba(0, 0, 0, 0)') return '#ffffff';
    if (color[0] === '#') return color.slice(0, 7);
    const m = color.match(/\d+/g);
    if (!m) return '#ffffff';
    return '#' + m.slice(0, 3).map(n => (+n).toString(16).padStart(2, '0')).join('');
}

function computed(el, prop) { return getComputedStyle(el).getPropertyValue(prop); }

function clone(obj) {
    return typeof structuredClone === 'function' ? structuredClone(obj) : JSON.parse(JSON.stringify(obj));
}

// ===================== PROGETTO / PAGINE =====================
function newPage(name) {
    return {
        id: generateId(),
        name: name || 'Pagina',
        title: name || 'Il Mio Sito Web',
        desc: '',
        bg: '#ffffff',
        font: 'Inter',
        favicon: '',
        head: '',
        html: '',
    };
}

function defaultProject() {
    return { v: 2, current: 0, anim: false, endpoint: '', pages: [newPage('Home')] };
}

function page() { return project.pages[project.current]; }

function pageFile(p) {
    const i = project.pages.indexOf(p);
    return i <= 0 ? 'index.html' : slugify(p.name) + '.html';
}

function migrate(data) {
    if (!data || typeof data !== 'object') return null;
    if (data.v === 2 && Array.isArray(data.pages) && data.pages.length) {
        data.current = Math.min(Math.max(0, data.current | 0), data.pages.length - 1);
        return data;
    }
    if (typeof data.html === 'string') {
        const p = newPage('Home');
        p.html = data.html;
        p.title = data.title || 'Il Mio Sito Web';
        p.desc = data.desc || '';
        p.bg = data.bg || '#ffffff';
        p.font = data.font || 'Inter';
        return { v: 2, current: 0, anim: false, endpoint: '', pages: [p] };
    }
    return null;
}

function syncFromCanvas() {
    if (!project || !page()) return;
    if (dropIndicator && dropIndicator.parentElement) dropIndicator.remove();
    const p = page();
    p.html = canvas.innerHTML;
    p.title = pageTitle.value;
    p.desc = pageDescription.value;
    p.bg = pageBg.value;
    p.font = pageFont.value;
    if (faviconInput) p.favicon = faviconInput.value.trim();
    if (headCode) p.head = headCode.value;
    if (endpointInput) project.endpoint = endpointInput.value.trim();
    if (animToggle) project.anim = !!animToggle.checked;
}

function loadCurrentPage() {
    const p = page();
    canvas.innerHTML = p.html || '';
    pageTitle.value = p.title;
    pageDescription.value = p.desc;
    pageBg.value = p.bg;
    pageFont.value = p.font;
    if (faviconInput) faviconInput.value = p.favicon || '';
    if (headCode) headCode.value = p.head || '';
    if (endpointInput) endpointInput.value = project.endpoint || '';
    if (animToggle) animToggle.checked = !!project.anim;
    applyPageStyles();
    initCanvasElements();
    selectedElement = null;
}

function applyPageStyles() { document.body.style.background = pageBg.value; }

function renderPages() {
    if (!pagesChips) return;
    pagesChips.innerHTML = project.pages.map((p, i) => `
        <button class="page-chip${i === project.current ? ' active' : ''}" data-page="${i}" title="Doppio clic per rinominare">
            <i class="bi bi-file-earmark-text"></i>${esc(p.name)}
            ${project.pages.length > 1 ? `<span class="page-del" data-del="${i}">&times;</span>` : ''}
        </button>`).join('');
}

function switchPage(i) {
    if (i === project.current || !project.pages[i]) return;
    syncFromCanvas();
    project.current = i;
    loadCurrentPage();
    refresh();
    pushHistory();
}

function addPage() {
    syncFromCanvas();
    const p = newPage('Pagina ' + (project.pages.length + 1));
    project.pages.push(p);
    project.current = project.pages.length - 1;
    loadCurrentPage();
    refresh();
    pushHistory();
    toast('Pagina aggiunta');
}

function removePage(i) {
    if (project.pages.length <= 1) { toast('Serve almeno una pagina', 'error'); return; }
    if (!confirm('Eliminare la pagina "' + project.pages[i].name + '"?')) return;
    syncFromCanvas();
    project.pages.splice(i, 1);
    if (project.current >= project.pages.length) project.current = project.pages.length - 1;
    else if (project.current > i) project.current--;
    loadCurrentPage();
    refresh();
    pushHistory();
    toast('Pagina eliminata');
}

function renamePage(i) {
    const n = prompt('Nome pagina:', project.pages[i].name);
    if (!n || n === project.pages[i].name) return;
    project.pages[i].name = n;
    if (i === project.current) pageTitle.value = project.pages[i].title || n;
    renderPages();
    pushHistory();
}

// ===================== STORIA =====================
function snapshot() { syncFromCanvas(); return clone(project); }

function sameSnap(a, b) {
    return a && b && JSON.stringify(a) === JSON.stringify(b);
}

function pushHistory() {
    const snap = snapshot();
    if (sameSnap(history[historyIndex], snap)) return;
    history = history.slice(0, historyIndex + 1);
    history.push(snap);
    if (history.length > HISTORY_MAX) history.shift();
    historyIndex = history.length - 1;
    updateHistoryButtons();
    scheduleAutosave();
}

function scheduleHistory() {
    clearTimeout(histTimer);
    histTimer = setTimeout(pushHistory, 450);
}

function applySnapshot(snap) {
    project = clone(snap);
    loadCurrentPage();
    refresh();
    updateHistoryButtons();
}

function updateHistoryButtons() {
    if (undoBtn) undoBtn.disabled = historyIndex <= 0;
    if (redoBtn) redoBtn.disabled = historyIndex >= history.length - 1;
}

function undo() {
    if (historyIndex <= 0) return;
    historyIndex--;
    applySnapshot(history[historyIndex]);
    scheduleAutosave();
    toast('Annullato');
}

function redo() {
    if (historyIndex >= history.length - 1) return;
    historyIndex++;
    applySnapshot(history[historyIndex]);
    scheduleAutosave();
    toast('Ripristinato');
}

// ===================== SALVATAGGIO =====================
function scheduleAutosave() {
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot()));
            if (autosaveTag) autosaveTag.textContent = 'Salvato ' + new Date().toLocaleTimeString();
        } catch (e) { /* quota piena */ }
    }, 500);
}

function restoreProject() {
    let data = null;
    try { data = JSON.parse(localStorage.getItem(STORAGE_KEY) || localStorage.getItem('webbuilder:project:v1')); } catch (e) { data = null; }
    const migrated = migrate(data);
    if (!migrated) return false;
    project = migrated;
    loadCurrentPage();
    return true;
}

function downloadProject() {
    const blob = new Blob([JSON.stringify(snapshot(), null, 2)], { type: 'application/json' });
    saveAs(blob, slugify(project.pages[0].name) + '.webbuilder.json');
    toast('Progetto esportato');
}

function loadProjectData(data) {
    const migrated = migrate(data);
    if (!migrated) throw new Error('File non valido');
    project = migrated;
    loadCurrentPage();
    refresh();
    pushHistory();
    toast('Progetto caricato');
}

// ===================== REFRESH =====================
function refresh() {
    updateEmptyState();
    renderPages();
    renderLayers();
    renderStylePanel();
}

// ===================== CANVAS =====================
function updateEmptyState() {
    const hasElements = canvas.querySelector('.canvas-element');
    if (hasElements) {
        canvas.classList.remove('empty');
        canvas.querySelector('.empty-state')?.remove();
    } else {
        canvas.classList.add('empty');
        if (!canvas.querySelector('.empty-state')) {
            canvas.insertAdjacentHTML('beforeend', `
                <div class="empty-state">
                    <i class="bi bi-plus-circle"></i>
                    <h3>Inizia a costruire</h3>
                    <p>Trascina un elemento, scegli un modello o usa l'AI</p>
                </div>`);
        }
    }
}

const CONTROLS_HTML = `
    <div class="element-controls">
        <button class="element-control up" title="Sposta su"><i class="bi bi-arrow-up"></i></button>
        <button class="element-control down" title="Sposta giù"><i class="bi bi-arrow-down"></i></button>
        <button class="element-control copy" title="Duplica"><i class="bi bi-copy"></i></button>
        <button class="element-control delete" title="Elimina"><i class="bi bi-trash"></i></button>
    </div>`;

function makeElementInteractive(element) {
    element.classList.add('canvas-element');
    element.setAttribute('draggable', true);
    if (!element.id) element.id = generateId();
    if (!element.querySelector(':scope > .element-controls')) {
        element.insertAdjacentHTML('afterbegin', CONTROLS_HTML);
    }
}

function initCanvasElements() {
    Array.from(canvas.children).forEach(child => {
        if (child === dropIndicator || child.classList.contains('empty-state')) return;
        makeElementInteractive(child);
    });
}

function contentTarget(el) {
    return el.firstElementChild && !el.firstElementChild.classList.contains('element-controls')
        ? el.firstElementChild
        : el;
}

function selectElement(el, focusLayers) {
    canvas.querySelectorAll('.canvas-element').forEach(e => e.classList.remove('selected'));
    selectedElement = el || null;
    if (el) {
        el.classList.add('selected');
        if (focusLayers !== false) openTab('style');
    }
    renderStylePanel();
    renderLayers();
}

function openTab(name) {
    const btn = document.querySelector('.nav-btn[data-tab="' + name + '"]');
    if (btn && !btn.classList.contains('active')) btn.click();
}

function elementLabel(el) {
    const t = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (t) return t.slice(0, 26) + (t.length > 26 ? '…' : '');
    const img = el.querySelector('img');
    if (img) return 'Immagine';
    return el.dataset.type || 'Elemento';
}

function elementIcon(el) {
    const t = (el.dataset.type || '').toLowerCase();
    if (t.includes('block-hero') || t.includes('hero')) return 'bi-image-alt';
    if (t.includes('contact') || t.includes('form')) return 'bi-input-cursor-text';
    if (t.includes('footer')) return 'bi-layout-text-window-reverse';
    if (t.includes('features') || t.includes('pricing')) return 'bi-grid-3x3-gap';
    if (t.includes('gallery')) return 'bi-images';
    const tag = (contentTarget(el).tagName || '').toLowerCase();
    return ({ h1: 'bi-type-h1', h2: 'bi-type-h2', h3: 'bi-heading', p: 'bi-text-paragraph',
        a: 'bi-link-45deg', img: 'bi-image', ul: 'bi-list-ul', li: 'bi-list-ul',
        form: 'bi-input-cursor-text', section: 'bi-layout-wtf', footer: 'bi-layout-text-window-reverse',
        hr: 'bi-dash-lg', video: 'bi-camera-video', div: 'bi-square' })[tag] || 'bi-square';
}

// ===================== ELEMENTI =====================
function createElement(type) {
    const div = document.createElement('div');
    div.id = generateId();
    div.dataset.type = type;

    switch (type) {
        case 'heading':
            div.innerHTML = '<h1 contenteditable="true" style="font-size: 2.5rem; margin-bottom: 1rem;">Titolo Principale</h1>';
            break;
        case 'text':
            div.innerHTML = '<p contenteditable="true" style="line-height: 1.6; margin-bottom: 1rem;">Questo è un paragrafo di testo. Puoi modificarlo facendo clic sopra.</p>';
            break;
        case 'button':
            div.innerHTML = '<a href="#" contenteditable="true" style="display: inline-block; padding: 0.75rem 1.5rem; background: #2563eb; color: white; border-radius: 0.5rem; text-decoration: none; cursor: pointer;">Pulsante</a>';
            break;
        case 'image':
            div.innerHTML = '<img src="https://picsum.photos/800/400" alt="Immagine" style="max-width: 100%; height: auto; border-radius: 0.5rem;">';
            break;
        case 'link':
            div.innerHTML = '<a href="#" contenteditable="true" style="color: #2563eb; text-decoration: underline;">Link personalizzato</a>';
            break;
        case 'divider':
            div.innerHTML = '<hr style="border: none; border-top: 2px solid #e2e8f0; margin: 2rem 0;">';
            break;
        case 'container':
            div.innerHTML = '<div style="padding: 2rem; background: #f8fafc; border-radius: 0.5rem; min-height: 100px;">Contenitore</div>';
            break;
        case 'list':
            div.innerHTML = '<ul style="padding-left: 2rem; line-height: 1.8;"><li contenteditable="true">Elemento 1</li><li contenteditable="true">Elemento 2</li><li contenteditable="true">Elemento 3</li></ul>';
            break;
        case 'form':
            div.innerHTML = `
                <form style="display: flex; flex-direction: column; gap: 1rem; padding: 1.5rem; background: #f8fafc; border-radius: 0.5rem;">
                    <input type="text" name="nome" placeholder="Nome" style="padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 0.375rem;">
                    <input type="email" name="email" placeholder="Email" style="padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 0.375rem;">
                    <textarea name="messaggio" rows="3" placeholder="Messaggio" style="padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 0.375rem;"></textarea>
                    <button type="submit" style="padding: 0.75rem; background: #2563eb; color: white; border: none; border-radius: 0.375rem; cursor: pointer;">Invia</button>
                </form>
            `;
            break;
        case 'spacer':
            div.innerHTML = '<div style="height: 3rem;"></div>';
            break;
        case 'video':
            div.innerHTML = '<div style="position:relative;padding-bottom:56.25%;height:0;border-radius:0.5rem;overflow:hidden;background:#0f172a;"><iframe src="https://www.youtube.com/embed/ScMzIvxBSi4" style="position:absolute;inset:0;width:100%;height:100%;border:0;" allowfullscreen title="Video"></iframe></div>';
            break;
        case 'columns':
            div.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1.5rem;"><div contenteditable="true" style="padding:1.5rem;background:#f8fafc;border-radius:0.5rem;"><h3 style="margin-bottom:.5rem;">Colonna 1</h3><p>Testo della prima colonna.</p></div><div contenteditable="true" style="padding:1.5rem;background:#f8fafc;border-radius:0.5rem;"><h3 style="margin-bottom:.5rem;">Colonna 2</h3><p>Testo della seconda colonna.</p></div></div>';
            break;
        case 'badge':
            div.innerHTML = '<span contenteditable="true" style="display:inline-block;padding:.3rem .8rem;background:#dbeafe;color:#1d4ed8;border-radius:999px;font-size:.8rem;font-weight:600;">Novità</span>';
            break;
        case 'quote':
            div.innerHTML = '<blockquote contenteditable="true" style="margin:0;padding:1.5rem 2rem;border-left:4px solid #2563eb;background:#f8fafc;border-radius:0 .5rem .5rem 0;font-size:1.15rem;font-style:italic;color:#334155;">"Le citazioni rendono una pagina più umana e credibile."</blockquote>';
            break;
        case 'code':
            div.innerHTML = '<pre contenteditable="true" style="margin:0;padding:1.25rem;background:#0f172a;color:#e2e8f0;border-radius:0.5rem;overflow-x:auto;font-size:.85rem;line-height:1.6;"><code>console.log("Ciao dal tuo sito");</code></pre>';
            break;
        case 'map':
            div.innerHTML = '<iframe src="https://www.openstreetmap.org/export/embed.html?bbox=9.1%2C45.4%2C9.2%2C45.5&layer=mapnik" style="width:100%;height:300px;border:0;border-radius:0.5rem;" title="Mappa"></iframe>';
            break;
    }

    makeElementInteractive(div);
    return div;
}

function createBlock(type) {
    const c = document.createElement('div');
    c.id = generateId();
    c.dataset.type = 'block-' + type;

    switch (type) {
        case 'navbar':
            c.innerHTML = `
<nav style="display:flex;align-items:center;justify-content:space-between;padding:1rem 2rem;background:white;border-bottom:1px solid #e2e8f0;">
  <a href="#" contenteditable="true" style="font-weight:700;font-size:1.15rem;color:#0f172a;text-decoration:none;">Marchio</a>
  <div style="display:flex;gap:1.5rem;align-items:center;">
    <a href="#" contenteditable="true" style="color:#475569;text-decoration:none;font-size:.95rem;">Home</a>
    <a href="#" contenteditable="true" style="color:#475569;text-decoration:none;font-size:.95rem;">Servizi</a>
    <a href="#" contenteditable="true" style="color:#475569;text-decoration:none;font-size:.95rem;">Contatti</a>
    <a href="#" contenteditable="true" style="padding:.5rem 1rem;background:#2563eb;color:white;border-radius:.5rem;text-decoration:none;font-size:.9rem;">Accedi</a>
  </div>
</nav>`;
            break;
        case 'hero':
            c.innerHTML = `
<section style="padding: 4rem 2rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center; border-radius: 0.5rem;">
  <h1 contenteditable="true" style="font-size: 3rem; margin-bottom: 1rem; color: white;">Benvenuto sul Mio Sito</h1>
  <p contenteditable="true" style="font-size: 1.25rem; margin-bottom: 2rem; opacity: 0.9;">Costruisci il tuo successo con noi</p>
  <a href="#" contenteditable="true" style="display: inline-block; padding: 1rem 2rem; background: white; color: #667eea; border-radius: 0.5rem; text-decoration: none; font-weight: 600;">Inizia Ora</a>
</section>`;
            break;
        case 'features':
            c.innerHTML = `
<section style="padding: 4rem 2rem; background: white;">
  <h2 contenteditable="true" style="text-align: center; font-size: 2.5rem; margin-bottom: 3rem;">I Nostri Servizi</h2>
  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem; max-width: 1200px; margin: 0 auto;">
    <div style="text-align: center; padding: 2rem; background: #f8fafc; border-radius: 0.5rem;">
      <h3 contenteditable="true" style="margin-bottom: 1rem;">Veloce</h3>
      <p contenteditable="true">Sito web performante e ottimizzato</p>
    </div>
    <div style="text-align: center; padding: 2rem; background: #f8fafc; border-radius: 0.5rem;">
      <h3 contenteditable="true" style="margin-bottom: 1rem;">Responsive</h3>
      <p contenteditable="true">Funziona su tutti i dispositivi</p>
    </div>
    <div style="text-align: center; padding: 2rem; background: #f8fafc; border-radius: 0.5rem;">
      <h3 contenteditable="true" style="margin-bottom: 1rem;">Gratuito</h3>
      <p contenteditable="true">Nessun costo, nessun limite</p>
    </div>
  </div>
</section>`;
            break;
        case 'stats':
            c.innerHTML = `
<section style="padding:3.5rem 2rem;background:#0f172a;color:white;">
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:2rem;max-width:1000px;margin:0 auto;text-align:center;">
    <div><p contenteditable="true" style="font-size:2.4rem;font-weight:700;color:#60a5fa;">12k</p><p contenteditable="true" style="opacity:.75;">Clienti felici</p></div>
    <div><p contenteditable="true" style="font-size:2.4rem;font-weight:700;color:#60a5fa;">98%</p><p contenteditable="true" style="opacity:.75;">Soddisfazione</p></div>
    <div><p contenteditable="true" style="font-size:2.4rem;font-weight:700;color:#60a5fa;">24/7</p><p contenteditable="true" style="opacity:.75;">Assistenza</p></div>
    <div><p contenteditable="true" style="font-size:2.4rem;font-weight:700;color:#60a5fa;">15</p><p contenteditable="true" style="opacity:.75;">Anni di esperienza</p></div>
  </div>
</section>`;
            break;
        case 'testimonial':
            c.innerHTML = `
<section style="padding:4rem 2rem;background:#f8fafc;">
  <h2 contenteditable="true" style="text-align:center;font-size:2.2rem;margin-bottom:2.5rem;">Cosa dicono di noi</h2>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1.5rem;max-width:1000px;margin:0 auto;">
    <figure contenteditable="true" style="margin:0;padding:1.75rem;background:white;border-radius:0.75rem;box-shadow:0 1px 3px rgba(0,0,0,.08);">
      <blockquote style="margin:0 0 1rem;color:#334155;">"Hanno trasformato la nostra idea in un sito che converte davvero."</blockquote>
      <figcaption style="display:flex;align-items:center;gap:.75rem;">
        <img src="https://i.pravatar.cc/80?img=15" alt="" style="width:44px;height:44px;border-radius:50%;">
        <span><strong>Giulia R.</strong><br><span style="color:#64748b;font-size:.85rem;">CEO, Nova</span></span>
      </figcaption>
    </figure>
    <figure contenteditable="true" style="margin:0;padding:1.75rem;background:white;border-radius:0.75rem;box-shadow:0 1px 3px rgba(0,0,0,.08);">
      <blockquote style="margin:0 0 1rem;color:#334155;">"Rapidi, professionali e sempre disponibili. Consigliatissimi."</blockquote>
      <figcaption style="display:flex;align-items:center;gap:.75rem;">
        <img src="https://i.pravatar.cc/80?img=33" alt="" style="width:44px;height:44px;border-radius:50%;">
        <span><strong>Marco T.</strong><br><span style="color:#64748b;font-size:.85rem;">Fondatore, Loop</span></span>
      </figcaption>
    </figure>
  </div>
</section>`;
            break;
        case 'team':
            c.innerHTML = `
<section style="padding:4rem 2rem;">
  <h2 contenteditable="true" style="text-align:center;font-size:2.2rem;margin-bottom:2.5rem;">Il nostro team</h2>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1.5rem;max-width:900px;margin:0 auto;text-align:center;">
    <div contenteditable="true"><img src="https://i.pravatar.cc/200?img=11" alt="" style="width:110px;height:110px;border-radius:50%;object-fit:cover;"><h3 style="margin-top:.75rem;">Anna Rossi</h3><p style="color:#64748b;">Designer</p></div>
    <div contenteditable="true"><img src="https://i.pravatar.cc/200?img=52" alt="" style="width:110px;height:110px;border-radius:50%;object-fit:cover;"><h3 style="margin-top:.75rem;">Luca Bianchi</h3><p style="color:#64748b;">Sviluppatore</p></div>
    <div contenteditable="true"><img src="https://i.pravatar.cc/200?img=68" alt="" style="width:110px;height:110px;border-radius:50%;object-fit:cover;"><h3 style="margin-top:.75rem;">Sara Conti</h3><p style="color:#64748b;">Project Manager</p></div>
  </div>
</section>`;
            break;
        case 'faq':
            c.innerHTML = `
<section style="padding:4rem 2rem;max-width:800px;margin:0 auto;">
  <h2 contenteditable="true" style="text-align:center;font-size:2.2rem;margin-bottom:2rem;">Domande frequenti</h2>
  <details contenteditable="true" style="padding:1rem 0;border-bottom:1px solid #e2e8f0;">
    <summary style="cursor:pointer;font-weight:600;">Quanto costa?</summary>
    <p style="margin-top:.75rem;color:#64748b;">Ogni progetto ha un preventivo su misura: scrivici e ti rispondiamo in 24 ore.</p>
  </details>
  <details contenteditable="true" style="padding:1rem 0;border-bottom:1px solid #e2e8f0;">
    <summary style="cursor:pointer;font-weight:600;">Quanto ci vuole?</summary>
    <p style="margin-top:.75rem;color:#64748b;">In media due settimane dalla conferma del progetto.</p>
  </details>
  <details contenteditable="true" style="padding:1rem 0;">
    <summary style="cursor:pointer;font-weight:600;">Fate anche la manutenzione?</summary>
    <p style="margin-top:.75rem;color:#64748b;">Sì, con piani mensili che includono aggiornamenti e backup.</p>
  </details>
</section>`;
            break;
        case 'cta':
            c.innerHTML = `
<section style="padding:4rem 2rem;background:linear-gradient(120deg,#2563eb,#7c3aed);color:white;text-align:center;border-radius:.5rem;">
  <h2 contenteditable="true" style="font-size:2.4rem;margin-bottom:1rem;color:white;">Pronto a partire?</h2>
  <p contenteditable="true" style="font-size:1.15rem;opacity:.9;margin-bottom:2rem;">Parliamo del tuo prossimo progetto, senza impegno.</p>
  <a href="#" contenteditable="true" style="display:inline-block;padding:1rem 2.5rem;background:white;color:#2563eb;border-radius:999px;text-decoration:none;font-weight:700;">Contattaci ora</a>
</section>`;
            break;
        case 'newsletter':
            c.innerHTML = `
<section style="padding:3rem 2rem;background:#111827;color:white;">
  <div style="max-width:640px;margin:0 auto;display:flex;gap:1rem;align-items:center;flex-wrap:wrap;justify-content:center;">
    <div style="flex:1;min-width:220px;">
      <h3 contenteditable="true" style="margin-bottom:.35rem;">Resta aggiornato</h3>
      <p contenteditable="true" style="opacity:.75;font-size:.95rem;">Una email al mese, niente spam.</p>
    </div>
    <form style="display:flex;gap:.5rem;flex-wrap:wrap;">
      <input type="email" name="email" placeholder="La tua email" style="padding:.75rem 1rem;border:none;border-radius:999px;min-width:200px;">
      <button type="submit" style="padding:.75rem 1.5rem;background:#2563eb;color:white;border:none;border-radius:999px;cursor:pointer;font-weight:600;">Iscriviti</button>
    </form>
  </div>
</section>`;
            break;
        case 'countdown':
            c.innerHTML = `
<section style="padding:3.5rem 2rem;background:#0f172a;color:white;text-align:center;">
  <h2 contenteditable="true" style="font-size:2rem;margin-bottom:1.5rem;color:white;">Manca poco</h2>
  <div data-countdown="2027-01-01T00:00:00" style="display:flex;gap:1rem;justify-content:center;font-variant-numeric:tabular-nums;">
    <div style="padding:1rem 1.25rem;background:#1e293b;border-radius:.75rem;min-width:80px;"><div data-cd="d" style="font-size:2rem;font-weight:700;">--</div><div style="opacity:.7;font-size:.8rem;">giorni</div></div>
    <div style="padding:1rem 1.25rem;background:#1e293b;border-radius:.75rem;min-width:80px;"><div data-cd="h" style="font-size:2rem;font-weight:700;">--</div><div style="opacity:.7;font-size:.8rem;">ore</div></div>
    <div style="padding:1rem 1.25rem;background:#1e293b;border-radius:.75rem;min-width:80px;"><div data-cd="m" style="font-size:2rem;font-weight:700;">--</div><div style="opacity:.7;font-size:.8rem;">min</div></div>
    <div style="padding:1rem 1.25rem;background:#1e293b;border-radius:.75rem;min-width:80px;"><div data-cd="s" style="font-size:2rem;font-weight:700;">--</div><div style="opacity:.7;font-size:.8rem;">sec</div></div>
  </div>
</section>`;
            break;
        case 'contact':
            c.innerHTML = `
<section style="padding: 4rem 2rem; background: #f8fafc;">
  <h2 contenteditable="true" style="text-align: center; font-size: 2.5rem; margin-bottom: 3rem;">Contattaci</h2>
  <form style="max-width: 600px; margin: 0 auto; display: flex; flex-direction: column; gap: 1rem;">
    <input type="text" name="nome" placeholder="Nome" style="padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 0.375rem;">
    <input type="email" name="email" placeholder="Email" style="padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 0.375rem;">
    <textarea name="messaggio" rows="4" placeholder="Messaggio" style="padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 0.375rem;"></textarea>
    <button type="submit" style="padding: 0.75rem; background: #2563eb; color: white; border: none; border-radius: 0.375rem; cursor: pointer;">Invia Messaggio</button>
  </form>
</section>`;
            break;
        case 'footer':
            c.innerHTML = `
<footer style="padding: 2.5rem 2rem; background: #1e293b; color: white; text-align: center;">
  <p contenteditable="true" style="font-weight:600;margin-bottom:.5rem;">Marchio</p>
  <p contenteditable="true" style="opacity:.7;">© ${new Date().getFullYear()} Il Mio Sito Web. Tutti i diritti riservati.</p>
</footer>`;
            break;
        case 'gallery':
            c.innerHTML = `
<section style="padding: 4rem 2rem;">
  <h2 contenteditable="true" style="text-align: center; font-size: 2.25rem; margin-bottom: 2rem;">Galleria</h2>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;">
    <img src="https://picsum.photos/seed/a/600/400" alt="" style="width:100%;height:180px;object-fit:cover;border-radius:0.5rem;">
    <img src="https://picsum.photos/seed/b/600/400" alt="" style="width:100%;height:180px;object-fit:cover;border-radius:0.5rem;">
    <img src="https://picsum.photos/seed/c/600/400" alt="" style="width:100%;height:180px;object-fit:cover;border-radius:0.5rem;">
    <img src="https://picsum.photos/seed/d/600/400" alt="" style="width:100%;height:180px;object-fit:cover;border-radius:0.5rem;">
  </div>
</section>`;
            break;
        case 'pricing':
            c.innerHTML = `
<section style="padding: 4rem 2rem; background:#0f172a; color:#e2e8f0;">
  <h2 contenteditable="true" style="text-align:center; font-size:2.25rem; margin-bottom:2.5rem; color:white;">Prezzi</h2>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:1.5rem;max-width:1000px;margin:0 auto;">
    <div style="padding:2rem;background:#1e293b;border-radius:0.75rem;text-align:center;">
      <h3 contenteditable="true">Base</h3>
      <p contenteditable="true" style="font-size:2rem;font-weight:700;margin:.5rem 0;">0€</p>
      <p contenteditable="true" style="opacity:.8;">Tutto il necessario</p>
    </div>
    <div style="padding:2rem;background:#2563eb;border-radius:0.75rem;text-align:center;color:white;">
      <h3 contenteditable="true">Pro</h3>
      <p contenteditable="true" style="font-size:2rem;font-weight:700;margin:.5rem 0;">19€</p>
      <p contenteditable="true" style="opacity:.9;">Il più scelto</p>
    </div>
    <div style="padding:2rem;background:#1e293b;border-radius:0.75rem;text-align:center;">
      <h3 contenteditable="true">Business</h3>
      <p contenteditable="true" style="font-size:2rem;font-weight:700;margin:.5rem 0;">49€</p>
      <p contenteditable="true" style="opacity:.8;">Per team</p>
    </div>
  </div>
</section>`;
            break;
    }

    makeElementInteractive(c);
    return c;
}

// ===================== MODELLI =====================
const TEMPLATES = {
    landing: {
        name: 'Landing prodotto', font: 'Inter', bg: '#ffffff',
        html: `
<section style="padding:5rem 2rem;background:linear-gradient(160deg,#0f172a,#1e3a8a);color:white;text-align:center;">
  <p contenteditable="true" style="letter-spacing:.2em;text-transform:uppercase;font-size:.8rem;opacity:.7;margin-bottom:1rem;">Nuovo</p>
  <h1 contenteditable="true" style="font-size:3.2rem;max-width:800px;margin:0 auto 1.25rem;">Il modo più veloce di fare le cose</h1>
  <p contenteditable="true" style="font-size:1.2rem;opacity:.85;max-width:600px;margin:0 auto 2.5rem;">Risparmia ore ogni settimana. Prova gratis, nessuna carta di credito richiesta.</p>
  <a href="#" contenteditable="true" style="display:inline-block;padding:1rem 2.5rem;background:#3b82f6;color:white;border-radius:999px;text-decoration:none;font-weight:600;">Inizia gratis</a>
</section>
<section style="padding:4rem 2rem;max-width:1100px;margin:0 auto;">
  <h2 contenteditable="true" style="text-align:center;font-size:2rem;margin-bottom:2.5rem;">Perché sceglierci</h2>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1.5rem;">
    <div contenteditable="true" style="padding:1.75rem;border:1px solid #e2e8f0;border-radius:0.75rem;"><h3 style="margin-bottom:.5rem;">Veloce</h3><p style="color:#64748b;">Configurazione in meno di 5 minuti.</p></div>
    <div contenteditable="true" style="padding:1.75rem;border:1px solid #e2e8f0;border-radius:0.75rem;"><h3 style="margin-bottom:.5rem;">Sicuro</h3><p style="color:#64748b;">Dati cifrati e server in Europa.</p></div>
    <div contenteditable="true" style="padding:1.75rem;border:1px solid #e2e8f0;border-radius:0.75rem;"><h3 style="margin-bottom:.5rem;">Supporto</h3><p style="color:#64748b;">Risposta umana entro 2 ore.</p></div>
  </div>
</section>
<footer style="padding:2rem;background:#0f172a;color:#94a3b8;text-align:center;"><p contenteditable="true">© ${new Date().getFullYear()} Nome Prodotto</p></footer>`,
    },
    portfolio: {
        name: 'Portfolio creativo', font: 'Poppins', bg: '#fafaf9',
        html: `
<section style="padding:5rem 2rem 3rem;max-width:1000px;margin:0 auto;">
  <h1 contenteditable="true" style="font-size:3rem;margin-bottom:.5rem;">Ciao, sono Maria.</h1>
  <p contenteditable="true" style="font-size:1.25rem;color:#57534e;max-width:560px;">Designer e sviluppatrice con base a Milano. Unisco estetica e funzione.</p>
</section>
<section style="padding:0 2rem 4rem;max-width:1000px;margin:0 auto;">
  <h2 contenteditable="true" style="font-size:1.5rem;margin-bottom:1.5rem;">Lavori selezionati</h2>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem;">
    <figure style="margin:0;"><img src="https://picsum.photos/seed/p1/800/600" alt="" style="width:100%;border-radius:0.75rem;"><figcaption contenteditable="true" style="margin-top:.6rem;color:#78716c;">Identità visiva — Brand 2025</figcaption></figure>
    <figure style="margin:0;"><img src="https://picsum.photos/seed/p2/800/600" alt="" style="width:100%;border-radius:0.75rem;"><figcaption contenteditable="true" style="margin-top:.6rem;color:#78716c;">App mobile — UI/UX</figcaption></figure>
    <figure style="margin:0;"><img src="https://picsum.photos/seed/p3/800/600" alt="" style="width:100%;border-radius:0.75rem;"><figcaption contenteditable="true" style="margin-top:.6rem;color:#78716c;">Editoria — Catalogo</figcaption></figure>
  </div>
</section>
<section style="padding:3rem 2rem;background:#1c1917;color:#fafaf9;text-align:center;">
  <h2 contenteditable="true" style="font-size:1.75rem;margin-bottom:1rem;">Lavoriamo insieme</h2>
  <a href="mailto:email@example.com" contenteditable="true" style="color:#fbbf24;font-weight:600;">email@example.com</a>
</section>`,
    },
    ristorante: {
        name: 'Ristorante', font: 'Inter', bg: '#fffbeb',
        html: `
<section style="padding:5rem 2rem;text-align:center;background:#7f1d1d;color:#fef3c7;">
  <h1 contenteditable="true" style="font-size:3rem;font-family:Georgia,serif;">Trattoria del Borgo</h1>
  <p contenteditable="true" style="margin-top:.75rem;font-size:1.15rem;opacity:.9;">Cucina italiana dal 1972 · Prenota il tuo tavolo</p>
</section>
<section style="padding:3.5rem 2rem;max-width:800px;margin:0 auto;">
  <h2 contenteditable="true" style="text-align:center;font-family:Georgia,serif;font-size:2rem;margin-bottom:2rem;">Il nostro menu</h2>
  <div contenteditable="true" style="display:flex;justify-content:space-between;gap:1rem;padding:.9rem 0;border-bottom:1px dashed #d6d3d1;"><span>Bruschetta al pomodoro</span><span>8€</span></div>
  <div contenteditable="true" style="display:flex;justify-content:space-between;gap:1rem;padding:.9rem 0;border-bottom:1px dashed #d6d3d1;"><span>Tagliatelle al ragù</span><span>12€</span></div>
  <div contenteditable="true" style="display:flex;justify-content:space-between;gap:1rem;padding:.9rem 0;border-bottom:1px dashed #d6d3d1;"><span>Bistecca alla fiorentina</span><span>26€</span></div>
  <div contenteditable="true" style="display:flex;justify-content:space-between;gap:1rem;padding:.9rem 0;"><span>Tiramisù della casa</span><span>6€</span></div>
</section>
<section style="padding:2.5rem 2rem;background:#fef3c7;text-align:center;">
  <p contenteditable="true" style="font-size:1.1rem;">Via Roma 12, Firenze · Tel. 055 000 0000</p>
  <p contenteditable="true" style="color:#78716c;margin-top:.5rem;">Aperto mar–dom, 12:00–15:00 e 19:00–23:00</p>
</section>`,
    },
    evento: {
        name: 'Evento / Conferenza', font: 'Inter', bg: '#ffffff',
        html: `
<section style="padding:5rem 2rem;background:radial-gradient(circle at 20% 20%,#7c3aed,#312e81);color:white;text-align:center;">
  <p contenteditable="true" style="text-transform:uppercase;letter-spacing:.25em;font-size:.8rem;opacity:.8;">12–14 Novembre 2026 · Milano</p>
  <h1 contenteditable="true" style="font-size:3rem;margin:1rem 0;">TechForward 2026</h1>
  <p contenteditable="true" style="font-size:1.15rem;opacity:.85;max-width:560px;margin:0 auto 2rem;">Tre giorni di talk, workshop e networking su intelligenza artificiale e prodotto.</p>
  <a href="#" contenteditable="true" style="display:inline-block;padding:1rem 2.5rem;background:white;color:#4c1d95;border-radius:999px;text-decoration:none;font-weight:700;">Prenota il biglietto</a>
</section>
<section style="padding:3.5rem 2rem;max-width:950px;margin:0 auto;">
  <h2 contenteditable="true" style="text-align:center;font-size:1.9rem;margin-bottom:2rem;">Relatori</h2>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1.5rem;">
    <div contenteditable="true" style="text-align:center;"><img src="https://i.pravatar.cc/160?img=12" alt="" style="width:96px;height:96px;border-radius:50%;object-fit:cover;"><h3 style="margin-top:.75rem;">Luca Rossi</h3><p style="color:#64748b;">CTO, Acme</p></div>
    <div contenteditable="true" style="text-align:center;"><img src="https://i.pravatar.cc/160?img=32" alt="" style="width:96px;height:96px;border-radius:50%;object-fit:cover;"><h3 style="margin-top:.75rem;">Sara Bianchi</h3><p style="color:#64748b;">AI Lead, Nova</p></div>
    <div contenteditable="true" style="text-align:center;"><img src="https://i.pravatar.cc/160?img=48" alt="" style="width:96px;height:96px;border-radius:50%;object-fit:cover;"><h3 style="margin-top:.75rem;">Marco Verdi</h3><p style="color:#64748b;">Founder, Loop</p></div>
  </div>
</section>`,
    },
    business: {
        name: 'Azienda / Business', font: 'Inter', bg: '#ffffff',
        html: `
<nav style="display:flex;align-items:center;justify-content:space-between;padding:1rem 2rem;border-bottom:1px solid #e2e8f0;">
  <a href="#" contenteditable="true" style="font-weight:700;font-size:1.15rem;color:#0f172a;text-decoration:none;">Acme</a>
  <div style="display:flex;gap:1.25rem;align-items:center;">
    <a href="#" contenteditable="true" style="color:#475569;text-decoration:none;">Servizi</a>
    <a href="#" contenteditable="true" style="color:#475569;text-decoration:none;">Team</a>
    <a href="#" contenteditable="true" style="color:#475569;text-decoration:none;">Contatti</a>
  </div>
</nav>
<section style="padding:5rem 2rem;background:linear-gradient(120deg,#0f172a,#1e3a8a);color:white;text-align:center;">
  <h1 contenteditable="true" style="font-size:3rem;margin-bottom:1rem;">Soluzioni digitali per la tua azienda</h1>
  <p contenteditable="true" style="font-size:1.2rem;opacity:.85;max-width:620px;margin:0 auto 2rem;">Consistenza e risultati misurabili, dal primo giorno.</p>
  <a href="#contatti" contenteditable="true" style="display:inline-block;padding:1rem 2.5rem;background:#3b82f6;color:white;border-radius:.5rem;text-decoration:none;font-weight:600;">Richiedi un preventivo</a>
</section>
<section style="padding:3.5rem 2rem;background:#0f172a;color:white;">
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:2rem;max-width:1000px;margin:0 auto;text-align:center;">
    <div><p contenteditable="true" style="font-size:2.4rem;font-weight:700;color:#60a5fa;">12k</p><p contenteditable="true" style="opacity:.75;">Clienti felici</p></div>
    <div><p contenteditable="true" style="font-size:2.4rem;font-weight:700;color:#60a5fa;">98%</p><p contenteditable="true" style="opacity:.75;">Soddisfazione</p></div>
    <div><p contenteditable="true" style="font-size:2.4rem;font-weight:700;color:#60a5fa;">24/7</p><p contenteditable="true" style="opacity:.75;">Assistenza</p></div>
  </div>
</section>
<section style="padding:4rem 2rem;" id="contatti">
  <h2 contenteditable="true" style="text-align:center;font-size:2.2rem;margin-bottom:2.5rem;">Cosa dicono di noi</h2>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1.5rem;max-width:1000px;margin:0 auto;">
    <figure contenteditable="true" style="margin:0;padding:1.75rem;background:#f8fafc;border-radius:.75rem;">
      <blockquote style="margin:0 0 1rem;color:#334155;">"Partner affidabile da tre anni."</blockquote>
      <figcaption style="color:#64748b;">Giulia R. — CEO, Nova</figcaption>
    </figure>
    <figure contenteditable="true" style="margin:0;padding:1.75rem;background:#f8fafc;border-radius:.75rem;">
      <blockquote style="margin:0 0 1rem;color:#334155;">"Risultati concreti in sei mesi."</blockquote>
      <figcaption style="color:#64748b;">Marco T. — Fondatore, Loop</figcaption>
    </figure>
  </div>
</section>
<section style="padding:2.5rem 2rem;background:#f1f5f9;">
  <h2 contenteditable="true" style="text-align:center;font-size:1.8rem;margin-bottom:1.5rem;">Domande frequenti</h2>
  <details contenteditable="true" style="padding:.9rem 0;border-bottom:1px solid #e2e8f0;max-width:800px;margin:0 auto;">
    <summary style="cursor:pointer;font-weight:600;">Quanto costa un progetto?</summary>
    <p style="margin-top:.75rem;color:#64748b;">Ogni progetto ha un preventivo su misura.</p>
  </details>
  <details contenteditable="true" style="padding:.9rem 0;max-width:800px;margin:0 auto;">
    <summary style="cursor:pointer;font-weight:600;">Fate manutenzione?</summary>
    <p style="margin-top:.75rem;color:#64748b;">Sì, con piani mensili.</p>
  </details>
</section>
<footer style="padding:2.5rem 2rem;background:#1e293b;color:white;text-align:center;">
  <p contenteditable="true" style="font-weight:600;margin-bottom:.5rem;">Acme</p>
  <p contenteditable="true" style="opacity:.7;">© ${new Date().getFullYear()} Acme S.r.l. — P.IVA 00000000000</p>
</footer>`,
    },
};

// ===================== LIVELLI =====================
function renderLayers() {
    if (!layersList) return;
    const els = Array.from(canvas.querySelectorAll(':scope > .canvas-element'));
    if (!els.length) {
        layersList.innerHTML = '<p class="no-selection">Nessun elemento nella pagina</p>';
        return;
    }
    layersList.innerHTML = els.map((el, i) => `
        <div class="layer-item${el === selectedElement ? ' selected' : ''}" data-layer="${i}">
            <i class="bi ${elementIcon(el)}"></i>
            <span class="layer-name">${esc(elementLabel(el))}</span>
            <span class="layer-actions">
                <button class="layer-btn" data-act="up" title="Su"><i class="bi bi-arrow-up"></i></button>
                <button class="layer-btn" data-act="down" title="Giù"><i class="bi bi-arrow-down"></i></button>
                <button class="layer-btn" data-act="del" title="Elimina"><i class="bi bi-trash"></i></button>
            </span>
        </div>`).join('');
}

// ===================== PANNELLO STILE =====================
function styleRow(label, inner) {
    return '<div class="style-row"><label>' + label + '</label>' + inner + '</div>';
}

function renderStylePanel() {
    if (!styleEditor) return;
    if (!selectedElement || !canvas.contains(selectedElement)) {
        styleEditor.innerHTML = '<p class="no-selection">Seleziona un elemento per modificarne lo stile</p>';
        return;
    }
    const el = selectedElement;
    const target = contentTarget(el);
    const img = el.querySelector('img');
    const link = el.querySelector('a');

    const color = toHex(computed(target, 'color'));
    const fontSize = px(parseFloat(computed(target, 'fontSize')));
    const bg = toHex(computed(el, 'backgroundColor'));
    const pad = px(parseFloat(computed(el, 'paddingLeft')));
    const mar = px(parseFloat(computed(el, 'marginBottom')));
    const rad = px(parseFloat(computed(el, 'borderTopLeftRadius')));
    const bw = px(parseFloat(computed(el, 'borderTopWidth')));
    const bc = toHex(computed(el, 'borderTopColor'));
    const align = computed(target, 'textAlign');

    styleEditor.innerHTML = `
        <div class="style-section"><span class="style-title">Testo</span>
            ${styleRow('Colore', '<input type="color" data-style="color" value="' + color + '">')}
            ${styleRow('Dimensione', '<input type="number" min="8" max="200" data-style="fontSize" value="' + fontSize + '">')}
            ${styleRow('Allineamento', '<select data-style="textAlign">'
                + ['left', 'center', 'right', 'justify'].map(a =>
                    '<option value="' + a + '"' + (align === a ? ' selected' : '') + '>' + a + '</option>').join('')
                + '</select>')}
            ${styleRow('Grassetto', '<input type="checkbox" data-style="fontWeight"'
                + (parseInt(computed(target, 'fontWeight'), 10) >= 600 ? ' checked' : '') + '>')}
            ${styleRow('Corsivo', '<input type="checkbox" data-style="fontStyle"'
                + (computed(target, 'fontStyle') === 'italic' ? ' checked' : '') + '>')}
        </div>
        <div class="style-section"><span class="style-title">Contenitore</span>
            ${styleRow('Sfondo', '<input type="color" data-style="backgroundColor" value="' + bg + '">')}
            ${styleRow('Padding', '<input type="number" min="0" max="200" data-style="padding" value="' + pad + '">')}
            ${styleRow('Margine inferiore', '<input type="number" min="0" max="200" data-style="marginBottom" value="' + mar + '">')}
            ${styleRow('Arrotondamento', '<input type="number" min="0" max="100" data-style="borderRadius" value="' + rad + '">')}
            ${styleRow('Bordo', '<span class="style-inline"><input type="color" data-style="borderColor" value="' + bc + '"><input type="number" min="0" max="20" data-style="borderWidth" value="' + bw + '"></span>')}
        </div>
        <div class="style-section"><span class="style-title">Sfumatura</span>
            ${styleRow('Da', '<input type="color" data-grad="c1" value="#2563eb">')}
            ${styleRow('A', '<input type="color" data-grad="c2" value="#7c3aed">')}
            ${styleRow('Angolo', '<input type="number" min="0" max="360" data-grad="angle" value="135">')}
            <button class="btn btn-secondary style-grad" id="gradApply" style="width:100%;margin-top:.4rem;">
                <i class="bi bi-droplet-half"></i> Applica sfumatura
            </button>
            <button class="btn btn-secondary style-grad" id="gradClear" style="width:100%;margin-top:.4rem;">
                <i class="bi bi-eraser"></i> Togli sfumatura
            </button>
        </div>
        ${img ? `<div class="style-section"><span class="style-title">Immagine</span>
            ${styleRow('URL', '<input type="text" data-style="imgSrc" value="' + escapeAttr(img.getAttribute('src') || '') + '">')}
            <label class="btn btn-secondary" style="width:100%;margin-top:.4rem;justify-content:center;cursor:pointer;">
                <i class="bi bi-upload"></i> Carica dal computer
                <input type="file" id="imgUpload" accept="image/*" hidden>
            </label>
        </div>` : ''}
        ${link ? `<div class="style-section"><span class="style-title">Link</span>
            ${styleRow('Destinazione', '<input type="text" data-style="href" value="' + escapeAttr(link.getAttribute('href') || '') + '">')}
        </div>` : ''}
        <button class="btn btn-secondary style-reset" id="styleReset" style="width:100%;margin-top:.5rem;">
            <i class="bi bi-arrow-counterclockwise"></i> Azzera stile
        </button>
    `;
}

function applyStyleProp(prop, value) {
    const el = selectedElement;
    if (!el) return;
    const target = contentTarget(el);
    switch (prop) {
        case 'color': target.style.color = value; break;
        case 'fontSize': target.style.fontSize = value + 'px'; break;
        case 'textAlign': target.style.textAlign = value; break;
        case 'fontWeight': target.style.fontWeight = value ? '700' : '400'; break;
        case 'fontStyle': target.style.fontStyle = value ? 'italic' : 'normal'; break;
        case 'backgroundColor': el.style.backgroundColor = value; break;
        case 'padding': el.style.padding = value + 'px'; break;
        case 'marginBottom': el.style.marginBottom = value + 'px'; break;
        case 'borderRadius': el.style.borderRadius = value + 'px'; break;
        case 'borderColor': el.style.borderColor = value; break;
        case 'borderWidth':
            el.style.borderWidth = value + 'px';
            el.style.borderStyle = +value > 0 ? 'solid' : 'none';
            break;
        case 'imgSrc': { const i = el.querySelector('img'); if (i) i.src = value; break; }
        case 'href': { const a = el.querySelector('a'); if (a) a.href = value || '#'; break; }
    }
    scheduleHistory();
}

function applyGradient(c1, c2, angle) {
    if (!selectedElement) return;
    selectedElement.style.background = 'linear-gradient(' + angle + 'deg, ' + c1 + ', ' + c2 + ')';
    selectedElement.style.backgroundColor = '';
    scheduleHistory();
}

if (styleEditor) {
    styleEditor.addEventListener('input', (e) => {
        const t = e.target;
        if (t.dataset && t.dataset.style) {
            applyStyleProp(t.dataset.style, t.type === 'checkbox' ? t.checked : t.value);
        }
    });
    styleEditor.addEventListener('change', (e) => {
        const t = e.target;
        if (t.type === 'checkbox' || t.tagName === 'SELECT') {
            if (t.dataset && t.dataset.style) applyStyleProp(t.dataset.style, t.type === 'checkbox' ? t.checked : t.value);
        }
        if (t.id === 'imgUpload' && t.files && t.files[0] && selectedElement) {
            const img = selectedElement.querySelector('img');
            if (!img) return;
            const reader = new FileReader();
            reader.onload = () => {
                img.src = reader.result;
                renderStylePanel();
                pushHistory();
                toast('Immagine caricata (salvata nel progetto)');
            };
            reader.readAsDataURL(t.files[0]);
        }
    });
    styleEditor.addEventListener('click', (e) => {
        if (e.target.closest('#styleReset') && selectedElement) {
            selectedElement.style.cssText = '';
            const t = contentTarget(selectedElement);
            if (t !== selectedElement) {
                ['color', 'fontSize', 'textAlign', 'fontWeight', 'fontStyle'].forEach(p => { t.style[p] = ''; });
            }
            renderStylePanel();
            pushHistory();
            toast('Stile azzerato');
        } else if (e.target.closest('#gradApply') && selectedElement) {
            const c1 = styleEditor.querySelector('[data-grad="c1"]').value;
            const c2 = styleEditor.querySelector('[data-grad="c2"]').value;
            const angle = styleEditor.querySelector('[data-grad="angle"]').value;
            applyGradient(c1, c2, angle);
            toast('Sfumatura applicata');
        } else if (e.target.closest('#gradClear') && selectedElement) {
            selectedElement.style.backgroundImage = '';
            selectedElement.style.background = '';
            scheduleHistory();
            toast('Sfumatura rimossa');
        }
    });
}

function moveElement(el, dir) {
    const sibling = dir < 0 ? el.previousElementSibling : el.nextElementSibling;
    if (!sibling || !sibling.classList.contains('canvas-element')) return;
    if (dir < 0) canvas.insertBefore(el, sibling);
    else canvas.insertBefore(sibling, el);
    renderLayers();
    pushHistory();
}

function duplicateElement(el) {
    const cloneEl = el.cloneNode(true);
    cloneEl.id = generateId();
    cloneEl.classList.remove('selected');
    el.after(cloneEl);
    initCanvasElements();
    selectElement(cloneEl);
    pushHistory();
}

function deleteElement(el) {
    el.remove();
    selectedElement = null;
    renderStylePanel();
    updateEmptyState();
    renderLayers();
    pushHistory();
}

// ===================== BARRA TESTO =====================
function ensureTextToolbar() {
    if (textToolbar) return textToolbar;
    textToolbar = document.createElement('div');
    textToolbar.className = 'text-toolbar';
    textToolbar.id = 'textToolbar';
    textToolbar.innerHTML = `
        <button data-cmd="bold" title="Grassetto"><i class="bi bi-type-bold"></i></button>
        <button data-cmd="italic" title="Corsivo"><i class="bi bi-type-italic"></i></button>
        <button data-cmd="underline" title="Sottolineato"><i class="bi bi-type-underline"></i></button>
        <button data-cmd="strikeThrough" title="Barrato"><i class="bi bi-type-strikethrough"></i></button>
        <span class="tt-sep"></span>
        <button data-cmd="justifyLeft" title="Sinistra"><i class="bi bi-text-left"></i></button>
        <button data-cmd="justifyCenter" title="Centra"><i class="bi bi-text-center"></i></button>
        <button data-cmd="justifyRight" title="Destra"><i class="bi bi-text-right"></i></button>
        <span class="tt-sep"></span>
        <button data-cmd="link" title="Inserisci link"><i class="bi bi-link-45deg"></i></button>
        <button data-cmd="removeFormat" title="Formattazione pulita"><i class="bi bi-eraser"></i></button>`;
    document.body.appendChild(textToolbar);

    textToolbar.addEventListener('mousedown', (e) => e.preventDefault());
    textToolbar.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const cmd = btn.dataset.cmd;
        if (cmd === 'link') {
            const url = prompt('URL del link:', 'https://');
            if (url) document.execCommand('createLink', false, url);
        } else {
            document.execCommand(cmd, false, null);
        }
        scheduleHistory();
    });
    return textToolbar;
}

function updateTextToolbar() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) { hideTextToolbar(); return; }
    const range = sel.getRangeAt(0);
    const node = range.commonAncestorContainer;
    const el = node.nodeType === 3 ? node.parentElement : node;
    if (!el || !canvas.contains(el)) { hideTextToolbar(); return; }
    const r = range.getBoundingClientRect();
    if (!r.width && !r.height) { hideTextToolbar(); return; }
    const tt = ensureTextToolbar();
    tt.classList.add('show');
    const top = Math.max(8, r.top - 46);
    const left = Math.max(8, Math.min(window.innerWidth - 320, r.left + r.width / 2 - 140));
    tt.style.top = top + 'px';
    tt.style.left = left + 'px';
}

function hideTextToolbar() {
    if (textToolbar) textToolbar.classList.remove('show');
}

// ===================== DRAG & DROP =====================
function getDropIndex(y) {
    const els = Array.from(canvas.querySelectorAll(':scope > .canvas-element'));
    for (let i = 0; i < els.length; i++) {
        const r = els[i].getBoundingClientRect();
        if (y < r.top + r.height / 2) return i;
    }
    return els.length;
}

function showDropIndicator(index) {
    const els = Array.from(canvas.querySelectorAll(':scope > .canvas-element'));
    if (!dropIndicator) {
        dropIndicator = document.createElement('div');
        dropIndicator.className = 'drop-indicator';
    }
    const canvasRect = canvas.getBoundingClientRect();
    let top;
    if (els.length === 0) top = canvasRect.top + 20;
    else if (index >= els.length) top = els[els.length - 1].getBoundingClientRect().bottom;
    else top = els[index].getBoundingClientRect().top;
    dropIndicator.style.top = (top - canvasRect.top + canvas.scrollTop - 2) + 'px';
    if (!dropIndicator.parentElement) canvas.appendChild(dropIndicator);
}

function hideDropIndicator() {
    if (dropIndicator && dropIndicator.parentElement) dropIndicator.remove();
}

elementList.forEach(item => {
    item.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('elementType', item.dataset.element);
        e.dataTransfer.effectAllowed = 'copy';
    });
});

blockList.forEach(item => {
    item.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('blockType', item.dataset.block);
        e.dataTransfer.effectAllowed = 'copy';
    });
});

canvas.addEventListener('dragstart', (e) => {
    const el = e.target.closest && e.target.closest('.canvas-element');
    if (!el || el.parentElement !== canvas) return;
    e.dataTransfer.setData('moveId', el.id);
    e.dataTransfer.effectAllowed = 'move';
    el.classList.add('dragging');
});

canvas.addEventListener('dragend', (e) => {
    const el = e.target.closest && e.target.closest('.canvas-element');
    if (el) el.classList.remove('dragging');
    hideDropIndicator();
    canvas.classList.remove('drag-over');
});

canvas.addEventListener('dragover', (e) => {
    e.preventDefault();
    canvas.classList.add('drag-over');
    showDropIndicator(getDropIndex(e.clientY));
});

canvas.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dragCounter--;
    if (dragCounter <= 0) {
        dragCounter = 0;
        canvas.classList.remove('drag-over');
        hideDropIndicator();
    }
});

canvas.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dragCounter++;
    canvas.classList.add('drag-over');
});

canvas.addEventListener('drop', (e) => {
    e.preventDefault();
    dragCounter = 0;
    canvas.classList.remove('drag-over');
    hideDropIndicator();

    const index = getDropIndex(e.clientY);
    const els = Array.from(canvas.querySelectorAll(':scope > .canvas-element'));
    const ref = els[index] || null;

    const moveId = e.dataTransfer.getData('moveId');
    const elementType = e.dataTransfer.getData('elementType');
    const blockType = e.dataTransfer.getData('blockType');

    if (moveId) {
        const el = canvas.querySelector('#' + CSS.escape(moveId));
        if (!el) return;
        canvas.insertBefore(el, ref);
        renderLayers();
        pushHistory();
        return;
    }

    let node = null;
    if (elementType) node = createElement(elementType);
    else if (blockType) node = createBlock(blockType);
    if (!node) return;

    canvas.querySelector('.empty-state')?.remove();
    canvas.insertBefore(node, ref);
    initCanvasElements();
    selectElement(node);
    updateEmptyState();
    renderLayers();
    pushHistory();
});

// ===================== EVENTI =====================
canvas.addEventListener('click', (e) => {
    const control = e.target.closest && e.target.closest('.element-control');
    if (control) {
        e.stopPropagation();
        const el = control.closest('.canvas-element');
        if (!el) return;
        if (control.classList.contains('delete')) deleteElement(el);
        else if (control.classList.contains('copy')) duplicateElement(el);
        else if (control.classList.contains('up')) moveElement(el, -1);
        else if (control.classList.contains('down')) moveElement(el, 1);
        return;
    }
    const el = e.target.closest && e.target.closest('.canvas-element');
    if (el && canvas.contains(el)) {
        e.stopPropagation();
        selectElement(el);
    } else if (e.target === canvas) {
        selectElement(null);
    }
});

canvas.addEventListener('input', scheduleHistory);
canvas.addEventListener('mouseup', updateTextToolbar);
canvas.addEventListener('keyup', updateTextToolbar);
document.addEventListener('selectionchange', () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) hideTextToolbar();
});

document.addEventListener('keydown', (e) => {
    const mod = e.ctrlKey || e.metaKey;
    const tag = (document.activeElement && document.activeElement.tagName || '').toLowerCase();
    const typing = tag === 'input' || tag === 'textarea' || (document.activeElement && document.activeElement.isContentEditable);

    if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        if (typing && document.activeElement !== canvas) return;
        e.preventDefault();
        undo();
    } else if (mod && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
        if (typing && document.activeElement !== canvas) return;
        e.preventDefault();
        redo();
    } else if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        downloadProject();
    } else if (mod && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        openCodeModal();
    } else if (e.key === 'Escape') {
        document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
        hideTextToolbar();
        selectElement(null);
    } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElement && !typing) {
        e.preventDefault();
        deleteElement(selectedElement);
    } else if (e.key === '?' && !typing) {
        helpModal?.classList.add('active');
    }
});

// pagine
if (pagesChips) {
    pagesChips.addEventListener('click', (e) => {
        const del = e.target.closest('[data-del]');
        if (del) {
            e.stopPropagation();
            removePage(+del.dataset.del);
            return;
        }
        const chip = e.target.closest('[data-page]');
        if (chip) switchPage(+chip.dataset.page);
    });
    pagesChips.addEventListener('dblclick', (e) => {
        const chip = e.target.closest('[data-page]');
        if (chip) renamePage(+chip.dataset.page);
    });
}
if (addPageBtn) addPageBtn.addEventListener('click', addPage);

// livelli
if (layersList) {
    layersList.addEventListener('click', (e) => {
        const item = e.target.closest('.layer-item');
        if (!item) return;
        const els = Array.from(canvas.querySelectorAll(':scope > .canvas-element'));
        const el = els[+item.dataset.layer];
        if (!el) return;
        const act = e.target.closest('[data-act]');
        if (act) {
            if (act.dataset.act === 'up') moveElement(el, -1);
            else if (act.dataset.act === 'down') moveElement(el, 1);
            else if (act.dataset.act === 'del') deleteElement(el);
            return;
        }
        selectElement(el, false);
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
}

// vista codice
function openCodeModal() {
    syncFromCanvas();
    codeArea.value = exportHTML(false);
    codeModal.classList.add('active');
}
if (codeBtn) codeBtn.addEventListener('click', openCodeModal);
if (codeClose) codeClose.addEventListener('click', () => codeModal.classList.remove('active'));
if (codeModal) codeModal.addEventListener('click', (e) => { if (e.target === codeModal) codeModal.classList.remove('active'); });
if (codeApply) {
    codeApply.addEventListener('click', () => {
        canvas.innerHTML = codeArea.value;
        canvas.querySelector('.drop-indicator')?.remove();
        initCanvasElements();
        selectElement(null);
        updateEmptyState();
        renderLayers();
        pushHistory();
        codeModal.classList.remove('active');
        toast('Codice applicato');
    });
}
if (codeCopy) {
    codeCopy.addEventListener('click', () => {
        navigator.clipboard?.writeText(codeArea.value).then(
            () => toast('Codice copiato'),
            () => toast('Copia non riuscita', 'error')
        );
    });
}

// tema
function applyTheme(theme) {
    document.body.classList.toggle('dark', theme === 'dark');
    localStorage.setItem(THEME_KEY, theme);
    if (themeBtn) {
        themeBtn.innerHTML = theme === 'dark'
            ? '<i class="bi bi-sun"></i>' : '<i class="bi bi-moon-stars"></i>';
        themeBtn.title = theme === 'dark' ? 'Tema chiaro' : 'Tema scuro';
    }
}
if (themeBtn) {
    themeBtn.addEventListener('click', () => {
        applyTheme(document.body.classList.contains('dark') ? 'light' : 'dark');
    });
}

// aiuto
if (helpBtn) helpBtn.addEventListener('click', () => helpModal?.classList.add('active'));
if (helpClose) helpClose.addEventListener('click', () => helpModal.classList.remove('active'));
if (helpModal) helpModal.addEventListener('click', (e) => { if (e.target === helpModal) helpModal.classList.remove('active'); });

// ricerca elementi
if (elementSearch) {
    elementSearch.addEventListener('input', () => {
        const q = elementSearch.value.trim().toLowerCase();
        document.querySelectorAll('.element-item, .block-item, .template-item').forEach(item => {
            const text = (item.textContent || '').toLowerCase();
            item.style.display = !q || text.includes(q) ? '' : 'none';
        });
    });
}

// nav
navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        navBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
        if (btn.dataset.tab === 'style') renderStylePanel();
        if (btn.dataset.tab === 'layers') renderLayers();
    });
});

// esportazione
function cleanCanvasClone() {
    syncFromCanvas();
    const c = canvas.cloneNode(true);
    c.querySelectorAll('.element-controls, .drop-indicator, .empty-state').forEach(x => x.remove());
    c.querySelectorAll('.canvas-element').forEach(el => {
        el.classList.remove('canvas-element', 'selected', 'dragging');
        el.removeAttribute('draggable');
        el.removeAttribute('id');
        el.removeAttribute('data-type');
    });
    c.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
    c.classList.remove('drag-over', 'empty');
    return c;
}

function rewritePageLinks(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    tmp.querySelectorAll('a[href]').forEach(a => {
        const t = a.textContent.trim().toLowerCase();
        if (a.getAttribute('href') === '#' && t) {
            const target = project.pages.find(p => p.name.trim().toLowerCase() === t);
            if (target) a.setAttribute('href', pageFile(target));
        }
    });
    return tmp.innerHTML;
}

function applyExportEnhancements(root) {
    if (project.endpoint) {
        root.querySelectorAll('form').forEach(f => {
            f.setAttribute('action', project.endpoint);
            f.setAttribute('method', 'POST');
        });
    }
    return root;
}

function countdownScript() {
    return `<script>
document.querySelectorAll('[data-countdown]').forEach(function(box){
  var end=new Date(box.getAttribute('data-countdown')).getTime();
  function tick(){
    var d=Math.max(0,end-Date.now());
    var s=Math.floor(d/1000);
    var set=function(k,v){var el=box.querySelector('[data-cd="'+k+'"]');if(el)el.textContent=String(v).padStart(2,'0');};
    set('d',Math.floor(s/86400));set('h',Math.floor(s%86400/3600));set('m',Math.floor(s%3600/60));set('s',s%60);
  }
  tick();setInterval(tick,1000);
});
<\/script>`;
}

function animSnippets() {
    return {
        style: '.wb-anim{opacity:0;transform:translateY(18px);transition:opacity .6s ease,transform .6s ease}.wb-anim.in{opacity:1;transform:none}@media (prefers-reduced-motion:reduce){.wb-anim{opacity:1;transform:none;transition:none}}',
        script: 'var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target);}});},{threshold:.12});document.querySelectorAll("body > *").forEach(function(el){el.classList.add("wb-anim");io.observe(el);});',
    };
}

function buildPageHTML(p, opts) {
    opts = opts || {};
    const tmp = document.createElement('div');
    tmp.innerHTML = p.html || '';
    tmp.querySelectorAll('.element-controls, .drop-indicator, .empty-state').forEach(x => x.remove());
    tmp.querySelectorAll('.canvas-element').forEach(el => {
        el.classList.remove('canvas-element', 'selected', 'dragging');
        el.removeAttribute('draggable');
        el.removeAttribute('data-type');
    });
    tmp.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));

    applyExportEnhancements(tmp);
    let body = rewritePageLinks(tmp.innerHTML.trim());

    const anim = animSnippets();
    const headExtra = [
        p.favicon ? `<link rel="icon" href="${escapeAttr(p.favicon)}">` : '',
        p.head || '',
        project.anim ? `<style>${anim.style}</style>` : '',
    ].filter(Boolean).join('\n    ');

    const bodyStart = project.anim ? '<body>\n' : '<body>\n';
    const scripts = [
        tmp.querySelector('[data-countdown]') ? countdownScript() : '',
        project.anim ? `<script>${anim.script}<\/script>` : '',
    ].filter(Boolean).join('\n');

    const fontHref = 'https://fonts.googleapis.com/css2?family=' + encodeURIComponent(p.font) + ':wght@400;500;600;700&display=swap';

    return `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${escapeAttr(p.desc || '')}">
    <title>${escapeAttr(p.title || p.name)}</title>
    <link href="${fontHref}" rel="stylesheet">
    ${headExtra}
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: '${p.font}', sans-serif; background: ${p.bg}; line-height: 1.5; }
        img { max-width: 100%; }
        a { cursor: pointer; }
    </style>
</head>
${bodyStart}${body}
${scripts}
</body>
</html>`;
}

function exportHTML(fullPage = false) {
    syncFromCanvas();
    if (!fullPage) {
        const c = cleanCanvasClone();
        return c.innerHTML.trim();
    }
    return buildPageHTML(page());
}

function downloadHTML() {
    const html = exportHTML(true);
    saveAs(new Blob([html], { type: 'text/html' }), pageFile(page()));
    toast('HTML scaricato');
}

function previewSite() {
    syncFromCanvas();
    previewFrame.srcdoc = exportHTML(true);
    previewModal.classList.add('active');
}

function exportAll() {
    syncFromCanvas();
    const zip = new JSZip();
    project.pages.forEach((p, i) => {
        const name = i === 0 ? 'index.html' : pageFile(p);
        zip.file(name, buildPageHTML(p));
    });
    zip.file('style.css', `/* Stili del sito esportato da WebBuilder */\nbody { font-family: '${page().font}', sans-serif; background: ${page().bg}; }\n`);
    zip.file('progetto.webbuilder.json', JSON.stringify(snapshot(), null, 2));
    zip.file('README.txt', 'Sito creato con WebBuilder.\n\nApri index.html nel browser.\nprogetto.webbuilder.json può essere riaperto in WebBuilder con "Apri progetto".');
    zip.generateAsync({ type: 'blob' }).then(content => {
        saveAs(content, slugify(project.pages[0].name) + '.zip');
        toast('ZIP esportato (' + project.pages.length + ' pagine)');
    });
}

// anteprima responsive
document.querySelectorAll('.device-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.device-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const d = btn.dataset.device;
        previewFrame.style.width = d === 'mobile' ? '390px' : d === 'tablet' ? '768px' : '100%';
        previewFrame.style.margin = d === 'desktop' ? '0' : '0 auto';
        previewFrame.style.borderRadius = d === 'desktop' ? '0' : '0.5rem';
        previewFrame.style.boxShadow = d === 'desktop' ? 'none' : '0 10px 30px rgba(0,0,0,.25)';
    });
});

// azioni header / settings
previewBtn.addEventListener('click', previewSite);
downloadBtn.addEventListener('click', downloadHTML);
exportAllBtn.addEventListener('click', exportAll);
previewModalClose.addEventListener('click', () => previewModal.classList.remove('active'));
previewModal.addEventListener('click', (e) => { if (e.target === previewModal) previewModal.classList.remove('active'); });

if (undoBtn) undoBtn.addEventListener('click', undo);
if (redoBtn) redoBtn.addEventListener('click', redo);
if (saveProjectBtn) saveProjectBtn.addEventListener('click', downloadProject);
if (openProjectBtn) openProjectBtn.addEventListener('click', () => importFile.click());
if (importFile) {
    importFile.addEventListener('change', () => {
        const file = importFile.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try { loadProjectData(JSON.parse(reader.result)); }
            catch (err) { toast('File non valido: ' + err.message, 'error'); }
        };
        reader.readAsText(file);
        importFile.value = '';
    });
}
if (clearBtn) {
    clearBtn.addEventListener('click', () => {
        if (!confirm('Svuotare tutta la pagina? (puoi annullare con Ctrl+Z)')) return;
        canvas.innerHTML = '';
        selectElement(null);
        updateEmptyState();
        renderLayers();
        pushHistory();
        toast('Pagina svuotata');
    });
}
if (sidebarBtn) {
    sidebarBtn.addEventListener('click', () => document.querySelector('.sidebar').classList.toggle('open'));
}

[pageTitle, pageDescription, pageBg, pageFont].forEach(el => {
    el.addEventListener('input', () => { applyPageStyles(); scheduleHistory(); });
    el.addEventListener('change', () => { applyPageStyles(); scheduleHistory(); });
});
[faviconInput, headCode, endpointInput].forEach(el => {
    if (!el) return;
    el.addEventListener('input', scheduleHistory);
    el.addEventListener('change', scheduleHistory);
});
if (animToggle) animToggle.addEventListener('change', scheduleHistory);

// modelli
document.querySelectorAll('.template-item').forEach(item => {
    item.addEventListener('click', () => {
        const tpl = TEMPLATES[item.dataset.template];
        if (!tpl) return;
        if (canvas.querySelector('.canvas-element')
            && !confirm('Sostituire il contenuto della pagina con il modello "' + tpl.name + '"?')) return;
        canvas.innerHTML = tpl.html;
        const p = page();
        p.name = item.dataset.template === 'landing' ? 'Home' : p.name;
        pageTitle.value = tpl.name;
        p.title = tpl.name;
        pageFont.value = tpl.font;
        pageBg.value = tpl.bg;
        applyPageStyles();
        initCanvasElements();
        selectElement(null);
        updateEmptyState();
        renderLayers();
        renderPages();
        pushHistory();
        toast('Modello "' + tpl.name + '" applicato');
    });
});

// ===================== AI (Ollama) =====================
const aiBtn = document.getElementById('aiBtn');
const aiModal = document.getElementById('aiModal');
const aiModalClose = document.getElementById('aiModalClose');
const aiCancel = document.getElementById('aiCancel');
const aiGenerate = document.getElementById('aiGenerate');
const aiModel = document.getElementById('aiModel');
const aiPrompt = document.getElementById('aiPrompt');
const aiRefresh = document.getElementById('aiRefresh');
const aiStatus = document.getElementById('aiStatus');
const aiAppend = document.getElementById('aiAppend');
const aiExamples = document.querySelectorAll('.ai-examples .chip');

const OLLAMA_URL = localStorage.getItem('ollamaUrl') || 'http://127.0.0.1:11434';

const SYSTEM_PROMPT = `Sei un generatore di siti web professionali.
Rispondi SOLO con codice HTML valido. NON usare markdown, NON aggiungere spiegazioni, NON usare blocchi di codice con backtick.
Genera SOLO le sezioni interne del <body> (niente <html>, <head> o <body>).
REGOLE:
- Usa SOLO attributi style inline su ogni elemento (nessun CSS esterno, nessun <style>).
- Layout moderno e responsive con flexbox e grid.
- Colori coordinati e professionali in base alla richiesta.
- Immagini segnaposto con https://picsum.photos/800/400 o simili.
- Testi in italiano, realistici e completi.
- Includi sezioni complete: header/hero, contenuti, e footer.
- Il risultato deve essere subito utilizzabile in un editor che accetta HTML.`;

function setAiStatus(state, text) {
    aiStatus.className = 'ai-status ' + state;
    const icon = state === 'loading' ? '<span class="spinner"></span>'
        : state === 'ok' ? '<i class="bi bi-check-circle"></i>'
        : state === 'error' ? '<i class="bi bi-exclamation-triangle"></i>'
        : '<i class="bi bi-info-circle"></i>';
    aiStatus.innerHTML = icon + '<span>' + text + '</span>';
}

async function loadModels() {
    setAiStatus('loading', 'Connessione a Ollama...');
    aiModel.innerHTML = '<option>Caricamento...</option>';
    try {
        const res = await fetch(OLLAMA_URL + '/api/tags');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        const models = (data.models || []).map(m => m.name);
        if (models.length === 0) {
            setAiStatus('error', 'Nessun modello installato. Esegui: ollama pull llama3');
            aiModel.innerHTML = '<option value="">Nessun modello</option>';
            return;
        }
        aiModel.innerHTML = models.map(m => `<option value="${m}">${m}</option>`).join('');
        const preferred = models.find(m => m.includes('llama') || m.includes('qwen') || m.includes('mistral'));
        if (preferred) aiModel.value = preferred;
        setAiStatus('ok', 'Ollama connesso - ' + models.length + ' modelli disponibili');
    } catch (err) {
        setAiStatus('error', 'Ollama non raggiungibile su ' + OLLAMA_URL + '. Avvialo con: ollama serve');
        aiModel.innerHTML = '<option value="">Non disponibile</option>';
    }
}

function stripCodeFences(text) {
    let t = text.trim();
    t = t.replace(/^```(?:html)?\s*/i, '').replace(/```\s*$/i, '');
    const htmlMatch = t.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    if (htmlMatch) t = htmlMatch[1];
    t = t.replace(/<!DOCTYPE[^>]*>/gi, '');
    t = t.replace(/<\/?html[^>]*>/gi, '');
    t = t.replace(/<head[\s\S]*?<\/head>/gi, '');
    t = t.replace(/<\/?body[^>]*>/gi, '');
    return t.trim();
}

async function generateWithOllama(prompt, model, onChunk) {
    const fullPrompt = SYSTEM_PROMPT + '\n\nRichiesta utente: ' + prompt;
    const res = await fetch(OLLAMA_URL + '/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, prompt: fullPrompt, stream: true })
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let full = '';
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();
        for (const line of lines) {
            if (!line.trim()) continue;
            try {
                const json = JSON.parse(line);
                if (json.response) {
                    full += json.response;
                    onChunk(full);
                }
            } catch (e) { /* chunk parziale */ }
        }
    }
    return full;
}

function injectGeneratedHTML(html, append) {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const nodes = Array.from(temp.children).filter(n => n.tagName !== 'STYLE' && n.tagName !== 'SCRIPT');

    if (!append) canvas.innerHTML = '';
    else canvas.querySelector('.empty-state')?.remove();

    nodes.forEach(node => {
        const wrapper = document.createElement('div');
        wrapper.id = generateId();
        while (node.firstChild) wrapper.appendChild(node);
        canvas.appendChild(wrapper);
    });

    initCanvasElements();
    updateEmptyState();
    renderLayers();
    if (nodes.length === 0) alert('L\'AI non ha restituito contenuto valido. Riprova.');
    else pushHistory();
}

function showGeneratingOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'generating-overlay';
    overlay.id = 'genOverlay';
    overlay.innerHTML = '<span class="spinner"></span><p id="genText">L\'AI sta generando il sito...</p>';
    canvas.parentElement.style.position = 'relative';
    canvas.parentElement.appendChild(overlay);
}

function updateGeneratingText(text) {
    const el = document.getElementById('genText');
    if (el) el.textContent = text;
}

function hideGeneratingOverlay() {
    document.getElementById('genOverlay')?.remove();
}

async function runGeneration() {
    const prompt = aiPrompt.value.trim();
    const model = aiModel.value;
    if (!prompt) { alert('Scrivi una descrizione del sito.'); return; }
    if (!model) { alert('Nessun modello disponibile. Avvia Ollama e ricarica.'); return; }

    aiGenerate.disabled = true;
    const log = document.createElement('div');
    log.className = 'ai-log active';
    document.querySelector('.ai-modal .modal-body').appendChild(log);
    showGeneratingOverlay();

    try {
        let chunks = 0;
        const full = await generateWithOllama(prompt, model, (txt) => {
            chunks++;
            log.textContent = 'Ricevuti ' + chunks + ' blocchi... (' + txt.length + ' caratteri)';
            log.scrollTop = log.scrollHeight;
            updateGeneratingText('Generazione in corso (' + txt.length + ' caratteri)...');
        });
        const html = stripCodeFences(full);
        if (!html || html.length < 20) throw new Error('Risposta vuota o non valida');
        injectGeneratedHTML(html, aiAppend.checked);
        aiModal.classList.remove('active');
    } catch (err) {
        alert('Errore generazione: ' + err.message);
    } finally {
        aiGenerate.disabled = false;
        hideGeneratingOverlay();
        log.remove();
    }
}

aiBtn.addEventListener('click', () => {
    aiModal.classList.add('active');
    if (aiModel.options.length <= 1 || aiModel.value === '') loadModels();
});
aiModalClose.addEventListener('click', () => aiModal.classList.remove('active'));
aiCancel.addEventListener('click', () => aiModal.classList.remove('active'));
aiModal.addEventListener('click', (e) => { if (e.target === aiModal) aiModal.classList.remove('active'); });
aiRefresh.addEventListener('click', loadModels);
aiGenerate.addEventListener('click', runGeneration);
aiExamples.forEach(chip => {
    chip.addEventListener('click', () => {
        aiPrompt.value = chip.textContent;
        aiPrompt.focus();
    });
});
aiPrompt.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') runGeneration();
});

// ===================== AVVIO =====================
(function init() {
    applyTheme(localStorage.getItem(THEME_KEY) || 'light');
    if (!restoreProject()) {
        project = defaultProject();
        loadCurrentPage();
    }
    refresh();
    pushHistory();
    updateHistoryButtons();
    console.log('WebBuilder pronto! Progetto v2 con ' + project.pages.length + ' pagina/e.');
})();
