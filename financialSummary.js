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
}) => {
  const safeTotalIncome = toSafeNumber(totalIncome, 0);
  const safeLessonsInvoicedGross = toSafeNumber(lessonsInvoicedGross, 0);
  const safePaitoneCompensation = toSafeNumber(paitoneCompensation, 0);
  const safeTaxRate = toSafeNumber(taxRate, 0);
  const safeTotalExpenses = toSafeNumber(totalExpenses, 0);

  const totalInvoicedGross = safeLessonsInvoicedGross + safePaitoneCompensation;
  const totalInvoicedNet = totalInvoicedGross * (1 - safeTaxRate / 100);
  const totalNotInvoicedIncome = safeTotalIncome - safeLessonsInvoicedGross;
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
