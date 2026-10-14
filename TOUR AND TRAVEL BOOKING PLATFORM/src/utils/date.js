// Date helpers that normalise Firestore Timestamps, JS Dates, ISO strings and
// epoch numbers into plain JS Dates for display and comparisons.

/** Convert any supported date value to a JS Date (or null when invalid/empty). */
export function toDate(value) {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  // Firestore Timestamp (has toDate()).
  if (typeof value === 'object' && typeof value.toDate === 'function') {
    const date = value.toDate();
    return Number.isNaN(date.getTime()) ? null : date;
  }
  // Firestore Timestamp shape with seconds/nanoseconds.
  if (typeof value === 'object' && typeof value.seconds === 'number') {
    return new Date(value.seconds * 1000);
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "Mar 5, 2026" */
export function formatDate(value) {
  const date = toDate(value);
  if (!date) {
    return '—';
  }
  return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
}

/** "Mar 5, 2026, 2:30 PM" */
export function formatDateTime(value) {
  const date = toDate(value);
  if (!date) {
    return '—';
  }
  return date.toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** yyyy-mm-dd for <input type="date"> values. */
export function toInputDate(value) {
  const date = toDate(value);
  if (!date) {
    return '';
  }
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

/** Parse an <input type="date"> value into a JS Date at local midnight. */
export function fromInputDate(text) {
  if (!text) {
    return null;
  }
  const date = new Date(`${text}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** True when the value is a valid date strictly after now. */
export function isFuture(value) {
  const date = toDate(value);
  return Boolean(date) && date.getTime() > Date.now();
}

/** Whole days from now until the given date (negative when in the past). */
export function daysUntil(value) {
  const date = toDate(value);
  if (!date) {
    return null;
  }
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.ceil((date.getTime() - Date.now()) / msPerDay);
}
