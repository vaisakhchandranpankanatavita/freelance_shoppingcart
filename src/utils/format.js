// Display formatting shared by every screen. Amounts always use the Indian grouping
// (₹1,23,456) — a bare toLocaleString() follows the device/browser locale instead, so the same
// bill read ₹123,456 on one phone and ₹1,23,456 on the next.

const num = (n) => Number(n) || 0;

// ₹1,260 — whole rupees for lists, tiles and buttons.
export const rupees = (n) => `₹${Math.round(num(n)).toLocaleString('en-IN')}`;

// ₹1,260.00 — paise shown, for bill totals and receipts.
export const rupeesExact = (n) =>
  `₹${num(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ₹51.4K / ₹3.2L — headline figures where the exact rupee doesn't matter.
export const rupeesShort = (n) => {
  const v = num(n);
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(1)}K`;
  return rupees(v);
};

// '2026-10-12' (or '2026-10-12 18:05') → '12 Oct 2026'. Unparseable input comes back as given.
export const shortDate = (value) => {
  const iso = String(value ?? '').slice(0, 10);
  const parsed = new Date(`${iso}T00:00:00`);
  if (!iso || Number.isNaN(parsed.getTime())) return String(value ?? '');
  return parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;
