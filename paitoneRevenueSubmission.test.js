import test from 'node:test';
import assert from 'node:assert/strict';
import { submitPaitoneRevenue } from './paitoneRevenueSubmission.js';

test('submitPaitoneRevenue restituisce errore su input non valido senza salvare', async () => {
  let called = false;
  const result = await submitPaitoneRevenue('', async () => {
    called = true;
  });

  assert.equal(result.success, false);
  assert.equal(result.error, 'Inserisci un importo di fatturato.');
  assert.equal(called, false);
});

test('submitPaitoneRevenue salva importo valido e restituisce successo', async () => {
  let savedValue = null;
  const result = await submitPaitoneRevenue('7120,50', async (value) => {
    savedValue = value;
  });

  assert.equal(result.success, true);
  assert.equal(result.error, '');
  assert.equal(savedValue, 7120.5);
});
