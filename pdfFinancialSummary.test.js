import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { jsPDF } from 'jspdf';
import autoTableModule from 'jspdf-autotable';
import { buildPdfFinancialSummary } from './pdfFinancialSummary.js';
import { DEFAULT_PAITONE_COMPENSATION } from './paitoneCompensation.js';

const options = {
  totalIncome: 1500,
  lessonsInvoicedGross: 1000,
  paitoneRevenue: 12120,
  settings: { taxRate: 25, paitoneCompensation: DEFAULT_PAITONE_COMPENSATION },
  includeNetDetails: true,
};
const value = (rows, label) => rows.find(([name]) => name === label)?.[1];

test('mostra totale lezioni, sezione Paitone, compenso e totale lordo seguiti dal netto', () => {
  const rows = buildPdfFinancialSummary(options);
  assert.deepEqual(rows.slice(0, 2), [
    ['Totale lezioni', '€ 1500.00'],
    ['Fatturato Paitone', 'Importo lordo'],
  ]);
  assert.equal(value(rows, 'Totale fatturato Paitone'), '€ 12120.00');
  assert.equal(value(rows, 'Affitto Paitone'), '- € 3000.00');
  assert.equal(value(rows, 'Collaboratore Paitone'), '- € 1120.00');
  assert.equal(value(rows, 'Detrazioni Paitone (affitto + collaboratore)'), '- € 4120.00');
  assert.equal(value(rows, 'Base Paitone per scaglioni (dopo detrazioni)'), '€ 8000.00');
  assert.deepEqual(rows.slice(8, 11), [
    ['Da € 0 a € 3000.00: 8% su € 3000.00', '€ 240.00'],
    ['Da € 3000.00 a € 6000.00: 12% su € 3000.00', '€ 360.00'],
    ['Oltre € 6000.00: 15% su € 2000.00', '€ 300.00'],
  ]);
  assert.deepEqual(rows.slice(11, 14), [
    ['Compenso Paitone (lordo)', '€ 900.00'],
    ['Totale lordo lezioni + compenso Paitone', '€ 2400.00'],
    ['Totale netto', '€ 1925.00'],
  ]);
  assert.equal(value(rows, 'Tasse / Ritenuta applicata (25%)'), '- € 475.00');
});

test('togliere e riattivare il flag netto non modifica né nasconde alcuna riga lorda', () => {
  const grossRows = buildPdfFinancialSummary({ ...options, includeNetDetails: false });
  const netRows = buildPdfFinancialSummary(options);
  assert.deepEqual(netRows.slice(0, grossRows.length), grossRows);
  assert.equal(grossRows.some(([label]) => /netto|tasse|ritenuta/i.test(label)), false);
  assert.equal(value(grossRows, 'Totale lordo lezioni + compenso Paitone'), '€ 2400.00');
  assert.equal(value(netRows, 'Totale netto'), '€ 1925.00');
  assert.deepEqual(buildPdfFinancialSummary({ ...options, includeNetDetails: false }), grossRows);
});

test('usa limiti e percentuali personalizzati, anche con scaglioni non raggiunti', () => {
  const rows = buildPdfFinancialSummary({
    ...options,
    paitoneRevenue: 2500,
    settings: {
      taxRate: 0,
      paitoneCompensation: {
        rentCost: 100,
        collaboratorCost: 200,
        firstBracketLimit: 1000,
        secondBracketLimit: 3000,
        firstBracketRate: 10,
        secondBracketRate: 20,
        thirdBracketRate: 30,
      },
    },
  });
  assert.deepEqual(rows.slice(8, 11), [
    ['Da € 0 a € 1000.00: 10% su € 1000.00', '€ 100.00'],
    ['Da € 1000.00 a € 3000.00: 20% su € 1200.00', '€ 240.00'],
    ['Oltre € 3000.00: 30% su € 0.00', '€ 0.00'],
  ]);
  assert.equal(value(rows, 'Compenso Paitone (lordo)'), '€ 340.00');
  assert.equal(value(rows, 'Totale netto'), '€ 1840.00');
});

test('mantiene il riepilogo Paitone anche senza lezioni', () => {
  const rows = buildPdfFinancialSummary({
    ...options, totalIncome: 0, lessonsInvoicedGross: 0, includeNetDetails: false,
  });
  assert.equal(value(rows, 'Totale lezioni'), '€ 0.00');
  assert.equal(value(rows, 'Totale lordo lezioni + compenso Paitone'), '€ 900.00');
});

test('fatturato assente o sotto le detrazioni non genera compensi negativi', () => {
  for (const paitoneRevenue of [0, 3000]) {
    const rows = buildPdfFinancialSummary({ ...options, paitoneRevenue });
    assert.equal(value(rows, 'Base Paitone per scaglioni (dopo detrazioni)'), '€ 0.00');
    assert.equal(value(rows, 'Compenso Paitone (lordo)'), '€ 0.00');
    assert.equal(value(rows, 'Totale lordo lezioni + compenso Paitone'), '€ 1500.00');
  }
});

test('il PDF genera le lezioni prima del riepilogo finanziario e degli altri dettagli', () => {
  const source = readFileSync(new URL('./components/ExportForm.tsx', import.meta.url), 'utf8');
  const summaryPosition = source.indexOf("head: [['Riepilogo finanziario'");
  const lessonsPosition = source.indexOf("head: [['Data'");
  const emptyCheckPosition = source.indexOf('if (filteredLessons.length > 0)');
  assert.ok(lessonsPosition > 0 && lessonsPosition < summaryPosition);
  assert.ok(summaryPosition < emptyCheckPosition);
});

test('preserva i totali fatturati e non fatturati senza tassare questi ultimi', () => {
  for (const lessonsInvoicedGross of [0, 1500]) {
    const rows = buildPdfFinancialSummary({ ...options, lessonsInvoicedGross });
    assert.equal(value(rows, 'Tasse / Ritenuta applicata (25%)'), `- € ${((lessonsInvoicedGross + 900) * 0.25).toFixed(2)}`);
    assert.equal(value(rows, 'Totale lordo lezioni + compenso Paitone'), '€ 2400.00');
    assert.equal(value(rows, 'Totale netto'), `€ ${((lessonsInvoicedGross + 900) * 0.75 + 1500 - lessonsInvoicedGross).toFixed(2)}`);
  }
});

test('il riepilogo si renderizza nel PDF dopo una tabella lezioni multipagina senza tagliare righe', () => {
  const autoTable = autoTableModule.default;
  for (const lessonCount of [0, 1, 26, 80]) {
    for (const includeNetDetails of [false, true]) {
      const doc = new jsPDF();
      const lessons = Array.from({ length: lessonCount }, (_, i) => ({
        price: 60, cost: 10, invoiced: i % 2 === 0,
      }));
      const totalIncome = lessons.reduce((sum, lesson) => sum + lesson.price - lesson.cost, 0);
      const lessonsInvoicedGross = lessons.filter(lesson => lesson.invoiced)
        .reduce((sum, lesson) => sum + lesson.price - lesson.cost, 0);
      const rows = buildPdfFinancialSummary({
        ...options, totalIncome, lessonsInvoicedGross, includeNetDetails,
      });
      assert.equal(value(rows, 'Totale lezioni'), `€ ${totalIncome.toFixed(2)}`);
      assert.equal(value(rows, 'Totale lordo lezioni + compenso Paitone'), `€ ${(totalIncome + 900).toFixed(2)}`);
      if (includeNetDetails) {
        assert.equal(value(rows, 'Totale netto'), `€ ${(totalIncome + 900 - (lessonsInvoicedGross + 900) * 0.25).toFixed(2)}`);
      }
      autoTable(doc, {
        startY: 40,
        head: [['Data', 'Sport', 'Tipo Lezione', 'Sede', 'Stato', 'Utile']],
        body: lessons.map(lesson => [
          '05/10/2026', 'Tennis', 'Lezione', 'Paitone',
          lesson.invoiced ? 'Fatturata' : 'Non Fatt.', `€ ${(lesson.price - lesson.cost).toFixed(2)}`,
        ]),
      });
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 10,
        head: [['Riepilogo finanziario', 'Importo']],
        body: rows,
        columnStyles: { 0: { cellWidth: 140 }, 1: { halign: 'right' } },
        rowPageBreak: 'avoid',
        didDrawCell: ({ cell }) => {
          assert.ok(cell.y + cell.height < doc.internal.pageSize.height);
        },
      });
      const pdf = doc.output();
      assert.ok(pdf.startsWith('%PDF-'));
      assert.ok(pdf.indexOf('(Data)') < pdf.indexOf('Totale lezioni'));
      assert.ok(pdf.indexOf('Totale lezioni') < pdf.indexOf('Totale fatturato Paitone'));
      assert.ok(pdf.includes('Compenso Paitone'));
      assert.ok(pdf.includes((totalIncome + 900).toFixed(2)));
      assert.equal(pdf.includes('Totale netto'), includeNetDetails);
      if (lessonCount > 1) assert.ok(pdf.includes('Fatturata') && pdf.includes('Non Fatt.'));
      if (lessonCount === 80) assert.ok(doc.internal.getNumberOfPages() > 1);
    }
  }
});
