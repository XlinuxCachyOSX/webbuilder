# WebBuilder — Guida installazione e hosting

Creatore di siti web drag & drop con generazione AI locale (Ollama).
100% gratis, open source (MIT), solo file statici.

---

## 1. Requisiti

- Un browser moderno (Chrome, Firefox, Edge, Brave)
- **Ollama** installato (solo per la funzione AI — il builder manuale funziona anche senza)

---

## 2. Installazione in locale

### Opzione A — Semplice (senza server)
1. Apri `index.html` con doppio click.
2. Il builder manuale funziona subito.
   ⚠️ La funzione AI **non** funziona da `file://` (bloccata per CORS).

### Opzione B — Con server locale (per usare l'AI)

**Modo rapido** — doppio click sullo script del tuo sistema:

| Sistema | File da avviare |
|---------|-----------------|
| Windows | `start.bat` |
| macOS | `start.command` |
| Linux | `start.sh` |

Lo script avvia il server e apre il browser su http://localhost:8000.

**Modo manuale** (qualsiasi sistema con Node.js):
```bash
node serve.js      # oppure: npm start
```

**Modo manuale** (qualsiasi sistema con Python 3):
```bash
python3 -m http.server 8000     # su Windows: python -m http.server 8000
```
Apri: **http://localhost:8000** (oppure `http://127.0.0.1:8000`)

---

## 3. Installare Ollama (per l'AI)

### CachyOS / Arch
```bash
paru -S ollama          # oppure yay -S ollama
```
Se il mirror dà errore 404 sulla firma:
```bash
curl -fsSL https://ollama.com/install.sh | sh   # metodo ufficiale
```

### Windows / macOS / Linux
Scarica da https://ollama.com/download

### Scarica un modello
```bash
ollama pull qwen2.5-coder:7b   # il migliore per generare HTML
```

### Avvia Ollama consentendo l'origine del sito
In locale (http://localhost:8000) di solito funziona già. Per sicurezza:

**Linux / macOS (terminal):**
```bash
OLLAMA_ORIGINS=* ollama serve
```

**Windows (PowerShell):**
```powershell
$env:OLLAMA_ORIGINS="*"; ollama serve
```

**Windows (CMD):**
```cmd
set OLLAMA_ORIGINS=* && ollama serve
```

Se usi il servizio systemd (Linux):
```bash
sudo systemctl edit ollama
```
Aggiungi:
```ini
[Service]
Environment="OLLAMA_ORIGINS=*"
```
Poi:
```bash
sudo systemctl restart ollama
```

**Impostare OLLAMA_ORIGINS in modo permanente (Windows):**
```cmd
setx OLLAMA_ORIGINS "*"
```
Poi chiudi e riavvia Ollama dal menu della tray (o riavvia il PC).

**Impostare OLLAMA_ORIGINS in modo permanente (macOS, app Ollama):**
```bash
launchctl setenv OLLAMA_ORIGINS "*"
```
Poi riavvia l'app Ollama.

---

## 4. Dove hostarlo GRATIS

Il sito è statico: basta caricare i 3 file (`index.html`, `style.css`, `app.js`).
Ecco le migliori piattaforme gratuite:

| Piattaforma | Come | Costo | Note |
|-------------|------|-------|------|
| **Cloudflare Pages** | Dashboard → Pages → "Upload assets" | Gratis | Banda illimitata, veloce, HTTPS |
| **Netlify Drop** | Trascina la cartella su https://app.netlify.com/drop | Gratis | Il più semplice, URL immediato |
| **GitHub Pages** | Crea repo → Settings → Pages | Gratis | Per chi usa Git, dominio incluso |
| **Vercel** | `vercel` CLI o dashboard | Gratis | Veloce, ottimo per dev |
| **GitLab Pages** | Repo + `.gitlab-ci.yml` | Gratis | Alternativa a GitHub |
| **Neocities** | https://neocities.org → carica file | Gratis | Semplice, community |
| **Codeberg Pages** | https://codeberg.org (Git) | Gratis | Open source, senza tracking |
| **surge.sh** | `npx surge webbuilder` | Gratis | Da terminale, 1 comando |

### Metodo più veloce in assoluto (Netlify Drop)
1. Vai su **https://app.netlify.com/drop**
2. Trascina la cartella `webbuilder` nella pagina
3. Ottieni un URL tipo `https://nome-a-caso.netlify.app` — già online!

### Metodo Cloudflare Pages
1. https://dash.cloudflare.com → **Workers & Pages** → **Create** → **Pages**
2. **Upload assets** → trascina la cartella `webbuilder`
3. Deploy → URL `https://nome.pages.dev`

---

## 5. ⚠️ IMPORTANTE per la versione online

Quando il builder è **hostato online** (es. `https://mio-sito.pages.dev`),
la funzione AI parla con l'**Ollama locale di chi visita il sito**.
Per permettere la connessione, chi visita deve avviare Ollama così:

```bash
OLLAMA_ORIGINS=* ollama serve
```
Su Windows: `setx OLLAMA_ORIGINS "*"` e riavvia Ollama.

**Sicurezza:** `OLLAMA_ORIGINS=*` permette a *qualsiasi* sito di contattare il tuo Ollama locale.
È comodo ma meno sicuro. Per limitare, usa l'origine esatta:
```bash
OLLAMA_ORIGINS=https://mio-sito.pages.dev ollama serve
```

Nota: il builder **manuale** (drag & drop) funziona online per tutti, anche senza Ollama.
Solo la generazione AI richiede Ollama installato sul computer del visitatore.

---

## 6. Personalizzare

- **Cambiare il nome/logo**: modifica `index.html` (sezione `.logo`)
- **Cambiare i colori**: modifica le variabili in `style.css` (`:root`)
- **Cambiare il modello AI predefinito**: modifica `app.js` (variabile `preferred` in `loadModels`)
- **Cambiare l'URL di Ollama**: `app.js`, costante `OLLAMA_URL`

---

## 7. File del progetto

```
webbuilder/
├── index.html         # Interfaccia
├── style.css          # Stili
├── app.js             # Logica + AI
├── serve.js           # Server statico cross-platform (Node)
├── start.bat          # Avvio rapido Windows
├── start.command      # Avvio rapido macOS
├── start.sh           # Avvio rapido Linux
├── README.md          # Guida base
├── DEPLOY.md          # Questa guida
└── LICENSE            # MIT
```

## 8. Licenza

MIT — puoi usarlo, modificarlo, venderlo e ridistribuirlo liberamente.
