import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

// Branding colors
const trustBlue = '#005CEE';
const habitMint = '#00E676';
const obsidian = '#121212';
const paperGray = '#F8F9FA';

export const lightTheme = {
  ...MD3LightTheme,
  roundness: 6, // Corresponds to 24px (2xl) for most components in RN Paper
  colors: {
    ...MD3LightTheme.colors,
    primary: trustBlue,
    secondary: habitMint,
    surface: paperGray,
    background: '#FFFFFF',
    elevation: {
      ...MD3LightTheme.colors.elevation,
      level1: '#FFFFFF',
    },
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  roundness: 6,
  colors: {
    ...MD3DarkTheme.colors,
    primary: trustBlue,
    secondary: habitMint,
    surface: '#1E1E1E',
    background: obsidian,
    elevation: {
      ...MD3DarkTheme.colors.elevation,
      level1: '#1E1E1E',
    },
  },
};
