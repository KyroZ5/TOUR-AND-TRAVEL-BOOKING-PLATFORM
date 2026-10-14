import { describe, it, expect } from 'vitest';
import {
  toDate,
  formatDate,
  formatDateTime,
  toInputDate,
  fromInputDate,
  isFuture,
  daysUntil,
} from '../../src/utils/date.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

describe('toDate', () => {
  it('returns null for empty/invalid values', () => {
    expect(toDate(null)).toBeNull();
    expect(toDate(undefined)).toBeNull();
    expect(toDate('')).toBeNull();
    expect(toDate('not-a-date')).toBeNull();
  });

  it('passes through valid Date instances', () => {
    const date = new Date('2026-03-05T12:00:00');
    expect(toDate(date)).toBe(date);
    expect(toDate(new Date('invalid'))).toBeNull();
  });

  it('converts Firestore Timestamp-like objects with toDate()', () => {
    const date = new Date('2026-01-01T00:00:00Z');
    expect(toDate({ toDate: () => date })).toBe(date);
    expect(toDate({ toDate: () => new Date('bad') })).toBeNull();
  });

  it('converts { seconds } shapes', () => {
    const seconds = 1700000000;
    expect(toDate({ seconds }).getTime()).toBe(seconds * 1000);
  });
});

describe('formatDate / formatDateTime', () => {
  it('returns an em dash for empty values', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDateTime(undefined)).toBe('—');
  });

  it('renders a readable date', () => {
    const out = formatDate(new Date(2026, 2, 5, 12));
    expect(out).toContain('Mar');
    expect(out).toContain('2026');
    expect(out).toContain('5');
  });

  it('renders a readable date-time', () => {
    const out = formatDateTime(new Date(2026, 2, 5, 14, 30));
    expect(out).toContain('Mar');
    expect(out).toContain('2026');
  });
});

describe('toInputDate / fromInputDate', () => {
  it('formats a Date to yyyy-mm-dd in local time', () => {
    expect(toInputDate(new Date(2026, 2, 5))).toBe('2026-03-05');
    expect(toInputDate(null)).toBe('');
  });

  it('parses yyyy-mm-dd into a local Date', () => {
    const date = fromInputDate('2026-03-05');
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(2);
    expect(date.getDate()).toBe(5);
    expect(fromInputDate('')).toBeNull();
    expect(fromInputDate('bad')).toBeNull();
  });

  it('round-trips through the input format', () => {
    expect(toInputDate(fromInputDate('2026-12-31'))).toBe('2026-12-31');
  });
});

describe('isFuture / daysUntil', () => {
  it('detects future dates', () => {
    expect(isFuture(new Date(Date.now() + MS_PER_DAY))).toBe(true);
    expect(isFuture(new Date(Date.now() - MS_PER_DAY))).toBe(false);
    expect(isFuture(null)).toBe(false);
  });

  it('counts whole days until a date', () => {
    expect(daysUntil(new Date(Date.now() + 3 * MS_PER_DAY))).toBe(3);
    expect(daysUntil(new Date(Date.now() - 3 * MS_PER_DAY))).toBeLessThanOrEqual(0);
    expect(daysUntil(null)).toBeNull();
  });
});
