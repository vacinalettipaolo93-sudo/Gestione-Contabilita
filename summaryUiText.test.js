import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const summarySource = readFileSync(new URL('./components/Summary.tsx', import.meta.url), 'utf8');

test('la sezione fatturato centro sportivo mantiene solo il dettaglio richiesto', () => {
  assert.match(summarySource, /Fatturato inserito/);
  assert.match(summarySource, /Detrazioni \(affitto \+ collaboratore\)/);
  assert.match(summarySource, /Base netta per scaglioni/);
  assert.match(summarySource, /Totale lordo calcolato da aggiungere alla fattura/);
});

test('la sezione fatturato centro sportivo non mostra più i riepiloghi duplicati', () => {
  assert.equal(summarySource.includes('Quota netta centro sportivo dopo partita IVA'), false);
  assert.equal(summarySource.includes('Totale fattura (netto fatturato incl. quota Paitone + utile non fatturato)'), false);
});
