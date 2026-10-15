export function digitsOnlyMobile(value) {
  return String(value ?? '').replace(/\D/g, '').slice(0, 10);
}

export function isTenDigitMobile(value) {
  return /^\d{10}$/.test(String(value ?? '').trim());
}
