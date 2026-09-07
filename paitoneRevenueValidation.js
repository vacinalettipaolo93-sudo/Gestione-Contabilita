export const parsePaitoneRevenueInput = (rawValue) => {
  const normalized = String(rawValue ?? '').trim().replace(',', '.');
  if (!normalized) {
    return { value: null, error: 'Inserisci un importo di fatturato.' };
  }

  if (normalized.startsWith('-')) {
    return { value: null, error: 'Il fatturato non può essere negativo.' };
  }

  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    return { value: null, error: 'Inserisci un importo valido.' };
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    return { value: null, error: 'Inserisci un importo valido.' };
  }

  return { value: parsed, error: '' };
};
