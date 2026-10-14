import { describe, it, expect } from 'vitest';
import { remainingSlots } from '../../src/services/departureService.js';
import { isPromotionActive } from '../../src/services/promotionService.js';
import { canCancelBooking, BookingError } from '../../src/services/bookingService.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

describe('remainingSlots', () => {
  it('returns 0 for a missing departure', () => {
    expect(remainingSlots(null)).toBe(0);
  });

  it('subtracts booked from capacity', () => {
    expect(remainingSlots({ capacity: 10, bookedCount: 3 })).toBe(7);
  });

  it('clamps at zero when overbooked', () => {
    expect(remainingSlots({ capacity: 2, bookedCount: 5 })).toBe(0);
  });

  it('coerces string numbers and defaults booked to 0', () => {
    expect(remainingSlots({ capacity: '10', bookedCount: '4' })).toBe(6);
    expect(remainingSlots({ capacity: 10 })).toBe(10);
  });
});

describe('isPromotionActive', () => {
  const base = { isActive: true, startDate: '2026-06-01', endDate: '2026-06-30' };

  it('is false when missing or inactive', () => {
    expect(isPromotionActive(null)).toBe(false);
    expect(isPromotionActive({ isActive: false })).toBe(false);
  });

  it('is true inside the window', () => {
    expect(isPromotionActive(base, new Date('2026-06-15'))).toBe(true);
  });

  it('is false before the start and after the end', () => {
    expect(isPromotionActive(base, new Date('2026-05-01'))).toBe(false);
    expect(isPromotionActive(base, new Date('2026-07-15'))).toBe(false);
  });

  it('is true when no dates are set', () => {
    expect(isPromotionActive({ isActive: true }, new Date())).toBe(true);
  });
});

describe('canCancelBooking', () => {
  it('is false without a booking', () => {
    expect(canCancelBooking(null, null)).toBe(false);
  });

  it('is false for non-cancellable statuses', () => {
    const departure = { departureDate: new Date(Date.now() + 30 * MS_PER_DAY) };
    expect(canCancelBooking({ bookingStatus: 'cancelled' }, departure)).toBe(false);
    expect(canCancelBooking({ bookingStatus: 'completed' }, departure)).toBe(false);
  });

  it('is false when the departure date is missing', () => {
    expect(canCancelBooking({ bookingStatus: 'pending' }, {})).toBe(false);
    expect(canCancelBooking({ bookingStatus: 'pending' }, null)).toBe(false);
  });

  it('allows cancelling pending/confirmed bookings at least 7 days out', () => {
    const booking = { bookingStatus: 'pending' };
    expect(canCancelBooking(booking, { departureDate: new Date(Date.now() + 10 * MS_PER_DAY) })).toBe(
      true
    );
    expect(canCancelBooking(booking, { departureDate: new Date(Date.now() + 3 * MS_PER_DAY) })).toBe(
      false
    );
  });

  it('honours a custom minimum window and confirmed status', () => {
    const departure = { departureDate: new Date(Date.now() + 3 * MS_PER_DAY) };
    expect(canCancelBooking({ bookingStatus: 'confirmed' }, departure, 2)).toBe(true);
  });
});

describe('BookingError', () => {
  it('carries a name, code and message', () => {
    const error = new BookingError('INSUFFICIENT_SEATS', 'No seats left.');
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('BookingError');
    expect(error.code).toBe('INSUFFICIENT_SEATS');
    expect(error.message).toBe('No seats left.');
  });
});
