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

const STORAGE_KEY = 'webbuilder:project:v1';
const HISTORY_MAX = 60;

let selectedElement = null;
let dragCounter = 0;
let history = [];
let historyIndex = -1;
let histTimer = null;
let autosaveTimer = null;
let dropIndicator = null;

function generateId() {
    return 'el-' + Math.random().toString(36).slice(2, 11);
}

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

// ===================== STORIA (undo/redo) =====================
function snapshot() {
    return {
        html: canvas.innerHTML,
        title: pageTitle.value,
        desc: pageDescription.value,
        bg: pageBg.value,
        font: pageFont.value,
    };
}

function sameSnap(a, b) {
    return a && b && a.html === b.html && a.title === b.title && a.desc === b.desc
        && a.bg === b.bg && a.font === b.font;
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
    canvas.innerHTML = snap.html;
    pageTitle.value = snap.title;
    pageDescription.value = snap.desc;
    pageBg.value = snap.bg;
    pageFont.value = snap.font;
    applyPageStyles();
    initCanvasElements();
    selectedElement = null;
    renderStylePanel();
    updateEmptyState();
}

function updateHistoryButtons() {
    if (undoBtn) undoBtn.disabled = historyIndex <= 0;
    if (redoBtn) redoBtn.disabled = historyIndex >= history.length - 1;
}

function undo() {
    if (historyIndex <= 0) return;
    historyIndex--;
    applySnapshot(history[historyIndex]);
    updateHistoryButtons();
    scheduleAutosave();
    toast('Annullato');
}

function redo() {
    if (historyIndex >= history.length - 1) return;
    historyIndex++;
    applySnapshot(history[historyIndex]);
    updateHistoryButtons();
    scheduleAutosave();
    toast('Ripristinato');
}

// ===================== SALVATAGGIO PROGETTO =====================
function scheduleAutosave() {
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 1, ...snapshot() }));
            if (autosaveTag) {
                autosaveTag.textContent = 'Salvato ' + new Date().toLocaleTimeString();
            }
        } catch (e) { /* quota piena o modalità privata */ }
    }, 500);
}

function restoreProject() {
    let data = null;
    try { data = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (e) { data = null; }
    if (!data || !data.html) return false;
    applySnapshot(data);
    return true;
}

function downloadProject() {
    const blob = new Blob([JSON.stringify({ v: 1, ...snapshot() }, null, 2)],
        { type: 'application/json' });
    saveAs(blob, (pageTitle.value || 'progetto').replace(/[^\w-]+/g, '-').toLowerCase() + '.webbuilder.json');
    toast('Progetto esportato');
}

function loadProjectData(data) {
    if (!data || typeof data.html !== 'string') throw new Error('File non valido');
    applySnapshot({
        html: data.html,
        title: data.title || 'Il Mio Sito Web',
        desc: data.desc || '',
        bg: data.bg || '#ffffff',
        font: data.font || 'Inter',
    });
    pushHistory();
    toast('Progetto caricato');
}

// ===================== PAGINA =====================
function applyPageStyles() {
    document.body.style.background = pageBg.value;
}

[pageTitle, pageDescription, pageBg, pageFont].forEach(el => {
    el.addEventListener('input', () => { applyPageStyles(); scheduleHistory(); });
    el.addEventListener('change', () => { applyPageStyles(); scheduleHistory(); });
});

// ===================== ELEMENTI CANVAS =====================
function updateEmptyState() {
    const hasElements = canvas.querySelector('.canvas-element');
    if (hasElements) {
        canvas.classList.remove('empty');
        const empty = canvas.querySelector('.empty-state');
        if (empty) empty.remove();
    } else {
        canvas.classList.add('empty');
        if (!canvas.querySelector('.empty-state')) {
            canvas.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-plus-circle"></i>
                    <h3>Inizia a costruire</h3>
                    <p>Trascina un elemento dalla sidebar per iniziare</p>
                </div>
            `;
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

function selectElement(el) {
    canvas.querySelectorAll('.canvas-element').forEach(e => e.classList.remove('selected'));
    selectedElement = el || null;
    if (el) {
        el.classList.add('selected');
        openStyleTab();
    }
    renderStylePanel();
}

function openStyleTab() {
    const btn = document.querySelector('.nav-btn[data-tab="style"]');
    if (btn && !btn.classList.contains('active')) btn.click();
}

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
            div.innerHTML = '<a href="#" contenteditable="true" class="custom-btn" style="display: inline-block; padding: 0.75rem 1.5rem; background: #2563eb; color: white; border-radius: 0.5rem; text-decoration: none; cursor: pointer;">Pulsante</a>';
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
            div.innerHTML = '<div style="padding: 2rem; background: #f8fafc; border-radius: 0.5rem; min-height: 100px;">Contenitore - trascina elementi qui</div>';
            break;
        case 'list':
            div.innerHTML = '<ul style="padding-left: 2rem; line-height: 1.8;"><li contenteditable="true">Elemento 1</li><li contenteditable="true">Elemento 2</li><li contenteditable="true">Elemento 3</li></ul>';
            break;
        case 'form':
            div.innerHTML = `
                <form style="display: flex; flex-direction: column; gap: 1rem; padding: 1.5rem; background: #f8fafc; border-radius: 0.5rem;">
                    <input type="text" placeholder="Nome" style="padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 0.375rem;">
                    <input type="email" placeholder="Email" style="padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 0.375rem;">
                    <textarea rows="3" placeholder="Messaggio" style="padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 0.375rem;"></textarea>
                    <button type="submit" style="padding: 0.75rem; background: #2563eb; color: white; border: none; border-radius: 0.375rem; cursor: pointer;">Invia</button>
                </form>
            `;
            break;
        case 'spacer':
            div.innerHTML = '<div style="height: 3rem;"></div>';
            break;
        case 'video':
            div.innerHTML = '<div style="position:relative;padding-bottom:56.25%;height:0;border-radius:0.5rem;overflow:hidden;background:#0f172a;"><iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" style="position:absolute;inset:0;width:100%;height:100%;border:0;" allowfullscreen title="Video"></iframe></div>';
            break;
        case 'columns':
            div.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1.5rem;"><div contenteditable="true" style="padding:1.5rem;background:#f8fafc;border-radius:0.5rem;"><h3 style="margin-bottom:.5rem;">Colonna 1</h3><p>Testo della prima colonna.</p></div><div contenteditable="true" style="padding:1.5rem;background:#f8fafc;border-radius:0.5rem;"><h3 style="margin-bottom:.5rem;">Colonna 2</h3><p>Testo della seconda colonna.</p></div></div>';
            break;
    }

    makeElementInteractive(div);
    return div;
}

function createBlock(type) {
    const container = document.createElement('div');
    container.id = generateId();
    container.dataset.type = 'block-' + type;

    switch (type) {
        case 'hero':
            container.innerHTML = `
                <section style="padding: 4rem 2rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center; border-radius: 0.5rem;">
                    <h1 contenteditable="true" style="font-size: 3rem; margin-bottom: 1rem; color: white;">Benvenuto sul Mio Sito</h1>
                    <p contenteditable="true" style="font-size: 1.25rem; margin-bottom: 2rem; opacity: 0.9;">Costruisci il tuo successo con noi</p>
                    <a href="#" contenteditable="true" style="display: inline-block; padding: 1rem 2rem; background: white; color: #667eea; border-radius: 0.5rem; text-decoration: none; font-weight: 600;">Inizia Ora</a>
                </section>
            `;
            break;
        case 'features':
            container.innerHTML = `
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
                </section>
            `;
            break;
        case 'contact':
            container.innerHTML = `
                <section style="padding: 4rem 2rem; background: #f8fafc;">
                    <h2 contenteditable="true" style="text-align: center; font-size: 2.5rem; margin-bottom: 3rem;">Contattaci</h2>
                    <form style="max-width: 600px; margin: 0 auto; display: flex; flex-direction: column; gap: 1rem;">
                        <input type="text" placeholder="Nome" style="padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 0.375rem;">
                        <input type="email" placeholder="Email" style="padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 0.375rem;">
                        <textarea rows="4" placeholder="Messaggio" style="padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 0.375rem;"></textarea>
                        <button type="submit" style="padding: 0.75rem; background: #2563eb; color: white; border: none; border-radius: 0.375rem; cursor: pointer;">Invia Messaggio</button>
                    </form>
                </section>
            `;
            break;
        case 'footer':
            container.innerHTML = `
                <footer style="padding: 2rem; background: #1e293b; color: white; text-align: center;">
                    <p contenteditable="true">© ${new Date().getFullYear()} Il Mio Sito Web. Tutti i diritti riservati.</p>
                </footer>
            `;
            break;
        case 'gallery':
            container.innerHTML = `
                <section style="padding: 4rem 2rem;">
                    <h2 contenteditable="true" style="text-align: center; font-size: 2.25rem; margin-bottom: 2rem;">Galleria</h2>
                    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;">
                        <img src="https://picsum.photos/seed/a/600/400" alt="" style="width:100%;height:180px;object-fit:cover;border-radius:0.5rem;">
                        <img src="https://picsum.photos/seed/b/600/400" alt="" style="width:100%;height:180px;object-fit:cover;border-radius:0.5rem;">
                        <img src="https://picsum.photos/seed/c/600/400" alt="" style="width:100%;height:180px;object-fit:cover;border-radius:0.5rem;">
                        <img src="https://picsum.photos/seed/d/600/400" alt="" style="width:100%;height:180px;object-fit:cover;border-radius:0.5rem;">
                    </div>
                </section>
            `;
            break;
        case 'pricing':
            container.innerHTML = `
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
                </section>
            `;
            break;
    }

    makeElementInteractive(container);
    return container;
}

// ===================== MODELLI (template) =====================
const TEMPLATES = {
    landing: {
        name: 'Landing prodotto',
        font: 'Inter', bg: '#ffffff',
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
    <div contenteditable="true" style="padding:1.75rem;border:1px solid #e2e8f0;border-radius:0.75rem;"><h3 style="margin-bottom:.5rem;">⚡ Veloce</h3><p style="color:#64748b;">Configurazione in meno di 5 minuti.</p></div>
    <div contenteditable="true" style="padding:1.75rem;border:1px solid #e2e8f0;border-radius:0.75rem;"><h3 style="margin-bottom:.5rem;">🔒 Sicuro</h3><p style="color:#64748b;">Dati cifrati e server in Europa.</p></div>
    <div contenteditable="true" style="padding:1.75rem;border:1px solid #e2e8f0;border-radius:0.75rem;"><h3 style="margin-bottom:.5rem;">💬 Supporto</h3><p style="color:#64748b;">Risposta umana entro 2 ore.</p></div>
  </div>
</section>
<footer style="padding:2rem;background:#0f172a;color:#94a3b8;text-align:center;"><p contenteditable="true">© ${new Date().getFullYear()} Nome Prodotto</p></footer>`,
    },
    portfolio: {
        name: 'Portfolio creativo',
        font: 'Poppins', bg: '#fafaf9',
        html: `
<section style="padding:5rem 2rem 3rem;max-width:1000px;margin:0 auto;">
  <h1 contenteditable="true" style="font-size:3rem;margin-bottom:.5rem;">Ciao, sono Maria.</h1>
  <p contenteditable="true" style="font-size:1.25rem;color:#57534e;max-width:560px;">Designer e sviluppatrice con base a Milano. Couisco estetica e funzione.</p>
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
        name: 'Ristorante',
        font: 'Inter', bg: '#fffbeb',
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
        name: 'Evento / Conferenza',
        font: 'Inter', bg: '#ffffff',
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
};

// ===================== PANNELLO STILE =====================
function px(n) { return Math.round(n) || 0; }

function computed(el, prop) {
    return getComputedStyle(el).getPropertyValue(prop);
}

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

    const color = computed(target, 'color');
    const fontSize = px(parseFloat(computed(target, 'fontSize')));
    const bg = computed(el, 'backgroundColor');
    const pad = px(parseFloat(computed(el, 'paddingLeft')));
    const mar = px(parseFloat(computed(el, 'marginBottom')));
    const rad = px(parseFloat(computed(el, 'borderTopLeftRadius')));
    const bw = px(parseFloat(computed(el, 'borderTopWidth')));
    const bc = computed(el, 'borderTopColor');
    const align = computed(target, 'textAlign');

    styleEditor.innerHTML = `
        <div class="style-section"><span class="style-title">Testo</span>
            ${styleRow('Colore', '<input type="color" data-style="color" value="' + toHex(color) + '">')}
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
            ${styleRow('Sfondo', '<input type="color" data-style="backgroundColor" value="' + toHex(bg) + '">')}
            ${styleRow('Padding', '<input type="number" min="0" max="200" data-style="padding" value="' + pad + '">')}
            ${styleRow('Margine inferiore', '<input type="number" min="0" max="200" data-style="marginBottom" value="' + mar + '">')}
            ${styleRow('Arrotondamento', '<input type="number" min="0" max="100" data-style="borderRadius" value="' + rad + '">')}
            ${styleRow('Bordo', '<span class="style-inline"><input type="color" data-style="borderColor" value="' + toHex(bc) + '"><input type="number" min="0" max="20" data-style="borderWidth" value="' + bw + '"></span>')}
        </div>
        ${img ? '<div class="style-section"><span class="style-title">Immagine</span>' + styleRow('URL', '<input type="text" data-style="imgSrc" value="' + escapeAttr(img.getAttribute('src') || '') + '">') + '</div>' : ''}
        ${link ? '<div class="style-section"><span class="style-title">Link</span>' + styleRow('Destinazione', '<input type="text" data-style="href" value="' + escapeAttr(link.getAttribute('href') || '') + '">') + '</div>' : ''}
        <button class="btn btn-secondary style-reset" id="styleReset" style="width:100%;margin-top:.5rem;">
            <i class="bi bi-arrow-counterclockwise"></i> Azzera stile
        </button>
    `;
}

function toHex(color) {
    if (!color || color === 'transparent' || color === 'rgba(0, 0, 0, 0)') return '#ffffff';
    if (color[0] === '#') return color.slice(0, 7);
    const m = color.match(/\d+/g);
    if (!m) return '#ffffff';
    return '#' + m.slice(0, 3).map(n => (+n).toString(16).padStart(2, '0')).join('');
}

function escapeAttr(s) {
    return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
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
        case 'href': {
            const a = el.querySelector('a');
            if (a) { a.href = value || '#'; }
            break;
        }
    }
    scheduleHistory();
}

if (styleEditor) {
    styleEditor.addEventListener('input', (e) => {
        const p = e.target.dataset && e.target.dataset.style;
        if (!p) return;
        applyStyleProp(p, e.target.type === 'checkbox' ? e.target.checked : e.target.value);
    });
    styleEditor.addEventListener('change', (e) => {
        if (e.target.type === 'checkbox' || e.target.tagName === 'SELECT') {
            const p = e.target.dataset && e.target.dataset.style;
            if (p) applyStyleProp(p, e.target.type === 'checkbox' ? e.target.checked : e.target.value);
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
        }
    });
}

function moveElement(el, dir) {
    const sibling = dir < 0 ? el.previousElementSibling : el.nextElementSibling;
    if (!sibling || !sibling.classList.contains('canvas-element')) return;
    if (dir < 0) canvas.insertBefore(el, sibling);
    else canvas.insertBefore(sibling, el);
    pushHistory();
}

function duplicateElement(el) {
    const clone = el.cloneNode(true);
    clone.id = generateId();
    clone.classList.remove('selected');
    el.after(clone);
    initCanvasElements();
    selectElement(clone);
    pushHistory();
}

function deleteElement(el) {
    el.remove();
    selectedElement = null;
    renderStylePanel();
    updateEmptyState();
    pushHistory();
}

// ===================== DRAG & DROP CON RIORDINO =====================
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
    else if (index >= els.length) {
        const r = els[els.length - 1].getBoundingClientRect();
        top = r.bottom;
    } else {
        top = els[index].getBoundingClientRect().top;
    }
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
        pushHistory();
        return;
    }

    let node = null;
    if (elementType) node = createElement(elementType);
    else if (blockType) node = createBlock(blockType);
    if (!node) return;

    const empty = canvas.querySelector('.empty-state');
    if (empty) empty.remove();
    canvas.insertBefore(node, ref);
    initCanvasElements();
    selectElement(node);
    updateEmptyState();
    pushHistory();
});

// ===================== INTERAZIONI (delegazione) =====================
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

document.addEventListener('keydown', (e) => {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        const tag = (document.activeElement.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'textarea') return;
        e.preventDefault();
        undo();
    } else if (mod && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
        const tag = (document.activeElement.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'textarea') return;
        e.preventDefault();
        redo();
    } else if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        downloadProject();
    } else if (e.key === 'Escape') {
        document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
        selectElement(null);
    } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElement) {
        const tag = (document.activeElement.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'textarea') return;
        if (document.activeElement.isContentEditable) return;
        e.preventDefault();
        deleteElement(selectedElement);
    }
});

// ===================== ESPORTAZIONE =====================
function exportHTML(fullPage = false) {
    const canvasClone = canvas.cloneNode(true);
    canvasClone.querySelectorAll('.element-controls, .drop-indicator').forEach(c => c.remove());
    canvasClone.querySelectorAll('.empty-state').forEach(c => c.remove());
    canvasClone.querySelectorAll('.canvas-element').forEach(el => {
        el.classList.remove('canvas-element', 'selected', 'dragging');
        el.removeAttribute('draggable');
        el.removeAttribute('id');
        el.removeAttribute('data-type');
    });
    canvasClone.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
    canvasClone.classList.remove('drag-over', 'empty');

    const bodyContent = canvasClone.innerHTML.trim();

    if (fullPage) {
        return `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${escapeAttr(pageDescription.value)}">
    <title>${escapeAttr(pageTitle.value)}</title>
    <link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(pageFont.value)}:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: '${pageFont.value}', sans-serif; background: ${pageBg.value}; line-height: 1.5; }
        img { max-width: 100%; }
        a { cursor: pointer; }
    </style>
</head>
<body>
${bodyContent}
</body>
</html>`;
    }
    return bodyContent;
}

function downloadHTML() {
    const html = exportHTML(true);
    const blob = new Blob([html], { type: 'text/html' });
    saveAs(blob, 'sito-web.html');
    toast('HTML scaricato');
}

function previewSite() {
    previewFrame.srcdoc = exportHTML(true);
    previewModal.classList.add('active');
}

function exportAll() {
    const html = exportHTML(true);
    const zip = new JSZip();
    zip.file('index.html', html);
    zip.file('style.css', '/* Stili personalizzati del sito */\n');
    zip.file('progetto.webbuilder.json', JSON.stringify({ v: 1, ...snapshot() }, null, 2));
    zip.file('README.txt', 'Sito web creato con WebBuilder\n\nApri index.html nel browser.\nprogetto.webbuilder.json può essere riaperto in WebBuilder con "Apri progetto".');
    zip.generateAsync({ type: 'blob' }).then((content) => {
        saveAs(content, 'sito-web.zip');
        toast('ZIP esportato');
    });
}

// ===================== ANTEPRIMA RESPONSIVE =====================
document.querySelectorAll('.device-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.device-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        previewFrame.style.width = btn.dataset.device === 'mobile' ? '390px'
            : btn.dataset.device === 'tablet' ? '768px' : '100%';
        previewFrame.style.margin = btn.dataset.device === 'desktop' ? '0' : '0 auto';
        previewFrame.style.borderRadius = btn.dataset.device === 'desktop' ? '0' : '0.5rem';
        previewFrame.style.boxShadow = btn.dataset.device === 'desktop' ? 'none' : '0 10px 30px rgba(0,0,0,.25)';
    });
});

// ===================== NAV / MODAL =====================
navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        navBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
        if (btn.dataset.tab === 'style') renderStylePanel();
    });
});

previewBtn.addEventListener('click', previewSite);
downloadBtn.addEventListener('click', downloadHTML);
exportAllBtn.addEventListener('click', exportAll);
previewModalClose.addEventListener('click', () => previewModal.classList.remove('active'));
previewModal.addEventListener('click', (e) => {
    if (e.target === previewModal) previewModal.classList.remove('active');
});

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
        pushHistory();
        toast('Pagina svuotata');
    });
}
if (sidebarBtn) {
    sidebarBtn.addEventListener('click', () => {
        document.querySelector('.sidebar').classList.toggle('open');
    });
}

// template
document.querySelectorAll('.template-item').forEach(item => {
    item.addEventListener('click', () => {
        const tpl = TEMPLATES[item.dataset.template];
        if (!tpl) return;
        if (canvas.querySelector('.canvas-element')
            && !confirm('Sostituire il contenuto della pagina con il modello "' + tpl.name + '"?')) return;
        canvas.innerHTML = tpl.html;
        pageTitle.value = tpl.name;
        pageFont.value = tpl.font;
        pageBg.value = tpl.bg;
        applyPageStyles();
        initCanvasElements();
        selectElement(null);
        updateEmptyState();
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

    const nodes = Array.from(temp.children).filter(n => {
        const tag = n.tagName;
        return tag !== 'STYLE' && tag !== 'SCRIPT';
    });

    if (!append) {
        canvas.innerHTML = '';
    } else {
        const empty = canvas.querySelector('.empty-state');
        if (empty) empty.remove();
    }

    nodes.forEach(node => {
        const wrapper = document.createElement('div');
        wrapper.id = generateId();
        while (node.firstChild) wrapper.appendChild(node);
        canvas.appendChild(wrapper);
    });

    initCanvasElements();
    updateEmptyState();

    if (nodes.length === 0) {
        alert('L\'AI non ha restituito contenuto valido. Riprova.');
    } else {
        pushHistory();
    }
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
        if (!html || html.length < 20) {
            throw new Error('Risposta vuota o non valida');
        }
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
    if (aiModel.options.length <= 1 || aiModel.value === '') {
        loadModels();
    }
});

aiModalClose.addEventListener('click', () => aiModal.classList.remove('active'));
aiCancel.addEventListener('click', () => aiModal.classList.remove('active'));
aiModal.addEventListener('click', (e) => {
    if (e.target === aiModal) aiModal.classList.remove('active');
});
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
    applyPageStyles();
    updateEmptyState();
    initCanvasElements();
    renderStylePanel();
    const restored = restoreProject();
    pushHistory();
    updateHistoryButtons();
    if (restored) toast('Progetto ripristinato dal salvataggio automatico');
    console.log('WebBuilder pronto!');
})();
