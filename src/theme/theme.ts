import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

const primaryGreen = '#22C55E';
const secondaryGreen = '#86EFAC';
const accentGreen = '#BBF7D0';

const darkBackground = '#065F46';
const darkSurface = '#054C38';
const darkTextPrimary = '#E5E7EB';
const darkTextSecondary = '#9CA3AF';

const lightBackground = '#FFFFFF';
const lightSurface = '#FFFFFF';
const lightTextPrimary = '#111827';
const lightTextSecondary = '#4B5563';

const incomeColor = '#16A34A';
const incomeContainer = '#DCFCE7';
const warningColor = '#CA8A04';
const warningContainer = '#FEF9C3';

export const chartColors = [
  '#f44336',
  '#e91e63',
  '#9c27b0',
  '#673ab7',
  '#3f51b5',
  '#2196f3',
  '#00bcd4',
  '#009688',
  '#4caf50',
  '#ff9800',
];

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
    income: incomeColor,
    incomeContainer: incomeContainer,
    warning: warningColor,
    warningContainer: warningContainer,
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
    income: '#4ADE80', // Lighter green for dark theme
    incomeContainer: '#064E3B', // Darker green for dark theme
    warning: '#FACC15',
    warningContainer: '#422006',
    elevation: {
      ...MD3DarkTheme.colors.elevation,
      level1: '#1F2937', // Slightly lighter than surface for elevation
    },
  },
};
