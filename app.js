const canvas = document.getElementById('canvas');
const elementList = document.querySelectorAll('.element-item');
const blockList = document.querySelectorAll('.block-item');
const navBtns = document.querySelectorAll('.nav-btn');
const tabContents = document.querySelectorAll('.tab-content');
const previewBtn = document.getElementById('previewBtn');
const downloadBtn = document.getElementById('downloadBtn');
const exportAllBtn = document.getElementById('exportAllBtn');
const elementModal = document.getElementById('elementModal');
const previewModal = document.getElementById('previewModal');
const modalClose = document.getElementById('modalClose');
const modalCancel = document.getElementById('modalCancel');
const modalSave = document.getElementById('modalSave');
const previewModalClose = document.getElementById('previewModalClose');
const previewFrame = document.getElementById('previewFrame');
const pageTitle = document.getElementById('pageTitle');
const pageDescription = document.getElementById('pageDescription');
const pageBg = document.getElementById('pageBg');
const pageFont = document.getElementById('pageFont');

let selectedElement = null;
let dragCounter = 0;

function generateId() {
    return 'el-' + Math.random().toString(36).substr(2, 9);
}

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

function createElementControls(element) {
    const controls = document.createElement('div');
    controls.className = 'element-controls';
    controls.innerHTML = `
        <button class="element-control edit" title="Modifica"><i class="bi bi-pencil"></i></button>
        <button class="element-control copy" title="Copia"><i class="bi bi-copy"></i></button>
        <button class="element-control delete" title="Elimina"><i class="bi bi-trash"></i></button>
    `;
    element.appendChild(controls);

    controls.querySelector('.edit').addEventListener('click', (e) => {
        e.stopPropagation();
        openEditModal(element);
    });

    controls.querySelector('.copy').addEventListener('click', (e) => {
        e.stopPropagation();
        const clone = element.cloneNode(true);
        clone.id = generateId();
        canvas.insertBefore(clone, element.nextSibling);
        makeElementInteractive(clone);
    });

    controls.querySelector('.delete').addEventListener('click', (e) => {
        e.stopPropagation();
        element.remove();
        updateEmptyState();
    });
}

function makeElementInteractive(element) {
    element.classList.add('canvas-element');
    element.setAttribute('draggable', true);
    if (!element.id) element.id = generateId();

    element.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.canvas-element').forEach(el => el.classList.remove('selected'));
        element.classList.add('selected');
        selectedElement = element;
    });

    element.addEventListener('dragstart', (e) => {
        e.dataTransfer.effectAllowed = 'move';
        element.classList.add('dragging');
    });

    element.addEventListener('dragend', () => {
        element.classList.remove('dragging');
    });

    if (!element.querySelector('.element-controls')) {
        createElementControls(element);
    }
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
    }

    makeElementInteractive(div);
    return div;
}

function createBlock(type) {
    const container = document.createElement('div');
    container.id = generateId();
    container.className = 'canvas-element';

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
                    <p contenteditable="true">© 2025 Il Mio Sito Web. Tutti i diritti riservati.</p>
                </footer>
            `;
            break;
    }

    makeElementInteractive(container);
    return container;
}

function exportHTML(fullPage = false) {
    const canvasClone = canvas.cloneNode(true);
    canvasClone.querySelectorAll('.element-controls').forEach(c => c.remove());
    canvasClone.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
    canvasClone.querySelector('.empty-state')?.remove();
    canvasClone.classList.remove('drag-over', 'empty');

    const bodyContent = canvasClone.innerHTML;

    if (fullPage) {
        return `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${pageDescription.value}">
    <title>${pageTitle.value}</title>
    <link href="https://fonts.googleapis.com/css2?family=${pageFont.value.replace(' ', '+')}:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: '${pageFont.value}', sans-serif; background: ${pageBg.value}; }
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
}

function previewSite() {
    const html = exportHTML(true);
    previewFrame.srcdoc = html;
    previewModal.classList.add('active');
}

function exportAll() {
    const html = exportHTML(true);
    const zip = new JSZip();
    zip.file('index.html', html);
    zip.file('style.css', '/* Stili personalizzati */');
    zip.file('README.txt', `Sito web creato con WebBuilder\n\nApri index.html nel tuo browser per visualizzarlo.`);
    zip.generateAsync({ type: 'blob' }).then((content) => {
        saveAs(content, 'sito-web.zip');
    });
}

elementList.forEach(item => {
    item.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('elementType', item.dataset.element);
    });
});

blockList.forEach(item => {
    item.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('blockType', item.dataset.block);
    });
});

canvas.addEventListener('dragover', (e) => {
    e.preventDefault();
    canvas.classList.add('drag-over');
});

canvas.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dragCounter--;
    if (dragCounter === 0) {
        canvas.classList.remove('drag-over');
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

    const elementType = e.dataTransfer.getData('elementType');
    const blockType = e.dataTransfer.getData('blockType');

    if (elementType) {
        const el = createElement(elementType);
        canvas.appendChild(el);
        updateEmptyState();
    } else if (blockType) {
        const block = createBlock(blockType);
        canvas.appendChild(block);
        updateEmptyState();
    }
});

canvas.addEventListener('click', (e) => {
    if (e.target === canvas) {
        document.querySelectorAll('.canvas-element').forEach(el => el.classList.remove('selected'));
        selectedElement = null;
    }
});

navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        navBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
    });
});

previewBtn.addEventListener('click', previewSite);
downloadBtn.addEventListener('click', downloadHTML);
exportAllBtn.addEventListener('click', exportAll);

modalClose.addEventListener('click', () => elementModal.classList.remove('active'));
modalCancel.addEventListener('click', () => elementModal.classList.remove('active'));
previewModalClose.addEventListener('click', () => previewModal.classList.remove('active'));

elementModal.addEventListener('click', (e) => {
    if (e.target === elementModal) elementModal.classList.remove('active');
});

previewModal.addEventListener('click', (e) => {
    if (e.target === previewModal) previewModal.classList.remove('active');
});

function openEditModal(element) {
    document.getElementById('modalTitle').textContent = 'Modifica Elemento';
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <div class="form-group">
            <label>URL Immagine (se immagine)</label>
            <input type="text" class="form-control" id="imgUrl" placeholder="https://...">
        </div>
        <div class="form-group">
            <label>Colore Sfondo</label>
            <input type="color" class="form-control color" id="bgColor" value="#ffffff">
        </div>
        <div class="form-group">
            <label>Spaziatura Interna (Padding)</label>
            <input type="text" class="form-control" id="padding" placeholder="1rem 2rem">
        </div>
    `;
    elementModal.classList.add('active');
}

updateEmptyState();
console.log('WebBuilder pronto!');

// ===================== AI GENERATION (Ollama) =====================
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
            } catch (e) { /* ignore partial */ }
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
        wrapper.appendChild(node);
        makeElementInteractive(wrapper);
        canvas.appendChild(wrapper);
    });

    updateEmptyState();

    if (nodes.length === 0) {
        alert('L\'AI non ha restituito contenuto valido. Riprova.');
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

// double-click per modifica inline degli elementi
canvas.addEventListener('dblclick', (e) => {
    const element = e.target.closest('.canvas-element');
    if (!element) return;
    const editable = element.getAttribute('contenteditable') === 'true';
    element.setAttribute('contenteditable', editable ? 'false' : 'true');
    if (!editable) {
        element.focus();
        setAiStatus('ok', 'Modalita modifica attiva - premi Esc per uscire');
    }
});

canvas.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const el = e.target.closest('.canvas-element');
        if (el) el.setAttribute('contenteditable', 'false');
    }
});
