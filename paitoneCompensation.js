const DEFAULT_PAITONE_COMPENSATION = {
  rentCost: 3000,
  collaboratorCost: 1120,
  firstBracketLimit: 3000,
  secondBracketLimit: 6000,
  firstBracketRate: 8,
  secondBracketRate: 12,
  thirdBracketRate: 15,
};

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

const toSafePositiveNumber = (value, fallback = 0) => Math.max(0, toSafeNumber(value, fallback));

export const sanitizePaitoneCompensationSettings = (rawConfig) => {
  const firstBracketLimit = toSafePositiveNumber(
    rawConfig?.firstBracketLimit,
    DEFAULT_PAITONE_COMPENSATION.firstBracketLimit
  );
  const secondBracketLimit = Math.max(
    firstBracketLimit,
    toSafePositiveNumber(rawConfig?.secondBracketLimit, DEFAULT_PAITONE_COMPENSATION.secondBracketLimit)
  );

  return {
    rentCost: toSafePositiveNumber(rawConfig?.rentCost, DEFAULT_PAITONE_COMPENSATION.rentCost),
    collaboratorCost: toSafePositiveNumber(rawConfig?.collaboratorCost, DEFAULT_PAITONE_COMPENSATION.collaboratorCost),
    firstBracketLimit,
    secondBracketLimit,
    firstBracketRate: toSafePositiveNumber(rawConfig?.firstBracketRate, DEFAULT_PAITONE_COMPENSATION.firstBracketRate),
    secondBracketRate: toSafePositiveNumber(rawConfig?.secondBracketRate, DEFAULT_PAITONE_COMPENSATION.secondBracketRate),
    thirdBracketRate: toSafePositiveNumber(rawConfig?.thirdBracketRate, DEFAULT_PAITONE_COMPENSATION.thirdBracketRate),
  };
};

export const calculateProgressiveCompensation = (taxableAmount, rawConfig) => {
  const config = sanitizePaitoneCompensationSettings(rawConfig);
  const safeTaxableAmount = toSafePositiveNumber(taxableAmount, 0);

  const firstPortion = Math.min(safeTaxableAmount, config.firstBracketLimit);
  const secondRange = Math.max(config.secondBracketLimit - config.firstBracketLimit, 0);
  const secondPortion = Math.min(Math.max(safeTaxableAmount - config.firstBracketLimit, 0), secondRange);
  const thirdPortion = Math.max(safeTaxableAmount - config.secondBracketLimit, 0);

  return (
    firstPortion * (config.firstBracketRate / 100) +
    secondPortion * (config.secondBracketRate / 100) +
    thirdPortion * (config.thirdBracketRate / 100)
  );
};

export const calculatePaitoneCompensation = (revenue, rawConfig) => {
  const config = sanitizePaitoneCompensationSettings(rawConfig);
  const safeRevenue = toSafePositiveNumber(revenue, 0);
  const deductibleCosts = config.rentCost + config.collaboratorCost;
  const taxableRevenue = Math.max(0, safeRevenue - deductibleCosts);
  const compensation = calculateProgressiveCompensation(taxableRevenue, config);

  return {
    revenue: safeRevenue,
    deductibleCosts,
    taxableRevenue,
    compensation,
    config,
  };
};

export { DEFAULT_PAITONE_COMPENSATION };
