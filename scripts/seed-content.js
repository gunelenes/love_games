/**
 * İçerik seed script — scripts/content/{collection}/ altındaki JSON'ları
 * Firestore'un ilgili collection'ına merge eder.
 *
 * Klasör yapısı:
 *   scripts/content/
 *     categories/*.json       → categories collection
 *     diceFaces/*.json        → diceFaces collection
 *     placeCategories/*.json  → placeCategories collection
 *
 * Kullanım:
 *   node scripts/seed-content.js
 *
 * Her JSON dosyası bir item dizisi barındırır (id + collection-uygun alanlar).
 * merge:true ile çalışır — mevcut alanları korur, yeni alanlar üzerine yazar.
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

const CONTENT_DIR = path.join(__dirname, 'content');
const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'service-account.json');

let serviceAccount;
try {
  serviceAccount = require(SERVICE_ACCOUNT_PATH);
} catch {
  console.error(
    'scripts/service-account.json bulunamadı. Firebase Console → Project settings → Service accounts → Generate new private key → indirilen JSON\'ı bu yola koy.'
  );
  process.exit(1);
}

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

function isItemLike(x) {
  return x && typeof x === 'object' && typeof x.id === 'string';
}

async function seedFile(collection, filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const items = JSON.parse(raw);
  if (!Array.isArray(items)) {
    console.warn(`  Skip (not array): ${path.basename(filePath)}`);
    return 0;
  }
  let count = 0;
  for (const item of items) {
    if (!isItemLike(item)) {
      console.warn(`  Skip (no id): ${path.basename(filePath)}`);
      continue;
    }
    const { id, ...rest } = item;
    await db.collection(collection).doc(id).set(rest, { merge: true });
    const summary =
      collection === 'placeCategories'
        ? `${rest.places?.length ?? 0} places`
        : `${rest.prompts?.length ?? 0} prompts`;
    console.log(
      `  ✓ ${collection}/${id} (${rest.track || '-'} L${rest.level || '?'}, ${summary})`
    );
    count += 1;
  }
  return count;
}

async function bumpMeta() {
  await db
    .collection('meta')
    .doc('content')
    .set({ version: Date.now(), updatedAt: new Date() }, { merge: true });
  console.log(`  ✓ meta/content bump`);
}

async function main() {
  if (!fs.existsSync(CONTENT_DIR)) {
    console.error(`Klasör yok: ${CONTENT_DIR}`);
    process.exit(1);
  }
  const collections = fs
    .readdirSync(CONTENT_DIR)
    .filter((name) => fs.statSync(path.join(CONTENT_DIR, name)).isDirectory());

  if (collections.length === 0) {
    console.log('scripts/content/ altında collection klasörü yok.');
    process.exit(0);
  }

  let total = 0;
  for (const col of collections) {
    const colDir = path.join(CONTENT_DIR, col);
    const files = fs
      .readdirSync(colDir)
      .filter((f) => f.endsWith('.json'))
      .sort();
    if (files.length === 0) continue;
    console.log(`\n📁 ${col}/`);
    for (const f of files) {
      console.log(`→ ${f}`);
      total += await seedFile(col, path.join(colDir, f));
    }
  }

  console.log(`\n→ meta`);
  await bumpMeta();
  console.log(`\n✅ Toplam ${total} item yazıldı.`);
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Hata:', err.message || err);
  process.exit(1);
});
