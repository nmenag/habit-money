import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
} from '@react-navigation/native';
import {
  adaptNavigationTheme,
  MD3DarkTheme,
  MD3LightTheme,
  useTheme,
  configureFonts,
} from 'react-native-paper';

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
    700: '#B45309',
  },
};

// Global Spacing scale (4px base)
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

// Clean global typography scale using Inter only (weights: 400, 500, 600)
const fontConfig = {
  displayLarge: {
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600' as const,
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: -1,
  },
  displayMedium: {
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600' as const,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  displaySmall: {
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600' as const,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: 0,
  },
  headlineLarge: {
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600' as const,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: 0,
  },
  headlineMedium: {
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600' as const,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: 0,
  },
  headlineSmall: {
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600' as const,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: 0,
  },
  titleLarge: {
    fontFamily: 'Inter-Medium',
    fontWeight: '500' as const,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 0.15,
  },
  titleMedium: {
    fontFamily: 'Inter-Medium',
    fontWeight: '500' as const,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0.15,
  },
  titleSmall: {
    fontFamily: 'Inter-Medium',
    fontWeight: '500' as const,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  bodyLarge: {
    fontFamily: 'Inter-Regular',
    fontWeight: '400' as const,
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0.15,
  },
  bodyMedium: {
    fontFamily: 'Inter-Regular',
    fontWeight: '400' as const,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.25,
  },
  bodySmall: {
    fontFamily: 'Inter-Regular',
    fontWeight: '400' as const,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.4,
  },
  labelLarge: {
    fontFamily: 'Inter-Medium',
    fontWeight: '500' as const,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  labelMedium: {
    fontFamily: 'Inter-Medium',
    fontWeight: '500' as const,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.5,
  },
  labelSmall: {
    fontFamily: 'Inter-Regular',
    fontWeight: '400' as const,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.5,
  },
};

const customFonts = configureFonts({ config: fontConfig });

declare module 'react-native-paper' {
  export interface MD3Colors {
    income: string;
    incomeContainer: string;
    warning: string;
    warningContainer: string;
  }
}

export type AppTheme = typeof lightTheme;
export const useAppTheme = () => useTheme<AppTheme>();

export const lightTheme = {
  ...MD3LightTheme,
  roundness: 12,
  fonts: customFonts,
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
    onSurfaceVariant: palette.slate[700],
    income: palette.green[700],
    incomeContainer: palette.green[100],
    warning: palette.amber[700],
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
  fonts: customFonts,
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
    },
  },
};

const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme,
});

export const CombinedDefaultTheme = {
  ...LightTheme,
  ...lightTheme,
  colors: {
    ...LightTheme.colors,
    ...lightTheme.colors,
  },
  fonts: lightTheme.fonts,
};

export const CombinedDarkTheme = {
  ...DarkTheme,
  ...darkTheme,
  colors: {
    ...DarkTheme.colors,
    ...darkTheme.colors,
  },
  fonts: darkTheme.fonts,
};
