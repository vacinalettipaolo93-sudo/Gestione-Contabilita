import { calculatePaitoneCompensation } from './paitoneCompensation.js';
import { calculateFinancialSummary } from './financialSummary.js';

const formatEuro = (amount) => `€ ${amount.toFixed(2)}`;

/**
 * @param {{
 *   totalIncome: number,
 *   lessonsInvoicedGross: number,
 *   paitoneRevenue: number,
 *   settings: import('./types').Settings,
 *   includeNetDetails: boolean
 * }} options
 * @returns {[string, string][]}
 */
export const buildPdfFinancialSummary = ({
  totalIncome,
  lessonsInvoicedGross,
  paitoneRevenue,
  settings,
  includeNetDetails,
}) => {
  const paitone = calculatePaitoneCompensation(paitoneRevenue, settings.paitoneCompensation);
  const financial = calculateFinancialSummary({
    totalIncome,
    lessonsInvoicedGross,
    paitoneCompensation: paitone.compensation,
    taxRate: settings.taxRate || 0,
    totalIncomeIncludesPaitoneCompensation: false,
  });
  const { config, taxableRevenue } = paitone;
  const firstPortion = Math.min(taxableRevenue, config.firstBracketLimit);
  const secondPortion = Math.min(
    Math.max(0, taxableRevenue - config.firstBracketLimit),
    config.secondBracketLimit - config.firstBracketLimit
  );
  const thirdPortion = Math.max(0, taxableRevenue - config.secondBracketLimit);

  /** @type {[string, string][]} */
  const rows = [
    ['Totale fatturato Paitone', formatEuro(paitone.revenue)],
    ['Detrazioni Paitone (affitto + collaboratore)', `- ${formatEuro(paitone.deductibleCosts)}`],
    ['Base Paitone per scaglioni (dopo detrazioni)', formatEuro(taxableRevenue)],
    ['Percentuali scaglioni', 'Compenso lordo'],
    [`Da € 0 a ${formatEuro(config.firstBracketLimit)}: ${config.firstBracketRate}% su ${formatEuro(firstPortion)}`, formatEuro(firstPortion * config.firstBracketRate / 100)],
    [`Da ${formatEuro(config.firstBracketLimit)} a ${formatEuro(config.secondBracketLimit)}: ${config.secondBracketRate}% su ${formatEuro(secondPortion)}`, formatEuro(secondPortion * config.secondBracketRate / 100)],
    [`Oltre ${formatEuro(config.secondBracketLimit)}: ${config.thirdBracketRate}% su ${formatEuro(thirdPortion)}`, formatEuro(thirdPortion * config.thirdBracketRate / 100)],
    ['Compenso Paitone (lordo)', formatEuro(paitone.compensation)],
    ['Totale lordo lezioni/attività (escluso compenso Paitone)', formatEuro(totalIncome)],
    ['Totale lordo (lezioni/attività + compenso Paitone)', formatEuro(totalIncome + paitone.compensation)],
    ['Fatturato lordo (incluso compenso Paitone)', formatEuro(financial.totalInvoicedGross)],
    ['Utile non fatturato', formatEuro(financial.totalNotInvoicedIncome)],
  ];

  if (includeNetDetails) {
    rows.push(
      [`Tasse / Ritenuta applicata (${settings.taxRate || 0}%)`, `- ${formatEuro(financial.totalInvoicedGross - financial.totalInvoicedNet)}`],
      ['Fatturato netto', formatEuro(financial.totalInvoicedNet)],
      ['Compenso Paitone (netto dopo partita IVA)', formatEuro(financial.paitoneNetCompensation)],
      ['Totale netto complessivo', formatEuro(financial.totalInvoice)]
    );
  }

  return rows;
};
