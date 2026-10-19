/**
 * Art deck seed — Pozlar + Göz Ucuyla kartlarını Firebase'e yükler.
 *
 * Kaynak:
 *   scripts/art/poses.json       + scripts/art/poses/*.jpeg     → poses collection
 *   scripts/art/glimpses.json    + scripts/art/glimpses/*.jpeg  → glimpses collection
 *
 * Her görsel Storage'a `{deck}/{id}-{hash8}.{ext}` olarak yüklenir. Hash
 * içerikten türetildiği için görsel değişmedikçe URL de değişmez (mobil
 * disk cache'i geçerli kalır); değişince yeni URL oluşur ve eski blob silinir.
 *
 * Firestore doc'u merge edilir — admin panelden yapılan metin düzenlemeleri
 * JSON'da olmayan alanlarda korunur, JSON'daki alanlar üzerine yazılır.
 *
 * Kullanım:
 *   node scripts/seed-art.js            # tüm desteler
 *   node scripts/seed-art.js glimpses   # tek deste
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ART_DIR = path.join(__dirname, 'art');
const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'service-account.json');
const BUCKET = process.env.FIREBASE_STORAGE_BUCKET || 'love-games-prod.firebasestorage.app';
const DECKS = ['poses', 'glimpses'];

let serviceAccount;
try {
  serviceAccount = require(SERVICE_ACCOUNT_PATH);
} catch {
  console.error(
    'scripts/service-account.json bulunamadı. Firebase Console → Project settings → Service accounts → Generate new private key → indirilen JSON\'ı bu yola koy.'
  );
  process.exit(1);
}

initializeApp({ credential: cert(serviceAccount), storageBucket: BUCKET });
const db = getFirestore();
const bucket = getStorage().bucket();

const CONTENT_TYPES = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

function downloadUrl(storagePath, token) {
  return (
    `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/` +
    `${encodeURIComponent(storagePath)}?alt=media&token=${token}`
  );
}

function stripUndefined(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}

/** Upload once per content hash; reuse the existing token if already there. */
async function uploadImage(deck, id, localPath) {
  const buf = fs.readFileSync(localPath);
  const hash = crypto.createHash('sha1').update(buf).digest('hex').slice(0, 8);
  const ext = path.extname(localPath).slice(1).toLowerCase();
  const storagePath = `${deck}/${id}-${hash}.${ext}`;
  const file = bucket.file(storagePath);

  const [exists] = await file.exists();
  if (exists) {
    const [meta] = await file.getMetadata();
    const token = meta.metadata?.firebaseStorageDownloadTokens?.split(',')[0];
    if (token) return { url: downloadUrl(storagePath, token), path: storagePath, uploaded: false };
  }

  const token = crypto.randomUUID();
  await file.save(buf, {
    resumable: false,
    metadata: {
      contentType: CONTENT_TYPES[ext] || 'application/octet-stream',
      // Path is content-addressed, so the blob behind a URL never changes.
      cacheControl: 'public, max-age=31536000, immutable',
      metadata: { firebaseStorageDownloadTokens: token },
    },
  });
  return { url: downloadUrl(storagePath, token), path: storagePath, uploaded: true };
}

async function seedDeck(deck) {
  const jsonPath = path.join(ART_DIR, `${deck}.json`);
  if (!fs.existsSync(jsonPath)) {
    console.warn(`  Skip: ${jsonPath} yok`);
    return 0;
  }
  const items = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  let count = 0;

  for (const item of items) {
    const { id, file, ...rest } = item;
    if (!id || !file) {
      console.warn(`  Skip (id/file eksik): ${JSON.stringify(item).slice(0, 60)}`);
      continue;
    }
    const localPath = path.join(ART_DIR, deck, file);
    if (!fs.existsSync(localPath)) {
      console.warn(`  Skip (görsel yok): ${deck}/${file}`);
      continue;
    }

    const ref = db.collection(deck).doc(id);
    const prev = (await ref.get()).data();
    const img = await uploadImage(deck, id, localPath);

    await ref.set(stripUndefined({ ...rest, image: img.url, imagePath: img.path }), { merge: true });

    if (prev?.imagePath && prev.imagePath !== img.path) {
      await bucket.file(prev.imagePath).delete({ ignoreNotFound: true });
      console.log(`  🗑  eski görsel silindi: ${prev.imagePath}`);
    }
    console.log(`  ✓ ${deck}/${id} ${img.uploaded ? '(yüklendi)' : '(görsel aynı)'}`);
    count += 1;
  }
  return count;
}

async function main() {
  const only = process.argv[2];
  const decks = only ? DECKS.filter((d) => d === only) : DECKS;
  if (decks.length === 0) {
    console.error(`Bilinmeyen deste: ${only} (seçenekler: ${DECKS.join(', ')})`);
    process.exit(1);
  }

  let total = 0;
  for (const deck of decks) {
    console.log(`\n🖼  ${deck}/`);
    total += await seedDeck(deck);
  }

  await db
    .collection('meta')
    .doc('content')
    .set({ version: Date.now(), updatedAt: new Date() }, { merge: true });
  console.log(`  ✓ meta/content bump`);
  console.log(`\n✅ Toplam ${total} kart yazıldı.`);
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Hata:', err.message || err);
  process.exit(1);
});
