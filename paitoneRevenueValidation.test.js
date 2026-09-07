import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePaitoneRevenueInput } from './paitoneRevenueValidation.js';

test('parsePaitoneRevenueInput valida input vuoto', () => {
  assert.deepEqual(parsePaitoneRevenueInput(''), {
    value: null,
    error: 'Inserisci un importo di fatturato.',
  });
});

test('parsePaitoneRevenueInput valida input non numerico', () => {
  assert.deepEqual(parsePaitoneRevenueInput('abc'), {
    value: null,
    error: 'Inserisci un importo valido.',
  });
});

test('parsePaitoneRevenueInput rifiuta notazioni non decimali', () => {
  assert.deepEqual(parsePaitoneRevenueInput('1e3'), {
    value: null,
    error: 'Inserisci un importo valido.',
  });
});

test('parsePaitoneRevenueInput gestisce decimali con virgola', () => {
  assert.deepEqual(parsePaitoneRevenueInput('7120,50'), {
    value: 7120.5,
    error: '',
  });
});

test('parsePaitoneRevenueInput blocca input negativi', () => {
  assert.deepEqual(parsePaitoneRevenueInput('-1'), {
    value: null,
    error: 'Il fatturato non può essere negativo.',
  });
});
