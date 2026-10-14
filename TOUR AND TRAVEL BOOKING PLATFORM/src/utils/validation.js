// Reusable client-side validation. Server-side Security Rules remain the
// source of truth; these helpers only improve the user experience.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Accepts PH mobile numbers, +63 prefixes and international E.164 formats.
const PHONE_PATTERN = /^(\+?\d{1,3}[\s-]?)?\d{7,12}$/;

export function isEmail(value) {
  return EMAIL_PATTERN.test(String(value || '').trim());
}

export function isPhone(value) {
  const cleaned = String(value || '').replace(/[\s-]/g, '');
  return PHONE_PATTERN.test(cleaned);
}

export function isNonEmpty(value) {
  return String(value || '').trim().length > 0;
}

export function minLength(value, length) {
  return String(value || '').trim().length >= length;
}

/**
 * Password policy: at least 8 characters, one letter and one number.
 * Returns null when valid, otherwise a human-readable message.
 */
export function passwordIssue(value) {
  const password = String(value || '');
  if (password.length < 8) {
    return 'Password must be at least 8 characters.';
  }
  if (!/[A-Za-z]/.test(password)) {
    return 'Password must contain at least one letter.';
  }
  if (!/\d/.test(password)) {
    return 'Password must contain at least one number.';
  }
  return null;
}

/**
 * Validate the registration form.
 * @returns {Object} field -> error message map (empty when valid).
 */
export function validateRegistration({ fullName, email, phone, password, confirmPassword, acceptedTerms }) {
  const errors = {};
  if (!minLength(fullName, 2)) {
    errors.fullName = 'Enter your full name.';
  }
  if (!isEmail(email)) {
    errors.email = 'Enter a valid email address.';
  }
  if (!isPhone(phone)) {
    errors.phone = 'Enter a valid phone number.';
  }
  const pwIssue = passwordIssue(password);
  if (pwIssue) {
    errors.password = pwIssue;
  }
  if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }
  if (!acceptedTerms) {
    errors.acceptedTerms = 'You must accept the terms and conditions.';
  }
  return errors;
}

export function validateLogin({ email, password }) {
  const errors = {};
  if (!isEmail(email)) {
    errors.email = 'Enter a valid email address.';
  }
  if (!isNonEmpty(password)) {
    errors.password = 'Enter your password.';
  }
  return errors;
}

export function validateBooking({ departureId, numberOfTravelers, customerName, customerEmail, customerPhone }) {
  const errors = {};
  if (!isNonEmpty(departureId)) {
    errors.departureId = 'Select a departure schedule.';
  }
  const travelers = Number(numberOfTravelers);
  if (!Number.isInteger(travelers) || travelers < 1) {
    errors.numberOfTravelers = 'Enter at least 1 traveler.';
  }
  if (!minLength(customerName, 2)) {
    errors.customerName = 'Enter the lead traveler name.';
  }
  if (!isEmail(customerEmail)) {
    errors.customerEmail = 'Enter a valid email address.';
  }
  if (!isPhone(customerPhone)) {
    errors.customerPhone = 'Enter a valid phone number.';
  }
  return errors;
}

export function validateDestination(values) {
  const errors = {};
  if (!minLength(values.name, 2)) {
    errors.name = 'Destination name is required.';
  }
  if (!isNonEmpty(values.country)) {
    errors.country = 'Country is required.';
  }
  if (!isNonEmpty(values.location)) {
    errors.location = 'Location is required.';
  }
  if (!minLength(values.description, 20)) {
    errors.description = 'Description must be at least 20 characters.';
  }
  if (!Array.isArray(values.imageUrls) || values.imageUrls.filter(Boolean).length === 0) {
    errors.imageUrls = 'Add at least one image URL.';
  }
  return errors;
}

export function validatePackage(values) {
  const errors = {};
  if (!minLength(values.name, 2)) {
    errors.name = 'Package name is required.';
  }
  if (!isNonEmpty(values.destinationId)) {
    errors.destinationId = 'Select a destination.';
  }
  if (!minLength(values.description, 20)) {
    errors.description = 'Description must be at least 20 characters.';
  }
  const price = Number(values.pricePerPerson);
  if (!Number.isFinite(price) || price <= 0) {
    errors.pricePerPerson = 'Enter a price greater than zero.';
  }
  const days = Number(values.durationDays);
  if (!Number.isInteger(days) || days < 1) {
    errors.durationDays = 'Duration must be at least 1 day.';
  }
  const nights = Number(values.durationNights);
  if (!Number.isInteger(nights) || nights < 0) {
    errors.durationNights = 'Nights cannot be negative.';
  }
  if (!Array.isArray(values.imageUrls) || values.imageUrls.filter(Boolean).length === 0) {
    errors.imageUrls = 'Add at least one image URL.';
  }
  return errors;
}

export function validateDeparture({ packageId, departureDate, returnDate, capacity }) {
  const errors = {};
  if (!isNonEmpty(packageId)) {
    errors.packageId = 'Select a tour package.';
  }
  const start = departureDate ? new Date(departureDate) : null;
  const end = returnDate ? new Date(returnDate) : null;
  if (!start || Number.isNaN(start.getTime())) {
    errors.departureDate = 'Select a departure date.';
  }
  if (!end || Number.isNaN(end.getTime())) {
    errors.returnDate = 'Select a return date.';
  }
  if (start && end && end <= start) {
    errors.returnDate = 'Return date must be after the departure date.';
  }
  const cap = Number(capacity);
  if (!Number.isInteger(cap) || cap < 1) {
    errors.capacity = 'Capacity must be at least 1.';
  }
  return errors;
}

export function validatePromotion(values) {
  const errors = {};
  if (!minLength(values.title, 3)) {
    errors.title = 'Title is required.';
  }
  if (!minLength(values.description, 10)) {
    errors.description = 'Description must be at least 10 characters.';
  }
  const value = Number(values.discountValue);
  if (!Number.isFinite(value) || value <= 0) {
    errors.discountValue = 'Discount value must be greater than zero.';
  }
  if (values.discountType === 'percent' && value > 90) {
    errors.discountValue = 'Percentage discount cannot exceed 90%.';
  }
  const start = values.startDate ? new Date(values.startDate) : null;
  const end = values.endDate ? new Date(values.endDate) : null;
  if (!start || Number.isNaN(start.getTime())) {
    errors.startDate = 'Select a start date.';
  }
  if (!end || Number.isNaN(end.getTime())) {
    errors.endDate = 'Select an end date.';
  }
  if (start && end && end <= start) {
    errors.endDate = 'End date must be after the start date.';
  }
  return errors;
}

/** True when the errors map has no entries. */
export function isClean(errors) {
  return !errors || Object.keys(errors).length === 0;
}
