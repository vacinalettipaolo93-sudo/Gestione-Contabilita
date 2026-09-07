export const PAITONE_REVENUE_ENTRY_ID_PREFIX = 'paitone-revenue-';
export const PAITONE_REVENUE_LESSON_TYPE_ID = 'paitone-revenue';
export const PAITONE_REVENUE_LESSON_TYPE_NAME = 'Fatturato Paitone Arena';

export const getPaitoneRevenueEntryId = (monthKey) => `${PAITONE_REVENUE_ENTRY_ID_PREFIX}${monthKey}`;

export const isPaitoneRevenueEntryId = (id, monthKey) => id === getPaitoneRevenueEntryId(monthKey);

export const buildPaitoneRevenueDisplayLesson = (monthKey, revenueEntry, summary) => {
  if (!revenueEntry) return null;

  return {
    id: getPaitoneRevenueEntryId(monthKey),
    date: `${monthKey}-01`,
    sportId: '',
    lessonTypeId: PAITONE_REVENUE_LESSON_TYPE_ID,
    locationId: '',
    price: summary?.compensation ?? 0,
    cost: 0,
    invoiced: true,
    customLessonTypeName: PAITONE_REVENUE_LESSON_TYPE_NAME,
    customPrice: revenueEntry.revenue ?? 0,
    paitoneRevenue: revenueEntry.revenue ?? 0,
    paitoneDeductibleCosts: summary?.deductibleCosts ?? 0,
    paitoneTaxableRevenue: summary?.taxableRevenue ?? 0,
  };
};

export const mergeLessonsWithPaitoneRevenue = (lessons, monthKey, revenueEntry, summary) => {
  const paitoneLesson = buildPaitoneRevenueDisplayLesson(monthKey, revenueEntry, summary);
  if (!paitoneLesson) return lessons;
  const paitoneEntryId = getPaitoneRevenueEntryId(monthKey);
  const lessonsWithoutCurrentPaitone = lessons.filter((lesson) => lesson?.id !== paitoneEntryId);
  return [...lessonsWithoutCurrentPaitone, paitoneLesson];
};
