import { describe, it, expect } from 'vitest';
import { generateBookingReference } from '../../src/utils/bookingRef.js';

describe('generateBookingReference', () => {
  it('uses the TTB prefix and 6 characters by default', () => {
    const ref = generateBookingReference();
    expect(ref).toMatch(/^TTB-[A-HJ-NP-Z2-9]{6}$/);
  });

  it('honours a custom prefix', () => {
    expect(generateBookingReference('ABC')).toMatch(/^ABC-[A-HJ-NP-Z2-9]{6}$/);
  });

  it('never emits confusing characters (I, O, 0, 1)', () => {
    for (let i = 0; i < 500; i += 1) {
      const code = generateBookingReference().slice(4);
      expect(code).not.toMatch(/[IO01]/);
    }
  });

  it('produces varied references', () => {
    const seen = new Set();
    for (let i = 0; i < 100; i += 1) {
      seen.add(generateBookingReference());
    }
    expect(seen.size).toBeGreaterThan(90);
  });
});
