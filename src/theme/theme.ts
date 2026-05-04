import {
  MD3DarkTheme,
  MD3LightTheme,
  configureFonts,
} from 'react-native-paper';

// 1. Token primitives (Tailwind-inspired palette)
const palette = {
  green: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E', // Primary
    600: '#16A34A', // Income
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
    950: '#052E16',
  },
  emerald: {
    900: '#064E3B',
    950: '#065F46', // Dark Background
  },
  slate: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
    950: '#020617',
  },
  amber: {
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
  },
};

// 2. Spacing scale (4px base)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const chartColors = [
  '#22C55E', // primary
  '#3B82F6', // blue
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
  '#10B981', // emerald
  '#6366F1', // indigo
];

// 3. Theme Augmentation
declare global {
  namespace ReactNativePaper {
    interface MD3Colors {
      income: string;
      incomeContainer: string;
      warning: string;
      warningContainer: string;
    }
  }
}

export const lightTheme = {
  ...MD3LightTheme,
  roundness: 12,
  colors: {
    ...MD3LightTheme.colors,
    primary: palette.green[500],
    onPrimary: palette.slate[50], // Tinted white
    secondary: palette.green[300],
    onSecondary: palette.green[950],
    tertiary: palette.green[200],
    surface: palette.slate[50], // Tinted white
    background: '#F8FAFC',
    onSurface: palette.slate[900],
    onSurfaceVariant: palette.slate[600],
    income: palette.green[600],
    incomeContainer: palette.green[100],
    warning: palette.amber[600],
    warningContainer: '#FEF3C7',
    elevation: {
      ...MD3LightTheme.colors.elevation,
      level1: palette.slate[50],
    },
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  roundness: 12,
  colors: {
    ...MD3DarkTheme.colors,
    primary: palette.green[500],
    onPrimary: palette.slate[950], // Tinted dark
    secondary: palette.green[400],
    onSecondary: palette.green[950],
    tertiary: palette.green[300],
    surface: '#0A110F',
    background: '#040908',
    onSurface: palette.slate[200],
    onSurfaceVariant: palette.slate[400],
    income: palette.green[400],
    incomeContainer: palette.emerald[900],
    warning: palette.amber[400],
    warningContainer: '#451A03',
    elevation: {
      ...MD3DarkTheme.colors.elevation,
      level1: '#111817',
    },
  },
};
