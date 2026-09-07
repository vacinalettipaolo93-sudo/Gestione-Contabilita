import { parsePaitoneRevenueInput } from './paitoneRevenueValidation.js';

export const submitPaitoneRevenue = async (rawInput, onSavePaitoneRevenue) => {
  const parsed = parsePaitoneRevenueInput(rawInput);
  if (parsed.error || parsed.value === null) {
    return { success: false, error: parsed.error || 'Inserisci un importo valido.' };
  }

  await onSavePaitoneRevenue(parsed.value);
  return { success: true, error: '' };
};
