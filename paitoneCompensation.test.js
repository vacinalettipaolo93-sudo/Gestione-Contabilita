import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePaitoneCompensation } from './paitoneCompensation.js';

const baseConfig = {
  rentCost: 3000,
  collaboratorCost: 1120,
  firstBracketLimit: 3000,
  secondBracketLimit: 6000,
  firstBracketRate: 8,
  secondBracketRate: 12,
  thirdBracketRate: 15,
};

test('fatturato sotto i costi: compenso zero', () => {
  const result = calculatePaitoneCompensation(3000, baseConfig);
  assert.equal(result.taxableRevenue, 0);
  assert.equal(result.compensation, 0);
});

test('fatturato entro il primo scaglione', () => {
  const result = calculatePaitoneCompensation(6120, baseConfig);
  assert.equal(result.taxableRevenue, 2000);
  assert.equal(result.compensation, 160);
});

test('attraversamento del secondo scaglione', () => {
  const result = calculatePaitoneCompensation(10120, baseConfig);
  assert.equal(result.taxableRevenue, 6000);
  assert.equal(result.compensation, 600);
});

test('oltre il terzo scaglione', () => {
  const result = calculatePaitoneCompensation(12120, baseConfig);
  assert.equal(result.taxableRevenue, 8000);
  assert.equal(result.compensation, 900);
});

test('modifica parametri da impostazioni', () => {
  const result = calculatePaitoneCompensation(10000, {
    ...baseConfig,
    rentCost: 2000,
    collaboratorCost: 1000,
    firstBracketLimit: 2000,
    secondBracketLimit: 5000,
    firstBracketRate: 10,
    secondBracketRate: 20,
    thirdBracketRate: 30,
  });
  assert.equal(result.taxableRevenue, 7000);
  assert.equal(result.compensation, 1400);
});

test('gestisce input vuoti/non validi senza NaN', () => {
  const result = calculatePaitoneCompensation('', {
    ...baseConfig,
    rentCost: 'abc',
    collaboratorCost: undefined,
  });
  assert.equal(result.taxableRevenue, 0);
  assert.equal(Number.isNaN(result.compensation), false);
  assert.equal(result.compensation, 0);
});

test('normalizza la seconda soglia se inferiore alla prima', () => {
  const result = calculatePaitoneCompensation(12120, {
    ...baseConfig,
    firstBracketLimit: 5000,
    secondBracketLimit: 3000,
  });
  assert.equal(result.config.firstBracketLimit, 5000);
  assert.equal(result.config.secondBracketLimit, 5000);
  assert.equal(result.taxableRevenue, 8000);
  assert.equal(result.compensation, 850);
});
