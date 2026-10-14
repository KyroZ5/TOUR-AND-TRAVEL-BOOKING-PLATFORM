// Philippine Peso helpers. Money is stored in Firestore as integer centavos
// to avoid floating point rounding errors (₱12,999.00 -> 1299900).

const phpFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Format integer centavos as a PHP currency string: 1299900 -> "₱12,999.00" */
export function formatPHP(centavos) {
  const value = Number(centavos);
  if (!Number.isFinite(value)) {
    return '₱0.00';
  }
  return phpFormatter.format(value / 100);
}

/** Format a plain peso amount: 12999 -> "₱12,999.00" */
export function formatPesos(pesos) {
  const value = Number(pesos);
  if (!Number.isFinite(value)) {
    return '₱0.00';
  }
  return phpFormatter.format(value);
}

/** Weighted-peso input -> integer centavos, e.g. 129.5 -> 12950 */
export function toCentavos(pesos) {
  const value = Number(pesos);
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.round(value * 100);
}

/** Integer centavos -> plain pesos number, e.g. 12950 -> 129.5 */
export function fromCentavos(centavos) {
  const value = Number(centavos);
  if (!Number.isFinite(value)) {
    return 0;
  }
  return value / 100;
}

/** Parse a user-entered peso string into centavos. Returns null if invalid. */
export function parsePesoInput(text) {
  if (text === null || text === undefined) {
    return null;
  }
  const cleaned = String(text).replace(/[^0-9.]/g, '');
  if (!cleaned) {
    return null;
  }
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value < 0) {
    return null;
  }
  return Math.round(value * 100);
}
