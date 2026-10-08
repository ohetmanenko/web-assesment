export const MAX_AMOUNT_CENTS = 999999999;
export const centsToInput = cents => Math.floor(cents / 100) + '.' + String(cents % 100).padStart(2, '0');

export const formatCentsInput = (raw, previous = '') => {
  if (raw === '') return '';
  if (!/^\d*(?:[.,]\d*)?$/.test(raw)) return previous;
  const digits = raw.replace(/[.,]/g, '');
  if (!digits) return previous;
  const cents = Number(digits);
  return Number.isSafeInteger(cents) && cents <= MAX_AMOUNT_CENTS ? centsToInput(cents) : previous;
};

export const parsePastedAmount = (text, previous = '') => {
  const raw = text.trim();
  if (/^\d+$/.test(raw)) return formatCentsInput(raw, previous);
  const match = /^(\d+)[.,](\d{1,2})$/.exec(raw);
  if (!match) return previous;
  return formatCentsInput(match[1] + match[2].padEnd(2, '0'), previous);
};
