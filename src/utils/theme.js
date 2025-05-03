import { DefaultTheme, DarkTheme } from 'react-native-paper';

// Light theme
export const lightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#1a56db',
    accent: '#0e4da4',
    background: '#ffffff',
    surface: '#f5f7fa',
    text: '#1f2937',
    error: '#ef4444',
    notification: '#1a56db',
  },
};

// Dark theme
export const darkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#3b82f6',
    accent: '#60a5fa',
    background: '#111827',
    surface: '#1f2937',
    text: '#f3f4f6',
    error: '#f87171',
    notification: '#3b82f6',
  },
};