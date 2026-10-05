import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLocationOrder, moveLocation, orderLocationEntries } from './locationOrder.js';
import { calculateFinancialSummary } from './financialSummary.js';

const locations = [
  { id: 'gavardo', name: 'Gavardo' },
  { id: 'paitone', name: 'Paitone' },
  { id: 'other', name: 'Altra sede' },
];

test('migra le sedi esistenti mantenendo ordine e identità senza mutare i dati', () => {
  const snapshot = structuredClone(locations);
  const migrated = normalizeLocationOrder(locations);
  assert.deepEqual(migrated.map(loc => loc.id), locations.map(loc => loc.id));
  assert.deepEqual(migrated.map(loc => loc.order), [0, 1, 2]);
  assert.deepEqual(locations, snapshot);
  assert.deepEqual(normalizeLocationOrder(migrated), migrated);
  assert.deepEqual(normalizeLocationOrder(), []);
});

test('sposta su e giù e conserva l’ordine al salvataggio e alla rilettura', () => {
  const moved = moveLocation(locations, 'paitone', 0);
  assert.deepEqual(moved.map(loc => loc.id), ['paitone', 'gavardo', 'other']);
  assert.deepEqual(moved.map(loc => loc.order), [0, 1, 2]);
  const restored = normalizeLocationOrder(JSON.parse(JSON.stringify(moved)).reverse());
  assert.deepEqual(restored, moved);
  assert.deepEqual(moveLocation(restored, 'paitone', 1), normalizeLocationOrder(locations));
  assert.deepEqual(moveLocation(locations, 'gavardo', 2).map(loc => loc.id), ['paitone', 'other', 'gavardo']);
});

test('ignora spostamenti invalidi e gestisce elenchi vuoti o con una sola sede', () => {
  for (const target of [-1, 3, NaN, 0.5]) {
    assert.deepEqual(moveLocation(locations, 'gavardo', target), normalizeLocationOrder(locations));
  }
  assert.deepEqual(moveLocation(locations, 'missing', 0), normalizeLocationOrder(locations));
  assert.deepEqual(moveLocation([], 'missing', 0), []);
  assert.deepEqual(moveLocation([locations[0]], 'gavardo', 0), [{ ...locations[0], order: 0 }]);
});

test('normalizza ordini mancanti, duplicati o invalidi in modo deterministico', () => {
  const mixed = locations.map((loc, index) => ({ ...loc, order: [2, -1, 2][index] }));
  assert.deepEqual(normalizeLocationOrder(mixed).map(loc => loc.id), ['paitone', 'gavardo', 'other']);
  for (const order of [NaN, Infinity, '0', 0.5]) {
    assert.equal(normalizeLocationOrder([{ ...locations[0], order }])[0].order, 0);
  }
});

test('riordino, modifica, aggiunta ed eliminazione non disallineano prezzi e costi', () => {
  const sport = {
    id: 'tennis', locations: structuredClone(locations),
    lessonTypes: [{ id: 'single', name: 'Singola' }, { id: 'double', name: 'Doppia' }],
    prices: { gavardo: { single: 30, double: 50 }, paitone: { single: 45, double: 65 }, other: { single: 60 } },
    costs: { gavardo: { single: 10, double: 20 }, paitone: { single: 15, double: 25 }, other: { single: 30 } },
  };
  const otherSport = { id: 'padel', locations: [{ id: 'padel', name: 'Padel', order: 0 }], costs: { padel: { double: 22 } } };
  const snapshot = structuredClone({ sport, otherSport });
  const lessons = locations.map(loc => ({
    sportId: sport.id, locationId: loc.id, lessonTypeId: 'single',
    price: sport.prices[loc.id].single, cost: sport.costs[loc.id].single, invoiced: true,
  }));
  const savedLessons = structuredClone(lessons);
  const financials = () => calculateFinancialSummary({
    totalIncome: lessons.reduce((sum, lesson) => sum + lesson.price - lesson.cost, 0),
    lessonsInvoicedGross: lessons.reduce((sum, lesson) => sum + lesson.price - lesson.cost, 0),
    paitoneCompensation: 900, taxRate: 25, totalExpenses: 100,
  });
  const before = financials();
  sport.locations = moveLocation(sport.locations, 'paitone', 0);
  assert.equal(sport.prices[sport.locations[0].id].single, 45);
  assert.equal(sport.costs[sport.locations[0].id].single, 15);
  assert.equal(sport.costs[sport.locations[1].id].double, 20);
  sport.locations[0].name = 'Paitone Arena';
  sport.locations.push({ id: 'new', name: 'Nuova sede', order: sport.locations.length });
  sport.locations = moveLocation(sport.locations, 'new', 1);
  const removedId = sport.locations[1].id;
  sport.locations.splice(1, 1);
  delete sport.prices[removedId];
  delete sport.costs[removedId];
  sport.locations = normalizeLocationOrder(sport.locations);
  assert.deepEqual(sport.locations.map(loc => loc.id), ['paitone', 'gavardo', 'other']);
  assert.deepEqual(sport.locations.map(loc => loc.order), [0, 1, 2]);
  assert.deepEqual(sport.prices, snapshot.sport.prices);
  assert.deepEqual(sport.costs, snapshot.sport.costs);
  assert.deepEqual(sport.lessonTypes, snapshot.sport.lessonTypes);
  assert.deepEqual(otherSport, snapshot.otherSport);
  assert.deepEqual(lessons, savedLessons);
  assert.deepEqual(financials(), before);
});

test('riepiloghi e PDF seguono l’ordine configurato, non quantità, utile o nome', () => {
  const names = ['Paitone', 'Gavardo', 'Altra sede'];
  assert.deepEqual(orderLocationEntries({ Gavardo: 10, Paitone: 2 }, names), [['Paitone', 2], ['Gavardo', 10]]);
  assert.deepEqual(orderLocationEntries({ Gavardo: 300, Paitone: 30 }, names), [['Paitone', 30], ['Gavardo', 300]]);
  assert.deepEqual(orderLocationEntries({ 1: 10, 2: 20 }, ['2', '1']), [['2', 20], ['1', 10]]);
  assert.deepEqual(orderLocationEntries({ Gavardo: 10, Paitone: 2, Unknown: 1 }, ['Paitone', 'Paitone', 'Gavardo']),
    [['Paitone', 2], ['Gavardo', 10], ['Unknown', 1]]);
});
