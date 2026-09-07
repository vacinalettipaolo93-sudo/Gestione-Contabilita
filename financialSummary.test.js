import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateFinancialSummary } from './financialSummary.js';

test('include una sola volta il compenso Paitone nei riepiloghi principali', () => {
  const result = calculateFinancialSummary({
    totalIncome: 1500,
    lessonsInvoicedGross: 1000,
    paitoneCompensation: 600,
    taxRate: 25,
    totalExpenses: 200,
  });

  assert.equal(result.totalInvoicedGross, 1600);
  assert.equal(result.totalInvoicedNet, 1200);
  assert.equal(result.totalNotInvoicedIncome, 500);
  assert.equal(result.totalInvoice, 1700);
  assert.equal(result.netProfit, 1500);
  assert.equal(result.paitoneNetCompensation, 450);
});

test('con partita IVA a 0% il netto coincide col lordo aggiornato', () => {
  const result = calculateFinancialSummary({
    totalIncome: 1800,
    lessonsInvoicedGross: 1200,
    paitoneCompensation: 300,
    taxRate: 0,
    totalExpenses: 100,
  });

  assert.equal(result.totalInvoicedGross, 1500);
  assert.equal(result.totalInvoicedNet, 1500);
  assert.equal(result.totalInvoice, 2100);
  assert.equal(result.netProfit, 2000);
  assert.equal(result.paitoneNetCompensation, 300);
});

test('gestisce input non validi senza duplicazioni o NaN', () => {
  const result = calculateFinancialSummary({
    totalIncome: 'abc',
    lessonsInvoicedGross: undefined,
    paitoneCompensation: '',
    taxRate: '25',
    totalExpenses: null,
  });

  assert.equal(result.totalInvoicedGross, 0);
  assert.equal(result.totalInvoicedNet, 0);
  assert.equal(result.totalNotInvoicedIncome, 0);
  assert.equal(result.totalInvoice, 0);
  assert.equal(result.netProfit, 0);
  assert.equal(result.paitoneNetCompensation, 0);
});
