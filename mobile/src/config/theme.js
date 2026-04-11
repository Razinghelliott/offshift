export const colors = {
  black: '#0a0a0a',
  dark: '#111111',
  darkCard: '#141414',
  darkCardHover: '#1a1a1a',
  darkBorder: '#222222',
  white: '#f5f5f5',
  whitePure: '#ffffff',
  red: '#c8102e',
  redHover: '#a00d24',
  redGlow: 'rgba(200, 16, 46, 0.3)',
  redSubtle: 'rgba(200, 16, 46, 0.06)',
  gray: '#888888',
  grayLight: '#aaaaaa',
  grayDark: '#333333',
  grayMuted: '#666666',
  green: '#34C759',
  greenSubtle: 'rgba(52, 199, 89, 0.1)',
  greenBorder: 'rgba(52, 199, 89, 0.25)',
  orange: '#FF9500',
  orangeSubtle: 'rgba(255, 149, 0, 0.1)',
  orangeBorder: 'rgba(255, 149, 0, 0.25)',
};

export const fonts = {
  serif: 'PlayfairDisplay',
  sans: 'Inter',
  serifFallback: 'serif',
  sansFallback: 'System',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
  full: 100,
};

export const typography = {
  h1: { fontSize: 32, fontWeight: '400', color: colors.white },
  h2: { fontSize: 24, fontWeight: '400', color: colors.white },
  h3: { fontSize: 20, fontWeight: '600', color: colors.white },
  body: { fontSize: 15, fontWeight: '400', color: colors.white },
  bodySmall: { fontSize: 13, fontWeight: '400', color: colors.grayLight },
  caption: { fontSize: 11, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', color: colors.grayMuted },
  button: { fontSize: 14, fontWeight: '600', color: colors.white },
};

export const shadows = {
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 2 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  red: { shadowColor: colors.red, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 4 },
};

// Also export as a flat "theme" object for screens that use theme.black, theme.red, etc.
export const theme = {
  ...colors,
  ...spacing,
  ...shadows.md,
};
