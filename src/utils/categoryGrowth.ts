import { Language, translations } from '../i18n/translations';
import { formatCurrency } from './formatters';

export interface CalculateCategoryGrowthParams {
  currentSpending: number;
  previousMonthTotal: number;
  currencyCode?: string;
  language?: Language;
  referenceDate?: Date;
}

export type CategoryGrowthStatus = 'new' | 'no_spend' | 'occasional' | 'normal';

export interface CategoryGrowthResult {
  status: CategoryGrowthStatus;
  expectedBase: number;
  delta: number;
  rawGrowthPercentage: number | null;
  displayGrowthPercentage: number | null;
  growthPercentageBadge: string | null;
  statusLabel: string | null;
  formattedDelta: string;
  formattedDisplay: string;
}

export const getGrowthMinThreshold = (currencyCode: string = 'COP'): number => {
  const code = currencyCode.toUpperCase();
  switch (code) {
    case 'COP':
      return 20000;
    case 'CLP':
      return 5000;
    case 'PYG':
      return 35000;
    case 'ARS':
    case 'MXN':
      return 100;
    case 'PEN':
      return 20;
    case 'BRL':
      return 25;
    case 'USD':
    case 'EUR':
    case 'GBP':
    case 'CAD':
    case 'AUD':
    case 'NZD':
    case 'CHF':
    case 'SGD':
      return 5;
    default:
      return code === 'COP' ? 20000 : 5;
  }
};

export const calculateCategoryGrowth = (
  params: CalculateCategoryGrowthParams,
): CategoryGrowthResult => {
  const {
    currentSpending,
    previousMonthTotal,
    currencyCode = 'COP',
    language = 'en',
    referenceDate,
  } = params;

  const now = referenceDate || new Date();
  const currentDayOfMonth = now.getDate();
  const daysInPreviousMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    0,
  ).getDate();

  const expectedBase =
    (previousMonthTotal / daysInPreviousMonth) * currentDayOfMonth;
  const delta = currentSpending - previousMonthTotal;

  const absDelta = Math.abs(delta);
  const formattedAbsDelta = formatCurrency(absDelta, currencyCode, language);
  const formattedDelta =
    delta > 0
      ? `↑${formattedAbsDelta}`
      : delta < 0
        ? `↓${formattedAbsDelta}`
        : formatCurrency(0, currencyCode, language);

  const t = translations[language] || translations.en;

  if (previousMonthTotal === 0 && currentSpending > 0) {
    const statusLabel = t.growthLabelNew;
    return {
      status: 'new',
      expectedBase,
      delta,
      rawGrowthPercentage: null,
      displayGrowthPercentage: null,
      growthPercentageBadge: null,
      statusLabel,
      formattedDelta,
      formattedDisplay: `${formattedDelta} (${statusLabel})`,
    };
  }

  if (currentSpending === 0 && previousMonthTotal > 0) {
    const statusLabel = t.growthLabelNoSpend;
    return {
      status: 'no_spend',
      expectedBase,
      delta,
      rawGrowthPercentage: -100,
      displayGrowthPercentage: -100,
      growthPercentageBadge: '↓100%',
      statusLabel,
      formattedDelta,
      formattedDisplay: `${formattedDelta} (${statusLabel})`,
    };
  }

  const minThreshold = getGrowthMinThreshold(currencyCode);
  if (previousMonthTotal < minThreshold && currentSpending < minThreshold) {
    const statusLabel = t.growthLabelOccasional;
    return {
      status: 'occasional',
      expectedBase,
      delta,
      rawGrowthPercentage: null,
      displayGrowthPercentage: null,
      growthPercentageBadge: null,
      statusLabel,
      formattedDelta,
      formattedDisplay: `${formattedDelta} (${statusLabel})`,
    };
  }

  const rawGrowthPercentage =
    previousMonthTotal > 0
      ? ((currentSpending - previousMonthTotal) / previousMonthTotal) * 100
      : 0;

  let displayGrowthPercentage: number;
  let growthPercentageBadge: string;

  if (rawGrowthPercentage > 200) {
    displayGrowthPercentage = 200;
    growthPercentageBadge = '↑200%+';
  } else if (rawGrowthPercentage > 0) {
    displayGrowthPercentage = rawGrowthPercentage;
    growthPercentageBadge = `↑${Math.round(rawGrowthPercentage)}%`;
  } else if (rawGrowthPercentage < 0) {
    displayGrowthPercentage = rawGrowthPercentage;
    growthPercentageBadge = `↓${Math.abs(Math.round(rawGrowthPercentage))}%`;
  } else {
    displayGrowthPercentage = 0;
    growthPercentageBadge = '0%';
  }

  return {
    status: 'normal',
    expectedBase,
    delta,
    rawGrowthPercentage,
    displayGrowthPercentage,
    growthPercentageBadge,
    statusLabel: null,
    formattedDelta,
    formattedDisplay: `${formattedDelta} (${growthPercentageBadge})`,
  };
};
