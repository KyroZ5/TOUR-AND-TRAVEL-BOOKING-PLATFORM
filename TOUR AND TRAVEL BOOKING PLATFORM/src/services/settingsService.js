import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firebase.js';

const DOC_PATH = { collection: 'settings', id: 'site' };

export function siteSettingsRef() {
  return doc(db, DOC_PATH.collection, DOC_PATH.id);
}

export const DEFAULT_SETTINGS = {
  agencyName: 'Wanderlust Travel',
  contactEmail: 'hello@wanderlust.travel',
  contactPhone: '+63 917 000 0000',
  address: 'Manila, Philippines',
  socials: { facebook: '', instagram: '', twitter: '' },
  heroTitle: 'Discover Your Next Adventure.',
  heroSubtitle:
    'Handpicked destinations, transparent pricing, and hassle-free bookings for your next great journey.',
  featuredDestinationIds: [],
  featuredPackageIds: [],
  faqs: [
    {
      q: 'How do I book a tour?',
      a: 'Browse our tour packages, open a package, choose an available departure, enter your traveler details, and submit your booking. You will receive a booking reference immediately.',
    },
    {
      q: 'How do I pay?',
      a: 'After booking, submit your payment reference on the booking page. An administrator verifies each payment manually and updates your payment status.',
    },
    {
      q: 'Can I cancel my booking?',
      a: 'Yes. Bookings may be cancelled up to 7 days before departure, subject to the cancellation policy shown on the package page.',
    },
    {
      q: 'Are departure schedules guaranteed?',
      a: 'Departures run once the minimum number of travelers is met. Our team will notify you if a schedule changes.',
    },
    {
      q: 'What should I bring?',
      a: 'Bring a valid ID, your booking reference, comfortable clothing, and any personal essentials. Package-specific reminders are listed on each tour page.',
    },
  ],
  cancellationPolicyDefault:
    'Free cancellation up to 7 days before departure. Cancellations within 7 days may be subject to charges.',
  updatedBy: '',
};

/** Reads settings/site, falling back to defaults for any missing field. */
export async function getSiteSettings() {
  const snapshot = await getDoc(siteSettingsRef());
  if (!snapshot.exists()) {
    return { ...DEFAULT_SETTINGS };
  }
  return { ...DEFAULT_SETTINGS, ...snapshot.data() };
}

/** Admin: persist site settings. */
export async function updateSiteSettings(values, adminUid) {
  await setDoc(
    siteSettingsRef(),
    {
      ...values,
      updatedBy: adminUid || '',
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
