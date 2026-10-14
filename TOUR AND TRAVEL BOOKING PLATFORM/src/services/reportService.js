// Report + dashboard aggregation helpers. Pure functions over arrays already
// loaded from Firestore, plus a CSV export utility.

const EXCLUDED_FROM_REVENUE = ['cancelled', 'rejected'];

function toJsDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === 'function') return value.toDate();
  if (typeof value.seconds === 'number') return new Date(value.seconds * 1000);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Aggregate headline booking statistics. */
export function summarizeBookings(bookings = []) {
  const summary = {
    total: bookings.length,
    pending: 0,
    confirmed: 0,
    rejected: 0,
    cancelled: 0,
    completed: 0,
    travelers: 0,
    totalBookingValue: 0,
  };
  bookings.forEach((booking) => {
    if (summary[booking.bookingStatus] !== undefined) {
      summary[booking.bookingStatus] += 1;
    }
    summary.travelers += Number(booking.numberOfTravelers) || 0;
    if (!EXCLUDED_FROM_REVENUE.includes(booking.bookingStatus)) {
      summary.totalBookingValue += Number(booking.totalPrice) || 0;
    }
  });
  return summary;
}

/**
 * Collected revenue = verified ("paid") payments belonging to bookings that
 * were not cancelled or rejected.
 */
export function calculateCollectedRevenue(payments = [], bookings = []) {
  const bookingById = new Map(bookings.map((b) => [b.id, b]));
  return payments
    .filter((p) => p.paymentStatus === 'paid')
    .filter((p) => {
      const booking = bookingById.get(p.bookingId);
      return !booking || !EXCLUDED_FROM_REVENUE.includes(booking.bookingStatus);
    })
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
}

/** Bookings grouped by YYYY-MM, oldest first. */
export function groupBookingsByMonth(bookings = []) {
  const buckets = new Map();
  bookings.forEach((booking) => {
    const date = toJsDate(booking.createdAt);
    if (!date) return;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    buckets.set(key, (buckets.get(key) || 0) + 1);
  });
  return Array.from(buckets.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, count]) => ({ month: key, count }));
}

/** Revenue grouped by YYYY-MM from verified payments. */
export function groupRevenueByMonth(payments = [], bookings = []) {
  const bookingById = new Map(bookings.map((b) => [b.id, b]));
  const buckets = new Map();
  payments
    .filter((p) => p.paymentStatus === 'paid')
    .forEach((payment) => {
      const booking = bookingById.get(payment.bookingId);
      if (booking && EXCLUDED_FROM_REVENUE.includes(booking.bookingStatus)) {
        return;
      }
      const date = toJsDate(payment.verifiedAt) || toJsDate(payment.createdAt);
      if (!date) return;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      buckets.set(key, (buckets.get(key) || 0) + (Number(payment.amount) || 0));
    });
  return Array.from(buckets.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, total]) => ({ month: key, total }));
}

/** Most-booked packages. */
export function popularPackages(bookings = [], topN = 5) {
  const counts = new Map();
  bookings.forEach((booking) => {
    if (booking.bookingStatus === 'cancelled' || booking.bookingStatus === 'rejected') return;
    counts.set(booking.packageId, (counts.get(booking.packageId) || 0) + 1);
  });
  return Array.from(counts.entries())
    .map(([packageId, count]) => ({ packageId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);
}

/** Most-booked destinations, resolved through a packageId -> destinationId map. */
export function popularDestinations(bookings = [], packageToDestination = new Map(), topN = 5) {
  const counts = new Map();
  bookings.forEach((booking) => {
    if (booking.bookingStatus === 'cancelled' || booking.bookingStatus === 'rejected') return;
    const destinationId = packageToDestination.get(booking.packageId);
    if (!destinationId) return;
    counts.set(destinationId, (counts.get(destinationId) || 0) + 1);
  });
  return Array.from(counts.entries())
    .map(([destinationId, count]) => ({ destinationId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);
}

/** Filter bookings to an inclusive date range on createdAt. */
export function filterBookingsByRange(bookings = [], startDate, endDate) {
  return bookings.filter((booking) => {
    const date = toJsDate(booking.createdAt);
    if (!date) return false;
    if (startDate && date < startDate) return false;
    if (endDate && date > endDate) return false;
    return true;
  });
}

function escapeCsvValue(value) {
  const text = value === null || value === undefined ? '' : String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

/** Convert an array of objects to a CSV string given ordered columns. */
export function toCsv(rows = [], columns = []) {
  const header = columns.map((c) => escapeCsvValue(c.label)).join(',');
  const body = rows
    .map((row) => columns.map((c) => escapeCsvValue(c.value(row))).join(','))
    .join('\n');
  return body ? `${header}\n${body}` : header;
}

/** Trigger a browser download of a CSV string. */
export function downloadCsv(filename, csvContent) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
