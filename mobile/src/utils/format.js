export const CURRENCY_CODE = 'INR';
export const CURRENCY_SYMBOL = '₹';
export function formatCurrency(amount) {
    const value = Number(amount || 0);
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: CURRENCY_CODE,
        maximumFractionDigits: 0,
    }).format(Number.isFinite(value) ? value : 0);
}
