/**
 * Firestore security rules tests (rooms, boxes, blocking, reports, admin
 * moderation). Run after every firestore.rules change:
 *
 *   cd scripts/rules-test && npm install
 *   npm test   # firebase emulators:exec … "node firestore.test.mjs"
 *
 * Needs Java 11+ on PATH for the emulator. Lives in its own package because
 * @firebase/rules-unit-testing wants firebase 13 while the app is on 12.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from '@firebase/rules-unit-testing';
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, collection, getDocs,
  arrayUnion, serverTimestamp,
} from 'firebase/firestore';

const RULES = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../firestore.rules');
const env = await initializeTestEnvironment({
  projectId: 'demo-love-games',
  firestore: { rules: fs.readFileSync(RULES, 'utf8'), host: '127.0.0.1', port: 8080 },
});

const db = (uid) => env.authenticatedContext(uid).firestore();
const H = 'host', G = 'guest', X = 'stranger';
const R = (who) => doc(db(who), 'rooms', 'ROOM22');
const B = (who) => doc(db(who), 'rooms', 'ROOM22', 'boxes', 'b1');

let pass = 0, fail = 0;
async function t(name, p) {
  try { await p; pass++; console.log('  ok  ', name); }
  catch (e) { fail++; console.log('  FAIL', name, '-', e.message.split('\n')[0]); }
}

const freshRoom = async (extra = {}) => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'rooms', 'ROOM22'), {
      code: 'ROOM22', hostUid: H, guestUid: null, active: true,
      track: 'romantik', level: 1, blockedUids: [], createdAt: 1, ...extra,
    });
  });
};

console.log('create');
await env.clearFirestore();
await t('host creates room with blockedUids', assertSucceeds(setDoc(R(H), {
  code: 'ROOM22', hostUid: H, guestUid: null, active: true, track: 'romantik',
  level: 1, blockedUids: ['old-block'], createdAt: serverTimestamp(),
})));
await t('cannot create as someone else', assertFails(setDoc(doc(db(X), 'rooms', 'ROOM33'), {
  code: 'ROOM33', hostUid: H, guestUid: null,
})));

console.log('join');
await freshRoom();
await t('stranger joins empty slot', assertSucceeds(updateDoc(R(G), { guestUid: G })));
await freshRoom();
await t('join that also changes another field fails', assertFails(updateDoc(R(G), { guestUid: G, level: 5 })));
await freshRoom({ blockedUids: [G] });
await t('blocked uid cannot join', assertFails(updateDoc(R(G), { guestUid: G })));
await t('non-blocked uid can still join', assertSucceeds(updateDoc(R(X), { guestUid: X })));
await freshRoom({ guestUid: G });
await t('cannot join a full room', assertFails(updateDoc(R(X), { guestUid: X })));

console.log('guest powers');
await freshRoom({ guestUid: G });
await t('guest sets track/level', assertSucceeds(updateDoc(R(G), { track: 'cesur', level: 3 })));
await t('guest cannot take hostUid', assertFails(updateDoc(R(G), { hostUid: G })));
await t('guest cannot edit blockedUids', assertFails(updateDoc(R(G), { blockedUids: [H] })));
await t('guest cannot hand slot to someone else', assertFails(updateDoc(R(G), { guestUid: X })));
await t('guest leaves (slot -> null)', assertSucceeds(updateDoc(R(G), { guestUid: null })));
await t('ex-guest has no member powers', assertFails(updateDoc(R(G), { level: 2 })));

console.log('host powers');
await freshRoom({ guestUid: G });
await t('host blocks guest', assertSucceeds(updateDoc(R(H), { guestUid: null, blockedUids: arrayUnion(G) })));
await t('blocked ex-guest cannot rejoin', assertFails(updateDoc(R(G), { guestUid: G })));
await freshRoom({ guestUid: G });
await t('host hands room over to guest', assertSucceeds(updateDoc(R(H), { hostUid: G, guestUid: null })));
await t('old host lost access', assertFails(updateDoc(R(H), { level: 2 })));
await freshRoom({ guestUid: G });
await t('host cannot hand room to a stranger', assertFails(updateDoc(R(H), { hostUid: X })));
await freshRoom();
await t('host cannot hand room over with no guest', assertFails(updateDoc(R(H), { hostUid: X })));
await t('stranger cannot delete room', assertFails(deleteDoc(R(X))));
await t('host deletes room', assertSucceeds(deleteDoc(R(H))));

console.log('boxes');
await freshRoom({ guestUid: G });
await t('guest writes a box', assertSucceeds(setDoc(B(G), { notes: [] })));
await t('stranger cannot read box', assertFails(getDoc(B(X))));
await updateDoc(R(H), { guestUid: null, blockedUids: arrayUnion(G) });
await t('kicked guest cannot read box', assertFails(getDoc(B(G))));
await t('kicked guest cannot list boxes', assertFails(getDocs(collection(db(G), 'rooms', 'ROOM22', 'boxes'))));
await t('host still reads box', assertSucceeds(getDoc(B(H))));

console.log('reports');
const report = (uid, over = {}) => addDoc(collection(db(uid), 'reports'), {
  uid, roomCode: 'ROOM22', reportedUid: G, reason: 'harassment', details: '',
  noteText: 'x', locale: 'en', status: 'new', createdAt: serverTimestamp(), ...over,
});
await t('signed-in user files report', assertSucceeds(report(H)));
await t('cannot file report as someone else', assertFails(report(H, { uid: X })));
await t('unknown reason rejected', assertFails(report(H, { reason: 'meh' })));
await t('oversized details rejected', assertFails(report(H, { details: 'a'.repeat(501) })));
await t('status must start as new', assertFails(report(H, { status: 'resolved' })));
await t('user cannot read reports', assertFails(getDocs(collection(db(H), 'reports'))));
const adminDb = env.authenticatedContext('admin1', { admin: true }).firestore();
await t('admin reads reports', assertSucceeds(getDocs(collection(adminDb, 'reports'))));
await t('anonymous (no auth) cannot report', assertFails(addDoc(collection(env.unauthenticatedContext().firestore(), 'reports'), { uid: 'x' })));

console.log('admin moderation');
await freshRoom({ guestUid: G });
await env.withSecurityRulesDisabled(async (ctx) => {
  await setDoc(doc(ctx.firestore(), 'rooms', 'ROOM22', 'boxes', 'b1'), {
    notes: [{ id: 'n1', authorUid: G, text: 'bad' }],
  });
});
const A = (path) => doc(adminDb, ...path);
await t('admin reads a room', assertSucceeds(getDoc(A(['rooms', 'ROOM22']))));
await t('admin reads boxes', assertSucceeds(getDocs(collection(adminDb, 'rooms', 'ROOM22', 'boxes'))));
await t('admin strips notes', assertSucceeds(updateDoc(A(['rooms', 'ROOM22', 'boxes', 'b1']), { notes: [] })));
await t('admin ejects + blocks guest', assertSucceeds(updateDoc(A(['rooms', 'ROOM22']), { guestUid: null, blockedUids: arrayUnion(G) })));
await t('admin cannot delete a room', assertFails(deleteDoc(A(['rooms', 'ROOM22']))));
await t('admin cannot delete a box', assertFails(deleteDoc(A(['rooms', 'ROOM22', 'boxes', 'b1']))));
const fake = env.authenticatedContext('x2', { admin: false }).firestore();
await t('admin:false claim gets no moderation', assertFails(getDoc(doc(fake, 'rooms', 'ROOM22', 'boxes', 'b1'))));

await env.cleanup();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
