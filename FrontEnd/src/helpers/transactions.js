export const MAX_AMOUNT_CENTS = 999999999;
export const formatMoney = cents =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
export const centsToInput = cents => Math.floor(cents / 100) + '.' + String(cents % 100).padStart(2, '0');
export const amountToCents = value => {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(String(value ?? ''));
  if (!match) return null;
  const cents = Number(match[1]) * 100 + Number((match[2] || '').padEnd(2, '0'));
  return Number.isSafeInteger(cents) && cents > 0 && cents <= MAX_AMOUNT_CENTS ? cents : null;
};
export const sortTransactions = records =>
  [...records].sort(
    (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt) || b._id.localeCompare(a._id)
  );
