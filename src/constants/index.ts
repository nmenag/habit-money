export const COLORS = [
  '#f44336', // Red
  '#e91e63', // Pink
  '#9c27b0', // Purple
  '#673ab7', // Deep Purple
  '#3f51b5', // Indigo
  '#2196f3', // Blue
  '#03a9f4', // Light Blue
  '#00bcd4', // Cyan
  '#009688', // Teal
  '#4caf50', // Green
  '#8bc34a', // Light Green
  '#cddc39', // Lime
  '#ffeb3b', // Yellow
  '#ffc107', // Amber
  '#ff9800', // Orange
  '#ff5722', // Deep Orange
  '#795548', // Brown
  '#9e9e9e', // Grey
  '#607d8b', // Blue Grey
  '#1a1a1a', // Black
  '#d32f2f', // Dark Red
  '#c2185b', // Dark Pink
  '#7b1fa2', // Dark Purple
  '#512da8', // Dark Deep Purple
  '#303f9f', // Dark Indigo
  '#1976d2', // Dark Blue
  '#0288d1', // Dark Light Blue
  '#0097a7', // Dark Cyan
];

export const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'COP', name: 'Colombian Peso', symbol: '$' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
];

export const CATEGORY_ICONS = [
  'food',
  'car',
  'bus',
  'subway',
  'bicycle',
  'home',
  'home-city',
  'controller-classic',
  'medical-bag',
  'format-list-bulleted',
  'cash',
  'wallet',
  'piggy-bank',
  'bank',
  'bank-transfer',
  'credit-card',
  'cart',
  'airplane',
  'briefcase',
  'school',
  'tshirt-crew',
  'coffee',
  'dumbbell',
  'music-note',
  'chart-line',
  'trending-up',
  'pizza',
  'hamburger',
  'food-apple',
  'beer',
  'glass-wine',
  'ice-cream',
  'gas-station',
  'movie-open',
  'ticket',
  'laptop',
  'cellphone',
  'television',
  'newspaper',
  'book-open-variant',
  'gift',
  'heart',
  'star',
  'church',
  'paw',
  'dog',
  'cat',
  'baby-carriage',
];

export const GOAL_ICONS = [
  'trophy',
  'car',
  'home',
  'airplane',
  'cart',
  'gift',
  'school',
  'medkit',
  'star',
  'heart',
  'sunny',
  'umbrella',
  'bicycle',
  'bus',
  'boat',
  'train',
  'cafe',
  'restaurant',
  'fast-food',
  'beer',
  'wine',
  'pizza',
  'ice-cream',
  'barbell',
  'musical-notes',
  'camera',
  'laptop',
  'desktop',
  'phone-portrait',
  'watch',
  'book',
  'newspaper',
  'briefcase',
  'wallet',
  'cash',
  'cash-outline',
  'trending-up',
  'stats-chart',
  'fitness',
  'medical',
  'paw',
  'car-sport',
  'construct',
  'build',
  'color-palette',
  'brush',
  'game-controller',
  'headset',
  'tv',
  'radio',
  'infinite',
  'flash',
  'leaf',
  'flower',
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
