/**
 * Bir kullanıcının custom claims'lerini görüntüler.
 * Kullanım: node scripts/check-claims.js email@example.com
 */
const admin = require('firebase-admin');
const path = require('path');

const email = process.argv[2];
if (!email) {
  console.error('Kullanım: node scripts/check-claims.js email@example.com');
  process.exit(1);
}

const serviceAccount = require(path.join(__dirname, 'service-account.json'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

(async () => {
  try {
    const user = await admin.auth().getUserByEmail(email);
    console.log('Email       :', user.email);
    console.log('UID         :', user.uid);
    console.log('Custom claims:', JSON.stringify(user.customClaims || {}, null, 2));
    console.log('Provider    :', user.providerData.map((p) => p.providerId).join(', '));
    process.exit(0);
  } catch (e) {
    console.error('Hata:', e.message || e);
    process.exit(1);
  }
})();
