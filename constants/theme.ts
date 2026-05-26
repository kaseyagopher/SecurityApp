import { MD3LightTheme } from 'react-native-paper';

export const COLORS = {
  primary: '#0d9488',
  primaryDark: '#0f766e',
  primaryLight: '#14b8a6',
  primaryMuted: '#ccfbf1',

  accent: '#6366f1',
  accentMuted: '#e0e7ff',

  background: '#f1f5f9',
  surface: '#ffffff',
  surfaceElevated: '#ffffff',

  text: '#0f172a',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  border: '#e2e8f0',

  success: '#10b981',
  successMuted: '#d1fae5',
  danger: '#ef4444',
  dangerMuted: '#fee2e2',
  warning: '#f59e0b',
  warningMuted: '#fef3c7',
  info: '#3b82f6',
  infoMuted: '#dbeafe',

  white: '#ffffff',
  black: '#000000',

  tabBar: '#0f766e',
  headerGradient: ['#0f766e', '#14b8a6'] as const,
  darkHeaderGradient: ['#0f172a', '#1e293b'] as const,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  tabBar: 88,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

/** Alias pour les composants Expo template (thème clair uniquement) */
export const Colors = {
  ...COLORS,
  light: {
    text: COLORS.text,
    background: COLORS.background,
    tint: COLORS.primary,
    icon: COLORS.textSecondary,
    tabIconDefault: COLORS.textMuted,
    tabIconSelected: COLORS.primary,
  },
  dark: {
    text: COLORS.white,
    background: '#0f172a',
    tint: COLORS.primaryLight,
    icon: COLORS.textMuted,
    tabIconDefault: COLORS.textMuted,
    tabIconSelected: COLORS.primaryLight,
  },
};

export const theme = {
  ...MD3LightTheme,
  roundness: RADIUS.md,
  colors: {
    ...MD3LightTheme.colors,
    primary: COLORS.primary,
    secondary: COLORS.accent,
    error: COLORS.danger,
    background: COLORS.background,
    surface: COLORS.surface,
    onSurface: COLORS.text,
  },
};
