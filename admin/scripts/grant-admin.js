/**
 * Grant admin custom claim to a Firebase Auth user.
 *
 * Kullanım:
 *   1) Firebase Console → Project settings → Service accounts → "Generate new
 *      private key" → indirilen JSON'ı scripts/service-account.json olarak koy.
 *   2) npm install --no-save firebase-admin  (proje setup'ında zaten olmalı)
 *   3) npm run grant-admin -- kullanici@ornek.com
 *
 * Kullanıcı önce Firebase Console → Authentication → Users'tan email+şifre
 * ile oluşturulmalı. Bu script sadece o kullanıcıya `admin: true` claim ekler.
 */

const admin = require('firebase-admin');
const path = require('path');

const email = process.argv[2];
if (!email) {
  console.error('Kullanım: npm run grant-admin -- email@domain.com');
  process.exit(1);
}

const serviceAccountPath = path.join(__dirname, 'service-account.json');
let serviceAccount;
try {
  serviceAccount = require(serviceAccountPath);
} catch {
  console.error(
    'scripts/service-account.json bulunamadı. Firebase Console\'dan indir.'
  );
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function main() {
  const user = await admin.auth().getUserByEmail(email);
  await admin.auth().setCustomUserClaims(user.uid, { admin: true });
  console.log(`✅ ${email} artık admin (uid: ${user.uid})`);
  console.log(
    '   Kullanıcı zaten giriş yaptıysa çıkıp tekrar girmesi gerek (token yenilenmesi için).'
  );
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Hata:', err.message || err);
  process.exit(1);
});
