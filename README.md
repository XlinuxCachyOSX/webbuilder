# WebBuilder

> Creatore di siti web drag & drop, gratis e open source, con generazione **AI locale** (Ollama). Nessun server, nessun account, nessun costo.

<!-- Sostituisci TUOUTENTE col tuo username GitHub dopo la pubblicazione -->
[![CI](https://github.com/TUOUTENTE/webbuilder/actions/workflows/ci.yml/badge.svg)](https://github.com/TUOUTENTE/webbuilder/actions/workflows/ci.yml)
[![Deploy](https://github.com/TUOUTENTE/webbuilder/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/TUOUTENTE/webbuilder/actions/workflows/deploy-pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/TUOUTENTE/webbuilder/pulls)

Trascina elementi, componi la pagina, oppure descrivi il sito in una frase e lascia che l'AI lo costruisca. Poi esporti HTML o ZIP e lo pubblichi dove vuoi.

---

## Getting Started (avvio rapido)

### 1. Provalo subito (senza installare nulla)
Apri `index.html` con un doppio click. Il builder manuale funziona immediatamente.

> La funzione **AI** richiede di aprire il progetto via `http://localhost` (vedi sotto), perché da `file://` il browser blocca le richieste per CORS.

### 2. Modalità completa (consigliata)
```bash
# clona
git clone https://github.com/TUOUTENTE/webbuilder.git
cd webbuilder

# avvia un server locale (una delle due)
python3 -m http.server 8000      # oppure:  npm start
```
Apri **http://localhost:8000**.

### 3. Abilita la generazione AI (opzionale, gratis)
```bash
# installa Ollama (una volta sola): https://ollama.com/download
ollama pull qwen2.5-coder:7b     # il migliore per generare HTML
OLLAMA_ORIGINS=* ollama serve
```
Nel builder: **Genera con AI** → scegli il modello → scrivi il prompt → **Genera**.
Dettagli completi in [`DEPLOY.md`](DEPLOY.md).

---

## Funzionalità

- **Generazione AI**: descrivi il sito e Ollama lo crea — locale, gratis, offline
- **Elementi base**: titoli, testo, pulsanti, immagini, link, liste, moduli, separatori, contenitori
- **Blocchi pronti**: Hero, Caratteristiche, Contatti, Footer
- **Modifica inline**: clicca e scrivi direttamente sugli elementi
- **Controlli elemento**: modifica, duplica, elimina
- **Impostazioni pagina**: titolo, descrizione SEO, sfondo, font
- **Anteprima** in tempo reale
- **Esportazione**: HTML singolo o ZIP completo

## Screenshot

> _Aggiungi qui uno screenshot dell'interfaccia (es. `docs/screenshot.png`)._

---

## Struttura del progetto

```
webbuilder/
├── index.html                 # Interfaccia dell'editor
├── style.css                  # Stili
├── app.js                     # Logica drag & drop, export e AI
├── test/
│   └── structure.test.js      # Test di struttura (node --test)
├── .github/
│   ├── workflows/
│   │   ├── ci.yml             # Test + lint ad ogni push/PR
│   │   └── deploy-pages.yml   # Deploy automatico su GitHub Pages
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

Il progetto è statico: carica i file su **GitHub Pages**, **Cloudflare Pages**, **Netlify**, **Vercel** e altri. Con il workflow incluso, il deploy su GitHub Pages è automatico ad ogni push su `main` (attiva prima *Settings → Pages → Source: GitHub Actions*).

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
