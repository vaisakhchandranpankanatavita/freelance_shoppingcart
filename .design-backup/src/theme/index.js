export const colors = {
  primary: '#1F5E3A',
  primaryDark: '#0E3D22',
  primaryLight: '#8ED27A',
  accent: '#E58A2C',
  teal: '#2FA9A2',
  tealDark: '#1F8983',
  background: '#FFFDF6',
  surface: '#FFFFFF',
  surfaceAlt: '#E8F5E1',
  border: '#E4E9E1',
  text: '#1A1A1A',
  textMuted: '#6B7280',
  muted: '#9CA3AF',
  danger: '#DC2626',
  success: '#16A34A',
  warning: '#F59E0B',
  info: '#3B82F6',
  chartBarDark: '#1F5E3A',
  chartBarLight: '#8ED27A',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  pill: 999,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '700', color: colors.text },
  h2: { fontSize: 22, fontWeight: '700', color: colors.text },
  h3: { fontSize: 18, fontWeight: '600', color: colors.text },
  body: { fontSize: 14, color: colors.text },
  bodyMuted: { fontSize: 14, color: colors.textMuted },
  small: { fontSize: 12, color: colors.textMuted },
  button: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
};

export default { colors, spacing, radius, typography };
