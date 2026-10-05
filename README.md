<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1Q0nOeBXOog9OJy7Vt-4Cb1alIU5j-5rg

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Riordinare le sedi

In **Impostazioni → Sedi**, usa i pulsanti **Sposta su / Sposta giù** accanto
alla sede (anche con Tab e Invio/Spazio), quindi premi **Salva Tutto**.
**Annulla** scarta le modifiche. L'ordine viene salvato su Firebase per ogni
sport e utilizzato nei selettori, nelle tabelle prezzi/costi, nei riepiloghi e
nei riepiloghi per sede del PDF; le lezioni restano in ordine cronologico.
Prezzi, costi e lezioni rimangono collegati all'ID della sede.

Le configurazioni precedenti, senza il campo `order`, mantengono l'ordine
esistente: il campo viene aggiunto al successivo salvataggio, senza scritture
automatiche al caricamento.

Verifiche disponibili: `node --test *.test.js` e `npm run build`.

## PWA – Installazione su Android e iOS/iPadOS

L'app è configurata come **Progressive Web App (PWA)** installabile su dispositivi mobili e desktop.

### Testare l'installabilità (Lighthouse / Chrome DevTools)

1. Avvia l'app in locale (`npm run dev`) oppure aprila su un dominio HTTPS.
2. Apri Chrome DevTools → scheda **Lighthouse** → seleziona **Progressive Web App** → clicca **Analyze page load**.
3. Lighthouse mostrerà se l'app soddisfa i criteri PWA (manifest, service worker, HTTPS).

### Installare su Android (Chrome)

1. Apri l'app in **Chrome per Android**.
2. Tocca i tre puntini (menu) → **"Aggiungi a schermata Home"** oppure attendi il banner di installazione automatico.
3. Conferma: l'icona (simbolo €) apparirà nella schermata Home.

### Installare su iPhone/iPad (Safari)

1. Apri l'app in **Safari su iOS/iPadOS** (deve essere servita via HTTPS o localhost).
2. Tocca l'icona **Condividi** (quadrato con freccia in su) nella barra inferiore.
3. Scorri e seleziona **"Aggiungi alla schermata Home"**.
4. Modifica il nome se vuoi, poi tocca **Aggiungi**: l'icona apparirà nella schermata Home.

> **Nota:** Safari su iOS non supporta le notifiche push PWA e alcune API avanzate, ma installazione e uso offline sono pienamente supportati.

### Testare in locale con HTTPS (opzionale)

Per testare il service worker in locale con HTTPS puoi usare `localhost` direttamente (Chrome e Safari lo trattano come contesto sicuro) oppure usare un tunnel come [ngrok](https://ngrok.com/):

```bash
npm run dev
# In un altro terminale:
npx ngrok http 3000
```

Poi apri l'URL `https://...ngrok-free.app` su mobile.
