import { describe, it, expect } from 'vitest';
import {
  summarizeBookings,
  calculateCollectedRevenue,
  groupBookingsByMonth,
  groupRevenueByMonth,
  popularPackages,
  popularDestinations,
  filterBookingsByRange,
  toCsv,
} from '../../src/services/reportService.js';

describe('summarizeBookings', () => {
  const bookings = [
    { bookingStatus: 'pending', numberOfTravelers: 2, totalPrice: 10000 },
    { bookingStatus: 'confirmed', numberOfTravelers: 1, totalPrice: 5000 },
    { bookingStatus: 'cancelled', numberOfTravelers: 3, totalPrice: 9999 },
    { bookingStatus: 'rejected', numberOfTravelers: 1, totalPrice: 1111 },
    { bookingStatus: 'completed', numberOfTravelers: 2, totalPrice: 20000 },
  ];

  it('counts each status and sums travelers', () => {
    const summary = summarizeBookings(bookings);
    expect(summary.total).toBe(5);
    expect(summary.pending).toBe(1);
    expect(summary.confirmed).toBe(1);
    expect(summary.cancelled).toBe(1);
    expect(summary.rejected).toBe(1);
    expect(summary.completed).toBe(1);
    expect(summary.travelers).toBe(9);
  });

  it('excludes cancelled and rejected bookings from total value', () => {
    expect(summarizeBookings(bookings).totalBookingValue).toBe(35000);
  });

  it('handles an empty list and unknown statuses', () => {
    expect(summarizeBookings().total).toBe(0);
    expect(summarizeBookings([{ bookingStatus: 'weird' }]).total).toBe(1);
  });
});

describe('calculateCollectedRevenue', () => {
  const bookings = [
    { id: 'b1', bookingStatus: 'confirmed' },
    { id: 'b2', bookingStatus: 'cancelled' },
  ];
  const payments = [
    { bookingId: 'b1', paymentStatus: 'paid', amount: 5000 },
    { bookingId: 'b2', paymentStatus: 'paid', amount: 7000 },
    { bookingId: 'b1', paymentStatus: 'pending_verification', amount: 1 },
    { bookingId: 'b3', paymentStatus: 'paid', amount: 2000 },
  ];

  it('sums only verified payments on non-cancelled bookings', () => {
    expect(calculateCollectedRevenue(payments, bookings)).toBe(7000);
  });

  it('returns 0 when there are no payments', () => {
    expect(calculateCollectedRevenue([], bookings)).toBe(0);
  });
});

describe('groupBookingsByMonth', () => {
  it('buckets by YYYY-MM, oldest first, skipping invalid dates', () => {
    const bookings = [
      { createdAt: new Date(2026, 1, 3) },
      { createdAt: new Date(2026, 0, 5) },
      { createdAt: new Date(2026, 0, 20) },
      { createdAt: null },
      { createdAt: { seconds: 1735689600 } }, // 2025-01-01
    ];
    expect(groupBookingsByMonth(bookings)).toEqual([
      { month: '2025-01', count: 1 },
      { month: '2026-01', count: 2 },
      { month: '2026-02', count: 1 },
    ]);
  });
});

describe('groupRevenueByMonth', () => {
  it('sums verified payments by month and ignores cancelled bookings', () => {
    const bookings = [{ id: 'b1', bookingStatus: 'confirmed' }, { id: 'b2', bookingStatus: 'cancelled' }];
    const payments = [
      { bookingId: 'b1', paymentStatus: 'paid', amount: 5000, verifiedAt: new Date(2026, 0, 10) },
      { bookingId: 'b2', paymentStatus: 'paid', amount: 7000, verifiedAt: new Date(2026, 0, 11) },
      { bookingId: 'b1', paymentStatus: 'paid', amount: 3000, verifiedAt: new Date(2026, 1, 2) },
      { bookingId: 'b1', paymentStatus: 'rejected', amount: 9999, verifiedAt: new Date(2026, 0, 12) },
    ];
    expect(groupRevenueByMonth(payments, bookings)).toEqual([
      { month: '2026-01', total: 5000 },
      { month: '2026-02', total: 3000 },
    ]);
  });
});

describe('popularPackages / popularDestinations', () => {
  const bookings = [
    { packageId: 'p1', bookingStatus: 'pending' },
    { packageId: 'p1', bookingStatus: 'confirmed' },
    { packageId: 'p2', bookingStatus: 'cancelled' },
    { packageId: 'p2', bookingStatus: 'confirmed' },
  ];

  it('ranks packages, excluding cancelled/rejected', () => {
    expect(popularPackages(bookings)).toEqual([
      { packageId: 'p1', count: 2 },
      { packageId: 'p2', count: 1 },
    ]);
  });

  it('resolves destinations through a package map', () => {
    const map = new Map([
      ['p1', 'd1'],
      ['p2', 'd2'],
    ]);
    expect(popularDestinations(bookings, map)).toEqual([
      { destinationId: 'd1', count: 2 },
      { destinationId: 'd2', count: 1 },
    ]);
  });

  it('respects topN and skips unmapped packages', () => {
    expect(popularPackages(bookings, 1)).toHaveLength(1);
    expect(popularDestinations(bookings, new Map())).toEqual([]);
  });
});

describe('filterBookingsByRange', () => {
  const bookings = [
    { createdAt: new Date(2026, 0, 1) },
    { createdAt: new Date(2026, 0, 15) },
    { createdAt: new Date(2026, 1, 1) },
    { createdAt: null },
  ];

  it('filters inclusively on createdAt', () => {
    const result = filterBookingsByRange(bookings, new Date(2026, 0, 1), new Date(2026, 0, 31));
    expect(result).toHaveLength(2);
  });

  it('supports open-ended ranges', () => {
    expect(filterBookingsByRange(bookings, new Date(2026, 0, 10))).toHaveLength(2);
    expect(filterBookingsByRange(bookings, null, new Date(2026, 0, 31))).toHaveLength(2);
  });
});

describe('toCsv', () => {
  const columns = [
    { label: 'Name', value: (r) => r.name },
    { label: 'Note', value: (r) => r.note },
  ];

  it('emits a header only when there are no rows', () => {
    expect(toCsv([], columns)).toBe('Name,Note');
  });

  it('escapes commas, quotes and newlines', () => {
    const rows = [
      { name: 'A', note: 'has,comma' },
      { name: 'B', note: 'has "quotes"' },
      { name: 'C', note: 'line\nbreak' },
    ];
    const csv = toCsv(rows, columns);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('Name,Note');
    expect(csv).toContain('A,"has,comma"');
    expect(csv).toContain('B,"has ""quotes"""');
    expect(csv).toContain('C,"line');
  });

  it('renders null/undefined values as empty strings', () => {
    expect(toCsv([{ name: null, note: undefined }], columns)).toBe('Name,Note\n,');
  });
});
