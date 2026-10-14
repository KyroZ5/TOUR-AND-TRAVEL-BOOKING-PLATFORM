// Human-friendly booking reference generator, e.g. "TTB-7X2K9Q".
// Uniqueness is additionally verified against Firestore by bookingService.

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no confusing I/O/0/1

export function generateBookingReference(prefix = 'TTB') {
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
  }
  return `${prefix}-${code}`;
}
