/** App currency — all amounts are Indian Rupees (INR). */
export const CURRENCY_CODE = 'INR';
export const CURRENCY_SYMBOL = '₹';
export const CURRENCY_LOCALE = 'en-IN';

const inrFormatter = new Intl.NumberFormat(CURRENCY_LOCALE, {
  style: 'currency',
  currency: CURRENCY_CODE,
  maximumFractionDigits: 0,
});

const inrFormatterPrecise = new Intl.NumberFormat(CURRENCY_LOCALE, {
  style: 'currency',
  currency: CURRENCY_CODE,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Format amount as INR (e.g. ₹16,932). */
export const formatCurrency = (amount, { precise = false } = {}) => {
  const value = Number(amount || 0);
  return (precise ? inrFormatterPrecise : inrFormatter).format(Number.isFinite(value) ? value : 0);
};

export const formatDate = (date) =>
  new Date(date).toLocaleDateString(CURRENCY_LOCALE, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

export const calcGST = (subtotal, rate = 0.12) => Math.round(subtotal * rate);
