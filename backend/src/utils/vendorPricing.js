/** Parse and validate vendor price payloads. All money fields must be > 0. */

export const positiveNumber = (value, field) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    return { error: `${field} must be greater than 0` };
  }
  return { value: n };
};

export const nonNegativeNumber = (value, field) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) {
    return { error: `${field} must be 0 or greater` };
  }
  return { value: n };
};

export const applyIfPresent = (body, key, parser, target, field = key) => {
  if (body[key] === undefined) return null;
  const parsed = parser(body[key], field);
  if (parsed.error) return parsed.error;
  target[key] = parsed.value;
  return null;
};

export const parseSeasonalPricing = (rows) => {
  if (rows === undefined) return { skip: true };
  if (!Array.isArray(rows)) return { error: 'seasonalPricing must be an array' };
  const seasonalPricing = [];
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i] || {};
    const price = positiveNumber(row.price, `seasonalPricing[${i}].price`);
    if (price.error) return price;
    const start = row.startDate ? new Date(row.startDate) : null;
    const end = row.endDate ? new Date(row.endDate) : null;
    if (start && Number.isNaN(start.getTime())) {
      return { error: `seasonalPricing[${i}].startDate is invalid` };
    }
    if (end && Number.isNaN(end.getTime())) {
      return { error: `seasonalPricing[${i}].endDate is invalid` };
    }
    seasonalPricing.push({
      season: row.season || '',
      startDate: start,
      endDate: end,
      price: price.value,
    });
  }
  return { value: seasonalPricing };
};
