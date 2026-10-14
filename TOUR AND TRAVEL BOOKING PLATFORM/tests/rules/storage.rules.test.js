import { describe, it, beforeAll, afterAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from '@firebase/rules-unit-testing';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { ref, uploadBytes, getBytes } from 'firebase/storage';

const PROJECT_ID = 'demo-tour-travel';
const ADMIN = 'sadmin-1';
const CUSTOMER = 'scust-1';

let testEnv;
let seedApp;

const bytes = new Uint8Array([0, 1, 2, 3, 4]);

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    storage: {
      rules: readFileSync(resolve('storage.rules'), 'utf8'),
      host: '127.0.0.1',
      port: 9199,
    },
  });

  // Seed the Firestore profiles the storage rules read via firestore.get().
  // Admin SDK bypasses Security Rules (direct emulator access via env vars).
  seedApp = getApps().length ? getApps()[0] : initializeApp({ projectId: PROJECT_ID });
  const seedDb = getFirestore(seedApp);
  await seedDb.collection('users').doc(ADMIN).set({ uid: ADMIN, role: 'admin', accountStatus: 'active' });
  await seedDb
    .collection('users')
    .doc(CUSTOMER)
    .set({ uid: CUSTOMER, role: 'customer', accountStatus: 'active' });
});

afterAll(async () => {
  if (testEnv) await testEnv.cleanup();
});

const anon = () => testEnv.unauthenticatedContext().storage();
const asAdmin = () => testEnv.authenticatedContext(ADMIN).storage();
const asCustomer = () => testEnv.authenticatedContext(CUSTOMER).storage();

describe('storage rules', () => {
  it('blocks anonymous and customer writes to site assets', async () => {
    await assertFails(uploadBytes(ref(anon(), 'site/hero.png'), bytes, { contentType: 'image/png' }));
    await assertFails(
      uploadBytes(ref(asCustomer(), 'site/hero.png'), bytes, { contentType: 'image/png' })
    );
  });

  it('lets an admin upload image assets', async () => {
    await assertSucceeds(
      uploadBytes(ref(asAdmin(), `destinations/${Date.now()}/cover.png`), bytes, {
        contentType: 'image/png',
      })
    );
  });

  it('rejects non-image uploads from an admin', async () => {
    await assertFails(
      uploadBytes(ref(asAdmin(), `destinations/${Date.now()}/notes.txt`), bytes, {
        contentType: 'text/plain',
      })
    );
  });

  it('allows public reads of destination images', async () => {
    const path = `destinations/${Date.now()}/cover.png`;
    await uploadBytes(ref(asAdmin(), path), bytes, { contentType: 'image/png' });
    await assertSucceeds(getBytes(ref(anon(), path)));
  });

  it('scopes receipt reads to the owner and admins', async () => {
    const path = `receipts/${CUSTOMER}/${Date.now()}.pdf`;
    await assertSucceeds(
      uploadBytes(ref(asCustomer(), path), bytes, { contentType: 'application/pdf' })
    );
    await assertFails(getBytes(ref(anon(), path)));
    const otherUser = testEnv.authenticatedContext('someone-else').storage();
    await assertFails(getBytes(ref(otherUser, path)));
  });
});
