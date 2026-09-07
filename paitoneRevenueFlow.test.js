import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPaitoneRevenueDisplayLesson,
  getPaitoneRevenueEntryId,
  isPaitoneRevenueEntryId,
  mergeLessonsWithPaitoneRevenue,
  PAITONE_REVENUE_LESSON_TYPE_ID,
  PAITONE_REVENUE_LESSON_TYPE_NAME,
} from './paitoneRevenueFlow.js';

test('buildPaitoneRevenueDisplayLesson crea la voce elenco con importo da fatturare calcolato', () => {
  const lesson = buildPaitoneRevenueDisplayLesson(
    '2026-09',
    { id: '2026-09', monthKey: '2026-09', revenue: 10120 },
    { deductibleCosts: 4120, taxableRevenue: 6000, compensation: 600 }
  );

  assert.equal(lesson?.id, getPaitoneRevenueEntryId('2026-09'));
  assert.equal(lesson?.lessonTypeId, PAITONE_REVENUE_LESSON_TYPE_ID);
  assert.equal(lesson?.customLessonTypeName, PAITONE_REVENUE_LESSON_TYPE_NAME);
  assert.equal(lesson?.price, 600);
  assert.equal(lesson?.paitoneRevenue, 10120);
  assert.equal(lesson?.paitoneDeductibleCosts, 4120);
  assert.equal(lesson?.paitoneTaxableRevenue, 6000);
});

test('mergeLessonsWithPaitoneRevenue non aggiunge nulla senza fatturato mese', () => {
  const lessons = [{ id: 'l1' }];
  const result = mergeLessonsWithPaitoneRevenue(lessons, '2026-09', null, { compensation: 0 });
  assert.equal(result, lessons);
});

test('mergeLessonsWithPaitoneRevenue aggiunge una sola voce fatturato al resto delle lezioni', () => {
  const lessons = [{ id: 'l1' }, { id: 'l2' }];
  const result = mergeLessonsWithPaitoneRevenue(
    lessons,
    '2026-09',
    { id: '2026-09', monthKey: '2026-09', revenue: 8000 },
    { deductibleCosts: 4120, taxableRevenue: 3880, compensation: 345.6 }
  );

  assert.equal(result.length, 3);
  assert.equal(result[2].id, getPaitoneRevenueEntryId('2026-09'));
  assert.equal(result[2].price, 345.6);
});

test('mergeLessonsWithPaitoneRevenue rimpiazza eventuale voce fatturato già presente nel mese', () => {
  const monthKey = '2026-09';
  const existingPaitoneId = getPaitoneRevenueEntryId(monthKey);
  const lessons = [{ id: 'l1' }, { id: existingPaitoneId, price: 1 }];
  const result = mergeLessonsWithPaitoneRevenue(
    lessons,
    monthKey,
    { id: monthKey, monthKey, revenue: 9000 },
    { deductibleCosts: 4120, taxableRevenue: 4880, compensation: 465.6 }
  );

  assert.equal(result.length, 2);
  assert.equal(result.filter((item) => item.id === existingPaitoneId).length, 1);
  assert.equal(result[1].price, 465.6);
});

test('isPaitoneRevenueEntryId riconosce solo la voce del mese corrente', () => {
  assert.equal(isPaitoneRevenueEntryId('paitone-revenue-2026-09', '2026-09'), true);
  assert.equal(isPaitoneRevenueEntryId('paitone-revenue-2026-08', '2026-09'), false);
});
