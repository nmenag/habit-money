import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

const primaryGreen = '#16A34A';
const secondaryGreen = '#22C55E';
const accentGreen = '#4ADE80';

const darkBackground = '#0B0F0C';
const darkSurface = '#111827';
const darkTextPrimary = '#E5E7EB';
const darkTextSecondary = '#9CA3AF';

const lightBackground = '#F9FAFB';
const lightSurface = '#FFFFFF';
const lightTextPrimary = '#111827';
const lightTextSecondary = '#4B5563';

export const lightTheme = {
  ...MD3LightTheme,
  roundness: 8,
  colors: {
    ...MD3LightTheme.colors,
    primary: primaryGreen,
    secondary: secondaryGreen,
    tertiary: accentGreen,
    surface: lightSurface,
    background: lightBackground,
    onSurface: lightTextPrimary,
    onSurfaceVariant: lightTextSecondary,
    elevation: {
      ...MD3LightTheme.colors.elevation,
      level1: '#FFFFFF',
    },
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  roundness: 8,
  colors: {
    ...MD3DarkTheme.colors,
    primary: primaryGreen,
    secondary: secondaryGreen,
    tertiary: accentGreen,
    surface: darkSurface,
    background: darkBackground,
    onSurface: darkTextPrimary,
    onSurfaceVariant: darkTextSecondary,
    elevation: {
      ...MD3DarkTheme.colors.elevation,
      level1: '#1F2937', // Slightly lighter than surface for elevation
    },
  },
};
