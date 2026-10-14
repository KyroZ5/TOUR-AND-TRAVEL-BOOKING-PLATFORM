// Ensures both the client SDK (via .env.emulator) and the Admin SDK connect to
// the local emulators. `firebase emulators:exec` already exports these, but we
// set fallbacks so the config also works when invoked directly.
process.env.FIRESTORE_EMULATOR_HOST ||= '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099';
process.env.FIREBASE_STORAGE_EMULATOR_HOST ||= '127.0.0.1:9199';
process.env.GCLOUD_PROJECT ||= 'demo-tour-travel';
