import { describe, it, expect } from 'vitest';
import {
  formatPHP,
  formatPesos,
  toCentavos,
  fromCentavos,
  parsePesoInput,
} from '../../src/utils/currency.js';

describe('formatPHP', () => {
  it('formats integer centavos as PHP currency', () => {
    const out = formatPHP(1299900);
    expect(out).toContain('12,999.00');
  });

  it('falls back to ₱0.00 for invalid input', () => {
    expect(formatPHP(NaN)).toBe('₱0.00');
    expect(formatPHP(undefined)).toBe('₱0.00');
    expect(formatPHP('not-a-number')).toBe('₱0.00');
  });
});

describe('formatPesos', () => {
  it('formats a plain peso amount', () => {
    expect(formatPesos(12999)).toContain('12,999.00');
  });

  it('falls back to ₱0.00 for invalid input', () => {
    expect(formatPesos(null)).toBe('₱0.00');
    expect(formatPesos(NaN)).toBe('₱0.00');
  });
});

describe('toCentavos', () => {
  it('converts pesos to integer centavos', () => {
    expect(toCentavos(129.5)).toBe(12950);
    expect(toCentavos('10.99')).toBe(1099);
    expect(toCentavos(0)).toBe(0);
  });

  it('rounds to the nearest centavo', () => {
    expect(toCentavos(12.999)).toBe(1300);
    expect(toCentavos(0.1 + 0.2)).toBe(30);
  });

  it('returns 0 for invalid input', () => {
    expect(toCentavos(NaN)).toBe(0);
    expect(toCentavos(undefined)).toBe(0);
    expect(toCentavos('abc')).toBe(0);
  });
});

describe('fromCentavos', () => {
  it('converts centavos back to pesos', () => {
    expect(fromCentavos(12950)).toBe(129.5);
    expect(fromCentavos(0)).toBe(0);
  });

  it('returns 0 for invalid input', () => {
    expect(fromCentavos(undefined)).toBe(0);
    expect(fromCentavos(NaN)).toBe(0);
  });
});

describe('parsePesoInput', () => {
  it('strips currency symbols/separators and returns centavos', () => {
    expect(parsePesoInput('₱1,299.50')).toBe(129950);
    expect(parsePesoInput('1299')).toBe(129900);
  });

  it('returns null for empty or non-numeric input', () => {
    expect(parsePesoInput('')).toBeNull();
    expect(parsePesoInput(null)).toBeNull();
    expect(parsePesoInput(undefined)).toBeNull();
    expect(parsePesoInput('abc')).toBeNull();
  });

  it('rounds to the nearest centavo', () => {
    expect(parsePesoInput('12.345')).toBe(1235);
  });
});
