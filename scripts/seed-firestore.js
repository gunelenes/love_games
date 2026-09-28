/**
 * Firestore seed script — bundle'daki JSON içerikleri Firestore'a yükler.
 *
 * Kullanım:
 *   1) Firebase Console → Project settings → Service accounts → "Generate new private key"
 *      → indirilen JSON'ı `scripts/service-account.json` olarak koy (git ignore edilir).
 *   2) `npm install --no-save firebase-admin`  (bir seferlik dev bağımlılığı)
 *   3) `node scripts/seed-firestore.js`
 *
 * Idempotent: aynı ID'ye tekrar yazar (üzerine yazma). Var olan sahaları silmez —
 * eksik alan ekleme veya güncelleme için güvenli.
 */

const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require('./service-account.json');
const categoriesJson = require('../src/data/categories.json');
const placeCategoriesJson = require('../src/data/placeCategories.json');
const diceFacesJson = require('../src/data/diceFaces.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function seedCollection(name, items) {
  console.log(`\n→ ${name} (${items.length} items)`);
  let idx = 0;
  for (const item of items) {
    const { id, ...rest } = item;
    const docRef = db.collection(name).doc(id);
    await docRef.set({ ...rest, order: idx }, { merge: true });
    console.log(`  ✓ ${name}/${id}`);
    idx += 1;
  }
}

async function seedMeta() {
  await db
    .collection('meta')
    .doc('content')
    .set({ version: Date.now(), updatedAt: new Date() }, { merge: true });
  console.log(`  ✓ meta/content`);
}

async function main() {
  await seedCollection('categories', categoriesJson);
  await seedCollection('placeCategories', placeCategoriesJson);
  await seedCollection('diceFaces', diceFacesJson);
  console.log(`\n→ meta`);
  await seedMeta();
  console.log('\n✅ Seed tamamlandı.');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Seed başarısız:', err);
  process.exit(1);
});
