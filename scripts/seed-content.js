/**
 * İçerik seed script — scripts/content/ altındaki JSON'ları Firestore'a merge eder.
 *
 * Kullanım:
 *   node scripts/seed-content.js
 *
 * Her JSON dosyası bir kategori dizisi barındırır (id, name, color, icon,
 * track, level, order, prompts). merge:true ile çalışır — mevcut alanları
 * korur, yeni prompt listesi/name/color/vs ile üzerine yazar.
 *
 * Dosya adı sadece organizasyon içindir (örn. cesur-l1.json, romantik-l3.json).
 * İçindeki her kategori kendi id'siyle collection'da tekil bir doc olur.
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

function isCategoryLike(x) {
  return (
    x &&
    typeof x === 'object' &&
    typeof x.id === 'string' &&
    typeof x.name === 'string' &&
    Array.isArray(x.prompts)
  );
}

async function seedFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const items = JSON.parse(raw);
  if (!Array.isArray(items)) {
    console.warn(`Skip (not array): ${path.basename(filePath)}`);
    return 0;
  }
  let count = 0;
  for (const item of items) {
    if (!isCategoryLike(item)) {
      console.warn(`Skip (invalid shape): ${path.basename(filePath)}#${item?.id}`);
      continue;
    }
    const { id, ...rest } = item;
    await db.collection('categories').doc(id).set(rest, { merge: true });
    console.log(`  ✓ categories/${id} (${rest.track || '-'} L${rest.level || '?'}, ${rest.prompts.length} prompts)`);
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
  const files = fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort();
  if (files.length === 0) {
    console.log('scripts/content/ boş.');
    process.exit(0);
  }
  console.log(`${files.length} dosya bulundu.\n`);
  let total = 0;
  for (const f of files) {
    console.log(`→ ${f}`);
    total += await seedFile(path.join(CONTENT_DIR, f));
  }
  console.log(`\n→ meta`);
  await bumpMeta();
  console.log(`\n✅ Toplam ${total} kategori yazıldı.`);
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Hata:', err.message || err);
  process.exit(1);
});
