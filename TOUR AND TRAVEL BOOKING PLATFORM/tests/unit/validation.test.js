import { describe, it, expect } from 'vitest';
import {
  isEmail,
  isPhone,
  isNonEmpty,
  minLength,
  passwordIssue,
  validateRegistration,
  validateLogin,
  validateBooking,
  validateDestination,
  validatePackage,
  validateDeparture,
  validatePromotion,
  isClean,
} from '../../src/utils/validation.js';

describe('primitive validators', () => {
  it('isEmail', () => {
    expect(isEmail('a@b.co')).toBe(true);
    expect(isEmail('  a@b.co ')).toBe(true);
    expect(isEmail('a@b')).toBe(false);
    expect(isEmail('nope')).toBe(false);
    expect(isEmail('')).toBe(false);
    expect(isEmail(null)).toBe(false);
  });

  it('isPhone', () => {
    expect(isPhone('+63 917 123 4567')).toBe(true);
    expect(isPhone('0917-123-4567')).toBe(true);
    expect(isPhone('1234567')).toBe(true);
    expect(isPhone('123')).toBe(false);
    expect(isPhone('abc')).toBe(false);
    expect(isPhone('')).toBe(false);
  });

  it('isNonEmpty / minLength', () => {
    expect(isNonEmpty(' x ')).toBe(true);
    expect(isNonEmpty('   ')).toBe(false);
    expect(minLength('abc', 3)).toBe(true);
    expect(minLength('ab', 3)).toBe(false);
  });

  it('passwordIssue', () => {
    expect(passwordIssue('short1')).toMatch(/at least 8/);
    expect(passwordIssue('abcdefgh')).toMatch(/one letter|one number/);
    expect(passwordIssue('12345678')).toMatch(/one letter/);
    expect(passwordIssue('abcd1234')).toBeNull();
  });
});

describe('validateRegistration', () => {
  const valid = {
    fullName: 'Juan Dela Cruz',
    email: 'juan@example.com',
    phone: '09171234567',
    password: 'secret123',
    confirmPassword: 'secret123',
    acceptedTerms: true,
  };

  it('passes a complete valid form', () => {
    expect(isClean(validateRegistration(valid))).toBe(true);
  });

  it('reports every invalid field', () => {
    const errors = validateRegistration({
      fullName: 'J',
      email: 'bad',
      phone: '12',
      password: 'short',
      confirmPassword: 'different',
      acceptedTerms: false,
    });
    expect(Object.keys(errors).sort()).toEqual(
      ['acceptedTerms', 'confirmPassword', 'email', 'fullName', 'password', 'phone'].sort()
    );
  });

  it('catches mismatched passwords', () => {
    const errors = validateRegistration({ ...valid, confirmPassword: 'other123' });
    expect(errors.confirmPassword).toMatch(/do not match/);
  });
});

describe('validateLogin', () => {
  it('passes valid credentials', () => {
    expect(isClean(validateLogin({ email: 'a@b.co', password: 'x' }))).toBe(true);
  });

  it('flags bad email and empty password', () => {
    const errors = validateLogin({ email: 'bad', password: '' });
    expect(errors.email).toBeDefined();
    expect(errors.password).toBeDefined();
  });
});

describe('validateBooking', () => {
  const valid = {
    departureId: 'dep1',
    numberOfTravelers: 2,
    customerName: 'Juan',
    customerEmail: 'juan@example.com',
    customerPhone: '09171234567',
  };

  it('passes a valid booking', () => {
    expect(isClean(validateBooking(valid))).toBe(true);
  });

  it('requires a departure, >=1 integer traveler and contact info', () => {
    const errors = validateBooking({
      departureId: '',
      numberOfTravelers: 0,
      customerName: 'J',
      customerEmail: 'bad',
      customerPhone: '1',
    });
    expect(errors.departureId).toBeDefined();
    expect(errors.numberOfTravelers).toBeDefined();
    expect(errors.customerName).toBeDefined();
    expect(errors.customerEmail).toBeDefined();
    expect(errors.customerPhone).toBeDefined();
  });

  it('rejects fractional travelers', () => {
    expect(validateBooking({ ...valid, numberOfTravelers: 1.5 }).numberOfTravelers).toBeDefined();
  });
});

describe('validateDestination', () => {
  const valid = {
    name: 'Boracay',
    country: 'Philippines',
    location: 'Aklan',
    description: 'A beautiful tropical island with white sand beaches.',
    imageUrls: ['https://example.com/a.jpg'],
  };

  it('passes a valid destination', () => {
    expect(isClean(validateDestination(valid))).toBe(true);
  });

  it('requires a long description and at least one image', () => {
    const errors = validateDestination({ ...valid, description: 'short', imageUrls: ['', ''] });
    expect(errors.description).toBeDefined();
    expect(errors.imageUrls).toBeDefined();
  });
});

describe('validatePackage', () => {
  const valid = {
    name: 'Bohol Escape',
    destinationId: 'dest1',
    description: 'A wonderful four day tour of Bohol and its wonders.',
    pricePerPerson: 12999,
    durationDays: 4,
    durationNights: 3,
    imageUrls: ['https://example.com/a.jpg'],
  };

  it('passes a valid package', () => {
    expect(isClean(validatePackage(valid))).toBe(true);
  });

  it('rejects non-positive price, bad duration and no images', () => {
    const errors = validatePackage({
      ...valid,
      pricePerPerson: 0,
      durationDays: 0,
      durationNights: -1,
      imageUrls: [],
    });
    expect(errors.pricePerPerson).toBeDefined();
    expect(errors.durationDays).toBeDefined();
    expect(errors.durationNights).toBeDefined();
    expect(errors.imageUrls).toBeDefined();
  });
});

describe('validateDeparture', () => {
  const valid = {
    packageId: 'pkg1',
    departureDate: '2026-06-01',
    returnDate: '2026-06-05',
    capacity: 20,
  };

  it('passes a valid departure', () => {
    expect(isClean(validateDeparture(valid))).toBe(true);
  });

  it('requires a return date after departure', () => {
    const errors = validateDeparture({ ...valid, returnDate: '2026-05-30' });
    expect(errors.returnDate).toMatch(/after the departure/);
  });

  it('requires capacity >= 1 and valid dates', () => {
    const errors = validateDeparture({
      packageId: '',
      departureDate: '',
      returnDate: '',
      capacity: 0,
    });
    expect(errors.packageId).toBeDefined();
    expect(errors.departureDate).toBeDefined();
    expect(errors.returnDate).toBeDefined();
    expect(errors.capacity).toBeDefined();
  });
});

describe('validatePromotion', () => {
  const valid = {
    title: 'Summer Sale',
    description: 'Get a big discount this summer season.',
    discountType: 'percent',
    discountValue: 20,
    startDate: '2026-06-01',
    endDate: '2026-06-30',
  };

  it('passes a valid promotion', () => {
    expect(isClean(validatePromotion(valid))).toBe(true);
  });

  it('caps percentage discounts at 90%', () => {
    const errors = validatePromotion({ ...valid, discountValue: 95 });
    expect(errors.discountValue).toMatch(/90%/);
  });

  it('allows large fixed discounts', () => {
    expect(isClean(validatePromotion({ ...valid, discountType: 'fixed', discountValue: 500 }))).toBe(
      true
    );
  });

  it('requires positive value and end after start', () => {
    const errors = validatePromotion({ ...valid, discountValue: 0, endDate: '2026-05-01' });
    expect(errors.discountValue).toBeDefined();
    expect(errors.endDate).toMatch(/after the start/);
  });
});

describe('isClean', () => {
  it('treats empty/undefined maps as clean', () => {
    expect(isClean({})).toBe(true);
    expect(isClean(undefined)).toBe(true);
    expect(isClean({ a: 'x' })).toBe(false);
  });
});
