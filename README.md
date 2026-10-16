# WebBuilder

> Creatore di siti web drag & drop, gratis e open source, con generazione **AI locale** (Ollama). Nessun server, nessun account, nessun costo.

[![CI](https://github.com/XlinuxCachyOSX/webbuilder/actions/workflows/ci.yml/badge.svg)](https://github.com/XlinuxCachyOSX/webbuilder/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/XlinuxCachyOSX/webbuilder/pulls)

Trascina elementi, componi la pagina, oppure descrivi il sito in una frase e lascia che l'AI lo costruisca. Poi esporti HTML o ZIP e lo pubblichi dove vuoi.

---

## Getting Started (avvio rapido)

### 1. Provalo subito (senza installare nulla)
Apri `index.html` con un doppio click. Il builder manuale funziona immediatamente.

> La funzione **AI** richiede di aprire il progetto via `http://localhost` (vedi sotto), perché da `file://` il browser blocca le richieste per CORS.

### 2. Modalità completa (consigliata)
```bash
git clone https://github.com/XlinuxCachyOSX/webbuilder.git
cd webbuilder
npm start          # oppure: node serve.js
```
Apri **http://localhost:8000** (il browser si apre da solo).

**Avvio rapido senza terminale** (il server parte e apre il browser):

| Sistema | Come avviare |
|---------|--------------|
| **Windows** | doppio click su `start.bat` |
| **macOS** | doppio click su `start.command` |
| **Linux** | `./start.sh` (oppure doppio click) |

> Gli script usano **Node.js** se presente, altrimenti ripiegano su **Python 3**. Installane almeno uno: [Node.js](https://nodejs.org) o [Python](https://python.org).

### 3. Abilita la generazione AI (opzionale, gratis)
```bash
# installa Ollama (una volta sola): https://ollama.com/download
ollama pull qwen2.5-coder:7b     # il migliore per generare HTML
```
Poi avvia Ollama consentendo l'origine locale:
- **Linux/macOS:** `OLLAMA_ORIGINS=* ollama serve`
- **Windows (PowerShell):** `$env:OLLAMA_ORIGINS="*"; ollama serve`

Nel builder: **Genera con AI** → scegli il modello → scrivi il prompt → **Genera**.
Dettagli completi in [`DEPLOY.md`](DEPLOY.md).

> Il builder **manuale** (drag & drop) funziona su qualsiasi sistema operativo, anche senza Ollama. Serve solo un browser.

---

## Funzionalità

### Editor
- **Undo / Redo** illimitati (60 passi): `Ctrl+Z` e `Ctrl+Shift+Z`
- **Salvataggio automatico** nel browser: chiudi la tab e riapri, il progetto è ancora lì
- **Esporta / importa progetto** (`.webbuilder.json`) per spostarlo su un altro computer
- **Modelli pronti**: Landing, Portfolio, Ristorante, Evento — un clic e hai un sito finito
- **Riordino**: trascina al punto giusto (c'è una linea che ti mostra dove finirà) oppure usa le frecce su/giù
- **Pannello Stile reale**: colore, dimensione, allineamento, grassetto/corsivo, sfondo, padding, margine, arrotondamento, bordo, URL immagine, destinazione link — tutto in tempo reale
- **Elementi base**: titoli, testo, pulsanti, immagini, video, colonne, link, liste, moduli, separatori, spazi
- **Blocchi pronti**: Hero, Caratteristiche, Contatti, Galleria, Prezzi, Footer
- **Modifica inline**: clicca e scrivi direttamente sugli elementi
- **Duplica / elimina** con un clic
- **Anteprima responsive**: desktop, tablet e telefono nel modale di anteprima
- **Esportazione**: HTML singolo o ZIP completo (con il progetto dentro per riaprirlo dopo)
- **Editor usabile anche da smartphone** (il pannello laterale si nasconde)

### AI (opzionale, gratis)
- **Generazione AI**: descrivi il sito e Ollama lo crea — locale, offline

## Screenshot

> _Aggiungi qui uno screenshot dell'interfaccia (es. `docs/screenshot.png`)._

---

## Struttura del progetto

```
webbuilder/
├── index.html                 # Interfaccia dell'editor
├── style.css                  # Stili
├── app.js                     # Logica drag & drop, export e AI
├── serve.js                   # Server statico cross-platform (Node, zero dipendenze)
├── start.bat / start.command / start.sh   # Avvio rapido per Windows/macOS/Linux
├── test/
│   └── structure.test.js      # Test di struttura (node --test)
├── .github/
│   ├── workflows/
│   │   └── ci.yml             # Test + lint ad ogni push/PR
│   ├── ISSUE_TEMPLATE/        # Template per bug e feature request
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── dependabot.yml         # Aggiornamenti automatici dipendenze
├── package.json               # Script e dev tooling
├── DEPLOY.md                  # Guida installazione e hosting gratuito
├── README.md
└── LICENSE                    # MIT
```

## Tecnologie

- HTML5, CSS3, JavaScript vanilla (zero dipendenze a runtime)
- Bootstrap Icons (CDN)
- JSZip + FileSaver (CDN, per l'esportazione)
- Solo lato client: nessuna build, nessun backend

## Script disponibili

```bash
npm test           # test di struttura + sintassi JS
npm run lint:js    # controllo sintassi con node --check
npm run lint:html  # validazione HTML (richiede npm install)
npm start          # server locale su :8000
```

---

## Pubblicare il sito (hosting gratuito)

Il progetto è statico: carica i file su **Netlify**, **Cloudflare Pages**, **GitHub Pages**, **Vercel** e altri.

Il metodo più veloce è **Netlify Drop**: trascina la cartella su https://app.netlify.com/drop e ottieni subito un link.

Guida completa per ogni piattaforma: [`DEPLOY.md`](DEPLOY.md).

## Contribuire

I contributi sono benvenuti! Apri una issue (usa i template) o una pull request.

1. Fai un fork del progetto
2. Crea un branch (`git checkout -b feature/nuova-funzione`)
3. Commit delle modifiche
4. Assicurati che `npm test` passi
5. Apri una pull request

## Licenza

Distribuito sotto licenza **MIT** — vedi [`LICENSE`](LICENSE).
