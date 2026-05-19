export const COLORS = [
  '#f44336',
  '#e91e63',
  '#ff4081',
  '#9c27b0',
  '#673ab7',
  '#3f51b5',
  '#2196f3',
  '#009688',
  '#4caf50',
  '#16A34A',
  '#ffc107',
  '#ff9800',
  '#ff5722',
  '#795548',
  '#607d8b',
];

export const CURRENCIES = [
  { code: 'COP', name: 'Colombian Peso', symbol: '$', tKey: 'currCOP' },
  { code: 'USD', name: 'US Dollar', symbol: '$', tKey: 'currUSD' },
  { code: 'EUR', name: 'Euro', symbol: '€', tKey: 'currEUR' },
  { code: 'GBP', name: 'British Pound', symbol: '£', tKey: 'currGBP' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$', tKey: 'currMXN' },
  { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/', tKey: 'currPEN' },
  { code: 'CLP', name: 'Chilean Peso', symbol: '$', tKey: 'currCLP' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: '$', tKey: 'currCAD' },
  { code: 'AUD', name: 'Australian Dollar', symbol: '$', tKey: 'currAUD' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: '$', tKey: 'currNZD' },
  { code: 'ARS', name: 'Argentine Peso', symbol: '$', tKey: 'currARS' },
  { code: 'BOB', name: 'Bolivian Boliviano', symbol: 'Bs.', tKey: 'currBOB' },
  { code: 'CRC', name: 'Costa Rican Colón', symbol: '₡', tKey: 'currCRC' },
  { code: 'CUP', name: 'Cuban Peso', symbol: '$', tKey: 'currCUP' },
  { code: 'DOP', name: 'Dominican Peso', symbol: 'RD$', tKey: 'currDOP' },
  { code: 'GTQ', name: 'Guatemalan Quetzal', symbol: 'Q', tKey: 'currGTQ' },
  { code: 'HNL', name: 'Honduran Lempira', symbol: 'L', tKey: 'currHNL' },
  { code: 'NIO', name: 'Nicaraguan Córdoba', symbol: 'C$', tKey: 'currNIO' },
  { code: 'PYG', name: 'Paraguayan Guaraní', symbol: '₲', tKey: 'currPYG' },
  { code: 'UYU', name: 'Uruguayan Peso', symbol: '$U', tKey: 'currUYU' },
  { code: 'VES', name: 'Venezuelan Bolívar', symbol: 'Bs.S', tKey: 'currVES' },
  {
    code: 'XAF',
    name: 'Central African CFA Franc',
    symbol: 'FCFA',
    tKey: 'currXAF',
  },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', tKey: 'currINR' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', tKey: 'currZAR' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', tKey: 'currSGD' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', tKey: 'currPHP' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', tKey: 'currNGN' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨', tKey: 'currPKR' },
  { code: 'JMD', name: 'Jamaican Dollar', symbol: 'J$', tKey: 'currJMD' },
  { code: 'BSD', name: 'Bahamian Dollar', symbol: 'B$', tKey: 'currBSD' },
  {
    code: 'TTD',
    name: 'Trinidad and Tobago Dollar',
    symbol: 'TT$',
    tKey: 'currTTD',
  },
  { code: 'BZD', name: 'Belize Dollar', symbol: 'BZ$', tKey: 'currBZD' },
  { code: 'BBD', name: 'Barbadian Dollar', symbol: 'Bds$', tKey: 'currBBD' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', tKey: 'currKES' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵', tKey: 'currGHS' },
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
  'home-city',
  'car',
  'airplane',
  'medical-bag',
  'school',
  'briefcase',
  'cellphone',
  'gift',
  'heart',
  'controller-classic',
  'format-list-bulleted',
  'tag',
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
