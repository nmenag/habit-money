export const COLORS = [
  '#f44336',
  '#e91e63',
  '#9c27b0',
  '#673ab7',
  '#3f51b5',
  '#2196f3',
  '#009688',
  '#4caf50',
  '#ffc107',
  '#ff9800',
  '#795548',
  '#607d8b',
];

export const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$', tKey: 'currUSD' },
  { code: 'EUR', name: 'Euro', symbol: '€', tKey: 'currEUR' },
  { code: 'GBP', name: 'British Pound', symbol: '£', tKey: 'currGBP' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$', tKey: 'currMXN' },
  { code: 'COP', name: 'Colombian Peso', symbol: '$', tKey: 'currCOP' },
  { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/', tKey: 'currPEN' },
  { code: 'CLP', name: 'Chilean Peso', symbol: '$', tKey: 'currCLP' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: '$', tKey: 'currCAD' },
  { code: 'AUD', name: 'Australian Dollar', symbol: '$', tKey: 'currAUD' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: '$', tKey: 'currNZD' },
];

export const CATEGORY_ICONS = [
  'cash',
  'wallet',
  'bank',
  'credit-card',
  'piggy-bank',
  'chart-line',
  'receipt',
  'cart',
  'tshirt-crew',
  'food',
  'gas-station',
  'home',
  'car',
  'airplane',
  'medical-bag',
  'school',
  'briefcase',
  'cellphone',
  'gift',
  'heart',
];

export const GOAL_ICONS = [
  'trophy',
  'home',
  'car',
  'airplane',
  'school',
  'cart',
  'gift',
  'star',
  'heart',
  'briefcase',
  'laptop',
  'wallet',
  'cash',
  'trending-up',
  'bicycle',
  'camera',
  'game-controller',
  'watch',
  'medkit',
  'umbrella',
];

export const getValidCategoryIcon = (
  icon: string | null | undefined,
): string => {
  if (!icon || !CATEGORY_ICONS.includes(icon as any)) {
    return 'tag';
  }
  return icon;
};

export const getValidGoalIcon = (icon: string | null | undefined): string => {
  if (!icon || !GOAL_ICONS.includes(icon as any)) {
    return 'trophy';
  }
  return icon;
};
