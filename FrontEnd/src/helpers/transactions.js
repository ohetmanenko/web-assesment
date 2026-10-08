import { MAX_AMOUNT_CENTS } from './amount-input.mjs';
export { MAX_AMOUNT_CENTS, centsToInput } from './amount-input.mjs';
export const titleCaseCategory = value =>
  value
    .normalize('NFKC')
    .trim()
    .replace(/\s+/gu, ' ')
    .toLowerCase()
    .replace(/(^|[\s\-_])\p{L}/gu, match => match.toUpperCase());
export const formatMoney = (cents, language = 'en') =>
  new Intl.NumberFormat(language === 'it' ? 'it-IT' : 'en-US', { style: 'currency', currency: 'USD' }).format(
    cents / 100
  );
export const amountToCents = value => {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(String(value ?? ''));
  if (!match) return null;
  const cents = Number(match[1]) * 100 + Number((match[2] || '').padEnd(2, '0'));
  return Number.isSafeInteger(cents) && cents > 0 && cents <= MAX_AMOUNT_CENTS ? cents : null;
};
export const compareTransactionDates = (a, b) =>
  a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt) || a._id.localeCompare(b._id);
export const sortTransactions = records => [...records].sort((a, b) => compareTransactionDates(b, a));
