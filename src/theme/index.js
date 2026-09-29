// Design tokens — charcoal smart-dashboard look: graphite canvas, slightly lifted
// graphite cards, cyan for interactive/active state and a green → cyan accent
// gradient for data (waveforms, chart area, progress).
export const colors = {
  // Canvas & dark surfaces
  bg: '#2A2A30',
  elevated: '#313138',
  elevated2: '#36363E',
  elevated3: '#40404A',
  line: '#3A3A42',

  // Text on dark
  text: '#FFFFFF',
  textMuted: '#9A9AA5',
  textFaint: '#5E5E69',

  // Cards (same graphite family; "ink" is text on a card)
  card: '#34343C',
  cardAlt: '#3C3C45',
  cardFade: '#2E2E35',
  ink: '#FFFFFF',
  inkMuted: '#9A9AA5',
  inkLine: '#44444D',

  // Chips / badges that sit on a card
  chip: '#25252B',

  // True white paper — only where contrast must be dark-on-white (QR codes)
  paper: '#FFFFFF',
  paperInk: '#0A0A0A',

  // Accents
  accent: '#1EB7EB',
  green: '#1ED58A',

  // Status
  danger: '#F2484E',
  success: '#1ED58A',
  warning: '#FFB020',
  info: '#1EB7EB',

  gradient: ['#1ED58A', '#1FC7B6', '#1EB7EB'],

  // Web presentation stage behind the phone frame
  stage: '#C9D6DF',
};

// Data tones: [start, end] of a waveform / gauge gradient, keyed by metric tone.
export const tones = {
  green: ['#1ED58A', '#1FC7B6'],
  cyan: ['#1FC7B6', '#1EB7EB'],
  red: ['#F2484E', '#FF7A59'],
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
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  pill: 999,
};

export const typography = {
  display: { fontSize: 40, lineHeight: 42, fontWeight: '800', letterSpacing: -1.6 },
  title: { fontSize: 28, lineHeight: 32, fontWeight: '800', letterSpacing: -0.8 },
  h2: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  h3: { fontSize: 17, fontWeight: '700', letterSpacing: -0.2 },
  body: { fontSize: 15 },
  small: { fontSize: 12 },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 0.4 },
  button: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
};

export default { colors, tones, spacing, radius, typography };
