const toSafeNumber = (value, fallback = 0) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().replace(',', '.');
    if (!normalized) return fallback;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
};

export const calculateFinancialSummary = ({
  totalIncome,
  lessonsInvoicedGross,
  paitoneCompensation,
  taxRate,
  totalExpenses = 0,
  totalIncomeIncludesPaitoneCompensation = false,
}) => {
  const safeTotalIncome = toSafeNumber(totalIncome, 0);
  const safeLessonsInvoicedGross = toSafeNumber(lessonsInvoicedGross, 0);
  const safePaitoneCompensation = toSafeNumber(paitoneCompensation, 0);
  const safeTaxRate = Math.min(100, Math.max(0, toSafeNumber(taxRate, 0)));
  const safeTotalExpenses = toSafeNumber(totalExpenses, 0);
  const safeTotalIncomeIncludesPaitoneCompensation = Boolean(totalIncomeIncludesPaitoneCompensation);

  const totalInvoicedGross = safeLessonsInvoicedGross + safePaitoneCompensation;
  const totalInvoicedNet = totalInvoicedGross * (1 - safeTaxRate / 100);
  const normalizedTotalIncome = safeTotalIncomeIncludesPaitoneCompensation
    ? Math.max(0, safeTotalIncome - safePaitoneCompensation)
    : safeTotalIncome;
  const totalNotInvoicedIncome = Math.max(0, normalizedTotalIncome - safeLessonsInvoicedGross);
  const totalInvoice = totalInvoicedNet + totalNotInvoicedIncome;
  const netProfit = totalInvoice - safeTotalExpenses;
  const paitoneNetCompensation = safePaitoneCompensation * (1 - safeTaxRate / 100);

  return {
    totalInvoicedGross,
    totalInvoicedNet,
    totalNotInvoicedIncome,
    totalInvoice,
    netProfit,
    paitoneNetCompensation,
  };
};
