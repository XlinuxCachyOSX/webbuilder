# WebBuilder

Creatore di siti web gratuito, drag & drop, basato su browser. Nessun server richiesto.

## Come usarlo

1. Apri `index.html` nel browser (doppio click o trascina nel browser)
2. Trascina gli elementi dalla barra laterale sinistra nell'area di lavoro
3. Clicca un elemento per selezionarlo e modificarlo
4. Usa i blocchi pronti per sezioni complete (Hero, Caratteristiche, Contatti, Footer)
5. **Oppure genera tutto con l'AI** (vedi sotto)
6. Esporta il tuo sito

## Generazione con AI (Ollama locale, gratis)

### 1. Installa Ollama
```bash
# CachyOS / Arch
paru -S ollama   # oppure yay -S ollama
# oppure script ufficiale
curl -fsSL https://ollama.com/install.sh | sh
```

### 2. Scarica un modello
```bash
ollama pull llama3.2
# altri buoni per codice/HTML: qwen2.5-coder, mistral, codellama
```

### 3. Avvia Ollama (con CORS aperto)
```bash
OLLAMA_ORIGINS=* ollama serve
```
Se usi il servizio systemd, imposta l'ambiente:
```bash
sudo systemctl edit ollama
# aggiungi:
# [Service]
# Environment="OLLAMA_ORIGINS=*"
sudo systemctl restart ollama
```

### 4. Avvia il builder via localhost (consigliato per CORS)
```bash
cd webbuilder
python3 -m http.server 8000
```
Apri `http://localhost:8000` e clicca **"Genera con AI"**.

### 5. Scrivi un prompt
Es: _"Crea una landing page per una pizzeria napoletana con hero, menu, recensioni e contatti. Colori caldi."_

Il sito viene generato e inserito direttamente nell'editor. Usa `Ctrl+Enter` per generare.

## Funzionalità

- **Generazione AI**: descrivi il sito e Ollama lo crea (locale, gratis, offline)
- **Elementi base**: titoli, testo, pulsanti, immagini, link, liste, moduli, separatori
- **Blocchi pronti**: Hero section, griglia caratteristiche, form contatti, footer
- **Modifica inline**: clicca e scrivi direttamente sugli elementi
- **Controlli elemento**: modifica, duplica, elimina
- **Impostazioni pagina**: titolo, descrizione SEO, sfondo, font
- **Anteprima** in tempo reale
- **Esportazione**:
  - HTML singolo
  - ZIP completo con README

## Struttura

```
webbuilder/
├── index.html   # Struttura dell'interfaccia
├── style.css    # Stili dell'editor
└── app.js       # Logica drag & drop ed export
```

## Tecnologie

- HTML5, CSS3, JavaScript vanilla
- Bootstrap Icons (CDN)
- JSZip + FileSaver (CDN per export)
- Solo lato client - nessuna installazione

## Note

Serve connessione internet solo per le icone/font da CDN. Il sito esportato è autonomo e funziona offline (tranne font Google e immagini esterne).
