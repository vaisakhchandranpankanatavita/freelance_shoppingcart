// Design tokens — light page, charcoal cards: a soft grey canvas with white
// rows/inputs, graphite "feature" cards (KPIs, chart, gauge), cyan for
// interactive/active state and a green → cyan gradient for data.
export const colors = {
  // Light canvas & surfaces
  bg: '#EEF1F5',
  elevated: '#FFFFFF',
  elevated2: '#E3E7EC',
  elevated3: '#D7DCE3',
  line: '#DCE1E7',

  // Text on the light canvas
  text: '#1D1D23',
  textMuted: '#6A6F7B',
  textFaint: '#9CA2AD',

  // Charcoal cards ("ink" is text on a card)
  card: '#2A2A30',
  cardAlt: '#36363E',
  cardFade: '#232328',
  ink: '#FFFFFF',
  inkMuted: '#9A9AA5',
  inkLine: '#3A3A42',

  // Chips / badges that sit on a card
  chip: '#1E1E23',

  // True white paper — only where contrast must be dark-on-white (QR codes)
  paper: '#FFFFFF',
  paperInk: '#0A0A0A',

  // Accents
  accent: '#1EB7EB',
  accentStrong: '#0A7FB0', // cyan dark enough for text/outlines on the light canvas
  green: '#1ED58A',
  greenStrong: '#0B8A57', // green for text on the light canvas

  // Status
  danger: '#F2484E',
  success: '#1ED58A',
  warning: '#FFB020',
  info: '#1EB7EB',

  gradient: ['#1ED58A', '#1FC7B6', '#1EB7EB'],

  // Web presentation stage behind the phone frame
  stage: '#2A2A30',
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
