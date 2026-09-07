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

test('rispetta le formule dei riepiloghi superiori con partita IVA al 25%', () => {
  const result = calculateFinancialSummary({
    totalIncome: 1500,
    lessonsInvoicedGross: 800,
    paitoneCompensation: 200,
    taxRate: 25,
    totalExpenses: 50,
  });

  assert.equal(result.totalInvoicedGross, 1000);
  assert.equal(result.totalInvoicedNet, 750);
  assert.equal(result.totalNotInvoicedIncome, 700);
  assert.equal(result.totalInvoice, 1450);
  assert.equal(result.netProfit, 1400);
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

test('con importi a zero mantiene tutti i riepiloghi a zero', () => {
  const result = calculateFinancialSummary({
    totalIncome: 0,
    lessonsInvoicedGross: 0,
    paitoneCompensation: 0,
    taxRate: 25,
    totalExpenses: 0,
  });

  assert.equal(result.totalInvoicedGross, 0);
  assert.equal(result.totalInvoicedNet, 0);
  assert.equal(result.totalNotInvoicedIncome, 0);
  assert.equal(result.totalInvoice, 0);
  assert.equal(result.netProfit, 0);
  assert.equal(result.paitoneNetCompensation, 0);
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

test('evita doppio conteggio quando totalIncome include già la voce Paitone sintetica', () => {
  const result = calculateFinancialSummary({
    totalIncome: 2100, // 1500 lezioni + 600 voce Paitone in elenco
    lessonsInvoicedGross: 1000,
    paitoneCompensation: 600,
    taxRate: 25,
    totalIncomeIncludesPaitoneCompensation: true,
  });

  assert.equal(result.totalInvoicedGross, 1600);
  assert.equal(result.totalInvoicedNet, 1200);
  assert.equal(result.totalNotInvoicedIncome, 500);
  assert.equal(result.totalInvoice, 1700);
});

test('normalizza totalIncome già inclusivo di Paitone quando inferiore al compenso', () => {
  const result = calculateFinancialSummary({
    totalIncome: 200,
    lessonsInvoicedGross: 0,
    paitoneCompensation: 600,
    taxRate: 25,
    totalIncomeIncludesPaitoneCompensation: true,
  });

  assert.equal(result.totalNotInvoicedIncome, 0);
  assert.equal(result.totalInvoicedGross, 600);
  assert.equal(result.totalInvoicedNet, 450);
});

test('non produce utile non fatturato negativo', () => {
  const result = calculateFinancialSummary({
    totalIncome: 500,
    lessonsInvoicedGross: 700,
    paitoneCompensation: 0,
    taxRate: 0,
  });

  assert.equal(result.totalNotInvoicedIncome, 0);
  assert.equal(result.totalInvoice, 700);
});

test('limita la partita IVA tra 0% e 100%', () => {
  const overHundred = calculateFinancialSummary({
    totalIncome: 1000,
    lessonsInvoicedGross: 1000,
    paitoneCompensation: 500,
    taxRate: 130,
  });
  assert.equal(overHundred.totalInvoicedNet, 0);
  assert.equal(overHundred.paitoneNetCompensation, 0);

  const negative = calculateFinancialSummary({
    totalIncome: 1000,
    lessonsInvoicedGross: 1000,
    paitoneCompensation: 500,
    taxRate: -10,
  });
  assert.equal(negative.totalInvoicedNet, 1500);
  assert.equal(negative.paitoneNetCompensation, 500);
});
