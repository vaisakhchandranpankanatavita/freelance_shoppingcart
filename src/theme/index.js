// Design tokens — black canvas, white "paper" cards, dark pill controls and a
// purple → pink → orange accent gradient (used sparingly for outlines & badges).
export const colors = {
  // Canvas & dark surfaces
  bg: '#000000',
  elevated: '#121212',
  elevated2: '#1C1C1E',
  elevated3: '#2A2A2D',
  line: '#232326',

  // Text on dark
  text: '#FFFFFF',
  textMuted: '#8E8E93',
  textFaint: '#5B5B60',

  // Light "paper" cards
  card: '#FFFFFF',
  cardAlt: '#F2F3F3',
  cardFade: '#D5DADA',
  ink: '#0A0A0A',
  inkMuted: '#6E6E73',
  inkLine: '#E7E7EA',

  // Status
  danger: '#FF453A',
  success: '#30D158',
  warning: '#FFB020',
  info: '#0A84FF',

  gradient: ['#8B3DFF', '#FF2E93', '#FF9A1F'],

  // Web presentation stage behind the phone frame
  stage: '#1C9A96',
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
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  pill: 999,
};

export const typography = {
  display: { fontSize: 40, lineHeight: 42, fontWeight: '800', letterSpacing: -1.6 },
  title: { fontSize: 30, lineHeight: 34, fontWeight: '800', letterSpacing: -1 },
  h2: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  h3: { fontSize: 17, fontWeight: '700', letterSpacing: -0.2 },
  body: { fontSize: 15 },
  small: { fontSize: 12 },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 0.4 },
  button: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
};

export default { colors, spacing, radius, typography };
