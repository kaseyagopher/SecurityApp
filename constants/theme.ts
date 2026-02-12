import { MD3LightTheme } from 'react-native-paper';

export const COLORS = {
  primary: '#2563eb',      // Bleu vif
  primaryLight: '#3b82f6', // Bleu clair
  secondary: '#f59e0b',    // Orange
  secondaryLight: '#fbbf24', // Orange clair
  success: '#10b981',      // Vert
  successLight: '#34d399', // Vert clair
  danger: '#ef4444',       // Rouge
  warning: '#f59e0b',      // Orange
  info: '#3b82f6',         // Bleu clair
  infoLight: '#60a5fa',    // Bleu très clair
  dark: '#1f2937',         // Gris foncé
  darkLight: '#374151',    // Gris
  light: '#f9fafb',        // Gris très clair
  white: '#ffffff',
  black: '#000000',
  gray: '#94a3b8',         // Gris moyen
  grayLight: '#e2e8f0',    // Gris clair
  background: '#f5f7fa',   // Fond gris très clair
};

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: COLORS.primary,
    secondary: COLORS.secondary,
    error: COLORS.danger,
    background: COLORS.background,
    surface: COLORS.white,
  },
};