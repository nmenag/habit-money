import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

const fintechPrimaryLight = '#005CEE'; // Clean, modern fintech blue
const fintechPrimaryDark = '#669CFF';

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: fintechPrimaryLight,
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: fintechPrimaryDark,
  },
};
