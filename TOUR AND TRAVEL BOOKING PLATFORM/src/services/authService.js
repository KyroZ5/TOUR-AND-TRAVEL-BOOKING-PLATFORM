import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  updateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../firebase/firebase.js';

/** Maps Firebase Auth error codes to friendly UI messages. */
export function mapAuthError(error) {
  const code = error && error.code ? error.code : '';
  switch (code) {
    case 'auth/invalid-email':
      return 'That email address is not valid.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/user-not-found':
      return 'No account was found with that email address.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password.';
    case 'auth/email-already-in-use':
      return 'An account already exists with that email address.';
    case 'auth/weak-password':
      return 'Your password is too weak. Use at least 8 characters with a number.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/requires-recent-login':
      return 'Please log out and log back in to make this change.';
    default:
      return (error && error.message) || 'Something went wrong. Please try again.';
  }
}

export function getCurrentUser() {
  return auth.currentUser;
}

/**
 * Registers a new customer account and creates the matching Firestore profile.
 * Public registration ALWAYS creates the `customer` role.
 */
export async function registerUser({ fullName, email, phone, password }) {
  const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  const { user } = credential;

  try {
    await updateProfile(user, { displayName: fullName.trim() });
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      role: 'customer',
      accountStatus: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    // Profile creation failed - surface a clear message; the AuthContext can
    // repair the profile on the next login if needed.
    throw Object.assign(new Error('Account created but profile setup failed. Please contact support.'), {
      code: 'profile/create-failed',
      cause: error,
    });
  }

  return user;
}

export async function loginUser(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  return credential.user;
}

export async function logoutUser() {
  await signOut(auth);
}

export async function sendResetEmail(email) {
  await sendPasswordResetEmail(auth, email.trim());
}

/** Fetch the Firestore profile for a UID. Returns null when missing. */
export async function fetchUserProfile(uid) {
  const snapshot = await getDoc(doc(db, 'users', uid));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}

/** Creates a minimal customer profile if one is missing (repair flow). */
export async function ensureUserProfile(user) {
  const existing = await fetchUserProfile(user.uid);
  if (existing) {
    return existing;
  }
  const profile = {
    uid: user.uid,
    fullName: user.displayName || (user.email ? user.email.split('@')[0] : 'Customer'),
    email: user.email || '',
    phone: '',
    role: 'customer',
    accountStatus: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(doc(db, 'users', user.uid), profile);
  return { id: user.uid, ...profile };
}

/** Change the signed-in user's email (requires recent login). */
export async function changeUserEmail(currentPassword, newEmail) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be signed in.');
  }
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updateEmail(user, newEmail.trim());
}

/** Change the signed-in user's password (requires recent login). */
export async function changeUserPassword(currentPassword, newPassword) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be signed in.');
  }
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
}
